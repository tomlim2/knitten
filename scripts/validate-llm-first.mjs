#!/usr/bin/env node
// Mechanical anti-rot validator for the LLM-first / agent-first policy.
// Run from repo root: node scripts/validate-llm-first.mjs
import { readdir, readFile, stat, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");

// ---------- helpers ----------

async function walk(dir, filter) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(full, filter)));
    else if (e.isFile() && filter(full)) out.push(full);
  }
  return out;
}

async function listDirOnce(dir) {
  try {
    return await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function stripFrontmatter(text) {
  // Returns { body, frontmatterLineCount }.
  // Body has frontmatter blanked out (lines kept as empty strings) so line numbers stay aligned.
  if (!text.startsWith("---\n")) return { body: text, fmLines: 0 };
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return { body: text, fmLines: 0 };
  const fmText = text.slice(0, 4 + end + 5);
  const fmLineCount = fmText.split("\n").length - 1;
  const blanked = "\n".repeat(fmLineCount) + text.slice(fmText.length);
  return { body: blanked, fmLines: fmLineCount };
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return null;
  const yaml = rest.slice(0, end);
  const out = {};
  for (const raw of yaml.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function rel(p) {
  return path.relative(REPO_ROOT, p);
}

// ---------- file scope helpers ----------

async function llmFirstFiles() {
  const files = [];
  const claude = path.join(REPO_ROOT, "claude");
  files.push(...(await walk(path.join(claude, "rules"), (f) => f.endsWith(".md"))));
  files.push(...(await walk(path.join(claude, "standards"), (f) => f.endsWith(".md"))));
  files.push(...(await walk(path.join(claude, "commands"), (f) => f.endsWith(".md"))));
  files.push(
    ...(await walk(path.join(claude, "skills"), (f) => path.basename(f) === "SKILL.md"))
  );
  for (const name of ["README.md", "LOOKUP.md", "AGENTS.md"]) {
    const p = path.join(REPO_ROOT, name);
    if (existsSync(p)) files.push(p);
  }
  return files;
}

// ---------- checks ----------

const BANNED_TERMS = [
  "etc.",
  "…", // …
  "consider ",
  "usually ",
  "typically ",
  "should probably",
  "might want ",
];

function maskCodeSpans(line) {
  // Replace inline backtick spans (`...`) and inline-quoted "..." with spaces of equal length.
  // Banned terms inside code spans or string literals are documentation, not prose violations.
  let out = "";
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c === "`") {
      out += " ";
      i++;
      while (i < line.length && line[i] !== "`") {
        out += " ";
        i++;
      }
      if (i < line.length) {
        out += " ";
        i++;
      }
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

function isInsideFencedCode(lines, idx, fenceState) {
  return fenceState[idx];
}

function computeFenceState(lines) {
  // Returns boolean[] — true if line is inside a ``` ... ``` fenced block.
  const state = new Array(lines.length).fill(false);
  let inside = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*```/.test(lines[i])) {
      inside = !inside;
      state[i] = true; // fence delimiter line itself: skip
      continue;
    }
    state[i] = inside;
  }
  return state;
}

async function checkBannedTerms() {
  const violations = [];
  const files = await llmFirstFiles();
  for (const f of files) {
    let text;
    try {
      text = await readFile(f, "utf8");
    } catch {
      continue;
    }
    const { body } = stripFrontmatter(text);
    const lines = body.split("\n");
    const fenceState = computeFenceState(lines);
    for (let i = 0; i < lines.length; i++) {
      if (fenceState[i]) continue;
      const original = lines[i];
      const masked = maskCodeSpans(original);
      const lower = masked.toLowerCase();
      for (const term of BANNED_TERMS) {
        const idx = lower.indexOf(term.toLowerCase());
        if (idx !== -1) {
          const start = Math.max(0, idx - 20);
          const end = Math.min(original.length, idx + term.length + 20);
          const snippet = original.slice(start, end).trim();
          violations.push({
            file: rel(f),
            line: i + 1,
            message: `term=${JSON.stringify(term)} :: ${snippet}`,
          });
        }
      }
    }
  }
  return { name: "banned-terms", violations };
}

async function checkRulesFrontmatter() {
  const violations = [];
  const dir = path.join(REPO_ROOT, "claude", "rules");
  const entries = await listDirOnce(dir);
  for (const e of entries) {
    if (!e.isFile() || !e.name.endsWith(".md")) continue;
    if (e.name === "index.md") continue;
    const f = path.join(dir, e.name);
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) {
      violations.push({ file: rel(f), line: 1, message: "missing YAML frontmatter" });
      continue;
    }
    const load = fm.load;
    if (!load) {
      violations.push({ file: rel(f), line: 1, message: "frontmatter missing 'load' field" });
      continue;
    }
    if (load !== "auto" && load !== "triggered") {
      violations.push({
        file: rel(f),
        line: 1,
        message: `frontmatter 'load' must be 'auto' or 'triggered' (got ${JSON.stringify(load)})`,
      });
      continue;
    }
    if (load === "triggered") {
      const trig = fm.trigger;
      if (!trig || !trig.trim()) {
        violations.push({
          file: rel(f),
          line: 1,
          message: "load=triggered requires non-empty 'trigger' field",
        });
      }
    }
  }
  return { name: "rules-frontmatter", violations };
}

async function checkImportTargets() {
  const violations = [];
  const f = path.join(REPO_ROOT, "claude", "CLAUDE.md");
  let text;
  try {
    text = await readFile(f, "utf8");
  } catch {
    return { name: "import-targets", violations: [{ file: rel(f), line: 0, message: "CLAUDE.md not found" }] };
  }
  const lines = text.split("\n");
  const re = /@~\/\.claude\/(\S+)/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(line)) !== null) {
      const sub = m[1];
      const target = path.join(REPO_ROOT, "claude", sub);
      if (!existsSync(target)) {
        violations.push({
          file: rel(f),
          line: i + 1,
          message: `broken @import: @~/.claude/${sub} -> ${rel(target)}`,
        });
      }
    }
  }
  return { name: "import-targets", violations };
}

async function checkInventoryCounts() {
  const violations = [];
  const f = path.join(REPO_ROOT, "README.md");
  let text;
  try {
    text = await readFile(f, "utf8");
  } catch {
    return {
      name: "inventory-counts",
      violations: [{ file: "README.md", line: 0, message: "README.md not found" }],
    };
  }
  const claude = path.join(REPO_ROOT, "claude");
  const countFiles = async (sub) => {
    const ents = await listDirOnce(path.join(claude, sub));
    return ents.filter((e) => e.isFile()).length;
  };
  const countDirs = async (sub) => {
    const ents = await listDirOnce(path.join(claude, sub));
    return ents.filter((e) => e.isDirectory()).length;
  };
  const countMdRecursive = async (sub) => {
    const files = await walk(path.join(claude, sub), (f) => f.endsWith(".md"));
    return files.length;
  };
  const actual = {
    standards: await countMdRecursive("standards"),
    rules: await countFiles("rules"),
    commands: await countFiles("commands"),
    skills: await countDirs("skills"),
  };
  // Look for "## Standards (N)", "## Rules ... (N)", "## Commands (N)", "## Skills (N)".
  const lines = text.split("\n");
  const patterns = [
    { key: "standards", re: /^##\s+Standards\b[^\n]*\((\d+)\)/i },
    { key: "rules", re: /^##\s+Rules\b[^\n]*\((\d+)\)/i },
    { key: "commands", re: /^##\s+Commands\b[^\n]*\((\d+)\)/i },
    { key: "skills", re: /^##\s+Skills\b[^\n]*\((\d+)\)/i },
  ];
  const found = {};
  for (let i = 0; i < lines.length; i++) {
    for (const p of patterns) {
      const m = lines[i].match(p.re);
      if (m) {
        const claimed = parseInt(m[1], 10);
        found[p.key] = true;
        if (claimed !== actual[p.key]) {
          violations.push({
            file: "README.md",
            line: i + 1,
            message: `${p.key}: README claims (${claimed}), actual ${actual[p.key]}`,
          });
        }
      }
    }
  }
  for (const p of patterns) {
    if (!found[p.key]) {
      violations.push({
        file: "README.md",
        line: 0,
        message: `no inventory header found for ${p.key} (expected '## ${p.key[0].toUpperCase() + p.key.slice(1)} (N)')`,
      });
    }
  }
  return { name: "inventory-counts", violations };
}

async function checkLookupPresence() {
  const violations = [];
  const mapPath = path.join(REPO_ROOT, "MAP.md");
  if (existsSync(mapPath)) {
    violations.push({
      file: "MAP.md",
      line: 0,
      message: "MAP.md exists at repo root — must be renamed to LOOKUP.md per plan",
    });
  }
  return { name: "lookup-presence", violations };
}

// ---------- driver ----------

const CHECKS = [
  { name: "banned-terms", fn: checkBannedTerms },
  { name: "rules-frontmatter", fn: checkRulesFrontmatter },
  { name: "import-targets", fn: checkImportTargets },
  { name: "inventory-counts", fn: checkInventoryCounts },
  { name: "lookup-presence", fn: checkLookupPresence },
];

function parseArgs(argv) {
  const args = { check: null, list: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a === "--check") args.check = argv[++i];
    else if (a.startsWith("--check=")) args.check = a.slice("--check=".length);
  }
  return args;
}

async function countScannedFiles() {
  const files = await llmFirstFiles();
  return files.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.list) {
    for (const c of CHECKS) console.log(c.name);
    process.exit(0);
  }
  const selected = args.check
    ? CHECKS.filter((c) => c.name === args.check)
    : CHECKS;
  if (selected.length === 0) {
    console.error(`unknown check: ${args.check}`);
    console.error(`available: ${CHECKS.map((c) => c.name).join(", ")}`);
    process.exit(2);
  }

  let totalViolations = 0;
  const failingChecks = [];
  for (const c of selected) {
    const result = await c.fn();
    if (result.violations.length === 0) continue;
    failingChecks.push(result);
    totalViolations += result.violations.length;
    console.log(`❌ ${result.name}  (${result.violations.length} violations)`);
    for (const v of result.violations) {
      console.log(`    ${v.file}:${v.line}  ${v.message}`);
    }
  }

  const fileCount = await countScannedFiles();
  if (failingChecks.length === 0) {
    console.log(`✓ all checks passed (${selected.length} checks, ${fileCount} files scanned)`);
    process.exit(0);
  } else {
    console.log(
      `\nsummary: ${failingChecks.length}/${selected.length} checks failed, ${totalViolations} total violations (${fileCount} files scanned)`
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("validator crashed:", err);
  process.exit(2);
});
