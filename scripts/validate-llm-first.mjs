#!/usr/bin/env node
// Mechanical anti-rot validator for the LLM-first policy.
// Run from repo root: node scripts/validate-llm-first.mjs
import { readdir, readFile, stat, access } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const AGENT_ROOT_NAME = "agent";
const AGENT_ROOT = path.join(REPO_ROOT, AGENT_ROOT_NAME);
const CONFIG_DIR = path.join(AGENT_ROOT, "config");
const CONFIG_CACHE = new Map();
const execFileAsync = promisify(execFile);

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
    if (e.isDirectory() && (e.name === "node_modules" || e.name.startsWith("."))) continue;
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

async function readJsonConfig(name) {
  if (CONFIG_CACHE.has(name)) return CONFIG_CACHE.get(name);
  const p = path.join(CONFIG_DIR, name);
  const text = await readFile(p, "utf8");
  const parsed = JSON.parse(text);
  CONFIG_CACHE.set(name, parsed);
  return parsed;
}

async function readJsonRel(relativePath) {
  const p = path.join(REPO_ROOT, relativePath);
  const text = await readFile(p, "utf8");
  return JSON.parse(text);
}

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function isSorted(values) {
  return values.join("\n") === [...values].sort().join("\n");
}

async function trackedFiles() {
  const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout.split("\0").filter(Boolean);
}

function pushArrayViolations(violations, file, key, values, options = {}) {
  if (!Array.isArray(values) || values.length === 0) {
    violations.push({ file, line: 1, message: `${key} must be a non-empty array` });
    return;
  }
  if (hasDuplicates(values)) {
    violations.push({ file, line: 1, message: `${key} must not contain duplicates` });
  }
  if (options.sorted && !isSorted(values)) {
    violations.push({ file, line: 1, message: `${key} must be sorted alphabetically` });
  }
}

function compareCountThenName(a, b) {
  if (b.count !== a.count) return b.count - a.count;
  return a.name.localeCompare(b.name);
}

function inlineCodeList(values) {
  return values.map((value) => `\`${value}\``).join(", ");
}

