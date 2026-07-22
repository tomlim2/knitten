#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLUGIN_ROOT = path.resolve(SKILL_ROOT, "../..");
const ENTRY_ID = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-v[0-9]+-[a-z0-9._-]+$/;
const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const SEED = /^[a-zA-Z0-9._-]+$/;
const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const TEXT_FIELDS = [
  "title",
  "emotionArc",
  "scene",
  "medium",
  "compositionRule",
  "directionChoice",
  "punchline",
  "joke",
  "rationale",
  "prompt",
  "sourceSkill",
  "generatedAt",
];

function usage() {
  return `Usage:
  manage-gallery.mjs root [--root <path>]
  manage-gallery.mjs list [--root <path>]
  manage-gallery.mjs render [--root <path>]
  manage-gallery.mjs add --image <path> --metadata <path> [--root <path>]`;
}

function parseArgs(argv) {
  const [command, ...tokens] = argv;
  const args = { command, root: "", image: "", metadata: "" };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--root") args.root = requiredValue(tokens, ++index, token);
    else if (token === "--image") args.image = requiredValue(tokens, ++index, token);
    else if (token === "--metadata") args.metadata = requiredValue(tokens, ++index, token);
    else if (token === "-h" || token === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else throw new Error(`unknown argument: ${token}`);
  }
  if (!command || !["root", "list", "render", "add"].includes(command)) {
    throw new Error(usage());
  }
  return args;
}

function requiredValue(tokens, index, flag) {
  const value = tokens[index];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value`);
  return value;
}

function galleryRoot(explicitRoot = "", create = false) {
  if (explicitRoot) {
    const root = path.resolve(explicitRoot);
    if (create) mkdirSync(root, { recursive: true });
    return root;
  }
  const shim = path.join(PLUGIN_ROOT, "bin", "knitten-resolve-output");
  const args = create
    ? ["--create", "knitten-gallery-root"]
    : ["knitten-gallery-root"];
  const result = spawnSync(shim, args, {
    cwd: PLUGIN_ROOT,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || "Knitten gallery output resolution failed").trim());
  }
  const resolved = JSON.parse(result.stdout);
  if (resolved.ok !== true || !resolved.absolutePath) {
    throw new Error("Knitten gallery output resolver returned no absolutePath");
  }
  return resolved.absolutePath;
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} must be non-empty text`);
  return value;
}

