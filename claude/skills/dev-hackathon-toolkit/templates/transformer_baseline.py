"""
Transformer Baseline Template for Hackathons
Copy this file, modify encode_pair() and config for your task.

Usage:
    python3 transformer_baseline.py              # default config
    python3 transformer_baseline.py --d 32 --layers 2 --heads 2 --ff 64
    python3 transformer_baseline.py --smoke      # 10-epoch smoke test
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
import math
import random
import numpy as np
import json
import argparse
import time
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

# ============================================================
# Config — MODIFY FOR YOUR TASK
# ============================================================

VOCAB_SIZE = 2          # number of tokens
INPUT_LEN = 12          # input sequence length
OUTPUT_LEN = 12         # output sequence length
SEQ_LEN = INPUT_LEN + OUTPUT_LEN

# ============================================================
# Data — MODIFY encode_pair() FOR YOUR TASK
# ============================================================

def encode_pair(a, b):
    """Encode input pair → (input_tokens, output_tokens). MODIFY THIS."""
    a_bits = [(a >> i) & 1 for i in range(6)]
    b_bits = [(b >> i) & 1 for i in range(6)]
    p = a * b
    p_bits = [(p >> i) & 1 for i in range(12)]
    return a_bits + b_bits, p_bits

def make_dataset(n=100000):
    inputs, targets = [], []
    for _ in range(n):
        a, b = random.randint(0, 63), random.randint(0, 63)
        inp, tgt = encode_pair(a, b)
        inputs.append(inp)
        targets.append(tgt)
    return torch.tensor(inputs, dtype=torch.long), torch.tensor(targets, dtype=torch.long)

# ============================================================
# Sinusoidal PE (FREE — not counted as parameters)
# ============================================================

def sinusoidal_pe(max_len, d_model):
    pe = torch.zeros(max_len, d_model)
    pos = torch.arange(0, max_len).unsqueeze(1).float()
    div = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
    pe[:, 0::2] = torch.sin(pos * div)
    pe[:, 1::2] = torch.cos(pos * div)
    return pe

# ============================================================
# Model
# ============================================================

class TransformerBlock(nn.Module):
    def __init__(self, d_model, n_heads, d_ff):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)
        self.ln2 = nn.LayerNorm(d_model)
        self.ff = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Linear(d_ff, d_model),
        )

    def forward(self, x, mask):
        h = self.ln1(x)
        h, _ = self.attn(h, h, h, attn_mask=mask)
        x = x + h
        x = x + self.ff(self.ln2(x))
        return x


class BaselineTransformer(nn.Module):
    def __init__(self, d_model=32, n_heads=2, n_layers=2, d_ff=64):
        super().__init__()
        self.d_model = d_model
        self.tok_emb = nn.Embedding(VOCAB_SIZE, d_model)
        self.register_buffer('pos_enc', sinusoidal_pe(SEQ_LEN, d_model))
        self.layers = nn.ModuleList([
            TransformerBlock(d_model, n_heads, d_ff)
            for _ in range(n_layers)
        ])
        self.ln_f = nn.LayerNorm(d_model)
        self.head = nn.Linear(d_model, VOCAB_SIZE, bias=False)

    def forward(self, x):
        B, T = x.shape
        h = self.tok_emb(x) + self.pos_enc[:T]
        mask = torch.triu(torch.ones(T, T, device=x.device), diagonal=1).bool()
        for layer in self.layers:
            h = layer(h, mask)
        h = self.ln_f(h)
        return self.head(h)

    def count_parameters(self):
        return sum(p.numel() for p in self.parameters())


def build_model(d_model=32, n_heads=2, n_layers=2, d_ff=64):
    return BaselineTransformer(d_model=d_model, n_heads=n_heads,
                                n_layers=n_layers, d_ff=d_ff)

# ============================================================
# Training (Fixed protocol)
# ============================================================

def train_model(model, device='cpu', epochs=200, batch_size=256, verbose=True):
    model = model.to(device)
    train_inp, train_tgt = make_dataset(100000)
    train_inp, train_tgt = train_inp.to(device), train_tgt.to(device)

    optimizer = AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

    history = []
    for epoch in range(epochs):
        model.train()
        perm = torch.randperm(len(train_inp), device=device)
        inp_shuf = train_inp[perm]
        tgt_shuf = train_tgt[perm]

        total_loss = 0
        n_batches = 0
        for i in range(0, len(train_inp), batch_size):
            inp = inp_shuf[i:i+batch_size]
            tgt = tgt_shuf[i:i+batch_size]
            full_seq = torch.cat([inp, tgt], dim=1)
            logits = model(full_seq)
            output_logits = logits[:, INPUT_LEN-1:INPUT_LEN+OUTPUT_LEN-1].reshape(-1, VOCAB_SIZE)
            output_targets = tgt.reshape(-1)
            loss = F.cross_entropy(output_logits, output_targets)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            n_batches += 1

        scheduler.step()
        avg_loss = total_loss / n_batches
        history.append(avg_loss)

        if verbose and (epoch + 1) % 10 == 0:
            acc = evaluate_model(model, device, n=1000)
            print(f"Epoch {epoch+1:3d} | Loss: {avg_loss:.4f} | Acc: {acc:.4f}")

    return model, history

# ============================================================
# Evaluation (autoregressive greedy decoding)
# ============================================================

def evaluate_model(model, device='cpu', n=10000):
    model.eval()
    correct = 0
    batch_size = 512
    with torch.no_grad():
        for start in range(0, n, batch_size):
            bs = min(batch_size, n - start)
            inps, expecteds = [], []
            for _ in range(bs):
                a, b = random.randint(0, 63), random.randint(0, 63)
                inp, exp = encode_pair(a, b)
                inps.append(inp)
                expecteds.append(exp)
            seq = torch.tensor(inps, dtype=torch.long, device=device)
            exp_tensor = torch.tensor(expecteds, dtype=torch.long, device=device)
            for step in range(OUTPUT_LEN):
                logits = model(seq)
                next_tok = logits[:, -1].argmax(dim=-1, keepdim=True)
                seq = torch.cat([seq, next_tok], dim=1)
            predicted = seq[:, INPUT_LEN:]
            correct += (predicted == exp_tensor).all(dim=1).sum().item()
    return correct / n

# ============================================================
# Main
# ============================================================

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--d', type=int, default=32, help='d_model')
    parser.add_argument('--heads', type=int, default=2)
    parser.add_argument('--layers', type=int, default=2)
    parser.add_argument('--ff', type=int, default=64, help='d_ff')
    parser.add_argument('--epochs', type=int, default=200)
    parser.add_argument('--seed', type=int, default=42)
    parser.add_argument('--device', type=str, default='auto')
    parser.add_argument('--smoke', action='store_true', help='10-epoch smoke test')
    args = parser.parse_args()

    # Seed
    torch.manual_seed(args.seed)
    random.seed(args.seed)
    np.random.seed(args.seed)

    # Device
    if args.device == 'auto':
        device = 'mps' if torch.backends.mps.is_available() else \
                 'cuda' if torch.cuda.is_available() else 'cpu'
    else:
        device = args.device

    # Smoke test override
    if args.smoke:
        args.epochs = 10
        device = 'cpu'
        print("=== SMOKE TEST (10 epochs, CPU) ===")

    print(f"Device: {device} | Seed: {args.seed}")
    print(f"Config: d={args.d}, heads={args.heads}, layers={args.layers}, ff={args.ff}")

    # Build & train
    model = build_model(d_model=args.d, n_heads=args.heads,
                        n_layers=args.layers, d_ff=args.ff)
    print(f"Parameters: {model.count_parameters()}")

    start_time = time.time()
    model, history = train_model(model, device=device, epochs=args.epochs)
    duration = time.time() - start_time

    # Evaluate
    acc = evaluate_model(model, device=device, n=10000)
    print(f"\n=== Final ===")
    print(f"P_2 = {model.count_parameters()}")
    print(f"Acc_2 = {acc:.4f}")
    print(f"Duration: {duration:.1f}s")

    # Save results
    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "config": {"d_model": args.d, "n_heads": args.heads,
                   "n_layers": args.layers, "d_ff": args.ff},
        "params": model.count_parameters(),
        "accuracy": acc,
        "seed": args.seed,
        "device": device,
        "epochs": args.epochs,
        "duration_seconds": round(duration, 1),
        "loss_history": history
    }
    result_file = f"results_{args.d}d_{args.layers}L_{args.seed}s.json"
    with open(result_file, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"Results saved to {result_file}")

    # Save model
    if acc >= 0.99:
        model_file = f"model_{args.d}d_{args.layers}L_{args.seed}s.pt"
        torch.save(model.state_dict(), model_file)
        print(f"Model saved to {model_file}")