function countByPrefix(names) {
  const counts = new Map();
  for (const name of names) {
    const prefix = name.split("-")[0];
    counts.set(prefix, (counts.get(prefix) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort(compareCountThenName);
}

function sortInventoryFiles(a, b) {
  return a.localeCompare(b);
}

async function skillNames() {
  const entries = await listDirOnce(path.join(AGENT_ROOT, "skills"));
  return entries
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .map((entry) => entry.name)
    .sort(sortInventoryFiles);
}

async function standardRows() {
  const dir = path.join(AGENT_ROOT, "standards");
  const files = await walk(dir, (f) => f.endsWith(".md"));
  const groups = new Map();
  for (const f of files) {
    const relative = path.relative(dir, f);
    const parts = relative.split(path.sep);
    const group = parts.length === 1 ? "root" : `${parts[0]}/`;
    const file = parts.length === 1 ? parts[0] : parts.slice(1).join("/");
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(file);
  }
  return [...groups.entries()]
    .map(([name, files]) => ({
      name,
      count: files.length,
      files: files.sort(sortInventoryFiles),
    }))
    .sort((a, b) => {
      if (a.name === "root") return 1;
      if (b.name === "root") return -1;
      return a.name.localeCompare(b.name);
    });
}

async function ruleRows() {
  const dir = path.join(AGENT_ROOT, "rules");
  const entries = await listDirOnce(dir);
  const groups = new Map();
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const f = path.join(dir, entry.name);
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    const load = entry.name === "index.md" ? "index" : fm?.load || "none";
    if (!groups.has(load)) groups.set(load, []);
    groups.get(load).push(entry.name);
  }
  const order = new Map([
    ["auto", 0],
    ["triggered", 1],
    ["index", 2],
    ["none", 3],
  ]);
  return [...groups.entries()]
    .map(([name, files]) => ({
      name,
      count: files.length,
      files: files.sort(sortInventoryFiles),
    }))
    .sort((a, b) => {
      const ao = order.has(a.name) ? order.get(a.name) : 99;
      const bo = order.has(b.name) ? order.get(b.name) : 99;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
}

async function generateReadmeInventory() {
  const skills = await skillNames();
  const skillCounts = countByPrefix(skills);
  const standards = await standardRows();
  const rules = await ruleRows();

  const sections = [];
  sections.push(`## Skills (${skills.length})`);
  sections.push("");
  sections.push("| Category | Count |");
  sections.push("|----------|------:|");
  for (const row of skillCounts) {
    sections.push(`| \`${row.name}-*\` | ${row.count} |`);
  }
  sections.push("");
  sections.push("---");
  sections.push("");
  sections.push(`## Standards (${standards.reduce((sum, row) => sum + row.count, 0)})`);
  sections.push("");
  sections.push("Reference docs in `agent/standards/`. Loaded on-demand, never auto.");
  sections.push("");
  sections.push("| Group | Count | Files |");
  sections.push("|-------|------:|-------|");
  for (const row of standards) {
    sections.push(`| \`${row.name}\` | ${row.count} | ${inlineCodeList(row.files)} |`);
  }
  sections.push("");
  sections.push("---");
  sections.push("");
  sections.push(`## Rules (${rules.reduce((sum, row) => sum + row.count, 0)})`);
  sections.push("");
  sections.push(
    "Rules in `agent/rules/`. Auto rules load every session via entry documents; triggered rules load on demand."
  );
  sections.push("");
  sections.push("| Load | Count | Files |");
  sections.push("|------|------:|-------|");
  for (const row of rules) {
    sections.push(`| \`${row.name}\` | ${row.count} | ${inlineCodeList(row.files)} |`);
  }
  return sections.join("\n");
}

function generateValidatorChecksBlock() {
  const names = CHECKS.map((check) => check.name);
  return [
    `Validator checks: **${names.length}**.`,
    "",
    ...names.map((name) => `- \`${name}\``),
  ].join("\n");
}

async function generateAgentHubInventory() {
  const hub = await readJsonConfig("agent-hub.json");
  const sections = [];
  sections.push("## Hub Inventory");
  sections.push("");
  sections.push("| Area | Count | Canonical owner |");
  sections.push("|------|------:|-----------------|");
  sections.push(`| Harnesses | ${hub.harnesses.length} | \`agent/config/agent-hub.json\` \`harnesses\` |`);
  sections.push(`| Shared layers | ${hub.sharedLayers.length} | \`agent/config/agent-hub.json\` \`sharedLayers\` |`);
  sections.push(`| Registries | ${hub.registries.length} | \`agent/config/agent-hub.json\` \`registries\` |`);
  sections.push(`| Generated documents | ${hub.generatedDocuments.length} | \`agent/config/agent-hub.json\` \`generatedDocuments\` |`);
  sections.push(`| Runtime path policies | ${hub.runtimePathPolicies.length} | \`agent/config/agent-hub.json\` \`runtimePathPolicies\` |`);
  sections.push(`| Validators | ${hub.validators.length} | \`agent/config/agent-hub.json\` \`validators\` |`);
  sections.push("");
  sections.push("## Harnesses");
  sections.push("");
  sections.push("| ID | Entry document | Deploy target |");
  sections.push("|----|----------------|---------------|");
  for (const harness of hub.harnesses) {
    sections.push(`| \`${harness.id}\` | \`${harness.entryDocument}\` | \`${harness.deployTarget}\` |`);
  }
  sections.push("");
  sections.push("## Shared Layers");
  sections.push("");
  sections.push("| ID | Path | Load mode |");
  sections.push("|----|------|-----------|");
  for (const layer of hub.sharedLayers) {
    sections.push(`| \`${layer.id}\` | \`${layer.path}\` | \`${layer.loadMode}\` |`);
  }
  sections.push("");
  sections.push("## Registries");
  sections.push("");
  sections.push("| ID | Path | Domain |");
  sections.push("|----|------|--------|");
  for (const registry of hub.registries) {
    sections.push(`| \`${registry.id}\` | \`${registry.path}\` | ${registry.domain} |`);
  }
  return sections.join("\n");
}

async function generateAgentHubRouting() {
  const routing = await readJsonConfig("context-routing.json");
  const fixtures = await readJsonRel(routing.fixtures.path);
  const sections = [];
  sections.push("## Task Routing");
  sections.push("");
  sections.push(
    "Load route-domain bodies only after a profile matches. Keep discovery in this compact index."
  );
  sections.push("");
  sections.push("| Profile | Route domains | Repo keys | Frameworks | Task types | Max bytes |");
  sections.push("|---------|---------------|-----------|------------|------------|----------:|");
  for (const profile of routing.profiles) {
    sections.push(
      `| \`${profile.id}\` | ${inlineCodeList(profile.domains)} | ${inlineCodeList(profile.repoKeys)} | ${inlineCodeList(profile.frameworks || []) || "-"} | ${inlineCodeList(profile.taskTypes)} | ${profile.maxBytes} |`
    );
  }
  sections.push("");
  sections.push("## Pilot Files");
  sections.push("");
  sections.push("| File | Profile | Cost |");
  sections.push("|------|---------|------|");
  for (const pilot of routing.pilotFiles) {
    sections.push(`| \`${pilot.path}\` | \`${pilot.profile}\` | \`${pilot.contextCost}\` |`);
  }
  sections.push("");
  sections.push("## Route Fixtures");
  sections.push("");
  sections.push("| Task | Must load | Must not load | Max bytes |");
  sections.push("|------|-----------|---------------|----------:|");
  for (const fixture of fixtures) {
    const mustLoad = fixture.mustLoad.length ? inlineCodeList(fixture.mustLoad) : "-";
    const mustNotLoad = fixture.mustNotLoad.length ? inlineCodeList(fixture.mustNotLoad) : "-";
    sections.push(`| ${fixture.task} | ${mustLoad} | ${mustNotLoad} | ${fixture.maxBytes} |`);
  }
  return sections.join("\n");
}

function findGeneratedBlock(text, id) {
  const startMarker = `<!-- generated:${id} -->`;
  const endMarker = `<!-- /generated:${id} -->`;
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return null;
  const bodyStart = start + startMarker.length;
  const body = text.slice(bodyStart, end);
  const line = text.slice(0, start).split("\n").length;
  return { body, line };
}

function findMarkedBlock(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker);
  if (start === -1 || end === -1 || end < start) return null;
  const bodyStart = start + startMarker.length;
  const body = text.slice(bodyStart, end);
  const line = text.slice(0, start).split("\n").length;
  return { body, line };
}

function normalizeGeneratedBlock(value) {
  return value.replace(/\r\n/g, "\n").trim();
}

async function managedMarkdownFiles(folder) {
  const root = path.join(REPO_ROOT, folder.path);
  if (folder.recursive) {
    return await walk(root, (f) => f.endsWith(".md"));
  }
  const entries = await listDirOnce(root);
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(root, entry.name));
}

// ---------- file scope helpers ----------

async function llmFirstFiles() {
  const files = [];
  files.push(...(await walk(path.join(AGENT_ROOT, "rules"), (f) => f.endsWith(".md"))));
  files.push(...(await walk(path.join(AGENT_ROOT, "standards"), (f) => f.endsWith(".md"))));
  files.push(
    ...(await walk(path.join(AGENT_ROOT, "skills"), (f) => path.basename(f) === "SKILL.md"))
  );
  for (const name of ["README.md", "LOOKUP.md", "SYSTEM.md"]) {
    const p = path.join(REPO_ROOT, name);
    if (existsSync(p)) files.push(p);
  }
  for (const entry of await harnessEntryDocuments()) {
    if (existsSync(entry.file)) files.push(entry.file);
  }
  return files;
}

async function systemTerminologyFiles() {
  const files = [];
  for (const name of ["README.md", "LOOKUP.md", "SYSTEM.md", "AGENT-HUB.md"]) {
    const p = path.join(REPO_ROOT, name);
    if (existsSync(p)) files.push(p);
  }
  for (const entry of await harnessEntryDocuments()) {
    if (existsSync(entry.file)) files.push(entry.file);
  }
  for (const dir of ["docs/decisions", "docs/plans", "docs/reference"]) {
    files.push(...(await walk(path.join(REPO_ROOT, dir), (f) => f.endsWith(".md"))));
  }
  files.push(path.join(AGENT_ROOT, "config", "README.md"));
  files.push(path.join(AGENT_ROOT, "config", "agent-hub.json"));
  files.push(path.join(AGENT_ROOT, "config", "context-routing.json"));
  return files.filter((f) => existsSync(f));
}

async function harnessEntryDocuments() {
  let manifest;
  try {
    manifest = await readJsonConfig("agent-hub.json");
  } catch {
    return [];
  }
  const seen = new Set();
  const entries = [];
  for (const harness of manifest.harnesses || []) {
    if (!harness.entryDocument || seen.has(harness.entryDocument)) continue;
    seen.add(harness.entryDocument);
    entries.push({
      file: path.join(REPO_ROOT, harness.entryDocument),
      path: harness.entryDocument,
      harness,
    });
  }
  return entries;
}

// ---------- checks ----------

const BANNED_TERMS = [
  "etc.",
  "…", // …
  "as we discussed",
  "consider ",
  "last time",
  "previously discussed",
  "previously mentioned",
  "usually ",
  "typically ",
  "should probably",
  "might want ",
  "what we talked",
  "you know what",
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

const TERMINOLOGY_RULES = [
  { label: "source of truth", pattern: /\bsource of truth\b/i, canonical: "canonical owner or canonical policy" },
  { label: "canonical root", pattern: /\bcanonical root\b/i, canonical: "agent root" },
  { label: "canonical repo root", pattern: /\bcanonical repo root\b/i, canonical: "agent root" },
  { label: "deploy path", pattern: /\bdeploy path\b/i, canonical: "deploy target" },
  { label: "entry docs", pattern: /\bentry docs\b/i, canonical: "entry documents" },
  { label: "agent directory", pattern: /\bagent directory\b/i, canonical: "agent root" },
  { label: "claude folder", pattern: /\bclaude folder\b/i, canonical: "agent root or Claude deploy target" },
];

async function checkTerminology() {
  const violations = [];
  const files = await systemTerminologyFiles();
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
      for (const rule of TERMINOLOGY_RULES) {
        if (!rule.pattern.test(masked)) continue;
        violations.push({
          file: rel(f),
          line: i + 1,
          message: `use ${rule.canonical} instead of ${JSON.stringify(rule.label)}`,
        });
      }
    }
  }
  return { name: "terminology", violations };
}

async function checkRulesFrontmatter() {
  const violations = [];
  const schema = await readJsonConfig("frontmatter-schema.json");
  const loadValues = new Set(schema.ruleLoadValues);
  const dir = path.join(AGENT_ROOT, "rules");
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
    if (!loadValues.has(load)) {
      violations.push({
        file: rel(f),
        line: 1,
        message: `frontmatter 'load' must be one of ${schema.ruleLoadValues.join("|")} (got ${JSON.stringify(load)})`,
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

async function checkRulesIndexNoLinks() {
  const violations = [];
  const f = path.join(AGENT_ROOT, "rules", "index.md");
  let text;
  try {
    text = await readFile(f, "utf8");
  } catch {
    return {
      name: "rules-index-no-links",
      violations: [{ file: "agent/rules/index.md", line: 0, message: "rules index not found" }],
    };
  }

  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (linkRe.test(lines[i])) {
      violations.push({
        file: "agent/rules/index.md",
        line: i + 1,
        message: "rules index must use code spans, not Markdown links, to preserve triggered-rule lazy loading",
      });
    }
    linkRe.lastIndex = 0;
  }
  return { name: "rules-index-no-links", violations };
}

async function checkRepoPathReads() {
  const violations = [];
  const files = [
    ...(await walk(path.join(AGENT_ROOT, "skills"), (f) => f.endsWith(".md") || f.endsWith(".sh"))),
  ];
  const directReadRe =
    /\bjq\s+-r[e]?\s+(['"])(\.(?:[A-Za-z0-9_-]+|"[^"]+"|\["[^"]+"\]))\1[^\n]*repo-paths\.json/;

  for (const f of files) {
    const lines = (await readFile(f, "utf8")).split("\n");
    for (let i = 0; i < lines.length; i++) {
      if (!directReadRe.test(lines[i])) continue;
      violations.push({
        file: rel(f),
        line: i + 1,
        message:
          "repo-paths.json entries may be objects; use '.key.path // .key // empty' or ah-resolve-doc-path repo mode",
      });
    }
  }
  return { name: "repo-path-reads", violations };
}

async function checkImportTargets() {
  const violations = [];
  const entries = await harnessEntryDocuments();
  for (const entry of entries) {
    const f = entry.file;
    let text;
    try {
      text = await readFile(f, "utf8");
    } catch {
      violations.push({ file: rel(f), line: 0, message: "entry document not found" });
      continue;
    }
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(/^@(\S+)/);
      if (!m) continue;
      const spec = m[1];
      let target;
      if (spec.startsWith("~/.claude/")) {
        target = path.join(AGENT_ROOT, spec.slice("~/.claude/".length));
      } else if (entry.harness?.mappings?.[spec]) {
        target = path.join(REPO_ROOT, entry.harness.mappings[spec]);
      } else {
        target = path.resolve(path.dirname(f), spec);
      }
      if (!existsSync(target)) {
        violations.push({
          file: rel(f),
          line: i + 1,
          message: `broken @import: @${spec} -> ${rel(target)}`,
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
  const countFiles = async (sub) => {
    const ents = await listDirOnce(path.join(AGENT_ROOT, sub));
    return ents.filter((e) => e.isFile()).length;
  };
  const countDirs = async (sub) => {
    const ents = await listDirOnce(path.join(AGENT_ROOT, sub));
    return ents.filter((e) => e.isDirectory() && !e.name.startsWith(".")).length;
  };
  const countMdRecursive = async (sub) => {
    const files = await walk(path.join(AGENT_ROOT, sub), (f) => f.endsWith(".md"));
    return files.length;
  };
  const actual = {
    standards: await countMdRecursive("standards"),
    rules: await countFiles("rules"),
    skills: await countDirs("skills"),
  };
  // Look for "## Standards (N)", "## Rules ... (N)", "## Skills (N)".
  const lines = text.split("\n");
  const patterns = [
    { key: "standards", re: /^##\s+Standards\b[^\n]*\((\d+)\)/i },
    { key: "rules", re: /^##\s+Rules\b[^\n]*\((\d+)\)/i },
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

function bodyLineCount(text) {
  // Total lines minus frontmatter lines (if present).
  const total = text.split("\n").length;
  if (!text.startsWith("---\n")) return total;
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return total;
  const fmText = text.slice(0, 4 + end + 5);
  const fmLines = fmText.split("\n").length - 1;
  return total - fmLines;
}

function exceptionPathSet(exceptions, key) {
  return new Set((exceptions[key] || []).map((entry) => entry.path));
}

async function checkLengthCaps() {
  const violations = [];
  const docBudgets = await readJsonConfig("doc-budgets.json");
  const exceptions = await readJsonConfig("exceptions.json");
  const budgets = docBudgets.lineBudgets;
  const standardLengthGrandfathered = exceptionPathSet(exceptions, "standardLengthGrandfathered");
  const skillLengthGrandfathered = exceptionPathSet(exceptions, "skillLengthGrandfathered");
  const ruleDir = path.join(AGENT_ROOT, "rules");
  const ruleFiles = await walk(ruleDir, (f) => f.endsWith(".md"));
  for (const f of ruleFiles) {
    if (path.basename(f) === "index.md") continue;
    const text = await readFile(f, "utf8");
    const lines = bodyLineCount(text);
    const fm = parseFrontmatter(text) || {};
    const isAuto = fm.load === "auto";
    const cap = isAuto ? budgets.ruleAutoBody : budgets.ruleTriggeredBody;
    if (lines > cap) {
      violations.push({
        file: rel(f),
        line: 1,
        message: `${isAuto ? "auto" : "triggered"} rule body ${lines} lines exceeds cap ${cap} — split into a more specific triggered rule`,
      });
    }
  }
  const stdDir = path.join(AGENT_ROOT, "standards");
  const stdFiles = await walk(stdDir, (f) => f.endsWith(".md"));
  for (const f of stdFiles) {
    if (path.basename(f) === "index.md") continue;
    const relPath = rel(f);
    if (standardLengthGrandfathered.has(relPath)) continue;
    const text = await readFile(f, "utf8");
    const lines = bodyLineCount(text);
    if (lines > budgets.standardBody) {
      violations.push({
        file: relPath,
        line: 1,
        message: `standard body ${lines} lines exceeds cap ${budgets.standardBody} — split into multiple standards`,
      });
    }
  }
  const skillDir = path.join(AGENT_ROOT, "skills");
  const skillFiles = await walk(skillDir, (f) => path.basename(f) === "SKILL.md");
  for (const f of skillFiles) {
    const relPath = rel(f);
    if (skillLengthGrandfathered.has(relPath)) continue;
    const text = await readFile(f, "utf8");
    const lines = bodyLineCount(text);
    if (lines > budgets.skillTotal) {
      violations.push({
        file: relPath,
        line: 1,
        message: `skill body ${lines} lines exceeds cap ${budgets.skillTotal} — move reference, rubric, template, or example detail below SKILL.md`,
      });
    }
  }
  return { name: "length-caps", violations };
}

async function checkStandardsStatus() {
  const violations = [];
  const schema = await readJsonConfig("frontmatter-schema.json");
  const statusValues = new Set(schema.standardStatusValues);
  const dir = path.join(AGENT_ROOT, "standards");
  const files = await walk(dir, (f) => f.endsWith(".md"));
  for (const f of files) {
    if (path.basename(f) === "index.md") continue;
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) {
      violations.push({ file: rel(f), line: 1, message: "missing YAML frontmatter" });
      continue;
    }
    const status = fm.status;
    if (!status) {
      violations.push({ file: rel(f), line: 1, message: "frontmatter missing 'status' field" });
      continue;
    }
    if (!statusValues.has(status)) {
      violations.push({
        file: rel(f),
        line: 1,
        message: `frontmatter 'status' must be one of ${schema.standardStatusValues.join("|")} (got ${JSON.stringify(status)})`,
      });
      continue;
    }
    if (status === "superseded" && (!fm["superseded-by"] || !fm["superseded-by"].trim())) {
      violations.push({
        file: rel(f),
        line: 1,
        message: "status=superseded requires non-empty 'superseded-by' field",
      });
    }
  }
  return { name: "standards-status", violations };
}

function repoRootRelativePath(absolutePath) {
  return path.relative(REPO_ROOT, absolutePath).split(path.sep).join("/");
}

function agentRelativePath(absolutePath) {
  return path.relative(AGENT_ROOT, absolutePath).split(path.sep).join("/");
}

function isRepoRootRelativeTarget(value) {
  return value.startsWith("agent/") || value.startsWith("docs/") || value.startsWith("tools/");
}

function resolveStandardsRedirectTarget(fromFile, target) {
  const absolutePath = isRepoRootRelativeTarget(target)
    ? path.join(REPO_ROOT, target)
    : path.resolve(path.dirname(fromFile), target);
  return {
    absolutePath,
    repoRelativePath: repoRootRelativePath(absolutePath),
  };
}

function markdownCellValue(cell) {
  const linkTargets = markdownLinkTargets(cell);
  if (linkTargets.length > 0) return linkTargets[0].trim();
  return cell.trim().replace(/^`|`$/g, "").trim();
}

function parseRedirectStubRows(indexPath, text) {
  const rows = new Map();
  const lines = text.split("\n");
  let inRedirectStubs = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+Redirect Stubs\b/.test(line)) {
      inRedirectStubs = true;
      continue;
    }
    if (inRedirectStubs && /^##\s+/.test(line)) break;
    if (!inRedirectStubs) continue;

    const cells = markdownTableCells(line);
    if (!cells || cells.length < 2 || cells[0] === "Stub") continue;
    const stubValue = markdownCellValue(cells[0]);
    const replacementValue = markdownCellValue(cells[1]);
    if (!stubValue || !replacementValue) continue;

    const stubPath = resolveRepoMarkdownPath(indexPath, stubValue);
    if (!stubPath) continue;
    const stub = agentRelativePath(stubPath);
    const replacement = resolveStandardsRedirectTarget(stubPath, replacementValue);
    rows.set(stub, {
      replacementRaw: replacementValue,
      replacementRepoRelativePath: replacement.repoRelativePath,
    });
  }
  return rows;
}

async function standardsRedirectIndexRows() {
  const indexPath = path.join(AGENT_ROOT, "standards", "index.md");
  const text = await readFile(indexPath, "utf8");
  return parseRedirectStubRows(indexPath, text);
}

function validateStandardRedirectIndexRow(violations, file, stub, targetRepoRelativePath, indexRows) {
  const row = indexRows.get(stub);
  if (!row) {
    violations.push({
      file,
      line: 1,
      message: `standards index missing redirect row for standards redirect stub: ${stub}`,
    });
    return;
  }
  if (row.replacementRepoRelativePath !== targetRepoRelativePath) {
    violations.push({
      file,
      line: 1,
      message: `standards index redirect mismatch: ${stub} frontmatter=${targetRepoRelativePath} index=${row.replacementRepoRelativePath}`,
    });
  }
}

async function checkStandardsRedirects() {
  const violations = [];
  const indexRows = await standardsRedirectIndexRows();
  const dir = path.join(AGENT_ROOT, "standards");
  const files = await walk(dir, (f) => f.endsWith(".md"));
  for (const f of files) {
    if (path.basename(f) === "index.md") continue;
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) continue;
    const target = fm["superseded-by"]?.trim();
    if (target && fm.status !== "superseded") {
      violations.push({
        file: rel(f),
        line: 1,
        message: "'superseded-by' requires status=superseded",
      });
      continue;
    }
    if (!target) continue;
    const targetInfo = resolveStandardsRedirectTarget(f, target);
    if (!existsSync(targetInfo.absolutePath)) {
      violations.push({
        file: rel(f),
        line: 1,
        message: `superseded-by target does not exist: ${target}`,
      });
      continue;
    }
    validateStandardRedirectIndexRow(
      violations,
      rel(f),
      agentRelativePath(f),
      targetInfo.repoRelativePath,
      indexRows,
    );
  }
  return { name: "standards-redirects", violations };
}

async function checkSkillRootShape() {
  const violations = [];
  const entries = await listDirOnce(path.join(AGENT_ROOT, "skills"));
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    const skillFile = path.join(AGENT_ROOT, "skills", entry.name, "SKILL.md");
    if (!existsSync(skillFile)) {
      violations.push({
        file: `agent/skills/${entry.name}/`,
        line: 0,
        message: "first-level skill directory must contain SKILL.md; move tool apps to tools/",
      });
    }
  }
  return { name: "skill-root-shape", violations };
}

function frontmatterKeyPositions(text) {
  if (!text.startsWith("---\n")) return null;
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return null;
  const positions = new Map();
  const lines = rest.slice(0, end).split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*([A-Za-z0-9_-]+)\s*:/);
    if (match && !positions.has(match[1])) positions.set(match[1], i + 2);
  }
  return positions;
}

function pushFrontmatterOrderViolation(violations, file, text) {
  const positions = frontmatterKeyPositions(text);
  if (!positions) {
    violations.push({ file, line: 1, message: "missing YAML frontmatter" });
    return;
  }
  const order = ["description", "argument-hint", "allowed-tools"];
  const present = order.filter((key) => positions.has(key));
  for (let i = 1; i < present.length; i++) {
    if (positions.get(present[i - 1]) > positions.get(present[i])) {
      violations.push({
        file,
        line: positions.get(present[i]),
        message: `frontmatter order must keep ${order.join(", ")} when fields are present`,
      });
      return;
    }
  }
}

function hasBareBashTool(value) {
  return String(value || "")
    .split(",")
    .some((item) => item.trim() === "Bash");
}

async function checkSkillCommandMechanics() {
  const violations = [];
  const taxonomy = await readJsonConfig("taxonomy.json");
  const maxNameChars = taxonomy.maxArtifactNameChars;
  const namePattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const targets = [];
  const skillEntries = await listDirOnce(path.join(AGENT_ROOT, "skills"));
  for (const entry of skillEntries) {
    if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
    targets.push({
      name: entry.name,
      file: `agent/skills/${entry.name}/SKILL.md`,
      fullPath: path.join(AGENT_ROOT, "skills", entry.name, "SKILL.md"),
      kind: "skill",
    });
  }
  for (const target of targets) {
    if (!namePattern.test(target.name)) {
      violations.push({
        file: target.file,
        line: 0,
        message: `${target.kind} name must be lowercase hyphen-case`,
      });
    }
    if (Number.isInteger(maxNameChars) && target.name.length > maxNameChars) {
      violations.push({
        file: target.file,
        line: 0,
        message: `${target.kind} name length ${target.name.length} exceeds taxonomy maxArtifactNameChars ${maxNameChars}`,
      });
    }
    if (!existsSync(target.fullPath)) continue;
    const text = await readFile(target.fullPath, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) {
      violations.push({ file: target.file, line: 1, message: "missing YAML frontmatter" });
      continue;
    }
    if (!fm.description || !String(fm.description).trim()) {
      violations.push({ file: target.file, line: 1, message: "frontmatter missing non-empty description" });
    }
    pushFrontmatterOrderViolation(violations, target.file, text);
    if (hasBareBashTool(fm["allowed-tools"])) {
      violations.push({
        file: target.file,
        line: 1,
        message: "allowed-tools must use specific Bash(...) patterns, not bare Bash",
      });
    }
  }

  return { name: "skill-mechanics", violations };
}

function isTrackedRuntimePath(file) {
  return (
    file === "agent/history.jsonl" ||
    /^agent\/(cache|backups|sessions|tasks|telemetry|projects|shell-snapshots|paste-cache|file-history|plans|session-env|downloads|ide|statsig)\//.test(file) ||
    /^agent\/hooks\/.*\.err$/.test(file)
  );
}

async function checkTrackedRuntimePaths() {
  const violations = [];
  for (const file of await trackedFiles()) {
    if (!isTrackedRuntimePath(file)) continue;
    violations.push({
      file,
      line: 0,
      message: "runtime/cache path must not be git-tracked",
    });
  }
  return { name: "tracked-runtime-paths", violations };
}

function shouldSkipAbsolutePathAudit(file) {
  return (
    file.startsWith("docs/plans/completed/") ||
    file.startsWith("docs/plans/reports/") ||
    file === "docs/plans/active/ah-architecture-hardening.md" ||
    file === "docs/plans/active/skill-path-hardcoding-cleanup.md" ||
    file.startsWith("agent/private/") ||
    file.startsWith("agent/plugins/") ||
    file.startsWith("tools/ah-hq/node_modules/") ||
    file.startsWith("tools/ah-hq/dist/") ||
    file.startsWith("tools/ah-hq/.astro/")
  );
}

function isTextAuditTarget(file) {
  return /\.(md|mdx|json|jsonc|js|mjs|cjs|ts|tsx|astro|py|sh|toml|yaml|yml|txt|html|css)$/.test(file);
}

async function checkTrackedUserAbsolutePaths() {
  const violations = [];
  const patterns = [
    /\/Users\/(younsoolim|deemooooooooo|john)\b/,
    /[A-Za-z]:\\Users\\[^\\\s]+/,
    /D:\\\\vs\\\\agent-hub\\\\claude\\\\skills\\\\/,
    new RegExp("obsidian" + "ClaudeDir"),
    new RegExp("MyNotes" + "\\/agent"),
    new RegExp("Obsidian" + "\\/agent"),
  ];
  for (const file of await trackedFiles()) {
    if (shouldSkipAbsolutePathAudit(file) || !isTextAuditTarget(file)) continue;
    const fullPath = path.join(REPO_ROOT, file);
    let text;
    try {
      text = await readFile(fullPath, "utf8");
    } catch {
      continue;
    }
    const lines = text.split("\n");
    lines.forEach((line, idx) => {
      if (!patterns.some((pattern) => pattern.test(line))) return;
      violations.push({
        file,
        line: idx + 1,
        message: "tracked source must not contain user-specific absolute paths or retired Obsidian placeholders",
      });
    });
  }
  return { name: "tracked-user-paths", violations };
}

function parsePlatformList(value) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

async function checkPlatformMetadata() {
  const violations = [];
  const schema = await readJsonConfig("frontmatter-schema.json");
  const platformValues = new Set(schema.platformValues);
  const portabilityValues = new Set(schema.portabilityValues);
  const files = await llmFirstFiles();
  const required = new Set(schema.platformMetadataPilotFiles);
  for (const f of files) {
    const relPath = rel(f);
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    const isPilot = required.has(relPath);
    const hasPlatforms = fm && Object.prototype.hasOwnProperty.call(fm, "platforms");
    const hasPortability = fm && Object.prototype.hasOwnProperty.call(fm, "portability");
    if (isPilot && !fm) {
      violations.push({ file: relPath, line: 1, message: "pilot file missing YAML frontmatter" });
      continue;
    }
    if (isPilot && !hasPlatforms) {
      violations.push({ file: relPath, line: 1, message: "pilot file missing 'platforms' field" });
    }
    if (isPilot && !hasPortability) {
      violations.push({ file: relPath, line: 1, message: "pilot file missing 'portability' field" });
    }
    if (hasPlatforms) {
      const values = parsePlatformList(fm.platforms);
      if (values.length === 0) {
        violations.push({ file: relPath, line: 1, message: "frontmatter 'platforms' is empty" });
      }
      for (const value of values) {
        if (!platformValues.has(value)) {
          violations.push({
            file: relPath,
            line: 1,
            message: `frontmatter 'platforms' has unknown value ${JSON.stringify(value)}`,
          });
        }
      }
      if (values.includes("all") && values.length > 1) {
        violations.push({
          file: relPath,
          line: 1,
          message: "frontmatter 'platforms: all' must not be combined with named platforms",
        });
      }
    }
    if (hasPortability && !portabilityValues.has(fm.portability)) {
      violations.push({
        file: relPath,
        line: 1,
        message: `frontmatter 'portability' must be one of ${schema.portabilityValues.join("|")} (got ${JSON.stringify(fm.portability)})`,
      });
    }
    if (hasPlatforms !== hasPortability) {
      violations.push({
        file: relPath,
        line: 1,
        message: "frontmatter 'platforms' and 'portability' must be added together",
      });
    }
  }
  return { name: "platform-metadata", violations };
}

async function checkRegistryIntegrity() {
  const violations = [];
  const budgets = await readJsonConfig("doc-budgets.json");
  const schema = await readJsonConfig("frontmatter-schema.json");
  const taxonomy = await readJsonConfig("taxonomy.json");
  const auditPolicy = await readJsonConfig("audit-policy.json");
  const exceptions = await readJsonConfig("exceptions.json");

  for (const [key, value] of Object.entries(budgets.lineBudgets || {})) {
    if (!Number.isInteger(value) || value <= 0) {
      violations.push({
        file: "agent/config/doc-budgets.json",
        line: 1,
        message: `lineBudgets.${key} must be a positive integer`,
      });
    }
  }

  pushArrayViolations(violations, "agent/config/frontmatter-schema.json", "ruleLoadValues", schema.ruleLoadValues);
  pushArrayViolations(violations, "agent/config/frontmatter-schema.json", "standardStatusValues", schema.standardStatusValues);
  pushArrayViolations(violations, "agent/config/frontmatter-schema.json", "platformValues", schema.platformValues);
  pushArrayViolations(violations, "agent/config/frontmatter-schema.json", "portabilityValues", schema.portabilityValues);
  pushArrayViolations(violations, "agent/config/frontmatter-schema.json", "platformMetadataPilotFiles", schema.platformMetadataPilotFiles);
  pushArrayViolations(violations, "agent/config/taxonomy.json", "skillCategories", taxonomy.skillCategories, { sorted: true });
  pushArrayViolations(violations, "agent/config/taxonomy.json", "standardGroups", taxonomy.standardGroups, { sorted: true });
  pushArrayViolations(violations, "agent/config/taxonomy.json", "universalAbbreviations", taxonomy.universalAbbreviations, { sorted: true });
  pushArrayViolations(violations, "agent/config/audit-policy.json", "severityTiers", auditPolicy.severityTiers);

  if (!Number.isInteger(taxonomy.maxArtifactNameChars) || taxonomy.maxArtifactNameChars <= 0) {
    violations.push({
      file: "agent/config/taxonomy.json",
      line: 1,
      message: "maxArtifactNameChars must be a positive integer",
    });
  }
  for (const key of [
    "ruleFilenamePattern",
    "standardFilenamePattern",
    "planFilenamePattern",
    "decisionFilenamePattern",
  ]) {
    if (!taxonomy[key] || typeof taxonomy[key] !== "string") {
      violations.push({
        file: "agent/config/taxonomy.json",
        line: 1,
        message: `${key} must be a regex string`,
      });
      continue;
    }
    try {
      new RegExp(taxonomy[key]);
    } catch {
      violations.push({
        file: "agent/config/taxonomy.json",
        line: 1,
        message: `${key} must compile as a regex`,
      });
    }
  }
  pushArrayViolations(violations, "agent/config/taxonomy.json", "managedDocumentFolders", taxonomy.managedDocumentFolders);
  const managedPaths = [];
  for (const entry of taxonomy.managedDocumentFolders || []) {
    if (!entry || typeof entry !== "object") {
      violations.push({
        file: "agent/config/taxonomy.json",
        line: 1,
        message: "managedDocumentFolders entries must be objects",
      });
      continue;
    }
    for (const field of ["path", "patternKey"]) {
      if (!entry[field] || typeof entry[field] !== "string") {
        violations.push({
          file: "agent/config/taxonomy.json",
          line: 1,
          message: `managedDocumentFolders entry missing ${field}`,
        });
      }
    }
    if (typeof entry.recursive !== "boolean") {
      violations.push({
        file: "agent/config/taxonomy.json",
        line: 1,
        message: `managedDocumentFolders ${entry.path || "<unknown>"} recursive must be boolean`,
      });
    }
    if (entry.path) {
      managedPaths.push(entry.path);
      if (!existsSync(path.join(REPO_ROOT, entry.path))) {
        violations.push({
          file: "agent/config/taxonomy.json",
          line: 1,
          message: `managedDocumentFolders path does not exist: ${entry.path}`,
        });
      }
    }
    if (entry.patternKey && typeof taxonomy[entry.patternKey] !== "string") {
      violations.push({
        file: "agent/config/taxonomy.json",
        line: 1,
        message: `managedDocumentFolders ${entry.path || "<unknown>"} references unknown patternKey ${entry.patternKey}`,
      });
    }
  }
  if (hasDuplicates(managedPaths)) {
    violations.push({
      file: "agent/config/taxonomy.json",
      line: 1,
      message: "managedDocumentFolders paths must not contain duplicates",
    });
  }
  if (!isSorted(managedPaths)) {
    violations.push({
      file: "agent/config/taxonomy.json",
      line: 1,
      message: "managedDocumentFolders paths must be sorted alphabetically",
    });
  }

  for (const [key, value] of Object.entries(auditPolicy.garden || {})) {
    if (!Number.isInteger(value) || value <= 0) {
      violations.push({
        file: "agent/config/audit-policy.json",
        line: 1,
        message: `garden.${key} must be a positive integer`,
      });
    }
  }
  for (const key of ["contextBudgetPercent", "obsidianBulkRetagNotes", "obsidianBulkRetagBackgroundNotes"]) {
    const value = auditPolicy[key];
    if (!Number.isInteger(value) || value <= 0) {
      violations.push({
        file: "agent/config/audit-policy.json",
        line: 1,
        message: `${key} must be a positive integer`,
      });
    }
  }

  for (const key of [
    "standardLengthGrandfathered",
    "skillLengthGrandfathered",
  ]) {
    if (exceptions[key] !== undefined && !Array.isArray(exceptions[key])) {
      violations.push({
        file: "agent/config/exceptions.json",
        line: 1,
        message: `${key} must be an array`,
      });
      continue;
    }
    for (const entry of exceptions[key] || []) {
      const fields = ["path", "reason", "decision"];
      for (const field of fields) {
        if (!entry[field] || !String(entry[field]).trim()) {
          violations.push({
            file: "agent/config/exceptions.json",
            line: 1,
            message: `${key} entry missing ${field}`,
          });
        }
      }
      if (!entry.expires && !entry.reviewAfter) {
        violations.push({
          file: "agent/config/exceptions.json",
          line: 1,
          message: `${key} ${entry.path || "<unknown>"} requires expires or reviewAfter`,
        });
      }
      if (entry.path && !existsSync(path.join(REPO_ROOT, entry.path))) {
        violations.push({
          file: "agent/config/exceptions.json",
          line: 1,
          message: `exception target does not exist: ${entry.path}`,
        });
      }
      if (entry.decision) {
        const decisionPath = String(entry.decision).split("#")[0];
        if (!existsSync(path.join(REPO_ROOT, decisionPath))) {
          violations.push({
            file: "agent/config/exceptions.json",
            line: 1,
            message: `exception decision target does not exist: ${entry.decision}`,
          });
        }
      }
    }
  }

  return { name: "registry-integrity", violations };
}

const AGENT_HUB_ALLOWED = {
  sharedLayerKinds: new Set(["rules", "standards", "skills", "lib", "config"]),
  loadModes: new Set(["entry", "auto", "triggered", "on-demand", "invoked", "library", "config"]),
  registryFormats: new Set(["json"]),
  registrySecretPolicies: new Set(["no-secrets", "template-only", "private-values"]),
  generatedDocumentModes: new Set(["generated-block", "validated-manual", "thin-wrapper"]),
  runtimeOwners: new Set(["agent-hub", "runtime", "machine-local", "project-local"]),
  gitPolicies: new Set(["tracked", "ignored", "template-tracked", "mixed"]),
  runtimeSecretPolicies: new Set(["no-secrets", "may-contain-secrets", "must-not-commit"]),
  durability: new Set(["durable", "runtime", "cache", "session", "backup", "private"]),
};

function pushUniqueIdViolations(violations, file, key, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    violations.push({ file, line: 1, message: `${key} must be a non-empty array` });
    return;
  }
  const ids = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      violations.push({ file, line: 1, message: `${key} entries must be objects` });
      continue;
    }
    if (!entry.id || typeof entry.id !== "string") {
      violations.push({ file, line: 1, message: `${key} entry missing id` });
    } else {
      ids.push(entry.id);
    }
  }
  if (hasDuplicates(ids)) {
    violations.push({ file, line: 1, message: `${key} ids must not contain duplicates` });
  }
}

function manifestPathExists(value) {
  if (!value || typeof value !== "string") return false;
  if (value.startsWith("~/")) return true;
  if (/[*{}]/.test(value)) return true;
  return existsSync(path.join(REPO_ROOT, value));
}

function normalizeManagedPath(value) {
  return String(value || "").replace(/\/+$/, "");
}

function isUnsafeManagedPath(value) {
  return (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.startsWith("../") ||
    value.includes("/../") ||
    /^([A-Za-z]:\\|\/Users\/)/.test(value)
  );
}

function lineNumberAt(text, index) {
  return text.slice(0, index).split("\n").length;
}

function aliasHasHarnessMapping(aliasValue, canonical, manifest) {
  const [aliasRoot, ...restParts] = aliasValue.split("/");
  const aliasRest = restParts.join("/");
  for (const harness of manifest.harnesses || []) {
    if (harness.linkMethod !== "symlink") continue;
    const mapped = harness.mappings?.[aliasRoot];
    if (!mapped) continue;
    const mappedCanonical = aliasRest ? `${mapped}/${aliasRest}` : mapped;
    if (normalizeManagedPath(mappedCanonical) === normalizeManagedPath(canonical)) return true;
  }
  return false;
}

async function managedPathAlias(id, fallback) {
  try {
    const registry = await readJsonConfig("managed-paths.json");
    const entry = (registry.paths || []).find((item) => item.id === id);
    const alias = (entry?.aliases || []).find((item) => item.contexts?.includes("validator-adapter"));
    return alias?.value || fallback;
  } catch {
    return fallback;
  }
}

function isHistoricalManagedPathFile(file) {
  return (
    file.startsWith("docs/plans/completed/") ||
    file.startsWith("docs/plans/archive/") ||
    file.startsWith("docs/briefings/") ||
    file.startsWith("docs/decisions/")
  );
}

function isRegistryOwnerManagedPathFile(file) {
  return (
    file === "agent/config/artifact-inventory.json" ||
    file === "agent/config/managed-paths.json" ||
    file === "agent/config/managed-paths.schema.json" ||
    file === "docs/plans/proposed/managed-path-registry-validation.md"
  );
}

function isCanonicalSubstringUse(text, index) {
  return text.slice(Math.max(0, index - "agent/".length), index) === "agent/";
}

function isRelativeMarkdownLinkUse(text, index) {
  return text.slice(Math.max(0, index - "../".length), index) === "../";
}

function isDeployTargetAliasUse(text, index) {
  const prefix = text.slice(Math.max(0, index - 20), index);
  return /~\/\.(claude|codex)\//.test(prefix);
}

function isValidatorAdapterAliasUse(file, text, index) {
  if (file !== "scripts/validate-llm-first.mjs") return false;
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const lineEnd = text.indexOf("\n", index);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  return line.includes('"rules/');
}

function isContextFrontmatterAliasUse(text, index) {
  if (!text.startsWith("---\n")) return false;
  const frontmatterEnd = text.indexOf("\n---\n", 4);
  if (frontmatterEnd === -1 || index > frontmatterEnd) return false;
  const lineStart = text.lastIndexOf("\n", index) + 1;
  const lineEnd = text.indexOf("\n", index);
  const line = text.slice(lineStart, lineEnd === -1 ? text.length : lineEnd);
  return /^context-(rules|standards|skills):/.test(line.trim());
}

async function checkManagedPaths() {
  const violations = [];
  const file = "agent/config/managed-paths.json";
  let registry;
  let manifest;
  try {
    registry = await readJsonConfig("managed-paths.json");
    manifest = await readJsonConfig("agent-hub.json");
  } catch (err) {
    return { name: "managed-paths", violations: [{ file, line: 1, message: `cannot read managed path registry: ${err.message}` }] };
  }

  if (registry["schema-version"] !== 1) {
    violations.push({ file, line: 1, message: `schema-version must be 1, got ${JSON.stringify(registry["schema-version"])}` });
  }
  if (!Array.isArray(registry.paths)) {
    violations.push({ file, line: 1, message: "paths must be an array" });
    return { name: "managed-paths", violations };
  }

  const ids = [];
  const canonicals = [];
  const enforcedAliases = [];
  const allowedContexts = new Set(["deploy-target", "context-frontmatter", "historical-doc", "registry-owner", "validator-adapter"]);
  for (const entry of registry.paths) {
    if (!entry || typeof entry !== "object") {
      violations.push({ file, line: 1, message: "paths entries must be objects" });
      continue;
    }
    if (!entry.id || typeof entry.id !== "string") {
      violations.push({ file, line: 1, message: "paths entry missing id" });
    } else {
      ids.push(entry.id);
    }
    if (isUnsafeManagedPath(entry.canonical)) {
      violations.push({ file, line: 1, message: `${entry.id || "<unknown>"} invalid canonical path: ${JSON.stringify(entry.canonical)}` });
    } else {
      canonicals.push(entry.canonical);
      if (!existsSync(path.join(REPO_ROOT, entry.canonical))) {
        violations.push({ file, line: 1, message: `${entry.id} canonical path does not exist: ${entry.canonical}` });
      }
    }
    for (const alias of entry.aliases || []) {
      if (!alias || typeof alias !== "object" || isUnsafeManagedPath(alias.value)) {
        violations.push({ file, line: 1, message: `${entry.id || "<unknown>"} invalid alias value: ${JSON.stringify(alias?.value)}` });
        continue;
      }
      if (!Array.isArray(alias.contexts) || alias.contexts.length === 0) {
        violations.push({ file, line: 1, message: `${entry.id} alias ${alias.value} contexts must be non-empty` });
      } else {
        for (const context of alias.contexts) {
          if (!allowedContexts.has(context)) {
            violations.push({ file, line: 1, message: `${entry.id} alias ${alias.value} has unknown context ${JSON.stringify(context)}` });
          }
        }
      }
      if (alias.contexts?.includes("deploy-target") && !aliasHasHarnessMapping(alias.value, entry.canonical, manifest)) {
        violations.push({ file, line: 1, message: `${entry.id} alias ${alias.value} does not map to ${entry.canonical} through a symlink harness` });
      }
      if (alias["enforce-canonical"]) enforcedAliases.push({ entry, alias });
    }
  }
  if (hasDuplicates(ids)) violations.push({ file, line: 1, message: "path ids must not contain duplicates" });
  if (hasDuplicates(canonicals)) violations.push({ file, line: 1, message: "canonical paths must not contain duplicates" });

  const files = (await trackedFiles()).filter((f) => isTextAuditTarget(f));
  for (const targetFile of files) {
    if (isRegistryOwnerManagedPathFile(targetFile)) continue;
    const historical = isHistoricalManagedPathFile(targetFile);
    let text;
    try {
      text = await readFile(path.join(REPO_ROOT, targetFile), "utf8");
    } catch {
      continue;
    }
    for (const { entry, alias } of enforcedAliases) {
      let index = text.indexOf(alias.value);
      while (index !== -1) {
        const contexts = new Set(alias.contexts || []);
        const allowed =
          isCanonicalSubstringUse(text, index) ||
          isRelativeMarkdownLinkUse(text, index) ||
          (historical && contexts.has("historical-doc")) ||
          (contexts.has("deploy-target") && isDeployTargetAliasUse(text, index)) ||
          (contexts.has("context-frontmatter") && isContextFrontmatterAliasUse(text, index)) ||
          (contexts.has("validator-adapter") && isValidatorAdapterAliasUse(targetFile, text, index));
        if (!allowed) {
          violations.push({
            file: targetFile,
            line: lineNumberAt(text, index),
            message: `use managed canonical path ${entry.canonical} instead of alias ${alias.value}`,
          });
        }
        index = text.indexOf(alias.value, index + alias.value.length);
      }
    }
  }

  return { name: "managed-paths", violations };
}

function pushManifestPathViolation(violations, field, value) {
  if (!manifestPathExists(value)) {
    violations.push({
      file: "agent/config/agent-hub.json",
      line: 1,
      message: `${field} target does not exist: ${value}`,
    });
  }
}

function collectManifestStrings(value, out = []) {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectManifestStrings(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) collectManifestStrings(item, out);
  }
  return out;
}

const REQUIRED_SYMLINK_LAYER_MAPPINGS = ["rules", "standards", "skills"];

async function checkAgentHubManifest() {
  const violations = [];
  const file = "agent/config/agent-hub.json";
  let manifest;
  try {
    manifest = await readJsonConfig("agent-hub.json");
  } catch (err) {
    return {
      name: "agent-hub",
      violations: [{ file, line: 1, message: `cannot read agent hub manifest: ${err.message}` }],
    };
  }

  if (manifest.version !== 1) {
    violations.push({ file, line: 1, message: "version must be 1" });
  }

  for (const key of [
    "harnesses",
    "sharedLayers",
    "registries",
    "generatedDocuments",
    "runtimePathPolicies",
    "validators",
  ]) {
    pushUniqueIdViolations(violations, file, key, manifest[key]);
  }

  let systemText = "";
  try {
    systemText = await readFile(path.join(REPO_ROOT, "SYSTEM.md"), "utf8");
  } catch {
    violations.push({ file: "SYSTEM.md", line: 0, message: "SYSTEM.md not found" });
  }

  for (const harness of manifest.harnesses || []) {
    for (const field of ["displayName", "entryDocument", "deployTarget", "firstRead", "adapter"]) {
      if (!harness[field] || typeof harness[field] !== "string") {
        violations.push({ file, line: 1, message: `harness ${harness.id || "<unknown>"} missing ${field}` });
      }
    }
    if (harness.entryDocument) {
      pushManifestPathViolation(violations, `harness ${harness.id}.entryDocument`, harness.entryDocument);
      const entryPath = path.join(REPO_ROOT, harness.entryDocument);
      if (existsSync(entryPath) && harness.firstRead) {
        const text = await readFile(entryPath, "utf8");
        if (!text.includes(harness.firstRead)) {
          violations.push({
            file,
            line: 1,
            message: `harness ${harness.id}.firstRead not found in ${harness.entryDocument}`,
          });
        }
      }
    }
    if (harness.deployTarget) {
      pushManifestPathViolation(violations, `harness ${harness.id}.deployTarget`, harness.deployTarget);
    }
    if (systemText && harness.entryDocument && !systemText.includes(`\`${harness.entryDocument}\``)) {
      violations.push({
        file: "SYSTEM.md",
        line: 1,
        message: `entry document table missing ${harness.entryDocument}`,
      });
    }
    if (systemText && harness.displayName && !systemText.includes(harness.displayName)) {
      violations.push({
        file: "SYSTEM.md",
        line: 1,
        message: `entry document table missing harness ${harness.displayName}`,
      });
    }
    if (harness.linkMethod === "symlink") {
      const mappings = harness.mappings || {};
      if (harness.entryDocument) {
        const targetName = path.basename(harness.entryDocument);
        if (mappings[targetName] !== harness.entryDocument) {
          violations.push({
            file,
            line: 1,
            message: `harness ${harness.id} missing entry mapping ${targetName} -> ${harness.entryDocument}`,
          });
        }
      }
      for (const layerId of REQUIRED_SYMLINK_LAYER_MAPPINGS) {
        if ((manifest.sharedLayers || []).some((layer) => layer.id === layerId) && !mappings[layerId]) {
          violations.push({
            file,
            line: 1,
            message: `harness ${harness.id} missing required mapping ${layerId} -> agent/${layerId}`,
          });
        }
      }
    }
  }

  for (const layer of manifest.sharedLayers || []) {
    for (const field of ["path", "kind", "loadMode", "inventorySource", "deployTarget"]) {
      if (!layer[field] || typeof layer[field] !== "string") {
        violations.push({ file, line: 1, message: `sharedLayers ${layer.id || "<unknown>"} missing ${field}` });
      }
    }
    if (layer.kind && !AGENT_HUB_ALLOWED.sharedLayerKinds.has(layer.kind)) {
      violations.push({ file, line: 1, message: `sharedLayers ${layer.id}.kind has unknown value ${layer.kind}` });
    }
    if (layer.loadMode && !AGENT_HUB_ALLOWED.loadModes.has(layer.loadMode)) {
      violations.push({ file, line: 1, message: `sharedLayers ${layer.id}.loadMode has unknown value ${layer.loadMode}` });
    }
    if (layer.path) pushManifestPathViolation(violations, `sharedLayers ${layer.id}.path`, layer.path);
    if (layer.inventorySource) {
      pushManifestPathViolation(violations, `sharedLayers ${layer.id}.inventorySource`, layer.inventorySource);
    }
  }

  for (const registry of manifest.registries || []) {
    for (const field of ["path", "domain", "format", "deployTarget", "secretPolicy"]) {
      if (!registry[field] || typeof registry[field] !== "string") {
        violations.push({ file, line: 1, message: `registries ${registry.id || "<unknown>"} missing ${field}` });
      }
    }
    if (registry.format && !AGENT_HUB_ALLOWED.registryFormats.has(registry.format)) {
      violations.push({ file, line: 1, message: `registries ${registry.id}.format has unknown value ${registry.format}` });
    }
    if (registry.secretPolicy && !AGENT_HUB_ALLOWED.registrySecretPolicies.has(registry.secretPolicy)) {
      violations.push({
        file,
        line: 1,
        message: `registries ${registry.id}.secretPolicy has unknown value ${registry.secretPolicy}`,
      });
    }
    if (registry.path) {
      pushManifestPathViolation(violations, `registries ${registry.id}.path`, registry.path);
      if (registry.path.endsWith(".json") && existsSync(path.join(REPO_ROOT, registry.path))) {
        try {
          JSON.parse(await readFile(path.join(REPO_ROOT, registry.path), "utf8"));
        } catch (err) {
          violations.push({ file, line: 1, message: `registries ${registry.id}.path is invalid JSON: ${err.message}` });
        }
      }
    }
  }

  for (const generated of manifest.generatedDocuments || []) {
    for (const field of ["path", "marker", "source", "mode", "validator"]) {
      if (!generated[field] || typeof generated[field] !== "string") {
        violations.push({ file, line: 1, message: `generatedDocuments ${generated.id || "<unknown>"} missing ${field}` });
      }
    }
    if (generated.mode && !AGENT_HUB_ALLOWED.generatedDocumentModes.has(generated.mode)) {
      violations.push({ file, line: 1, message: `generatedDocuments ${generated.id}.mode has unknown value ${generated.mode}` });
    }
    if (generated.path) pushManifestPathViolation(violations, `generatedDocuments ${generated.id}.path`, generated.path);
    if (generated.mode === "generated-block" && generated.path && generated.marker) {
      const generatedPath = path.join(REPO_ROOT, generated.path);
      if (existsSync(generatedPath)) {
        const text = await readFile(generatedPath, "utf8");
        if (generated.startMarker || generated.endMarker) {
          if (!generated.startMarker || !generated.endMarker) {
            violations.push({ file, line: 1, message: `generatedDocuments ${generated.id} custom markers must be paired` });
          } else if (!text.includes(generated.startMarker) || !text.includes(generated.endMarker)) {
            violations.push({ file, line: 1, message: `generatedDocuments ${generated.id} custom marker missing` });
          }
        } else if (!text.includes(`generated:${generated.marker}`)) {
          violations.push({ file, line: 1, message: `generatedDocuments ${generated.id} marker missing` });
        }
      }
    }
  }

  for (const policy of manifest.runtimePathPolicies || []) {
    for (const field of ["pathPattern", "owner", "gitPolicy", "secretPolicy", "durability"]) {
      if (!policy[field] || typeof policy[field] !== "string") {
        violations.push({ file, line: 1, message: `runtimePathPolicies ${policy.id || "<unknown>"} missing ${field}` });
      }
    }
    if (policy.owner && !AGENT_HUB_ALLOWED.runtimeOwners.has(policy.owner)) {
      violations.push({ file, line: 1, message: `runtimePathPolicies ${policy.id}.owner has unknown value ${policy.owner}` });
    }
    if (policy.gitPolicy && !AGENT_HUB_ALLOWED.gitPolicies.has(policy.gitPolicy)) {
      violations.push({ file, line: 1, message: `runtimePathPolicies ${policy.id}.gitPolicy has unknown value ${policy.gitPolicy}` });
    }
    if (policy.secretPolicy && !AGENT_HUB_ALLOWED.runtimeSecretPolicies.has(policy.secretPolicy)) {
      violations.push({
        file,
        line: 1,
        message: `runtimePathPolicies ${policy.id}.secretPolicy has unknown value ${policy.secretPolicy}`,
      });
    }
    if (policy.durability && !AGENT_HUB_ALLOWED.durability.has(policy.durability)) {
      violations.push({ file, line: 1, message: `runtimePathPolicies ${policy.id}.durability has unknown value ${policy.durability}` });
    }
  }

  const listedChecks = new Set(CHECKS.map((check) => check.name));
  for (const validator of manifest.validators || []) {
    for (const field of ["script", "listedCheck", "covers"]) {
      if (!validator[field]) {
        violations.push({ file, line: 1, message: `validators ${validator.id || "<unknown>"} missing ${field}` });
      }
    }
    if (validator.script) pushManifestPathViolation(violations, `validators ${validator.id}.script`, validator.script);
    if (validator.listedCheck && !listedChecks.has(validator.listedCheck)) {
      violations.push({ file, line: 1, message: `validators ${validator.id}.listedCheck is not registered` });
    }
    if (!Array.isArray(validator.covers) || validator.covers.length === 0) {
      violations.push({ file, line: 1, message: `validators ${validator.id || "<unknown>"}.covers must be non-empty` });
    }
  }

  for (const value of collectManifestStrings(manifest)) {
    if (/^\/Users\//.test(value) || /^[A-Za-z]:\\/.test(value)) {
      violations.push({ file, line: 1, message: `manifest must not store machine-specific absolute path: ${value}` });
    }
  }

  return { name: "agent-hub", violations };
}

const ROUTING_METADATA_FIELDS = [
  { field: "domains", axis: "domains", profileKey: "domains" },
  { field: "repo-keys", axis: "repoKeys", profileKey: "repoKeys" },
  { field: "languages", axis: "languages", profileKey: "languages" },
  { field: "frameworks", axis: "frameworks", profileKey: "frameworks" },
  { field: "task-types", axis: "taskTypes", profileKey: "taskTypes" },
];

const TASK_TYPE_EVIDENCE = {
  authoring: ["author", "make rule", "make skill", "milestone", "plan", "planning", "spec", "write skill"],
  deploy: ["deploy", "rollout", "ship"],
  git: ["branch", "commit", "merge", "pull", "push", "rebase"],
  implementation: ["build", "code", "ecs", "fix", "implement", "material"],
  ops: ["alert", "linear", "notice", "ops", "slack", "status", "worktree"],
  research: ["find", "lookup", "research", "search"],
  review: ["audit", "pr", "review"],
};

const ROUTER_EVIDENCE = {
  "ah-route-implementation": ["build", "code", "fix", "implement"],
  "ah-route-plan": ["milestone", "plan", "planning", "spec first"],
  "ah-route-review": ["audit", "review"],
};

const WORK_MODE_EVIDENCE = {
  company: ["company", "linear", "pr", "pull request", "review comment", "shotloom", "stl-"],
  experiment: ["benchmark", "comparison", "experiment", "prototype", "spike", "throwaway"],
  personal: ["local-only", "personal", "private project", "solo"],
};

const ROUTE_VALUE_EVIDENCE = {
  "3d": ["3d", "mmd", "pmx", "retarget", "vrm"],
  anju: ["anju"],
  astro: ["astro"],
  bevy: ["bevy", "ecs"],
  "agent-hub": ["agent hub", "agent-hub"],
  cinev: ["cci", "cinev"],
  "cinev-git": ["cinev git"],
  "cinev-studio": ["cinevstudio", "cinev studio"],
  "cinev-studio-git": ["cinevstudio git", "cinev studio git"],
  cpp: ["c++", "cpp"],
  css: ["css"],
  hyperframes: ["hyperframes"],
  javascript: ["javascript", "js"],
  json: ["json"],
  markdown: ["markdown", "md"],
  "mega-melange": ["mega melange", "mega-melange"],
  obsidian: ["note", "obsidian", "vault"],
  python: ["python", "py"],
  rust: ["cargo", "rust"],
  shotloom: ["shotloom"],
  three: ["three", "three.js"],
  typescript: ["ts", "typescript"],
  unreal: ["ue", "unreal"],
  video: ["hyperframes", "video"],
  "vrm2u-bevy": ["bevy-vrm", "vrm2u"],
  web: ["frontend", "web"],
  wgpu: ["webgpu", "wgpu"],
  yaml: ["yaml", "yml"],
};

const AUTHORING_ROUTING_FILES = [
  "agent/skills/ah-make-skill/SKILL.md",
  "agent/skills/ah-make-standard/SKILL.md",
  "agent/rules/author.md",
];

function pushStringArrayViolations(violations, file, key, value, options = {}) {
  pushArrayViolations(violations, file, key, value, options);
  if (!Array.isArray(value)) return;
  for (const item of value) {
    if (!item || typeof item !== "string") {
      violations.push({ file, line: 1, message: `${key} entries must be non-empty strings` });
    }
  }
}

function routeValuesFromFrontmatter(fm, field) {
  if (!fm || !Object.prototype.hasOwnProperty.call(fm, field)) return null;
  return parsePlatformList(fm[field]);
}

function hasTextEvidence(text, value) {
  const terms = ROUTE_VALUE_EVIDENCE[value] || [String(value).replaceAll("-", " ")];
  return terms.some((term) => text.includes(term));
}

function taskTypeEvidence(text) {
  const out = new Set();
  for (const [taskType, terms] of Object.entries(TASK_TYPE_EVIDENCE)) {
    if (terms.some((term) => text.includes(term))) out.add(taskType);
  }
  return out;
}

function workModeEvidence(text) {
  const out = new Set();
  for (const [workMode, terms] of Object.entries(WORK_MODE_EVIDENCE)) {
    if (terms.some((term) => text.includes(term))) out.add(workMode);
  }
  return out;
}

function selectRoutersForTask(task, routers) {
  const text = task.toLowerCase();
  const selected = [];
  for (const router of routers) {
    const terms = ROUTER_EVIDENCE[router.id] || [String(router.id).replaceAll("-", " ")];
    if (terms.some((term) => text.includes(term))) selected.push(router);
  }
  return selected;
}

function contextManifestValues(fm, field) {
  if (!fm || !Object.prototype.hasOwnProperty.call(fm, field)) return [];
  return parsePlatformList(fm[field]);
}

function normalizeSharedContextRef(raw) {
  const match = String(raw).match(/(?:~\/\.claude\/|agent\/)?(rules|standards)\/[-A-Za-z0-9_./]+\.md/);
  if (!match) return null;
  const prefix = `${match[1]}/`;
  const tail = String(raw).slice(String(raw).lastIndexOf(prefix) + prefix.length);
  return `${match[1]}/${tail}`;
}

function sharedContextRefsFromBody(body) {
  const refs = new Set();
  const re = /(?:~\/\.claude\/|agent\/)?(?:rules|standards)\/[-A-Za-z0-9_./]+\.md/g;
  for (const match of body.matchAll(re)) {
    const ref = normalizeSharedContextRef(match[0]);
    if (ref) refs.add(ref);
  }
  return refs;
}

async function validateContextStandardRedirect(violations, skillPath, declared, declaredPath, indexRows) {
  const text = await readFile(declaredPath, "utf8");
  const fm = parseFrontmatter(text);
  if (!fm || fm.status !== "superseded") return;

  const target = fm["superseded-by"]?.trim();
  if (!target) {
    violations.push({
      file: skillPath,
      line: 1,
      message: `context-standards redirect missing superseded-by: ${declared}`,
    });
    return;
  }
  const targetInfo = resolveStandardsRedirectTarget(declaredPath, target);
  if (!existsSync(targetInfo.absolutePath)) {
    violations.push({
      file: skillPath,
      line: 1,
      message: `context-standards redirect target does not exist: ${declared} -> ${targetInfo.repoRelativePath}`,
    });
    return;
  }
  validateStandardRedirectIndexRow(
    violations,
    skillPath,
    declared,
    targetInfo.repoRelativePath,
    indexRows,
  );
}

async function validateContextManifestPaths(violations, skillPath, fm, indexRows) {
  const groups = [
    { field: "context-rules", root: "agent", prefix: "rules/" },
    { field: "context-standards", root: "agent", prefix: "standards/" },
  ];
  for (const group of groups) {
    for (const value of contextManifestValues(fm, group.field)) {
      if (!value.startsWith(group.prefix)) {
        violations.push({
          file: skillPath,
          line: 1,
          message: `${group.field} entry must start with ${group.prefix}: ${value}`,
        });
        continue;
      }
      const targetPath = path.join(REPO_ROOT, group.root, value);
      if (!existsSync(targetPath)) {
        violations.push({ file: skillPath, line: 1, message: `${group.field} path does not exist: ${value}` });
        continue;
      }
      if (group.field === "context-standards") {
        await validateContextStandardRedirect(violations, skillPath, value, targetPath, indexRows);
      }
    }
  }
  for (const value of contextManifestValues(fm, "context-repo-docs")) {
    if (!value.startsWith("repo:")) {
      violations.push({ file: skillPath, line: 1, message: `context-repo-docs entry must start with repo:: ${value}` });
      continue;
    }
    const repoPath = value.slice("repo:".length);
    if (!repoPath || !existsSync(path.join(REPO_ROOT, repoPath))) {
      violations.push({ file: skillPath, line: 1, message: `context-repo-docs path does not exist: ${value}` });
    }
  }
  for (const value of contextManifestValues(fm, "context-references")) {
    const skillDir = path.dirname(path.join(REPO_ROOT, skillPath));
    if (!value || path.isAbsolute(value) || value.includes("..")) {
      violations.push({ file: skillPath, line: 1, message: `context-references entry must be skill-local: ${value}` });
      continue;
    }
    if (!existsSync(path.join(skillDir, value))) {
      violations.push({ file: skillPath, line: 1, message: `context-references path does not exist: ${value}` });
    }
  }
}

function selectProfilesForTask(task, profiles) {
  const text = task.toLowerCase();
  const taskTypes = taskTypeEvidence(text);
  const selected = [];
  const domainRequired = new Set(["3d", "cinev", "shotloom", "video"]);
  for (const profile of profiles) {
    if (taskTypes.size > 0 && !profile.taskTypes.some((value) => taskTypes.has(value))) {
      continue;
    }
    if (profile.taskTypes.length === 1 && profile.taskTypes[0] === "review" && !taskTypes.has("review")) {
      continue;
    }
    const requiredDomains = (profile.domains || []).filter((value) => domainRequired.has(value));
    if (requiredDomains.length > 0 && !requiredDomains.some((value) => hasTextEvidence(text, value))) {
      continue;
    }
    let score = 0;
    let routeScore = 0;
    for (const key of ["domains", "languages", "frameworks"]) {
      for (const value of profile[key] || []) {
        if (hasTextEvidence(text, value)) {
          score++;
          routeScore++;
        }
      }
    }
    for (const value of profile.repoKeys || []) {
      if (hasTextEvidence(text, value)) {
        score++;
      }
    }
    for (const value of profile.taskTypes || []) {
      if (taskTypes.has(value)) score++;
    }
    if (routeScore === 0) continue;
    if (score > 0) selected.push(profile);
  }
  return selected;
}

async function checkContextRouting() {
  const violations = [];
  const file = "agent/config/context-routing.json";
  let routing;
  try {
    routing = await readJsonConfig("context-routing.json");
  } catch (err) {
    return {
      name: "context-routing",
      violations: [{ file, line: 1, message: `cannot read context routing registry: ${err.message}` }],
    };
  }

  if (routing.version !== 1) {
    violations.push({ file, line: 1, message: "version must be 1" });
  }
  if (routing.metadataSyntax?.listStyle !== "comma-separated scalars") {
    violations.push({ file, line: 1, message: "metadataSyntax.listStyle must be comma-separated scalars" });
  }

  let repoPaths = {};
  try {
    repoPaths = await readJsonRel(routing.repoKeysSource);
  } catch (err) {
    violations.push({ file, line: 1, message: `cannot read repoKeysSource: ${err.message}` });
  }
  const repoKeys = new Set(Object.keys(repoPaths));

  for (const axis of ["domains", "languages", "frameworks", "taskTypes", "workModes"]) {
    pushStringArrayViolations(violations, file, `axes.${axis}`, routing.axes?.[axis], { sorted: true });
  }
  const allowed = {
    domains: new Set(routing.axes?.domains || []),
    repoKeys,
    languages: new Set(routing.axes?.languages || []),
    frameworks: new Set(routing.axes?.frameworks || []),
    taskTypes: new Set(routing.axes?.taskTypes || []),
    workModes: new Set(routing.axes?.workModes || []),
  };

  pushUniqueIdViolations(violations, file, "profiles", routing.profiles);
  const profiles = Array.isArray(routing.profiles) ? routing.profiles : [];
  const profileIds = new Set(profiles.map((profile) => profile.id).filter(Boolean));
  for (const profile of profiles) {
    for (const entry of ROUTING_METADATA_FIELDS) {
      const values = profile[entry.profileKey] || [];
      if (entry.field !== "frameworks") {
        pushStringArrayViolations(violations, file, `profiles.${profile.id}.${entry.profileKey}`, values);
      }
      if (entry.field === "frameworks" && values.length > 0) {
        pushStringArrayViolations(violations, file, `profiles.${profile.id}.${entry.profileKey}`, values);
      }
      for (const value of values) {
        if (!allowed[entry.axis].has(value)) {
          violations.push({
            file,
            line: 1,
            message: `profiles.${profile.id}.${entry.profileKey} has unknown value ${JSON.stringify(value)}`,
          });
        }
      }
    }
    if (!Number.isInteger(profile.maxBytes) || profile.maxBytes <= 0) {
      violations.push({ file, line: 1, message: `profiles.${profile.id}.maxBytes must be a positive integer` });
    }
  }

  pushUniqueIdViolations(violations, file, "routers", routing.routers);
  const routers = Array.isArray(routing.routers) ? routing.routers : [];
  const routerIds = new Set(routers.map((router) => router.id).filter(Boolean));
  for (const router of routers) {
    if (!router.path || typeof router.path !== "string") {
      violations.push({ file, line: 1, message: `routers.${router.id || "<unknown>"} missing path` });
    } else if (!existsSync(path.join(REPO_ROOT, router.path))) {
      violations.push({ file, line: 1, message: `router file does not exist: ${router.path}` });
    }
    pushStringArrayViolations(violations, file, `routers.${router.id}.taskTypes`, router.taskTypes);
    for (const value of router.taskTypes || []) {
      if (!allowed.taskTypes.has(value)) {
        violations.push({ file, line: 1, message: `routers.${router.id}.taskTypes has unknown value ${JSON.stringify(value)}` });
      }
    }
    pushStringArrayViolations(violations, file, `routers.${router.id}.workModes`, router.workModes);
    for (const value of router.workModes || []) {
      if (!allowed.workModes.has(value)) {
        violations.push({ file, line: 1, message: `routers.${router.id}.workModes has unknown value ${JSON.stringify(value)}` });
      }
    }
  }

  const pilotFiles = Array.isArray(routing.pilotFiles) ? routing.pilotFiles : [];
  const pilotPathSet = new Set(pilotFiles.map((pilot) => pilot.path).filter(Boolean));
  const standardRedirectRows = await standardsRedirectIndexRows();
  if (pilotFiles.length === 0) {
    violations.push({ file, line: 1, message: "pilotFiles must be a non-empty array" });
  }
  for (const pilot of pilotFiles) {
    if (!pilot.path || typeof pilot.path !== "string") {
      violations.push({ file, line: 1, message: "pilotFiles entry missing path" });
      continue;
    }
    const pilotPath = path.join(REPO_ROOT, pilot.path);
    if (!existsSync(pilotPath)) {
      violations.push({ file, line: 1, message: `pilot file does not exist: ${pilot.path}` });
      continue;
    }
    if (!profileIds.has(pilot.profile)) {
      violations.push({ file, line: 1, message: `pilot ${pilot.path} has unknown profile ${pilot.profile}` });
    }
    if (!["low", "medium", "high"].includes(pilot.contextCost)) {
      violations.push({ file, line: 1, message: `pilot ${pilot.path} has invalid contextCost` });
    }
    const text = await readFile(pilotPath, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) {
      violations.push({ file: pilot.path, line: 1, message: "pilot file missing YAML frontmatter" });
      continue;
    }
    if (fm["context-profile"] !== pilot.profile) {
      violations.push({
        file: pilot.path,
        line: 1,
        message: `context-profile must match pilot profile ${pilot.profile}`,
      });
    }
    for (const entry of ROUTING_METADATA_FIELDS) {
      const values = routeValuesFromFrontmatter(fm, entry.field);
      if (values === null && entry.field !== "frameworks") {
        violations.push({ file: pilot.path, line: 1, message: `pilot file missing '${entry.field}' field` });
        continue;
      }
      if (values === null) continue;
      if (values.length === 0) {
        violations.push({ file: pilot.path, line: 1, message: `frontmatter '${entry.field}' is empty` });
      }
      for (const value of values) {
        if (!allowed[entry.axis].has(value)) {
          violations.push({
            file: pilot.path,
            line: 1,
            message: `frontmatter '${entry.field}' has unknown value ${JSON.stringify(value)}`,
          });
        }
      }
      const profile = profiles.find((candidate) => candidate.id === pilot.profile);
      if (profile && values.some((value) => !(profile[entry.profileKey] || []).includes(value))) {
        violations.push({
          file: pilot.path,
          line: 1,
          message: `frontmatter '${entry.field}' must be covered by profile ${pilot.profile}`,
        });
      }
    }
    const domains = routeValuesFromFrontmatter(fm, "domains") || [];
    const workModes = routeValuesFromFrontmatter(fm, "work-modes");
    if (workModes) {
      for (const value of workModes) {
        if (!allowed.workModes.has(value)) {
          violations.push({
            file: pilot.path,
            line: 1,
            message: `frontmatter 'work-modes' has unknown value ${JSON.stringify(value)}`,
          });
        }
      }
    }
    const excluded = routeValuesFromFrontmatter(fm, "exclude-when") || [];
    for (const value of excluded) {
      if (!allowed.domains.has(value)) {
        violations.push({
          file: pilot.path,
          line: 1,
          message: `frontmatter 'exclude-when' has unknown route domain ${JSON.stringify(value)}`,
        });
      }
      if (domains.includes(value)) {
        violations.push({
          file: pilot.path,
          line: 1,
          message: `frontmatter 'exclude-when' repeats active domain ${JSON.stringify(value)}`,
        });
      }
    }
    if (pilot.path.endsWith("/SKILL.md")) {
      await validateContextManifestPaths(violations, pilot.path, fm, standardRedirectRows);
      const hasContextManifest = [
        "context-rules",
        "context-standards",
        "context-repo-docs",
        "context-references",
      ].some((field) => contextManifestValues(fm, field).length > 0);
      if (String(pilot.profile || "").startsWith("shotloom") && !hasContextManifest) {
        violations.push({
          file: pilot.path,
          line: 1,
          message: "shotloom pilot skill must declare at least one context-* manifest field",
        });
      }
      const declaredRules = new Set(contextManifestValues(fm, "context-rules"));
      const declaredStandards = new Set(contextManifestValues(fm, "context-standards"));
      const { body } = stripFrontmatter(text);
      for (const ref of sharedContextRefsFromBody(body)) {
        if (ref.startsWith("rules/") && !declaredRules.has(ref)) {
          violations.push({
            file: pilot.path,
            line: 1,
            message: `undeclared rule context reference: ${ref}`,
          });
        }
        if (ref.startsWith("standards/") && !declaredStandards.has(ref)) {
          violations.push({
            file: pilot.path,
            line: 1,
            message: `undeclared standard context reference: ${ref}`,
          });
        }
      }
    }
  }

  const exemptionPathSet = new Set();
  for (const exemption of routing.metadataExemptions || []) {
    if (!exemption || typeof exemption !== "object") {
      violations.push({ file, line: 1, message: "metadataExemptions entries must be objects" });
      continue;
    }
    for (const field of ["path", "reason", "decision"]) {
      if (!exemption[field] || !String(exemption[field]).trim()) {
        violations.push({ file, line: 1, message: `metadataExemptions entry missing ${field}` });
      }
    }
    if (!exemption.reviewAfter && !exemption.expires) {
      violations.push({
        file,
        line: 1,
        message: `metadataExemptions ${exemption.path || "<unknown>"} requires reviewAfter or expires`,
      });
    }
    if (exemption.path) {
      exemptionPathSet.add(exemption.path);
      if (!existsSync(path.join(REPO_ROOT, exemption.path))) {
        violations.push({ file, line: 1, message: `metadata exemption target does not exist: ${exemption.path}` });
      }
    }
    if (exemption.decision) {
      const decisionPath = String(exemption.decision).split("#")[0];
      if (!existsSync(path.join(REPO_ROOT, decisionPath))) {
        violations.push({ file, line: 1, message: `metadata exemption decision target does not exist: ${exemption.decision}` });
      }
    }
  }

  const thresholds = routing.enforcement?.highCostByteThresholds || {};
  for (const [kind, threshold] of Object.entries(thresholds)) {
    if (!Number.isInteger(threshold) || threshold <= 0) {
      violations.push({ file, line: 1, message: `enforcement.highCostByteThresholds.${kind} must be positive` });
    }
  }
  const highCostTargets = [
    {
      kind: "skills",
      threshold: thresholds.skills,
      files: await walk(path.join(AGENT_ROOT, "skills"), (f) => path.basename(f) === "SKILL.md"),
    },
    {
      kind: "standards",
      threshold: thresholds.standards,
      files: await walk(
        path.join(AGENT_ROOT, "standards"),
        (f) => f.endsWith(".md") && path.basename(f) !== "index.md"
      ),
    },
  ];
  for (const target of highCostTargets) {
    if (!Number.isInteger(target.threshold) || target.threshold <= 0) continue;
    for (const f of target.files) {
      const relPath = rel(f);
      const size = (await stat(f)).size;
      if (size < target.threshold) continue;
      const text = await readFile(f, "utf8");
      const fm = parseFrontmatter(text);
      const hasRoutingMetadata = Boolean(fm?.["context-profile"]);
      if (!hasRoutingMetadata && !exemptionPathSet.has(relPath)) {
        violations.push({
          file: relPath,
          line: 1,
          message: `high-cost ${target.kind.slice(0, -1)} ${size} bytes requires routing metadata or metadataExemptions entry`,
        });
      }
      if (hasRoutingMetadata && !pilotPathSet.has(relPath)) {
        violations.push({
          file: relPath,
          line: 1,
          message: "routing metadata on high-cost artifact must be listed in pilotFiles for generated inventory",
        });
      }
    }
  }

  for (const authoringPath of AUTHORING_ROUTING_FILES) {
    const fullPath = path.join(REPO_ROOT, authoringPath);
    if (!existsSync(fullPath)) {
      violations.push({ file, line: 1, message: `authoring routing file does not exist: ${authoringPath}` });
      continue;
    }
    const text = await readFile(fullPath, "utf8");
    for (const requiredText of ["context-routing.json", "context-profile"]) {
      if (!text.includes(requiredText)) {
        violations.push({
          file: authoringPath,
          line: 1,
          message: `authoring flow must mention ${requiredText}`,
        });
      }
    }
  }

  const routingBlockPath = routing.routingBlock?.path;
  if (!routingBlockPath || !existsSync(path.join(REPO_ROOT, routingBlockPath))) {
    violations.push({ file, line: 1, message: "routingBlock.path must point to an existing file" });
  }
  if (!routing.routingBlock?.startMarker || !routing.routingBlock?.endMarker) {
    violations.push({ file, line: 1, message: "routingBlock requires startMarker and endMarker" });
  }

  let fixtures = [];
  try {
    fixtures = await readJsonRel(routing.fixtures.path);
  } catch (err) {
    violations.push({ file, line: 1, message: `cannot read routing fixtures: ${err.message}` });
  }
  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    violations.push({ file: routing.fixtures?.path || file, line: 1, message: "fixtures must be a non-empty array" });
  }
  for (const fixture of Array.isArray(fixtures) ? fixtures : []) {
    if (!fixture.task || typeof fixture.task !== "string") {
      violations.push({ file: routing.fixtures.path, line: 1, message: "fixture missing task" });
      continue;
    }
    for (const key of ["mustLoad", "mustNotLoad"]) {
      if (!Array.isArray(fixture[key])) {
        violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} ${key} must be an array` });
        continue;
      }
      for (const profileId of fixture[key]) {
        if (!profileIds.has(profileId) && !routerIds.has(profileId)) {
          violations.push({
            file: routing.fixtures.path,
            line: 1,
            message: `fixture ${fixture.task} references unknown profile or router ${profileId}`,
          });
        }
      }
    }
    if (!Number.isInteger(fixture.maxBytes) || fixture.maxBytes <= 0) {
      violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} maxBytes must be positive` });
    }
    const selected = selectProfilesForTask(fixture.task, profiles);
    const selectedRouters = selectRoutersForTask(fixture.task, routers);
    const selectedIds = new Set(selected.map((profile) => profile.id));
    for (const router of selectedRouters) selectedIds.add(router.id);
    const selectedWorkModes = workModeEvidence(fixture.task.toLowerCase());
    if (fixture.workMode !== undefined) {
      if (!allowed.workModes.has(fixture.workMode)) {
        violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} has unknown workMode ${fixture.workMode}` });
      } else if (!selectedWorkModes.has(fixture.workMode)) {
        violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} did not select workMode ${fixture.workMode}` });
      }
    }
    if (fixture.requiresClarification !== undefined && typeof fixture.requiresClarification !== "boolean") {
      violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} requiresClarification must be boolean` });
    }
    if (fixture.requiresClarification === true && selectedWorkModes.size < 2) {
      violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} requires conflicting work-mode evidence` });
    }
    for (const id of fixture.mustLoad || []) {
      if (!selectedIds.has(id)) {
        violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} did not load ${id}` });
      }
    }
    for (const id of fixture.mustNotLoad || []) {
      if (selectedIds.has(id)) {
        violations.push({ file: routing.fixtures.path, line: 1, message: `fixture ${fixture.task} loaded forbidden ${id}` });
      }
    }
    const totalBytes = selected.reduce((sum, profile) => sum + profile.maxBytes, 0);
    if (Number.isInteger(fixture.maxBytes) && totalBytes > fixture.maxBytes) {
      violations.push({
        file: routing.fixtures.path,
        line: 1,
        message: `fixture ${fixture.task} budget ${totalBytes} exceeds maxBytes ${fixture.maxBytes}`,
      });
    }
  }

  return { name: "context-routing", violations };
}

async function checkTaxonomy() {
  const violations = [];
  const taxonomy = await readJsonConfig("taxonomy.json");
  const categories = new Set(taxonomy.skillCategories);
  const skillEntries = await listDirOnce(path.join(AGENT_ROOT, "skills"));
  for (const entry of skillEntries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const prefix = entry.name.split("-")[0];
    if (!categories.has(prefix)) {
      violations.push({
        file: `agent/skills/${entry.name}/`,
        line: 0,
        message: `skill category ${JSON.stringify(prefix)} missing from agent/config/taxonomy.json`,
      });
    }
  }
  const standardGroups = new Set(taxonomy.standardGroups);
  const standardEntries = await listDirOnce(path.join(AGENT_ROOT, "standards"));
  for (const entry of standardEntries) {
    if (!entry.isDirectory()) continue;
    if (!standardGroups.has(entry.name)) {
      violations.push({
        file: `agent/standards/${entry.name}/`,
        line: 0,
        message: `standard group ${JSON.stringify(entry.name)} missing from agent/config/taxonomy.json`,
      });
    }
  }

  const maxNameChars = taxonomy.maxArtifactNameChars;
  for (const folder of taxonomy.managedDocumentFolders || []) {
    if (!folder || !folder.path || !folder.patternKey || typeof taxonomy[folder.patternKey] !== "string") {
      continue;
    }
    const re = new RegExp(taxonomy[folder.patternKey]);
    const files = await managedMarkdownFiles(folder);
    for (const f of files) {
      const name = path.basename(f);
      if (Number.isInteger(maxNameChars) && name.length > maxNameChars) {
        violations.push({
          file: rel(f),
          line: 0,
          message: `filename length ${name.length} exceeds taxonomy maxArtifactNameChars ${maxNameChars}`,
        });
      }
      if (!re.test(name)) {
        violations.push({
          file: rel(f),
          line: 0,
          message: `filename violates taxonomy ${folder.patternKey}`,
        });
      }
    }
  }

  return { name: "taxonomy", violations };
}

const ARTIFACT_INVENTORY_ENUMS = {
  rowTypes: new Set(["artifact", "skill", "extraction-item"]),
  artifactTypes: new Set(["skill", "rule", "standard", "config", "script", "doc", "fixture", "generated-view", "shim"]),
  nonSkillArtifactTypes: new Set(["rule", "standard", "config", "script", "doc", "fixture", "generated-view", "shim"]),
  ownerDomains: new Set(["core", "repo", "company", "personal", "domain", "experiment", "unknown"]),
  privacyRisks: new Set(["public-safe", "needs-scrub", "private-only", "unknown"]),
  proposedDestinations: new Set(["knitten-core", "knitten-private-pack", "domain-pack", "deprecated", "migrate-later", "undecided"]),
  compatibilityNeeds: new Set(["alias", "shim", "redirect", "old-path-mapping", "none", "unknown"]),
  classificationStages: new Set(["undecided", "core-candidate", "pack-candidate", "deprecated", "migrate-later"]),
  reviewStates: new Set(["pending", "accepted", "blocked", "moved"]),
  skillSizes: new Set(["tiny", "small", "medium", "large", "huge"]),
  skillKinds: new Set(["workflow-only", "workflow-with-notes", "guide-heavy", "reference-heavy", "mixed-heavy", "unknown"]),
  coreSkillRoles: new Set(["bootstrap", "router", "lifecycle", "domain", "repo-specific", "none"]),
  splitReadiness: new Set(["none", "low", "ready", "blocked"]),
  contentKinds: new Set(["judgment", "example", "output-body", "naming-policy", "lifecycle-policy", "domain-reference", "machine-checkable-contract"]),
  artifactSubkinds: new Set(["guide", "reference", "document-template", "validator-check", "rubric", "example", "none"]),
  triState: new Set(["yes", "no", "unknown"]),
};

function inventoryViolation(violations, message) {
  violations.push({ file: "agent/config/artifact-inventory.json", line: 1, message });
}

function checkInventoryProvenance(violations, inventory) {
  const isoDateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  const parsedGeneratedAt = new Date(inventory["generated-at"]);
  if (
    typeof inventory["generated-at"] !== "string" ||
    !isoDateTimePattern.test(inventory["generated-at"]) ||
    Number.isNaN(parsedGeneratedAt.getTime()) ||
    parsedGeneratedAt.toISOString() !== inventory["generated-at"]
  ) {
    inventoryViolation(violations, `generated-at must match Date.toISOString(), got ${JSON.stringify(inventory["generated-at"])}`);
  }
  if (typeof inventory["source-commit"] !== "string" || !/^[0-9a-f]{7,40}$/.test(inventory["source-commit"])) {
    inventoryViolation(violations, `source-commit must be a git commit hash, got ${JSON.stringify(inventory["source-commit"])}`);
  }
  if (typeof inventory["source-dirty"] !== "boolean") {
    inventoryViolation(violations, `source-dirty must be a boolean, got ${JSON.stringify(inventory["source-dirty"])}`);
  }
}

function hasUnsafeInventoryPath(value) {
  return (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.startsWith("../") ||
    value.includes("/../") ||
    /^([A-Za-z]:\\|\/Users\/)/.test(value)
  );
}

function requireInventoryFields(violations, row, fields) {
  for (const field of fields) {
    if (row[field] === undefined) {
      inventoryViolation(violations, `${row["row-id"] || "(missing row-id)"} missing ${field}`);
    }
  }
}

function checkInventoryEnum(violations, row, field, allowed) {
  if (!allowed.has(row[field])) {
    inventoryViolation(violations, `${row["row-id"] || "(missing row-id)"} invalid ${field}: ${JSON.stringify(row[field])}`);
  }
}

function checkInventoryPathField(violations, row, field, { allowUndecided = false, mustExist = false } = {}) {
  const value = row[field];
  if (allowUndecided && value === "undecided") return;
  if (hasUnsafeInventoryPath(value)) {
    inventoryViolation(violations, `${row["row-id"] || "(missing row-id)"} invalid ${field}: ${JSON.stringify(value)}`);
    return;
  }
  if (mustExist && !existsSync(path.join(REPO_ROOT, value))) {
    inventoryViolation(violations, `${row["row-id"] || "(missing row-id)"} ${field} does not exist: ${value}`);
  }
}

async function checkInventorySourceSection(violations, row) {
  const sourcePath = row["source-artifact-path"];
  const section = row["source-section"];
  if (hasUnsafeInventoryPath(sourcePath) || typeof section !== "string" || section.length === 0) return;
  let text;
  try {
    text = await readFile(path.join(REPO_ROOT, sourcePath), "utf8");
  } catch {
    return;
  }
  if (!text.includes(section)) {
    inventoryViolation(violations, `${row["row-id"]} source-section not found in ${sourcePath}: ${JSON.stringify(section)}`);
  }
}

async function checkArtifactInventory() {
  const violations = [];
  const file = "agent/config/artifact-inventory.json";
  let inventory;
  try {
    inventory = await readJsonRel(file);
  } catch (err) {
    inventoryViolation(violations, `cannot read artifact inventory: ${err.message}`);
    return { name: "artifact-inventory", violations };
  }

  if (inventory["schema-version"] !== 1) {
    inventoryViolation(violations, `schema-version must be 1, got ${JSON.stringify(inventory["schema-version"])}`);
  }
  checkInventoryProvenance(violations, inventory);
  if (!Array.isArray(inventory.rows)) {
    inventoryViolation(violations, "rows must be an array");
    return { name: "artifact-inventory", violations };
  }

  const rowIds = new Set();
  const skillRows = new Map();
  const extractionRowsByParent = new Map();
  const extractionIdsByParent = new Map();
  const commonFields = [
    "row-id",
    "row-type",
    "source-artifact-path",
    "artifact-type",
    "owner-domain",
    "privacy-risk",
    "dependencies",
    "proposed-destination",
    "compatibility-need",
    "classification-stage",
    "review-state",
  ];

  for (const row of inventory.rows) {
    requireInventoryFields(violations, row, commonFields);
    if (typeof row["row-id"] !== "string") continue;
    if (rowIds.has(row["row-id"])) {
      inventoryViolation(violations, `duplicate row-id: ${row["row-id"]}`);
    }
    rowIds.add(row["row-id"]);

    checkInventoryEnum(violations, row, "row-type", ARTIFACT_INVENTORY_ENUMS.rowTypes);
    checkInventoryEnum(violations, row, "artifact-type", ARTIFACT_INVENTORY_ENUMS.artifactTypes);
    checkInventoryEnum(violations, row, "owner-domain", ARTIFACT_INVENTORY_ENUMS.ownerDomains);
    checkInventoryEnum(violations, row, "privacy-risk", ARTIFACT_INVENTORY_ENUMS.privacyRisks);
    checkInventoryEnum(violations, row, "proposed-destination", ARTIFACT_INVENTORY_ENUMS.proposedDestinations);
    checkInventoryEnum(violations, row, "compatibility-need", ARTIFACT_INVENTORY_ENUMS.compatibilityNeeds);
    checkInventoryEnum(violations, row, "classification-stage", ARTIFACT_INVENTORY_ENUMS.classificationStages);
    checkInventoryEnum(violations, row, "review-state", ARTIFACT_INVENTORY_ENUMS.reviewStates);
    checkInventoryPathField(violations, row, "source-artifact-path", { mustExist: true });

    if (!Array.isArray(row.dependencies)) {
      inventoryViolation(violations, `${row["row-id"]} dependencies must be an array`);
    } else {
      if (hasDuplicates(row.dependencies)) {
        inventoryViolation(violations, `${row["row-id"]} dependencies must not contain duplicates`);
      }
      for (const dependency of row.dependencies) {
        if (hasUnsafeInventoryPath(dependency) && !/^(artifact|skill|extraction):/.test(String(dependency))) {
          inventoryViolation(violations, `${row["row-id"]} invalid dependency: ${JSON.stringify(dependency)}`);
        }
      }
    }

    if (row["row-type"] === "artifact") {
      if (row["row-id"] !== `artifact:${row["source-artifact-path"]}`) {
        inventoryViolation(violations, `${row["row-id"]} must equal artifact:${row["source-artifact-path"]}`);
      }
      checkInventoryEnum(violations, row, "artifact-type", ARTIFACT_INVENTORY_ENUMS.nonSkillArtifactTypes);
    } else if (row["row-type"] === "skill") {
      if (row["row-id"] !== `skill:${row["source-artifact-path"]}`) {
        inventoryViolation(violations, `${row["row-id"]} must equal skill:${row["source-artifact-path"]}`);
      }
      requireInventoryFields(violations, row, ["skill-size", "skill-kind", "core-skill-role", "extraction-count", "split-readiness"]);
      if (row["artifact-type"] !== "skill") inventoryViolation(violations, `${row["row-id"]} artifact-type must be skill`);
      checkInventoryEnum(violations, row, "skill-size", ARTIFACT_INVENTORY_ENUMS.skillSizes);
      checkInventoryEnum(violations, row, "skill-kind", ARTIFACT_INVENTORY_ENUMS.skillKinds);
      checkInventoryEnum(violations, row, "core-skill-role", ARTIFACT_INVENTORY_ENUMS.coreSkillRoles);
      checkInventoryEnum(violations, row, "split-readiness", ARTIFACT_INVENTORY_ENUMS.splitReadiness);
      if (!Number.isInteger(row["extraction-count"]) || row["extraction-count"] < 0) {
        inventoryViolation(violations, `${row["row-id"]} extraction-count must be a non-negative integer`);
      }
      skillRows.set(row["row-id"], row);
    } else if (row["row-type"] === "extraction-item") {
      requireInventoryFields(violations, row, [
        "parent-row-id",
        "extraction-id",
        "source-section",
        "content-kind",
        "extracted-artifact-type",
        "artifact-subkind",
        "target-path",
        "required-at-runtime",
        "validation-needed",
      ]);
      if (row["artifact-type"] !== "skill") inventoryViolation(violations, `${row["row-id"]} artifact-type must be skill`);
      if (row["row-id"] !== `extraction:${row["source-artifact-path"]}#${row["extraction-id"]}`) {
        inventoryViolation(violations, `${row["row-id"]} must equal extraction:${row["source-artifact-path"]}#${row["extraction-id"]}`);
      }
      checkInventoryEnum(violations, row, "content-kind", ARTIFACT_INVENTORY_ENUMS.contentKinds);
      checkInventoryEnum(violations, row, "extracted-artifact-type", ARTIFACT_INVENTORY_ENUMS.artifactTypes);
      checkInventoryEnum(violations, row, "artifact-subkind", ARTIFACT_INVENTORY_ENUMS.artifactSubkinds);
      checkInventoryEnum(violations, row, "required-at-runtime", ARTIFACT_INVENTORY_ENUMS.triState);
      checkInventoryEnum(violations, row, "validation-needed", ARTIFACT_INVENTORY_ENUMS.triState);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(row["extraction-id"]))) {
        inventoryViolation(violations, `${row["row-id"]} extraction-id must be kebab-case`);
      }
      checkInventoryPathField(violations, row, "target-path", { allowUndecided: true });
      const expectedParentRowId = `skill:${row["source-artifact-path"]}`;
      if (row["parent-row-id"] !== expectedParentRowId) {
        inventoryViolation(violations, `${row["row-id"]} parent-row-id must equal ${expectedParentRowId}`);
      }
      await checkInventorySourceSection(violations, row);

      const parent = row["parent-row-id"];
      if (!extractionRowsByParent.has(parent)) extractionRowsByParent.set(parent, []);
      extractionRowsByParent.get(parent).push(row);
      if (!extractionIdsByParent.has(parent)) extractionIdsByParent.set(parent, new Set());
      const parentExtractionIds = extractionIdsByParent.get(parent);
      if (parentExtractionIds.has(row["extraction-id"])) {
        inventoryViolation(violations, `${parent} duplicate extraction-id: ${row["extraction-id"]}`);
      }
      parentExtractionIds.add(row["extraction-id"]);
    }
  }

  for (const [parentRowId, extractionRows] of extractionRowsByParent.entries()) {
    if (!skillRows.has(parentRowId)) {
      inventoryViolation(violations, `${parentRowId} missing parent skill row for ${extractionRows.length} extraction rows`);
      continue;
    }
    const skillRow = skillRows.get(parentRowId);
    if (skillRow["extraction-count"] !== extractionRows.length) {
      inventoryViolation(
        violations,
        `${parentRowId} extraction-count ${skillRow["extraction-count"]} does not match linked extraction rows ${extractionRows.length}`,
      );
    }
  }

  for (const [skillRowId, skillRow] of skillRows.entries()) {
    const linkedCount = extractionRowsByParent.get(skillRowId)?.length || 0;
    if (skillRow["extraction-count"] !== linkedCount) {
      inventoryViolation(
        violations,
        `${skillRowId} extraction-count ${skillRow["extraction-count"]} does not match linked extraction rows ${linkedCount}`,
      );
    }
  }

  return { name: "artifact-inventory", violations };
}

