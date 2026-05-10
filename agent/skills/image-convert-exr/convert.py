#!/usr/bin/env python3
"""Convert EXR files to PNG/JPG with optional resize."""

import sys
import argparse
from pathlib import Path

import OpenEXR
import numpy as np
from PIL import Image


def read_exr(path):
    """Read EXR and return RGB numpy array (float32, 0-1 range).

    Handles three cases:
    1. Standard RGB/RGBA channels (R, G, B)
    2. Blender multi-channel EXR (diffuse, specular, etc.) — sums all layers
    3. Single named RGBA layer — uses first available
    """
    f = OpenEXR.File(str(path))
    channels = f.channels()

    # Case 1: Standard RGB channels
    if all(ch in channels for ch in ['R', 'G', 'B']):
        rgb = [channels[ch].pixels.astype(np.float32) for ch in ['R', 'G', 'B']]
        return np.stack(rgb, axis=-1)

    # Collect all RGBA layers
    layers = {}
    for name, ch in channels.items():
        data = ch.pixels.astype(np.float32)
        if data.ndim == 3 and data.shape[2] >= 3:
            layers[name] = data[:, :, :3]

    if not layers:
        raise ValueError(f'No usable RGB data. Channels: {list(channels.keys())}')

    # Case 2: Multiple layers (e.g. diffuse + specular) — sum them
    if len(layers) > 1:
        names = list(layers.keys())
        print(f'Multi-channel EXR: combining {" + ".join(names)}')
        combined = sum(layers.values())
        return combined

    # Case 3: Single named layer
    name, data = next(iter(layers.items()))
    print(f'Using channel: {name} ({data.shape})')
    return data


def convert(input_path, output_path=None, size=None, fmt='png'):
    """Convert EXR to PNG or JPG."""
    src = Path(input_path)
    if not src.exists():
        print(f'Error: {src} not found')
        sys.exit(1)

    rgb = read_exr(src)
    img_u8 = (np.clip(rgb, 0, 1) * 255).astype(np.uint8)
    pil_img = Image.fromarray(img_u8, 'RGB')

    if size:
        pil_img = pil_img.resize((size, size), Image.LANCZOS)

    if output_path is None:
        output_path = src.with_suffix(f'.{fmt}')
    else:
        output_path = Path(output_path)

    pil_img.save(str(output_path))
    print(f'Saved: {output_path} ({pil_img.size[0]}x{pil_img.size[1]})')
    return str(output_path)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Convert EXR to PNG/JPG')
    parser.add_argument('input', help='Input EXR file path')
    parser.add_argument('-o', '--output', help='Output file path (default: same name, .png)')
    parser.add_argument('-s', '--size', type=int, help='Resize to NxN pixels')
    parser.add_argument('-f', '--format', default='png', choices=['png', 'jpg'], help='Output format')
    args = parser.parse_args()

    convert(args.input, args.output, args.size, args.format)