function validCalendarDate(value) {
  if (!DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

export function normalizeMetadata(raw) {
  if (!raw || raw.schemaVersion !== 1) throw new Error("metadata schemaVersion must be 1");
  const metadata = { ...raw };
  if (!ENTRY_ID.test(metadata.id || "")) throw new Error("metadata id has an invalid daily entry shape");
  if (!validCalendarDate(metadata.date || "")) throw new Error("metadata date must be a real YYYY-MM-DD date");
  if (!metadata.id.startsWith(`${metadata.date}-v`)) throw new Error("metadata id must start with date and variant");
  if (!Number.isInteger(metadata.variant) || metadata.variant < 0) {
    throw new Error("metadata variant must be a non-negative integer");
  }
  if (!metadata.id.startsWith(`${metadata.date}-v${metadata.variant}-`)) {
    throw new Error("metadata id variant does not match metadata variant");
  }
  if (!SEED.test(metadata.seedFingerprint || "")) {
    throw new Error("metadata seedFingerprint must be a safe stable token");
  }
  for (const field of TEXT_FIELDS) metadata[field] = requireText(metadata[field], field);
  if (Number.isNaN(Date.parse(metadata.generatedAt))) throw new Error("metadata generatedAt must be an ISO timestamp");
  return metadata;
}

function sha256(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}

function stableMetadata(entry) {
  const selected = {
    schemaVersion: entry.schemaVersion,
    id: entry.id,
    date: entry.date,
    variant: entry.variant,
    seedFingerprint: entry.seedFingerprint,
  };
  for (const field of TEXT_FIELDS) selected[field] = entry[field];
  return selected;
}

function entryFiles(root) {
  const entriesRoot = path.join(root, "entries");
  if (!existsSync(entriesRoot)) return [];
  return readdirSync(entriesRoot)
    .filter((name) => name.endsWith(".json"))
    .sort()
    .map((name) => path.join(entriesRoot, name));
}

export function loadEntries(root) {
  return entryFiles(root)
    .map((file) => readJson(file))
    .sort((left, right) => right.date.localeCompare(left.date) || right.id.localeCompare(left.id));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEntry(entry) {
  const asset = `assets/${encodeURIComponent(entry.image.filename)}`;
  return `
    <article class="card">
      <div class="visual"><img src="${asset}" alt="${escapeHtml(entry.title)}"></div>
      <div class="story">
        <div class="eyebrow"><time datetime="${escapeHtml(entry.date)}">${escapeHtml(entry.date)}</time><span>variant ${entry.variant}</span></div>
        <h2>${escapeHtml(entry.title)}</h2>
        <p class="arc">${escapeHtml(entry.emotionArc)}</p>
        <blockquote>${escapeHtml(entry.joke)}</blockquote>
        <dl>
          <div><dt>왜 이렇게 만들었나</dt><dd>${escapeHtml(entry.rationale)}</dd></div>
          <div><dt>생활 장면</dt><dd>${escapeHtml(entry.scene)}</dd></div>
          <div><dt>화풍</dt><dd>${escapeHtml(entry.medium)}</dd></div>
          <div><dt>화면 규칙</dt><dd>${escapeHtml(entry.compositionRule)}</dd></div>
          <div><dt>연출 선택</dt><dd>${escapeHtml(entry.directionChoice)}</dd></div>
          <div><dt>펀치라인</dt><dd>${escapeHtml(entry.punchline)}</dd></div>
        </dl>
        <details>
          <summary>실제 생성 프롬프트</summary>
          <pre>${escapeHtml(entry.prompt)}</pre>
        </details>
        <p class="meta">${escapeHtml(entry.sourceSkill)} · seed ${escapeHtml(entry.seedFingerprint)}</p>
      </div>
    </article>`;
}

function renderHtml(entries) {
  const cards = entries.map(renderEntry).join("\n");
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Knitten Gallery</title>
  <style>
    :root { color-scheme: dark; --ink:#f4eee3; --muted:#aea99f; --paper:#171816; --card:#22231f; --line:#3b3d35; --accent:#d5ff78; }
    * { box-sizing:border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font-family:ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
    header { max-width:1180px; margin:0 auto; padding:72px 24px 42px; border-bottom:1px solid var(--line); }
    .kicker { color:var(--accent); font-size:.75rem; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
    h1 { margin:.45rem 0 .7rem; font-family:Georgia,"Times New Roman",serif; font-size:clamp(3rem,8vw,7rem); font-weight:500; line-height:.9; }
    header p { max-width:700px; margin:0; color:var(--muted); font-size:1.05rem; line-height:1.65; }
    main { max-width:1180px; margin:0 auto; padding:48px 24px 96px; display:grid; gap:56px; }
    .card { display:grid; grid-template-columns:minmax(0,1.08fr) minmax(320px,.92fr); overflow:hidden; border:1px solid var(--line); border-radius:24px; background:var(--card); box-shadow:0 22px 70px #0005; }
    .visual { min-height:460px; background:#0c0d0c; }
    .visual img { width:100%; height:100%; display:block; object-fit:cover; }
    .story { padding:clamp(26px,4vw,52px); }
    .eyebrow { display:flex; gap:12px; color:var(--accent); font:700 .72rem/1.2 ui-monospace,SFMono-Regular,Menlo,monospace; letter-spacing:.09em; text-transform:uppercase; }
    h2 { margin:16px 0 14px; font-family:Georgia,"Times New Roman",serif; font-size:clamp(2rem,4vw,3.6rem); font-weight:500; line-height:1.05; }
    .arc { color:var(--muted); line-height:1.7; }
    blockquote { margin:28px 0; padding:18px 0 18px 22px; border-left:3px solid var(--accent); font-family:Georgia,"Times New Roman",serif; font-size:1.15rem; line-height:1.65; }
    dl { display:grid; gap:15px; margin:28px 0; }
    dl div { display:grid; grid-template-columns:130px 1fr; gap:14px; padding-top:15px; border-top:1px solid var(--line); }
    dt { color:var(--muted); font-size:.78rem; font-weight:700; }
    dd { margin:0; line-height:1.55; }
    details { margin-top:30px; border-top:1px solid var(--line); padding-top:18px; }
    summary { cursor:pointer; color:var(--accent); font-weight:750; }
    pre { max-height:420px; overflow:auto; margin:16px 0 0; padding:18px; border-radius:12px; background:#10110f; color:#ddd8ce; white-space:pre-wrap; word-break:break-word; font:12px/1.65 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .meta { margin-top:20px; color:#7f8277; font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }
    .empty { padding:80px 0; color:var(--muted); }
    @media (max-width:820px) { .card { grid-template-columns:1fr; } .visual { min-height:0; aspect-ratio:4/3; } dl div { grid-template-columns:1fr; gap:6px; } }
  </style>
</head>
<body>
  <header>
    <div class="kicker">Knitten · Daily Emotional Archive</div>
    <h1>Knitten Gallery</h1>
    <p>매일 한 장의 감정, 한 번의 연출 선택, 그리고 실제 생성 프롬프트를 함께 보존합니다. 결과보다 왜 그렇게 만들었는지를 잊지 않기 위한 기록입니다.</p>
  </header>
  <main>${cards || '<p class="empty">아직 기록된 작품이 없습니다.</p>'}</main>
</body>
</html>
`;
}

export function renderGallery(root) {
  mkdirSync(root, { recursive: true });
  const entries = loadEntries(root);
  const index = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    count: entries.length,
    entries,
  };
  const jsonPath = path.join(root, "index.json");
  const htmlPath = path.join(root, "index.html");
  writeFileSync(jsonPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  writeFileSync(htmlPath, renderHtml(entries), "utf8");
  return { root, count: entries.length, jsonPath, htmlPath };
}

export function addEntry({ root, imagePath, metadata }) {
  const normalized = normalizeMetadata(metadata);
  const sourceImage = path.resolve(imagePath);
  if (!existsSync(sourceImage) || !statSync(sourceImage).isFile()) throw new Error(`image does not exist: ${sourceImage}`);
  const extension = path.extname(sourceImage).toLowerCase();
  if (!IMAGE_EXTENSIONS.has(extension)) throw new Error(`unsupported image extension: ${extension}`);

  mkdirSync(path.join(root, "assets"), { recursive: true });
  mkdirSync(path.join(root, "entries"), { recursive: true });
  const imageDigest = sha256(sourceImage);
  const imageName = `${normalized.id}${extension}`;
  const destinationImage = path.join(root, "assets", imageName);
  const entryPath = path.join(root, "entries", `${normalized.id}.json`);

  if (existsSync(entryPath)) {
    const existing = readJson(entryPath);
    const sameMetadata = JSON.stringify(stableMetadata(existing)) === JSON.stringify(stableMetadata(normalized));
    if (sameMetadata && existing.image?.sha256 === imageDigest && existsSync(destinationImage)) {
      return { ...renderGallery(root), entryPath, imagePath: destinationImage, idempotent: true };
    }
    throw new Error(`gallery entry already exists with different content: ${normalized.id}`);
  }

  copyFileSync(sourceImage, destinationImage);
  const entry = {
    ...normalized,
    recordedAt: new Date().toISOString(),
    image: {
      filename: imageName,
      sha256: imageDigest,
      bytes: statSync(destinationImage).size,
    },
  };
  writeFileSync(entryPath, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
  return { ...renderGallery(root), entryPath, imagePath: destinationImage, idempotent: false };
}

function main() {
  try {
    const args = parseArgs(process.argv.slice(2));
    const root = galleryRoot(args.root, args.command !== "list" && args.command !== "root");
    let result;
    if (args.command === "root") {
      result = { ok: true, root, htmlPath: path.join(root, "index.html") };
    } else if (args.command === "list") {
      result = { ok: true, root, count: loadEntries(root).length, entries: loadEntries(root) };
    } else if (args.command === "render") {
      result = { ok: true, ...renderGallery(root) };
    } else {
      if (!args.image || !args.metadata) throw new Error("add requires --image and --metadata");
      result = { ok: true, ...addEntry({ root, imagePath: args.image, metadata: readJson(args.metadata) }) };
    }
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