const ARTIFACT_PACK_GATES = new Set([
  "manifest-shape",
  "manifest-paths",
  "manifest-exports",
  "manifest-dependencies",
  "manifest-routing",
  "manifest-visibility",
  "manifest-compatibility",
]);

const ARTIFACT_PACK_ENUMS = {
  artifactTypes: new Set(["skill", "rule", "standard", "config", "script", "doc", "fixture", "generated-view", "shim"]),
  compatibilityNeeds: new Set(["alias", "shim", "redirect", "old-path-mapping"]),
  layers: new Set(["skills", "rules", "standards", "config", "scripts", "docs", "fixtures", "generated-views", "shims"]),
  loads: new Set(["on-demand", "manual", "route-selected"]),
  modes: new Set(["link", "copy", "virtual"]),
  ownerDomains: new Set(["core", "repo", "company", "personal", "domain", "experiment"]),
  privacyRisks: new Set(["public-safe", "needs-scrub", "private-only", "unknown"]),
  shapes: new Set(["file", "directory"]),
  visibility: new Set(["public", "private", "company", "local"]),
};

const ARTIFACT_PACK_ALLOWED_KEYS = {
  root: new Set(["schema-version", "pack-id", "display-name", "version", "visibility", "owner-domain", "description", "exports", "dependencies", "compatibility-aliases"]),
  export: new Set(["artifact-id", "artifact-type", "path", "shape", "mount", "entrypoint", "load", "route", "dependencies", "privacy-risk", "platforms"]),
  mount: new Set(["layer", "target", "mode"]),
  route: new Set(["context-profile", "domains", "repo-keys", "task-types", "languages", "frameworks", "work-modes", "exclude-when", "min-evidence", "max-context-bytes", "priority"]),
  compatibilityAlias: new Set(["alias-id", "target-artifact-id", "compatibility-need", "old-name", "old-path", "shim-path", "deprecation-date", "removal-criteria"]),
};

const ARTIFACT_PACK_FIXTURE_EXPECTED_MESSAGES = new Map([
  ["absolute-export-path", "path must be repo-relative"],
  ["company-unknown-export", "company pack export must be public-safe or needs-scrub"],
  ["duplicate-artifact-id", "artifact-id values must be unique"],
  ["duplicate-route-signature-in-set", "duplicate route signature"],
  ["empty-removal-criteria", "removal-criteria must be non-empty"],
  ["entrypoint-escapes-directory", "entrypoint must stay under path"],
  ["invalid-dependency-ref", "invalid dependency ref"],
  ["invalid-json", "invalid JSON"],
  ["missing-compat-target", "target-artifact-id does not exist"],
  ["missing-in-set-pack-dependency", "pack dependency not present"],
  ["missing-required-root-field", "exports must be a non-empty array"],
  ["non-array-compatibility-aliases", "compatibility-aliases must be an array"],
  ["non-string-platform", "platforms values must be non-empty strings"],
  ["public-private-export", "public pack export must be public-safe"],
  ["route-selected-without-evidence", "requires positive route evidence"],
  ["trailing-dotdot-path", "path must be repo-relative"],
  ["file-shape-directory-path", "file export path must be a file"],
  ["unknown-core-capability", "unknown core capability"],
  ["unknown-root-field", "unknown root field"],
  ["unknown-route-domain", "domains has unknown value"],
]);

function artifactPackViolation(out, gate, file, message) {
  out.push({ gate, file, line: 1, message });
}

function isSlug(value) {
  return typeof value === "string" && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
}

function isSemverCore(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value);
}

function repoOrAbsolutePath(file) {
  return path.isAbsolute(file) ? file : path.join(REPO_ROOT, file);
}

function isSafePackPath(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value) || value.includes("\\")) return false;
  return value.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

function pathStaysUnder(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

async function parseArtifactPackManifest(file) {
  let text;
  try {
    text = await readFile(repoOrAbsolutePath(file), "utf8");
  } catch (err) {
    return {
      file,
      root: path.dirname(file),
      manifest: null,
      parseViolations: [{ gate: "manifest-shape", file, line: 1, message: `cannot read artifact pack manifest: ${err.message}` }],
    };
  }
  try {
    return {
      file,
      root: path.dirname(file),
      manifest: JSON.parse(text),
      parseViolations: [],
    };
  } catch (err) {
    return {
      file,
      root: path.dirname(file),
      manifest: null,
      parseViolations: [{ gate: "manifest-shape", file, line: 1, message: `invalid JSON: ${err.message}` }],
    };
  }
}

function artifactPackFixtureCase(file) {
  const parts = file.split("/");
  const packsIndex = parts.indexOf("artifact-packs");
  if (packsIndex !== -1) {
    const mode = parts[packsIndex + 1];
    if (mode === "pass") {
      return { kind: "single", expectedGate: null, key: parts.slice(0, -1).join("/"), files: [file] };
    }
    if (mode === "fail") {
      const expectedGate = parts[packsIndex + 2];
      const key = parts.slice(0, -1).join("/");
      return { kind: "single", expectedGate, key, files: [file] };
    }
  }
  const setsIndex = parts.indexOf("artifact-pack-sets");
  if (setsIndex !== -1) {
    const mode = parts[setsIndex + 1];
    if (mode === "pass") {
      const key = parts.slice(0, setsIndex + 3).join("/");
      return { kind: "set", expectedGate: null, key, files: [file] };
    }
    if (mode === "fail") {
      const expectedGate = parts[setsIndex + 2];
      const key = parts.slice(0, setsIndex + 4).join("/");
      return { kind: "set", expectedGate, key, files: [file] };
    }
  }
  return { kind: "single", expectedGate: null, key: path.dirname(file), files: [file] };
}

async function artifactPackFixtureCases(gate) {
  const roots = [
    path.join(REPO_ROOT, "tests/fixtures/artifact-packs"),
    path.join(REPO_ROOT, "tests/fixtures/artifact-pack-sets"),
    path.join(REPO_ROOT, "examples/artifact-packs"),
  ];
  const files = [];
  for (const root of roots) {
    files.push(...(await walk(root, (f) => path.basename(f) === "artifact-pack.json")).map(rel));
  }
  const grouped = new Map();
  for (const file of files) {
    const fixtureCase = artifactPackFixtureCase(file);
    if (gate && fixtureCase.expectedGate && fixtureCase.expectedGate !== gate) continue;
    if (!grouped.has(fixtureCase.key)) grouped.set(fixtureCase.key, { ...fixtureCase, files: [] });
    grouped.get(fixtureCase.key).files.push(file);
  }
  return [...grouped.values()].map((fixtureCase) => ({
    ...fixtureCase,
    files: fixtureCase.files.sort(sortInventoryFiles),
  })).sort((a, b) => a.key.localeCompare(b.key));
}

function artifactPackFixtureExpectedMessage(fixtureCase) {
  return ARTIFACT_PACK_FIXTURE_EXPECTED_MESSAGES.get(path.basename(fixtureCase.key));
}

function pushUnknownKeyViolations(out, file, gate, label, obj, allowed) {
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) artifactPackViolation(out, gate, file, `${label} unknown ${label === "root" ? "root field" : "field"} ${key}`);
  }
}

function pushUniqueArrayViolation(out, file, gate, label, value) {
  if (Array.isArray(value) && hasDuplicates(value)) artifactPackViolation(out, gate, file, `${label} values must be unique`);
}

function pushArtifactPackStringArrayViolations(out, file, gate, label, value) {
  if (value === undefined || !Array.isArray(value)) return;
  for (const item of value) {
    if (typeof item !== "string" || item.length === 0) {
      artifactPackViolation(out, gate, file, `${label} values must be non-empty strings`);
      return;
    }
  }
}

function validateArtifactPackShape(ctx, out) {
  const { file, manifest } = ctx;
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    artifactPackViolation(out, "manifest-shape", file, "manifest must be an object");
    return false;
  }
  pushUnknownKeyViolations(out, file, "manifest-shape", "root", manifest, ARTIFACT_PACK_ALLOWED_KEYS.root);
  const required = ["schema-version", "pack-id", "display-name", "version", "visibility", "owner-domain", "description", "exports"];
  for (const field of required) {
    if (manifest[field] === undefined) artifactPackViolation(out, "manifest-shape", file, `missing root field ${field}`);
  }
  if (manifest["schema-version"] !== 1) artifactPackViolation(out, "manifest-shape", file, "schema-version must be 1");
  if (!isSlug(manifest["pack-id"])) artifactPackViolation(out, "manifest-shape", file, "pack-id must be kebab-case");
  if (!isSemverCore(manifest.version)) artifactPackViolation(out, "manifest-shape", file, "version must be semver core");
  if (!ARTIFACT_PACK_ENUMS.visibility.has(manifest.visibility)) artifactPackViolation(out, "manifest-shape", file, "visibility has invalid value");
  if (!ARTIFACT_PACK_ENUMS.ownerDomains.has(manifest["owner-domain"])) artifactPackViolation(out, "manifest-shape", file, "owner-domain has invalid value");
  if (typeof manifest["display-name"] !== "string" || manifest["display-name"].length === 0) artifactPackViolation(out, "manifest-shape", file, "display-name must be non-empty");
  if (typeof manifest.description !== "string" || manifest.description.length === 0) artifactPackViolation(out, "manifest-shape", file, "description must be non-empty");
  if (!Array.isArray(manifest.exports) || manifest.exports.length === 0) {
    artifactPackViolation(out, "manifest-shape", file, "exports must be a non-empty array");
    return false;
  }
  for (const [index, entry] of manifest.exports.entries()) {
    const label = `exports[${index}]`;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      artifactPackViolation(out, "manifest-shape", file, `${label} must be an object`);
      continue;
    }
    pushUnknownKeyViolations(out, file, "manifest-shape", label, entry, ARTIFACT_PACK_ALLOWED_KEYS.export);
    for (const field of ["artifact-id", "artifact-type", "path", "shape", "mount", "load", "privacy-risk"]) {
      if (entry[field] === undefined) artifactPackViolation(out, "manifest-shape", file, `${label} missing ${field}`);
    }
    if (!isSlug(entry["artifact-id"])) artifactPackViolation(out, "manifest-shape", file, `${label}.artifact-id must be kebab-case`);
    if (!ARTIFACT_PACK_ENUMS.artifactTypes.has(entry["artifact-type"])) artifactPackViolation(out, "manifest-shape", file, `${label}.artifact-type has invalid value`);
    if (typeof entry.path !== "string" || entry.path.length === 0) artifactPackViolation(out, "manifest-shape", file, `${label}.path must be non-empty`);
    if (!ARTIFACT_PACK_ENUMS.shapes.has(entry.shape)) artifactPackViolation(out, "manifest-shape", file, `${label}.shape has invalid value`);
    if (!ARTIFACT_PACK_ENUMS.loads.has(entry.load)) artifactPackViolation(out, "manifest-shape", file, `${label}.load has invalid value`);
    if (!ARTIFACT_PACK_ENUMS.privacyRisks.has(entry["privacy-risk"])) artifactPackViolation(out, "manifest-shape", file, `${label}.privacy-risk has invalid value`);
    if (!entry.mount || typeof entry.mount !== "object" || Array.isArray(entry.mount)) {
      artifactPackViolation(out, "manifest-shape", file, `${label}.mount must be an object`);
    } else {
      pushUnknownKeyViolations(out, file, "manifest-shape", `${label}.mount`, entry.mount, ARTIFACT_PACK_ALLOWED_KEYS.mount);
      if (!ARTIFACT_PACK_ENUMS.layers.has(entry.mount.layer)) artifactPackViolation(out, "manifest-shape", file, `${label}.mount.layer has invalid value`);
      if (typeof entry.mount.target !== "string" || entry.mount.target.length === 0) artifactPackViolation(out, "manifest-shape", file, `${label}.mount.target must be non-empty`);
      if (!ARTIFACT_PACK_ENUMS.modes.has(entry.mount.mode)) artifactPackViolation(out, "manifest-shape", file, `${label}.mount.mode has invalid value`);
    }
    if (entry.dependencies !== undefined && !Array.isArray(entry.dependencies)) artifactPackViolation(out, "manifest-shape", file, `${label}.dependencies must be an array`);
    pushUniqueArrayViolation(out, file, "manifest-shape", `${label}.dependencies`, entry.dependencies);
    pushArtifactPackStringArrayViolations(out, file, "manifest-shape", `${label}.dependencies`, entry.dependencies);
    pushUniqueArrayViolation(out, file, "manifest-shape", `${label}.platforms`, entry.platforms);
    pushArtifactPackStringArrayViolations(out, file, "manifest-shape", `${label}.platforms`, entry.platforms);
    if (entry.platforms !== undefined && !Array.isArray(entry.platforms)) artifactPackViolation(out, "manifest-shape", file, `${label}.platforms must be an array`);
    if (entry.route !== undefined && (!entry.route || typeof entry.route !== "object" || Array.isArray(entry.route))) artifactPackViolation(out, "manifest-shape", file, `${label}.route must be an object`);
    if (entry.route && typeof entry.route === "object" && !Array.isArray(entry.route)) {
      pushUnknownKeyViolations(out, file, "manifest-shape", `${label}.route`, entry.route, ARTIFACT_PACK_ALLOWED_KEYS.route);
      for (const field of ["domains", "repo-keys", "task-types", "languages", "frameworks", "work-modes", "exclude-when"]) {
        pushUniqueArrayViolation(out, file, "manifest-shape", `${label}.route.${field}`, entry.route[field]);
        pushArtifactPackStringArrayViolations(out, file, "manifest-shape", `${label}.route.${field}`, entry.route[field]);
      }
    }
  }
  if (manifest.dependencies !== undefined && !Array.isArray(manifest.dependencies)) artifactPackViolation(out, "manifest-shape", file, "dependencies must be an array");
  pushUniqueArrayViolation(out, file, "manifest-shape", "dependencies", manifest.dependencies);
  pushArtifactPackStringArrayViolations(out, file, "manifest-shape", "dependencies", manifest.dependencies);
  if (manifest["compatibility-aliases"] !== undefined && !Array.isArray(manifest["compatibility-aliases"])) {
    artifactPackViolation(out, "manifest-shape", file, "compatibility-aliases must be an array");
  }
  for (const [index, alias] of (Array.isArray(manifest["compatibility-aliases"]) ? manifest["compatibility-aliases"] : []).entries()) {
    const label = `compatibility-aliases[${index}]`;
    if (!alias || typeof alias !== "object" || Array.isArray(alias)) {
      artifactPackViolation(out, "manifest-shape", file, `${label} must be an object`);
      continue;
    }
    pushUnknownKeyViolations(out, file, "manifest-shape", label, alias, ARTIFACT_PACK_ALLOWED_KEYS.compatibilityAlias);
    for (const field of ["alias-id", "target-artifact-id", "compatibility-need", "removal-criteria"]) {
      if (alias[field] === undefined) artifactPackViolation(out, "manifest-shape", file, `${label} missing ${field}`);
    }
    if (!isSlug(alias["alias-id"])) artifactPackViolation(out, "manifest-shape", file, `${label}.alias-id must be kebab-case`);
    if (!isSlug(alias["target-artifact-id"])) artifactPackViolation(out, "manifest-shape", file, `${label}.target-artifact-id must be kebab-case`);
    if (!ARTIFACT_PACK_ENUMS.compatibilityNeeds.has(alias["compatibility-need"])) artifactPackViolation(out, "manifest-shape", file, `${label}.compatibility-need has invalid value`);
    if (alias["deprecation-date"] !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(alias["deprecation-date"])) {
      artifactPackViolation(out, "manifest-shape", file, `${label}.deprecation-date must be YYYY-MM-DD`);
    }
  }
  return !out.some((violation) => violation.gate === "manifest-shape" && violation.file === file);
}

function validateArtifactPackPaths(ctx, out) {
  const { file, root, manifest } = ctx;
  const rootAbs = repoOrAbsolutePath(root);
  for (const entry of manifest.exports || []) {
    for (const [field, value] of [["path", entry.path], ["entrypoint", entry.entrypoint], ["mount.target", entry.mount?.target]]) {
      if (value === undefined) continue;
      if (!isSafePackPath(value)) artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"] || "export"} ${field} must be repo-relative and stay inside the pack`);
    }
    if (!isSafePackPath(entry.path)) continue;
    const exportAbs = path.join(rootAbs, entry.path);
    if (!existsSync(exportAbs)) artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} path does not exist: ${entry.path}`);
    if (existsSync(exportAbs)) {
      const exportStats = statSync(exportAbs);
      if (entry.shape === "file" && !exportStats.isFile()) artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} file export path must be a file`);
      if (entry.shape === "directory" && !exportStats.isDirectory()) artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} directory export path must be a directory`);
    }
    if (entry.shape === "directory") {
      if (!existsSync(exportAbs) || !pathStaysUnder(rootAbs, exportAbs)) {
        artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} directory path is invalid`);
      }
      if (!entry.entrypoint) {
        artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} directory export requires entrypoint`);
      } else if (isSafePackPath(entry.entrypoint)) {
        const entrypointAbs = path.join(rootAbs, entry.entrypoint);
        if (!pathStaysUnder(exportAbs, entrypointAbs)) artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} entrypoint must stay under path`);
        if (!existsSync(entrypointAbs)) artifactPackViolation(out, "manifest-paths", file, `${entry["artifact-id"]} entrypoint does not exist: ${entry.entrypoint}`);
      }
    }
  }
  for (const alias of manifest["compatibility-aliases"] || []) {
    for (const field of ["old-path", "shim-path"]) {
      if (alias[field] !== undefined && !isSafePackPath(alias[field])) {
        artifactPackViolation(out, "manifest-paths", file, `${alias["alias-id"] || "alias"} ${field} must be repo-relative`);
      }
    }
  }
}

function validateArtifactPackExports(ctx, out) {
  const { file, manifest } = ctx;
  const artifactIds = [];
  const mountTargets = [];
  for (const entry of manifest.exports || []) {
    artifactIds.push(entry["artifact-id"]);
    mountTargets.push(`${entry.mount?.layer || ""}:${entry.mount?.target || ""}`);
    if (entry["artifact-type"] === "skill") {
      if (entry.shape !== "directory") artifactPackViolation(out, "manifest-exports", file, `${entry["artifact-id"]} skill export must be a directory`);
      if (!String(entry.entrypoint || "").endsWith("/SKILL.md")) artifactPackViolation(out, "manifest-exports", file, `${entry["artifact-id"]} skill entrypoint must end with /SKILL.md`);
    }
    if (entry.shape === "file" && entry.entrypoint !== undefined) artifactPackViolation(out, "manifest-exports", file, `${entry["artifact-id"]} file export must not declare entrypoint`);
  }
  if (hasDuplicates(artifactIds)) artifactPackViolation(out, "manifest-exports", file, "artifact-id values must be unique");
  if (hasDuplicates(mountTargets)) artifactPackViolation(out, "manifest-exports", file, "mount targets must be unique unless compatibility rows preserve aliases");
  const artifactIdSet = new Set(artifactIds);
  for (const alias of manifest["compatibility-aliases"] || []) {
    if (!artifactIdSet.has(alias["target-artifact-id"])) {
      artifactPackViolation(out, "manifest-exports", file, `${alias["alias-id"]} target-artifact-id does not exist: ${alias["target-artifact-id"]}`);
    }
  }
}

function artifactPackDependencyRefs(manifest) {
  const refs = [];
  for (const ref of manifest.dependencies || []) refs.push(ref);
  for (const entry of manifest.exports || []) {
    for (const ref of entry.dependencies || []) refs.push(ref);
  }
  return refs;
}

function validateArtifactPackCoreCapabilityRegistry(registry, out) {
  const file = "agent/config/artifact-pack-core-capabilities.json";
  if (!registry || typeof registry !== "object" || Array.isArray(registry)) {
    artifactPackViolation(out, "manifest-dependencies", file, "core capability registry must be an object");
    return new Set();
  }
  if (registry["schema-version"] !== 1) artifactPackViolation(out, "manifest-dependencies", file, "core capability registry schema-version must be 1");
  if (!Array.isArray(registry.capabilities) || registry.capabilities.length === 0) {
    artifactPackViolation(out, "manifest-dependencies", file, "core capability registry capabilities must be a non-empty array");
    return new Set();
  }
  const ids = [];
  for (const [index, capability] of registry.capabilities.entries()) {
    const label = `capabilities[${index}]`;
    if (!capability || typeof capability !== "object" || Array.isArray(capability)) {
      artifactPackViolation(out, "manifest-dependencies", file, `${label} must be an object`);
      continue;
    }
    ids.push(capability.id);
    if (!isSlug(capability.id)) artifactPackViolation(out, "manifest-dependencies", file, `${label}.id must be kebab-case`);
    if (typeof capability.owner !== "string" || capability.owner.length === 0) {
      artifactPackViolation(out, "manifest-dependencies", file, `${label}.owner must be non-empty`);
    } else if (capability.owner.startsWith("scripts/validate-llm-first.mjs --check ")) {
      const checkName = capability.owner.slice("scripts/validate-llm-first.mjs --check ".length);
      if (!CHECKS.some((check) => check.name === checkName)) {
        artifactPackViolation(out, "manifest-dependencies", file, `${label}.owner references unknown validator check: ${checkName}`);
      }
    } else if (!existsSync(path.join(REPO_ROOT, capability.owner))) {
      artifactPackViolation(out, "manifest-dependencies", file, `${label}.owner path does not exist: ${capability.owner}`);
    }
    if (typeof capability.description !== "string" || capability.description.length === 0) {
      artifactPackViolation(out, "manifest-dependencies", file, `${label}.description must be non-empty`);
    }
  }
  if (hasDuplicates(ids)) artifactPackViolation(out, "manifest-dependencies", file, "core capability ids must be unique");
  return new Set(ids.filter(isSlug));
}

function validateArtifactPackDependencies(contexts, coreCapabilityIds, out, setMode) {
  const packIds = new Set(contexts.map((ctx) => ctx.manifest?.["pack-id"]).filter(Boolean));
  const artifactIdsByPack = new Map();
  for (const ctx of contexts) {
    artifactIdsByPack.set(ctx.manifest["pack-id"], new Set((ctx.manifest.exports || []).map((entry) => entry["artifact-id"])));
  }
  for (const ctx of contexts) {
    for (const ref of artifactPackDependencyRefs(ctx.manifest)) {
      if (typeof ref !== "string") {
        artifactPackViolation(out, "manifest-dependencies", ctx.file, "dependency refs must be strings");
        continue;
      }
      const packMatch = ref.match(/^pack:([a-z0-9]+(?:-[a-z0-9]+)*)$/);
      const artifactMatch = ref.match(/^artifact:([a-z0-9]+(?:-[a-z0-9]+)*)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
      const coreMatch = ref.match(/^core:([a-z0-9]+(?:-[a-z0-9]+)*)$/);
      if (!packMatch && !artifactMatch && !coreMatch) {
        artifactPackViolation(out, "manifest-dependencies", ctx.file, `invalid dependency ref: ${ref}`);
        continue;
      }
      if (coreMatch && !coreCapabilityIds.has(coreMatch[1])) {
        artifactPackViolation(out, "manifest-dependencies", ctx.file, `unknown core capability: ${coreMatch[1]}`);
      }
      if (packMatch && setMode && !packIds.has(packMatch[1])) {
        artifactPackViolation(out, "manifest-dependencies", ctx.file, `pack dependency not present in manifest set: ${packMatch[1]}`);
      }
      if (artifactMatch) {
        const [packId, artifactId] = [artifactMatch[1], artifactMatch[2]];
        if ((setMode || packId === ctx.manifest["pack-id"]) && !artifactIdsByPack.get(packId)?.has(artifactId)) {
          artifactPackViolation(out, "manifest-dependencies", ctx.file, `artifact dependency not present in manifest set: ${packId}/${artifactId}`);
        }
      }
    }
  }
}

function routeSignature(route) {
  const fields = ["context-profile", "domains", "repo-keys", "task-types", "languages", "frameworks", "work-modes", "exclude-when"];
  const parts = [];
  for (const field of fields) {
    const value = route?.[field];
    if (Array.isArray(value)) parts.push(`${field}=${[...value].sort().join(",")}`);
    else if (value !== undefined) parts.push(`${field}=${value}`);
    else parts.push(`${field}=`);
  }
  return parts.join("|");
}

async function artifactPackRoutingAllowedSets() {
  const routing = await readJsonConfig("context-routing.json");
  let repoPaths = {};
  try {
    repoPaths = await readJsonRel(routing.repoKeysSource);
  } catch {
    repoPaths = {};
  }
  return {
    contextProfiles: new Set((routing.profiles || []).map((profile) => profile.id)),
    domains: new Set(routing.axes?.domains || []),
    repoKeys: new Set(Object.keys(repoPaths)),
    taskTypes: new Set(routing.axes?.taskTypes || []),
    languages: new Set(routing.axes?.languages || []),
    frameworks: new Set(routing.axes?.frameworks || []),
    workModes: new Set(routing.axes?.workModes || []),
  };
}

function validateArtifactPackRouting(contexts, allowed, out) {
  const signatures = new Map();
  for (const ctx of contexts) {
    for (const entry of ctx.manifest.exports || []) {
      const route = entry.route || {};
      if (entry.load === "route-selected") {
        const positiveFields = ["context-profile", "domains", "repo-keys", "task-types", "languages", "frameworks", "work-modes"];
        if (!positiveFields.some((field) => route[field] !== undefined && (!Array.isArray(route[field]) || route[field].length > 0))) {
          artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} route-selected export requires positive route evidence`);
        }
      }
      const scalarChecks = [["context-profile", "contextProfiles"]];
      for (const [field, allowedKey] of scalarChecks) {
        if (route[field] !== undefined && !allowed[allowedKey].has(route[field])) {
          artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} ${field} has unknown value ${JSON.stringify(route[field])}`);
        }
      }
      const arrayChecks = [
        ["domains", "domains"],
        ["repo-keys", "repoKeys"],
        ["task-types", "taskTypes"],
        ["languages", "languages"],
        ["frameworks", "frameworks"],
        ["work-modes", "workModes"],
        ["exclude-when", "domains"],
      ];
      for (const [field, allowedKey] of arrayChecks) {
        if (route[field] === undefined) continue;
        if (!Array.isArray(route[field])) {
          artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} ${field} must be an array`);
          continue;
        }
        for (const value of route[field]) {
          if (!allowed[allowedKey].has(value)) {
            artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} ${field} has unknown value ${JSON.stringify(value)}`);
          }
        }
      }
      if (route["min-evidence"] !== undefined && (!Number.isInteger(route["min-evidence"]) || route["min-evidence"] < 1)) {
        artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} min-evidence must be a positive integer`);
      }
      if (route["max-context-bytes"] !== undefined && (!Number.isInteger(route["max-context-bytes"]) || route["max-context-bytes"] < 1)) {
        artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} max-context-bytes must be a positive integer`);
      }
      if (route.priority !== undefined && !Number.isInteger(route.priority)) {
        artifactPackViolation(out, "manifest-routing", ctx.file, `${entry["artifact-id"]} route.priority must be an integer`);
      }
      if (entry.load === "route-selected") {
        const signature = routeSignature(route);
        if (!signatures.has(signature)) signatures.set(signature, []);
        signatures.get(signature).push({ ctx, entry });
      }
    }
  }
  for (const rows of signatures.values()) {
    if (rows.length < 2) continue;
    const priorities = rows.map((row) => row.entry.route?.priority);
    const distinctPriorities = new Set(priorities);
    if (!priorities.every(Number.isInteger) || distinctPriorities.size !== priorities.length) {
      for (const row of rows) {
        artifactPackViolation(out, "manifest-routing", row.ctx.file, `${row.entry["artifact-id"]} duplicate route signature requires distinct route.priority`);
      }
    }
  }
}

function validateArtifactPackVisibility(ctx, out) {
  for (const entry of ctx.manifest.exports || []) {
    if (ctx.manifest.visibility === "public" && entry["privacy-risk"] !== "public-safe") {
      artifactPackViolation(out, "manifest-visibility", ctx.file, `${entry["artifact-id"]} public pack export must be public-safe`);
    }
    if (ctx.manifest.visibility === "company" && ["private-only", "unknown"].includes(entry["privacy-risk"])) {
      artifactPackViolation(out, "manifest-visibility", ctx.file, `${entry["artifact-id"]} company pack export must be public-safe or needs-scrub`);
    }
  }
}

function validateArtifactPackCompatibility(ctx, out) {
  const aliasIds = [];
  for (const alias of ctx.manifest["compatibility-aliases"] || []) {
    aliasIds.push(alias["alias-id"]);
    if (alias["compatibility-need"] === "alias" && !alias["old-name"]) artifactPackViolation(out, "manifest-compatibility", ctx.file, `${alias["alias-id"]} alias requires old-name`);
    if (["redirect", "old-path-mapping"].includes(alias["compatibility-need"]) && !alias["old-path"]) artifactPackViolation(out, "manifest-compatibility", ctx.file, `${alias["alias-id"]} ${alias["compatibility-need"]} requires old-path`);
    if (alias["compatibility-need"] === "shim" && !alias["shim-path"]) artifactPackViolation(out, "manifest-compatibility", ctx.file, `${alias["alias-id"]} shim requires shim-path`);
    if (typeof alias["removal-criteria"] !== "string" || alias["removal-criteria"].trim().length === 0) {
      artifactPackViolation(out, "manifest-compatibility", ctx.file, `${alias["alias-id"]} removal-criteria must be non-empty`);
    }
  }
  if (hasDuplicates(aliasIds)) artifactPackViolation(out, "manifest-compatibility", ctx.file, "alias-id values must be unique");
}

async function validateArtifactPackCase(files, gate, setMode = false) {
  const out = [];
  const contexts = [];
  for (const file of files) {
    const ctx = await parseArtifactPackManifest(file);
    contexts.push(ctx);
    out.push(...ctx.parseViolations);
  }
  if (gate && gate !== "manifest-shape") {
    contexts.splice(0, contexts.length, ...contexts.filter((ctx) => ctx.manifest));
  }
  const semanticContexts = [];
  for (const ctx of contexts) {
    if (!ctx.manifest) continue;
    let shapeOk = true;
    if (!gate || gate === "manifest-shape") {
      const before = out.length;
      shapeOk = validateArtifactPackShape(ctx, out);
      if (gate === "manifest-shape" && out.length > before) continue;
    } else {
      shapeOk = validateArtifactPackShape(ctx, []);
    }
    if (shapeOk) semanticContexts.push(ctx);
  }
  const runGate = (name) => !gate || gate === name;
  if (runGate("manifest-paths")) {
    for (const ctx of semanticContexts) validateArtifactPackPaths(ctx, out);
  }
  if (runGate("manifest-exports")) {
    for (const ctx of semanticContexts) validateArtifactPackExports(ctx, out);
  }
  if (runGate("manifest-dependencies")) {
    let registry;
    try {
      registry = await readJsonConfig("artifact-pack-core-capabilities.json");
    } catch (err) {
      artifactPackViolation(out, "manifest-dependencies", "agent/config/artifact-pack-core-capabilities.json", `cannot read core capability registry: ${err.message}`);
      registry = { capabilities: [] };
    }
    const coreCapabilityIds = validateArtifactPackCoreCapabilityRegistry(registry, out);
    validateArtifactPackDependencies(semanticContexts, coreCapabilityIds, out, setMode);
  }
  if (runGate("manifest-routing")) {
    validateArtifactPackRouting(semanticContexts, await artifactPackRoutingAllowedSets(), out);
  }
  if (runGate("manifest-visibility")) {
    for (const ctx of semanticContexts) validateArtifactPackVisibility(ctx, out);
  }
  if (runGate("manifest-compatibility")) {
    for (const ctx of semanticContexts) validateArtifactPackCompatibility(ctx, out);
  }
  return out.filter((violation) => !gate || violation.gate === gate);
}

async function artifactPackInputCase(inputs) {
  const files = [];
  let setMode = inputs.length > 1;
  for (const input of inputs) {
    const absolute = path.resolve(REPO_ROOT, input);
    const displayPath = absolute.startsWith(`${REPO_ROOT}${path.sep}`) ? rel(absolute) : absolute;
    if (!existsSync(absolute)) {
      throw new Error(`artifact pack input does not exist: ${input}`);
    }
    const inputStats = statSync(absolute);
    if (inputStats.isFile()) {
      if (path.basename(absolute) !== "artifact-pack.json") throw new Error(`artifact pack input file must be named artifact-pack.json: ${input}`);
      files.push(displayPath);
      continue;
    }
    if (!inputStats.isDirectory()) throw new Error(`artifact pack input must be a directory or artifact-pack.json file: ${input}`);
    const rootManifest = path.join(absolute, "artifact-pack.json");
    if (existsSync(rootManifest)) {
      files.push(rootManifest.startsWith(`${REPO_ROOT}${path.sep}`) ? rel(rootManifest) : rootManifest);
      continue;
    }
    const nested = (await walk(absolute, (f) => path.basename(f) === "artifact-pack.json")).map((file) => (
      file.startsWith(`${REPO_ROOT}${path.sep}`) ? rel(file) : file
    ));
    if (nested.length === 0) throw new Error(`artifact pack input directory contains no artifact-pack.json files: ${input}`);
    files.push(...nested);
    setMode = true;
  }
  return { files: [...new Set(files)].sort(sortInventoryFiles), setMode };
}

async function checkArtifactPack(gate = null, inputs = []) {
  const violations = [];
  if (gate && !ARTIFACT_PACK_GATES.has(gate)) {
    return { name: `artifact-pack:${gate}`, violations: [{ file: "scripts/validate-llm-first.mjs", line: 1, message: `unknown artifact pack gate: ${gate}` }] };
  }
  for (const required of ["artifact-pack.schema.json", "artifact-pack-core-capabilities.json"]) {
    try {
      await readJsonConfig(required);
    } catch (err) {
      violations.push({ file: `agent/config/${required}`, line: 1, message: `cannot read artifact pack registry: ${err.message}` });
    }
  }
  if (inputs.length > 0) {
    let inputCase;
    try {
      inputCase = await artifactPackInputCase(inputs);
    } catch (err) {
      return { name: gate ? `artifact-pack:${gate}` : "artifact-pack", violations: [{ file: "scripts/validate-llm-first.mjs", line: 1, message: err.message }] };
    }
    const actual = await validateArtifactPackCase(inputCase.files, null, inputCase.setMode);
    const selectedActual = gate ? actual.filter((violation) => violation.gate === "manifest-shape" || violation.gate === gate) : actual;
    violations.push(...selectedActual.map(({ gate: actualGate, file, line, message }) => ({
      file,
      line,
      message: `${actualGate}: ${message}`,
    })));
    return { name: gate ? `artifact-pack:${gate}` : "artifact-pack", violations };
  }
  const cases = await artifactPackFixtureCases(gate);
  for (const fixtureCase of cases) {
    const actual = await validateArtifactPackCase(fixtureCase.files, gate, fixtureCase.kind === "set");
    if (!fixtureCase.expectedGate) {
      violations.push(...actual.map(({ gate: actualGate, file, line, message }) => ({
        file,
        line,
        message: `${actualGate}: ${message}`,
      })));
      continue;
    }
    const expectedViolations = actual.filter((violation) => violation.gate === fixtureCase.expectedGate);
    const unexpectedViolations = actual.filter((violation) => violation.gate !== fixtureCase.expectedGate);
    if (expectedViolations.length === 0) {
      violations.push({
        file: fixtureCase.files[0],
        line: 1,
        message: `fixture expected ${fixtureCase.expectedGate} violation but none was reported`,
      });
    }
    const expectedMessage = artifactPackFixtureExpectedMessage(fixtureCase);
    if (expectedMessage && !expectedViolations.some((violation) => violation.message.includes(expectedMessage))) {
      violations.push({
        file: fixtureCase.files[0],
        line: 1,
        message: `fixture expected ${fixtureCase.expectedGate} violation containing ${JSON.stringify(expectedMessage)} but got: ${expectedViolations.map((violation) => violation.message).join("; ") || "none"}`,
      });
    }
    for (const violation of unexpectedViolations) {
      violations.push({
        file: violation.file,
        line: violation.line,
        message: `fixture expected ${fixtureCase.expectedGate} but reported ${violation.gate}: ${violation.message}`,
      });
    }
  }
  return { name: gate ? `artifact-pack:${gate}` : "artifact-pack", violations };
}

async function checkEntryDocuments() {
  const violations = [];
  for (const rootEntry of ["CLAUDE.md", "AGENTS.md"]) {
    if (existsSync(path.join(REPO_ROOT, rootEntry))) {
      violations.push({
        file: rootEntry,
        line: 1,
        message: "root entry documents are not canonical; use agent/ deploy entry templates",
      });
    }
  }
  const entries = await harnessEntryDocuments();
  const rulesIndexAdapterPath = await managedPathAlias("rules-index", "rules/index.md");
  const allowedClaudeRuleImports = new Set([
    rulesIndexAdapterPath,
    "rules/ambiguity-scoring.md",
    "rules/behavior.md",
    "rules/canonical-first.md",
    "rules/git-defaults.md",
    "rules/security.md",
    "rules/session-start.md",
    "rules/verify-before-report.md",
  ]);
  for (const entry of entries) {
    const f = entry.file;
    const marker = entry.harness?.firstRead || "SYSTEM.md";
    let text;
    try {
      text = await readFile(f, "utf8");
    } catch {
      violations.push({ file: entry.path, line: 0, message: "entry document not found" });
      continue;
    }
    const idx = text.indexOf(marker);
    if (idx === -1) {
      violations.push({
        file: entry.path,
        line: 1,
        message: `entry document must read SYSTEM.md first via ${marker}`,
      });
      continue;
    }
    const before = text.slice(0, idx);
    if (/@~?\/?\.?claude\//.test(before) || /claude\/(rules|standards|skills)\//.test(before)) {
      violations.push({
        file: entry.path,
        line: 1,
        message: "entry document references shared layers before SYSTEM.md",
      });
    }
    if (entry.harness?.adapter === "claude") {
      const importRe = /^@~\/\.claude\/(rules|standards|skills)\/(.+)$/gm;
      let m;
      while ((m = importRe.exec(text)) !== null) {
        const importPath = `${m[1]}/${m[2].trim()}`;
        const line = text.slice(0, m.index).split("\n").length;
        if (m[1] === "rules" && allowedClaudeRuleImports.has(importPath)) continue;
        violations.push({
          file: entry.path,
          line,
          message: `entry document may import bootstrap rules only, not ${importPath}`,
        });
      }
    }
  }
  return { name: "entry-documents", violations };
}

async function checkMarkdownLinks() {
  const violations = [];
  const files = [
    path.join(REPO_ROOT, "README.md"),
    path.join(REPO_ROOT, "LOOKUP.md"),
    path.join(REPO_ROOT, "SYSTEM.md"),
    path.join(AGENT_ROOT, "rules", "index.md"),
    path.join(AGENT_ROOT, "standards", "index.md"),
  ];
  files.push(...(await harnessEntryDocuments()).map((entry) => entry.file));
  files.push(...(await walk(path.join(REPO_ROOT, "docs"), (f) => f.endsWith(".md"))));
  const seen = new Set();
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  for (const f of files) {
    const relPath = rel(f);
    if (seen.has(relPath)) continue;
    seen.add(relPath);
    const text = await readFile(f, "utf8");
    const lines = text.split("\n");
    const fenceState = computeFenceState(lines);
    for (let i = 0; i < lines.length; i++) {
      if (fenceState[i]) continue;
      let match;
      linkRe.lastIndex = 0;
      while ((match = linkRe.exec(lines[i])) !== null) {
        const raw = match[1].trim();
        if (!raw || raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("#")) {
          continue;
        }
        const withoutAnchor = raw.split("#")[0];
        if (!withoutAnchor || withoutAnchor.startsWith("mailto:")) continue;
        const target = path.resolve(path.dirname(f), withoutAnchor);
        if (!existsSync(target)) {
          violations.push({
            file: relPath,
            line: i + 1,
            message: `broken markdown link: ${raw} -> ${rel(target)}`,
          });
        }
      }
    }
  }
  return { name: "markdown-links", violations };
}

function repoRelPath(p) {
  return rel(path.resolve(p)).split(path.sep).join("/");
}

function isPlanReportPath(relativePath) {
  return relativePath.includes("-reports/") || relativePath.startsWith("docs/plans/reports/");
}

function isSpecPlanFile(f) {
  const relativePath = repoRelPath(f);
  if (!relativePath.startsWith("docs/plans/") || !relativePath.endsWith(".md")) return false;
  if (isPlanReportPath(relativePath)) return false;
  return !["index.md", "README.md"].includes(path.basename(f));
}

function markdownSlug(f) {
  return path.basename(f, ".md");
}

function resolveRepoMarkdownPath(fromFile, rawValue) {
  if (!rawValue || typeof rawValue !== "string") return null;
  const withoutAnchor = rawValue.trim().split("#")[0];
  if (!withoutAnchor || withoutAnchor.startsWith("http://") || withoutAnchor.startsWith("https://")) {
    return null;
  }
  if (withoutAnchor.startsWith("docs/") || withoutAnchor.startsWith("agent/")) {
    return path.join(REPO_ROOT, withoutAnchor);
  }
  return path.resolve(path.dirname(fromFile), withoutAnchor);
}

function markdownLinkTargets(line) {
  const targets = [];
  const linkRe = /\[[^\]]+\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRe.exec(line)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}

function markdownTableCells(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) return null;
  const cells = trimmed
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());
  if (cells.every((cell) => /^:?-+:?$/.test(cell))) return null;
  return cells;
}

function specsSectionRows(text) {
  const rows = [];
  const lines = text.split("\n");
  let inSpecs = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s+Specs\b/.test(line)) {
      inSpecs = true;
      continue;
    }
    if (inSpecs && /^##\s+/.test(line)) break;
    if (inSpecs) rows.push({ line: i + 1, text: line });
  }
  return rows;
}

async function checkSpecLifecycle() {
  const violations = [];
  const planRoot = path.join(REPO_ROOT, "docs", "plans");
  const milestoneRoot = path.join(REPO_ROOT, "docs", "milestones");
  const specIntakeRoot = path.join(REPO_ROOT, "docs", "briefings", "specs");
  const allowedPlanDirs = new Set(["active", "archive", "completed", "drafts", "parked", "proposed", "reports"]);
  const allowedStatusesByDir = new Map([
    ["active", new Set(["active", "implemented-validation-blocked", "open"])],
    ["archive", new Set(["archived", "superseded"])],
    ["completed", new Set(["completed", "done", "implemented"])],
    ["drafts", new Set(["draft", "draft-conflict"])],
    ["parked", new Set(["blocked", "parked"])],
    ["proposed", new Set(["proposed"])],
  ]);
  const specFiles = (await walk(planRoot, (f) => f.endsWith(".md"))).filter(isSpecPlanFile);
  const specByRel = new Map();
  const specsBySlug = new Map();
  const specsByMilestone = new Map();

  const planRootEntries = await listDirOnce(planRoot);
  for (const entry of planRootEntries) {
    if (entry.isDirectory() && !allowedPlanDirs.has(entry.name)) {
      violations.push({
        file: `docs/plans/${entry.name}`,
        line: 0,
        message: "unexpected first-level docs/plans directory",
      });
    }
    if (entry.isFile() && entry.name.endsWith(".md") && !["README.md", "index.md"].includes(entry.name)) {
      violations.push({
        file: `docs/plans/${entry.name}`,
        line: 0,
        message: "spec markdown must live under a lifecycle folder",
      });
    }
  }

  for (const f of specFiles) {
    const relativePath = repoRelPath(f);
    const planRel = path.relative(planRoot, f).split(path.sep);
    const lifecycleDir = planRel[0];
    const slug = markdownSlug(f);
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    specByRel.set(relativePath, { file: f, relativePath, slug, fm });
    if (!specsBySlug.has(slug)) specsBySlug.set(slug, []);
    specsBySlug.get(slug).push(relativePath);

    const allowedStatuses = allowedStatusesByDir.get(lifecycleDir);
    if (allowedStatuses && fm?.status && !allowedStatuses.has(fm.status)) {
      violations.push({
        file: relativePath,
        line: 1,
        message: `status ${JSON.stringify(fm.status)} does not match lifecycle folder ${JSON.stringify(lifecycleDir)}`,
      });
    }

    if (fm?.briefing) {
      const target = resolveRepoMarkdownPath(f, fm.briefing);
      if (!target || !existsSync(target)) {
        violations.push({
          file: relativePath,
          line: 1,
          message: `briefing target does not exist: ${fm.briefing}`,
        });
      }
    }

    if (fm?.milestone) {
      const milestone = fm.milestone.trim();
      if (!specsByMilestone.has(milestone)) specsByMilestone.set(milestone, []);
      specsByMilestone.get(milestone).push(relativePath);
      const milestonePath = path.join(milestoneRoot, `${milestone}.md`);
      if (!existsSync(milestonePath)) {
        violations.push({
          file: relativePath,
          line: 1,
          message: `milestone target does not exist: docs/milestones/${milestone}.md`,
        });
      }
    }
  }

  for (const [slug, paths] of specsBySlug.entries()) {
    if (paths.length <= 1) continue;
    violations.push({
      file: paths[0],
      line: 0,
      message: `duplicate spec slug ${JSON.stringify(slug)} appears at ${paths.join(", ")}`,
    });
  }

  const milestoneEntries = await listDirOnce(milestoneRoot);
  const linkedSpecsByMilestone = new Map();
  for (const entry of milestoneEntries) {
    if (!entry.isFile() || !entry.name.endsWith(".md") || entry.name === "index.md") continue;
    const milestonePath = path.join(milestoneRoot, entry.name);
    const milestoneSlug = path.basename(entry.name, ".md");
    const text = await readFile(milestonePath, "utf8");
    const linkedSpecs = new Set();

    for (const row of specsSectionRows(text)) {
      const cells = markdownTableCells(row.text);
      if (!cells || cells.length < 2) continue;
      const targets = markdownLinkTargets(cells[0]);
      if (targets.length === 0) continue;
      const targetPath = resolveRepoMarkdownPath(milestonePath, targets[0]);
      if (!targetPath) continue;
      const targetRel = repoRelPath(targetPath);
      if (!targetRel.startsWith("docs/plans/") || isPlanReportPath(targetRel)) continue;
      linkedSpecs.add(targetRel);

      const spec = specByRel.get(targetRel);
      if (!spec) {
        violations.push({
          file: repoRelPath(milestonePath),
          line: row.line,
          message: `milestone links missing spec: ${targets[0]}`,
        });
        continue;
      }
      if (spec.fm?.milestone !== milestoneSlug) {
        violations.push({
          file: spec.relativePath,
          line: 1,
          message: `milestone backlink must be ${JSON.stringify(milestoneSlug)} for ${repoRelPath(milestonePath)}`,
        });
      }
      const rowStatus = cells[1].replace(/`/g, "").trim();
      if (spec.fm?.status && rowStatus && rowStatus !== spec.fm.status) {
        violations.push({
          file: repoRelPath(milestonePath),
          line: row.line,
          message: `milestone row status ${JSON.stringify(rowStatus)} does not match ${spec.relativePath} status ${JSON.stringify(spec.fm.status)}`,
        });
      }
    }

    linkedSpecsByMilestone.set(milestoneSlug, linkedSpecs);
  }

  for (const [milestone, specs] of specsByMilestone.entries()) {
    const linkedSpecs = linkedSpecsByMilestone.get(milestone) || new Set();
    for (const specPath of specs) {
      if (linkedSpecs.has(specPath)) continue;
      violations.push({
        file: specPath,
        line: 1,
        message: `spec declares milestone ${JSON.stringify(milestone)} but milestone ## Specs does not link it`,
      });
    }
  }

  const intakeFiles = await walk(specIntakeRoot, (f) => f.endsWith(".md"));
  for (const f of intakeFiles) {
    const relativePath = repoRelPath(f);
    if (path.basename(f) === "README.md") continue;
    const text = await readFile(f, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm?.spec) {
      violations.push({ file: relativePath, line: 1, message: "spec intake missing frontmatter 'spec'" });
      continue;
    }
    const target = resolveRepoMarkdownPath(f, fm.spec);
    const targetRel = target ? repoRelPath(target) : "";
    if (!target || !existsSync(target) || !specByRel.has(targetRel)) {
      violations.push({
        file: relativePath,
        line: 1,
        message: `spec intake target does not exist or is not a spec: ${fm.spec}`,
      });
    }
  }

  return { name: "spec-lifecycle", violations };
}

async function checkGeneratedBlocks() {
  const violations = [];
  const blocks = [
    {
      file: "README.md",
      id: "readme-inventory",
      expected: await generateReadmeInventory(),
    },
    {
      file: "agent/standards/policy/principles.md",
      id: "validator-checks",
      expected: generateValidatorChecksBlock(),
    },
    {
      file: "AGENT-HUB.md",
      id: "agent-hub-inventory",
      expected: await generateAgentHubInventory(),
    },
    {
      file: "AGENT-HUB.md",
      startMarker: "<!-- routing:start -->",
      endMarker: "<!-- routing:end -->",
      expected: await generateAgentHubRouting(),
    },
  ];
  for (const block of blocks) {
    const f = path.join(REPO_ROOT, block.file);
    let text;
    try {
      text = await readFile(f, "utf8");
    } catch {
      violations.push({ file: block.file, line: 0, message: "generated block file not found" });
      continue;
    }
    const found = block.id
      ? findGeneratedBlock(text, block.id)
      : findMarkedBlock(text, block.startMarker, block.endMarker);
    if (!found) {
      violations.push({
        file: block.file,
        line: 0,
        message: block.id
          ? `missing generated block generated:${block.id}`
          : `missing generated block ${block.startMarker}`,
      });
      continue;
    }
    if (normalizeGeneratedBlock(found.body) !== normalizeGeneratedBlock(block.expected)) {
      violations.push({
        file: block.file,
        line: found.line,
        message: block.id ? `generated:${block.id} is stale` : `${block.startMarker} block is stale`,
      });
    }
  }
  return { name: "generated-blocks", violations };
}

async function checkRepoPolicyConfig() {
  const violations = [];
  const schemaPath = "agent/config/repo-policy.schema.json";
  if (!existsSync(path.join(REPO_ROOT, schemaPath))) {
    violations.push({ file: schemaPath, line: 1, message: "repo policy schema is missing" });
  } else {
    const schema = await readJsonRel(schemaPath);
    const policyProps = schema?.additionalProperties?.properties?.worktreePolicy?.properties;
    for (const key of ["enabled", "worktreeRoot", "branchPrefix", "requireFreshPerExecution", "blockMainCommit", "blockMainPush", "allowMainFeatureBranch"]) {
      if (!policyProps?.[key]) {
        violations.push({ file: schemaPath, line: 1, message: `repo policy schema missing worktreePolicy.${key}` });
      }
    }
  }

  const configPath = path.join(os.homedir(), ".claude/private/agent-hub-config/repo-paths.json");
  if (!existsSync(configPath)) return { name: "repo-policy", violations };

  let repos;
  try {
    repos = JSON.parse(await readFile(configPath, "utf8"));
  } catch (err) {
    violations.push({ file: configPath, line: 1, message: `repo path config is invalid JSON: ${err.message}` });
    return { name: "repo-policy", violations };
  }

  const enabled = Object.entries(repos)
    .filter(([, entry]) => entry?.worktreePolicy?.enabled === true)
    .map(([key]) => key);
  for (const key of ["knitten", "shotloom", "story-previz"]) {
    if (!enabled.includes(key)) {
      violations.push({ file: configPath, line: 1, message: `expected worktreePolicy.enabled for ${key}` });
    }
  }
  for (const [key, entry] of Object.entries(repos)) {
    const policy = entry?.worktreePolicy;
    if (!policy) continue;
    if (typeof policy.enabled !== "boolean") {
      violations.push({ file: configPath, line: 1, message: `${key}.worktreePolicy.enabled must be boolean` });
    }
    if (policy.enabled === true) {
      for (const field of ["worktreeRoot", "branchPrefix"]) {
        if (typeof policy[field] !== "string" || policy[field].length === 0) {
          violations.push({ file: configPath, line: 1, message: `${key}.worktreePolicy.${field} must be a non-empty string` });
        }
      }
      if (!policy.branchPrefix.endsWith("/")) {
        violations.push({ file: configPath, line: 1, message: `${key}.worktreePolicy.branchPrefix must end with /` });
      }
    }
  }
  return { name: "repo-policy", violations };
}

function firstMarkdownHeading(text) {
  const { body, fmLines } = stripFrontmatter(text);
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,6}\s+/.test(line)) return { line: fmLines + i + 1, text: line };
  }
  return null;
}

function frontmatterTagCount(text, prefix) {
  if (!text.startsWith("---\n")) return 0;
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return 0;
  const yaml = rest.slice(0, end);
  const matches = yaml.match(new RegExp(`^\\s*-\\s*${prefix.replace("/", "\\/")}[^\\n]*`, "gm"));
  return matches ? matches.length : 0;
}

function frontmatterTags(text) {
  if (!text.startsWith("---\n")) return [];
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return [];
  const yaml = rest.slice(0, end);
  const tags = [];
  for (const raw of yaml.split("\n")) {
    const m = raw.match(/^\s*-\s*([A-Za-z0-9_/{}/-]+)\s*(?:#.*)?$/);
    if (m) tags.push(m[1]);
  }
  return tags;
}

function frontmatterTagMentions(text) {
  if (!text.startsWith("---\n")) return [];
  const rest = text.slice(4);
  const end = rest.indexOf("\n---\n");
  if (end === -1) return [];
  const yaml = rest.slice(0, end);
  const tags = [];
  for (const raw of yaml.split("\n")) {
    const m = raw.match(/^\s*(?:#\s*)?-\s*([a-z][a-z0-9-]*\/(?:\{\{[A-Z0-9_]+\}\}|[a-z0-9-]+))/);
    if (m) tags.push(m[1]);
  }
  return tags;
}

function lineNumberForText(text, needle) {
  const idx = text.indexOf(needle);
  if (idx === -1) return 1;
  return text.slice(0, idx).split("\n").length;
}

function pushMarkdownFenceViolations(violations, file, text) {
  const lines = text.split("\n");
  let open = null;
  const fenceRe = /^ {0,3}(`{3,}|~{3,})(.*)$/;
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(fenceRe);
    if (!match) continue;
    const marker = match[1];
    const rest = match[2] || "";
    if (!open) {
      open = {
        line: i + 1,
        char: marker[0],
        length: marker.length,
      };
      continue;
    }
    const trimmedRest = rest.trim();
    if (marker[0] === open.char && marker.length >= open.length && trimmedRest === "") {
      open = null;
    }
  }
  if (open) {
    violations.push({
      file,
      line: open.line,
      message: "template has an unclosed Markdown fenced code block",
    });
  }
}

async function readAllowedObsidianTagAxes() {
  const taxonomyPath = path.join(
    AGENT_ROOT,
    "skills",
    "obsidian-obsidian-markdown",
    "references",
    "TAG-TAXONOMY.md"
  );
  const text = await readFile(taxonomyPath, "utf8");
  return new Set([...text.matchAll(/^### `([^`]+\/)`/gm)].map((m) => m[1]));
}

function pushObsidianTagViolations(violations, file, text, allowedAxes) {
  const tags = frontmatterTags(text);
  if (tags.length > 5) {
    violations.push({
      file,
      line: 1,
      message: `Obsidian template must have at most 5 frontmatter tags (found ${tags.length})`,
    });
  }
  const tagLike = [...new Set(frontmatterTagMentions(text))];
  for (const tag of tagLike) {
    const slash = tag.indexOf("/");
    if (slash === -1) continue;
    const axis = tag.slice(0, slash + 1);
    if (!allowedAxes.has(axis)) {
      violations.push({
        file,
        line: lineNumberForText(text, tag),
        message: `Obsidian template uses unknown tag axis ${JSON.stringify(axis)}`,
      });
    }
  }
}

function normalizeGithubPrTemplate(text) {
  return text
    .split("\n")
    .filter((line) => !line.includes("Canonical template: `agent/document-templates/github/pull-request.md`"))
    .join("\n")
    .trimEnd();
}

function pushRequiredFrontmatter(violations, file, text, keys) {
  const fm = parseFrontmatter(text);
  if (!fm) {
    violations.push({ file, line: 1, message: "template missing YAML frontmatter" });
    return null;
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(fm, key)) {
      violations.push({ file, line: 1, message: `template frontmatter missing ${JSON.stringify(key)}` });
    }
  }
  return fm;
}

async function checkDocumentTemplates() {
  const violations = [];
  const root = path.join(AGENT_ROOT, "document-templates");
  const files = await walk(root, (f) => f.endsWith(".md"));
  const allowedObsidianTagAxes = await readAllowedObsidianTagAxes();

  for (const f of files) {
    const file = rel(f);
    const relative = path.relative(root, f);
    const text = await readFile(f, "utf8");
    const parts = relative.split(path.sep);
    const group = parts[0];
    pushMarkdownFenceViolations(violations, file, text);

    if (relative === "README.md") {
      pushRequiredFrontmatter(violations, file, text, ["status"]);
      if (!text.includes("## Consumer Format Contract")) {
        violations.push({ file, line: 1, message: "README must declare consumer format contract" });
      }
      continue;
    }

    if (group === "github") {
      if (parseFrontmatter(text)) {
        violations.push({ file, line: 1, message: "GitHub body template must not have YAML frontmatter" });
      }
      for (const heading of ["## Summary", "## Scope", "## Validation"]) {
        if (!text.includes(heading)) {
          violations.push({ file, line: 1, message: `GitHub body template missing ${heading}` });
        }
      }
      continue;
    }

    if (group === "linear") {
      pushRequiredFrontmatter(violations, file, text, ["status"]);
      if (!text.includes("```markdown")) {
        violations.push({ file, line: 1, message: "Linear template must include fenced markdown body examples" });
      }
      continue;
    }

    if (["obsidian", "consulting", "project"].includes(group)) {
      pushRequiredFrontmatter(violations, file, text, ["title", "tags", "date", "source"]);
      pushObsidianTagViolations(violations, file, text, allowedObsidianTagAxes);
      const typeCount = frontmatterTagCount(text, "type/");
      const projectCount = frontmatterTagCount(text, "project/");
      if (typeCount !== 1) {
        violations.push({ file, line: 1, message: `Obsidian template must have exactly one type/ tag (found ${typeCount})` });
      }
      if (projectCount !== 1) {
        violations.push({ file, line: 1, message: `Obsidian template must have exactly one project/ tag (found ${projectCount})` });
      }
      const firstHeading = firstMarkdownHeading(text);
      if (!firstHeading || !firstHeading.text.startsWith("# ")) {
        violations.push({ file, line: firstHeading?.line || 1, message: "Obsidian template first heading must be one H1" });
      }
      continue;
    }

    if (group === "agent-hub") {
      pushRequiredFrontmatter(violations, file, text, ["status"]);
      if (!text.includes("```markdown")) {
        violations.push({ file, line: 1, message: "agent-hub template must include fenced markdown generated-body examples" });
      }
      continue;
    }

    if (group === "review") {
      pushRequiredFrontmatter(violations, file, text, ["status"]);
      if (!text.includes("Review Output")) {
        violations.push({ file, line: 1, message: "review template must include review output sections" });
      }
      continue;
    }

    violations.push({ file, line: 1, message: `unknown document template consumer group ${JSON.stringify(group)}` });
  }

  const mirror = path.join(REPO_ROOT, ".github", "pull_request_template.md");
  const canonicalPr = path.join(root, "github", "pull-request.md");
  if (existsSync(mirror)) {
    const text = await readFile(mirror, "utf8");
    if (!text.includes("agent/document-templates/github/pull-request.md")) {
      violations.push({
        file: ".github/pull_request_template.md",
        line: 1,
        message: "GitHub runtime mirror must name canonical document template",
      });
    }
    if (existsSync(canonicalPr)) {
      const canonicalText = await readFile(canonicalPr, "utf8");
      if (normalizeGithubPrTemplate(text) !== normalizeGithubPrTemplate(canonicalText)) {
        violations.push({
          file: ".github/pull_request_template.md",
          line: 1,
          message: "GitHub runtime mirror must match canonical pull request template body",
        });
      }
    }
  } else if (existsSync(canonicalPr)) {
    violations.push({
      file: ".github/pull_request_template.md",
      line: 1,
      message: "GitHub runtime mirror is missing",
    });
  }

  const consumerRoots = [
    path.join(AGENT_ROOT, "skills"),
    path.join(AGENT_ROOT, "standards"),
    path.join(REPO_ROOT, ".github"),
    path.join(REPO_ROOT, "scripts"),
  ];
  for (const consumerRoot of consumerRoots) {
    const consumerFiles = await walk(consumerRoot, (f) => f.endsWith(".md") || f.endsWith(".mjs"));
    for (const f of consumerFiles) {
      const file = rel(f);
      if (file === "scripts/validate-llm-first.mjs") continue;
      const text = await readFile(f, "utf8");
      for (const pattern of ["~/.claude/templates/", "agent/templates/"]) {
        const idx = text.indexOf(pattern);
        if (idx !== -1) {
          violations.push({
            file,
            line: text.slice(0, idx).split("\n").length,
            message: `legacy template path ${JSON.stringify(pattern)} must be a documented runtime mirror or removed`,
          });
        }
      }
    }
  }

  return { name: "document-templates", violations };
}

async function checkArtifactPackDiscoveryRouting() {
  const violations = [];
  try {
    await execFileAsync(process.execPath, ["--test", "tests/artifact-pack-discovery-routing.test.mjs"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (err) {
    violations.push({
      file: "tests/artifact-pack-discovery-routing.test.mjs",
      line: 1,
      message: `artifact pack discovery routing tests failed: ${(err.stdout || err.stderr || err.message).trim()}`,
    });
  }
  return { name: "artifact-pack-discovery-routing", violations };
}

async function checkExampleSkillPack() {
  const violations = [];
  try {
    await execFileAsync(process.execPath, ["--test", "tests/example-skill-pack.test.mjs"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (err) {
    violations.push({
      file: "tests/example-skill-pack.test.mjs",
      line: 1,
      message: `example skill pack tests failed: ${(err.stdout || err.stderr || err.message).trim()}`,
    });
  }
  return { name: "example-skill-pack", violations };
}

// ---------- driver ----------

const CHECKS = [
  { name: "banned-terms", fn: checkBannedTerms },
  { name: "terminology", fn: checkTerminology },
  { name: "registry-integrity", fn: checkRegistryIntegrity },
  { name: "agent-hub", fn: checkAgentHubManifest },
  { name: "context-routing", fn: checkContextRouting },
  { name: "rules-frontmatter", fn: checkRulesFrontmatter },
  { name: "rules-index-no-links", fn: checkRulesIndexNoLinks },
  { name: "repo-path-reads", fn: checkRepoPathReads },
  { name: "standards-status", fn: checkStandardsStatus },
  { name: "standards-redirects", fn: checkStandardsRedirects },
  { name: "platform-metadata", fn: checkPlatformMetadata },
  { name: "taxonomy", fn: checkTaxonomy },
  { name: "managed-paths", fn: checkManagedPaths },
  { name: "artifact-inventory", fn: checkArtifactInventory },
  { name: "artifact-pack", fn: (args) => checkArtifactPack(null, args.artifactPackInputs) },
  { name: "artifact-pack:manifest-shape", fn: (args) => checkArtifactPack("manifest-shape", args.artifactPackInputs), full: false },
  { name: "artifact-pack:manifest-paths", fn: (args) => checkArtifactPack("manifest-paths", args.artifactPackInputs), full: false },
  { name: "artifact-pack:manifest-exports", fn: (args) => checkArtifactPack("manifest-exports", args.artifactPackInputs), full: false },
  { name: "artifact-pack:manifest-dependencies", fn: (args) => checkArtifactPack("manifest-dependencies", args.artifactPackInputs), full: false },
  { name: "artifact-pack:manifest-routing", fn: (args) => checkArtifactPack("manifest-routing", args.artifactPackInputs), full: false },
  { name: "artifact-pack:manifest-visibility", fn: (args) => checkArtifactPack("manifest-visibility", args.artifactPackInputs), full: false },
  { name: "artifact-pack:manifest-compatibility", fn: (args) => checkArtifactPack("manifest-compatibility", args.artifactPackInputs), full: false },
  { name: "artifact-pack-discovery-routing", fn: checkArtifactPackDiscoveryRouting },
  { name: "example-skill-pack", fn: checkExampleSkillPack },
  { name: "skill-root-shape", fn: checkSkillRootShape },
  { name: "skill-mechanics", fn: checkSkillCommandMechanics },
  { name: "tracked-runtime-paths", fn: checkTrackedRuntimePaths },
  { name: "tracked-user-paths", fn: checkTrackedUserAbsolutePaths },
  { name: "entry-documents", fn: checkEntryDocuments },
  { name: "generated-blocks", fn: checkGeneratedBlocks },
  { name: "repo-policy", fn: checkRepoPolicyConfig },
  { name: "document-templates", fn: checkDocumentTemplates },
  { name: "markdown-links", fn: checkMarkdownLinks },
  { name: "spec-lifecycle", fn: checkSpecLifecycle },
  { name: "length-caps", fn: checkLengthCaps },
  { name: "import-targets", fn: checkImportTargets },
  { name: "inventory-counts", fn: checkInventoryCounts },
  { name: "lookup-presence", fn: checkLookupPresence },
];

function parseArgs(argv) {
  const args = { check: null, list: false, artifactPackInputs: [], unknown: [], errors: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--list") args.list = true;
    else if (a === "--check") {
      const value = argv[++i];
      if (!value || value.startsWith("--")) {
        args.errors.push("--check requires a check name");
        if (value?.startsWith("--")) i--;
      } else {
        args.check = value;
      }
    }
    else if (a.startsWith("--check=")) args.check = a.slice("--check=".length);
    else if (a === "--artifact-pack") {
      const value = argv[++i];
      if (!value || value.startsWith("--")) {
        args.errors.push("--artifact-pack requires a path");
        if (value?.startsWith("--")) i--;
      } else {
        args.artifactPackInputs.push(value);
      }
    }
    else if (a.startsWith("--artifact-pack=")) args.artifactPackInputs.push(a.slice("--artifact-pack=".length));
    else args.unknown.push(a);
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
  if (args.errors.length > 0) {
    console.error(args.errors.join("\n"));
    process.exit(2);
  }
  if (args.unknown.length > 0) {
    console.error(`unknown argument(s): ${args.unknown.join(", ")}`);
    process.exit(2);
  }
  if (args.artifactPackInputs.length > 0 && (!args.check || !args.check.startsWith("artifact-pack"))) {
    console.error("--artifact-pack can only be used with --check artifact-pack or artifact-pack:<gate>");
    process.exit(2);
  }
  const selected = args.check
    ? CHECKS.filter((c) => c.name === args.check)
    : CHECKS.filter((c) => c.full !== false);
  if (selected.length === 0) {
    console.error(`unknown check: ${args.check}`);
    console.error(`available: ${CHECKS.map((c) => c.name).join(", ")}`);
    process.exit(2);
  }

  let totalViolations = 0;
  const failingChecks = [];
  for (const c of selected) {
    const result = await c.fn(args);
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
