#!/usr/bin/env node
// Mechanical anti-rot validator for the LLM-first / agent-first policy.
// Run from repo root: node scripts/validate-llm-first.mjs
import { readdir, readFile, stat, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const REPO_ROOT = path.resolve(path.dirname(__filename), "..");
const CONFIG_DIR = path.join(REPO_ROOT, "claude", "config");
const CONFIG_CACHE = new Map();

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
    if (e.isDirectory() && e.name === "node_modules") continue;
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

function hasDuplicates(values) {
  return new Set(values).size !== values.length;
}

function isSorted(values) {
  return values.join("\n") === [...values].sort().join("\n");
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

async function commandNames() {
  const entries = await listDirOnce(path.join(REPO_ROOT, "claude", "commands"));
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name.slice(0, -".md".length))
    .sort(sortInventoryFiles);
}

async function skillNames() {
  const entries = await listDirOnce(path.join(REPO_ROOT, "claude", "skills"));
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort(sortInventoryFiles);
}

async function standardRows() {
  const dir = path.join(REPO_ROOT, "claude", "standards");
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
  const dir = path.join(REPO_ROOT, "claude", "rules");
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
  const commands = await commandNames();
  const skills = await skillNames();
  const commandCounts = countByPrefix(commands);
  const skillCounts = countByPrefix(skills);
  const commandExamples = new Map();
  for (const command of commands) {
    const prefix = command.split("-")[0];
    if (!commandExamples.has(prefix)) commandExamples.set(prefix, []);
    const examples = commandExamples.get(prefix);
    if (examples.length < 3) examples.push(command);
  }
  const standards = await standardRows();
  const rules = await ruleRows();

  const sections = [];
  sections.push(`## Commands (${commands.length})`);
  sections.push("");
  sections.push("| Category | Count | Examples |");
  sections.push("|----------|------:|----------|");
  for (const row of commandCounts) {
    sections.push(
      `| \`${row.name}-*\` | ${row.count} | ${inlineCodeList(commandExamples.get(row.name) || [])} |`
    );
  }
  sections.push("");
  sections.push("---");
  sections.push("");
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
  sections.push("Reference docs in `claude/standards/`. Loaded on-demand, never auto.");
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
    "Rules in `claude/rules/`. Auto rules load every session via entry documents; triggered rules load on demand."
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
  sections.push(`| Harnesses | ${hub.harnesses.length} | \`claude/config/agent-hub.json\` \`harnesses\` |`);
  sections.push(`| Shared layers | ${hub.sharedLayers.length} | \`claude/config/agent-hub.json\` \`sharedLayers\` |`);
  sections.push(`| Registries | ${hub.registries.length} | \`claude/config/agent-hub.json\` \`registries\` |`);
  sections.push(`| Generated documents | ${hub.generatedDocuments.length} | \`claude/config/agent-hub.json\` \`generatedDocuments\` |`);
  sections.push(`| Runtime path policies | ${hub.runtimePathPolicies.length} | \`claude/config/agent-hub.json\` \`runtimePathPolicies\` |`);
  sections.push(`| Validators | ${hub.validators.length} | \`claude/config/agent-hub.json\` \`validators\` |`);
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
  const claude = path.join(REPO_ROOT, "claude");
  files.push(...(await walk(path.join(claude, "rules"), (f) => f.endsWith(".md"))));
  files.push(...(await walk(path.join(claude, "standards"), (f) => f.endsWith(".md"))));
  files.push(...(await walk(path.join(claude, "commands"), (f) => f.endsWith(".md"))));
  files.push(
    ...(await walk(path.join(claude, "skills"), (f) => path.basename(f) === "SKILL.md"))
  );
  for (const name of ["README.md", "LOOKUP.md", "SYSTEM.md", "AGENTS.md", "CLAUDE.md"]) {
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
  const schema = await readJsonConfig("frontmatter-schema.json");
  const loadValues = new Set(schema.ruleLoadValues);
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

async function checkImportTargets() {
  const violations = [];
  const files = [path.join(REPO_ROOT, "CLAUDE.md"), path.join(REPO_ROOT, "claude", "CLAUDE.md")];
  const re = /@(\S+)/g;
  for (const f of files) {
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
      let m;
      re.lastIndex = 0;
      while ((m = re.exec(line)) !== null) {
        const spec = m[1];
        let target;
        if (spec.startsWith("~/.claude/")) {
          target = path.join(REPO_ROOT, "claude", spec.slice("~/.claude/".length));
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

async function checkLengthCaps() {
  const violations = [];
  const docBudgets = await readJsonConfig("doc-budgets.json");
  const exceptions = await readJsonConfig("exceptions.json");
  const budgets = docBudgets.lineBudgets;
  const standardLengthGrandfathered = new Set(
    exceptions.standardLengthGrandfathered.map((entry) => entry.path)
  );
  const ruleDir = path.join(REPO_ROOT, "claude", "rules");
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
  const stdDir = path.join(REPO_ROOT, "claude", "standards");
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
  return { name: "length-caps", violations };
}

async function checkStandardsStatus() {
  const violations = [];
  const schema = await readJsonConfig("frontmatter-schema.json");
  const statusValues = new Set(schema.standardStatusValues);
  const dir = path.join(REPO_ROOT, "claude", "standards");
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
        file: "claude/config/doc-budgets.json",
        line: 1,
        message: `lineBudgets.${key} must be a positive integer`,
      });
    }
  }

  pushArrayViolations(violations, "claude/config/frontmatter-schema.json", "ruleLoadValues", schema.ruleLoadValues);
  pushArrayViolations(violations, "claude/config/frontmatter-schema.json", "standardStatusValues", schema.standardStatusValues);
  pushArrayViolations(violations, "claude/config/frontmatter-schema.json", "platformValues", schema.platformValues);
  pushArrayViolations(violations, "claude/config/frontmatter-schema.json", "portabilityValues", schema.portabilityValues);
  pushArrayViolations(violations, "claude/config/frontmatter-schema.json", "platformMetadataPilotFiles", schema.platformMetadataPilotFiles);
  pushArrayViolations(violations, "claude/config/taxonomy.json", "skillCommandCategories", taxonomy.skillCommandCategories, { sorted: true });
  pushArrayViolations(violations, "claude/config/taxonomy.json", "standardGroups", taxonomy.standardGroups, { sorted: true });
  pushArrayViolations(violations, "claude/config/taxonomy.json", "universalAbbreviations", taxonomy.universalAbbreviations, { sorted: true });
  pushArrayViolations(violations, "claude/config/audit-policy.json", "severityTiers", auditPolicy.severityTiers);

  if (!Number.isInteger(taxonomy.maxArtifactNameChars) || taxonomy.maxArtifactNameChars <= 0) {
    violations.push({
      file: "claude/config/taxonomy.json",
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
        file: "claude/config/taxonomy.json",
        line: 1,
        message: `${key} must be a regex string`,
      });
      continue;
    }
    try {
      new RegExp(taxonomy[key]);
    } catch {
      violations.push({
        file: "claude/config/taxonomy.json",
        line: 1,
        message: `${key} must compile as a regex`,
      });
    }
  }
  pushArrayViolations(violations, "claude/config/taxonomy.json", "managedDocumentFolders", taxonomy.managedDocumentFolders);
  const managedPaths = [];
  for (const entry of taxonomy.managedDocumentFolders || []) {
    if (!entry || typeof entry !== "object") {
      violations.push({
        file: "claude/config/taxonomy.json",
        line: 1,
        message: "managedDocumentFolders entries must be objects",
      });
      continue;
    }
    for (const field of ["path", "patternKey"]) {
      if (!entry[field] || typeof entry[field] !== "string") {
        violations.push({
          file: "claude/config/taxonomy.json",
          line: 1,
          message: `managedDocumentFolders entry missing ${field}`,
        });
      }
    }
    if (typeof entry.recursive !== "boolean") {
      violations.push({
        file: "claude/config/taxonomy.json",
        line: 1,
        message: `managedDocumentFolders ${entry.path || "<unknown>"} recursive must be boolean`,
      });
    }
    if (entry.path) {
      managedPaths.push(entry.path);
      if (!existsSync(path.join(REPO_ROOT, entry.path))) {
        violations.push({
          file: "claude/config/taxonomy.json",
          line: 1,
          message: `managedDocumentFolders path does not exist: ${entry.path}`,
        });
      }
    }
    if (entry.patternKey && typeof taxonomy[entry.patternKey] !== "string") {
      violations.push({
        file: "claude/config/taxonomy.json",
        line: 1,
        message: `managedDocumentFolders ${entry.path || "<unknown>"} references unknown patternKey ${entry.patternKey}`,
      });
    }
  }
  if (hasDuplicates(managedPaths)) {
    violations.push({
      file: "claude/config/taxonomy.json",
      line: 1,
      message: "managedDocumentFolders paths must not contain duplicates",
    });
  }
  if (!isSorted(managedPaths)) {
    violations.push({
      file: "claude/config/taxonomy.json",
      line: 1,
      message: "managedDocumentFolders paths must be sorted alphabetically",
    });
  }

  for (const [key, value] of Object.entries(auditPolicy.garden || {})) {
    if (!Number.isInteger(value) || value <= 0) {
      violations.push({
        file: "claude/config/audit-policy.json",
        line: 1,
        message: `garden.${key} must be a positive integer`,
      });
    }
  }
  for (const key of ["contextBudgetPercent", "obsidianBulkRetagNotes", "obsidianBulkRetagBackgroundNotes"]) {
    const value = auditPolicy[key];
    if (!Number.isInteger(value) || value <= 0) {
      violations.push({
        file: "claude/config/audit-policy.json",
        line: 1,
        message: `${key} must be a positive integer`,
      });
    }
  }

  for (const entry of exceptions.standardLengthGrandfathered || []) {
    const fields = ["path", "reason", "decision"];
    for (const field of fields) {
      if (!entry[field] || !String(entry[field]).trim()) {
        violations.push({
          file: "claude/config/exceptions.json",
          line: 1,
          message: `standardLengthGrandfathered entry missing ${field}`,
        });
      }
    }
    if (!entry.expires && !entry.reviewAfter) {
      violations.push({
        file: "claude/config/exceptions.json",
        line: 1,
        message: `standardLengthGrandfathered ${entry.path || "<unknown>"} requires expires or reviewAfter`,
      });
    }
    if (entry.path && !existsSync(path.join(REPO_ROOT, entry.path))) {
      violations.push({
        file: "claude/config/exceptions.json",
        line: 1,
        message: `exception target does not exist: ${entry.path}`,
      });
    }
    if (entry.decision) {
      const decisionPath = String(entry.decision).split("#")[0];
      if (!existsSync(path.join(REPO_ROOT, decisionPath))) {
        violations.push({
          file: "claude/config/exceptions.json",
          line: 1,
          message: `exception decision target does not exist: ${entry.decision}`,
        });
      }
    }
  }

  return { name: "registry-integrity", violations };
}

const AGENT_HUB_ALLOWED = {
  sharedLayerKinds: new Set(["rules", "standards", "skills", "commands", "lib", "config"]),
  loadModes: new Set(["entry", "auto", "triggered", "on-demand", "invoked", "library", "config"]),
  registryFormats: new Set(["json"]),
  registrySecretPolicies: new Set(["no-secrets", "template-only", "private-values"]),
  generatedDocumentModes: new Set(["generated-block", "validated-manual", "thin-wrapper"]),
  runtimeOwners: new Set(["caol-ila", "runtime", "machine-local", "project-local"]),
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

function pushManifestPathViolation(violations, field, value) {
  if (!manifestPathExists(value)) {
    violations.push({
      file: "claude/config/agent-hub.json",
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

async function checkAgentHubManifest() {
  const violations = [];
  const file = "claude/config/agent-hub.json";
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
        if (!text.includes(`generated:${generated.marker}`)) {
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

async function checkTaxonomy() {
  const violations = [];
  const taxonomy = await readJsonConfig("taxonomy.json");
  const categories = new Set(taxonomy.skillCommandCategories);
  const skillEntries = await listDirOnce(path.join(REPO_ROOT, "claude", "skills"));
  for (const entry of skillEntries) {
    if (!entry.isDirectory()) continue;
    const prefix = entry.name.split("-")[0];
    if (!categories.has(prefix)) {
      violations.push({
        file: `claude/skills/${entry.name}/`,
        line: 0,
        message: `skill category ${JSON.stringify(prefix)} missing from claude/config/taxonomy.json`,
      });
    }
  }
  const commandEntries = await listDirOnce(path.join(REPO_ROOT, "claude", "commands"));
  for (const entry of commandEntries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const stem = entry.name.slice(0, -".md".length);
    const prefix = stem.split("-")[0];
    if (!categories.has(prefix)) {
      violations.push({
        file: `claude/commands/${entry.name}`,
        line: 0,
        message: `command category ${JSON.stringify(prefix)} missing from claude/config/taxonomy.json`,
      });
    }
  }

  const standardGroups = new Set(taxonomy.standardGroups);
  const standardEntries = await listDirOnce(path.join(REPO_ROOT, "claude", "standards"));
  for (const entry of standardEntries) {
    if (!entry.isDirectory()) continue;
    if (!standardGroups.has(entry.name)) {
      violations.push({
        file: `claude/standards/${entry.name}/`,
        line: 0,
        message: `standard group ${JSON.stringify(entry.name)} missing from claude/config/taxonomy.json`,
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

async function checkEntryDocuments() {
  const violations = [];
  const entries = [
    { file: "CLAUDE.md", marker: "@SYSTEM.md" },
    { file: "AGENTS.md", marker: "[`SYSTEM.md`](SYSTEM.md)" },
  ];
  for (const entry of entries) {
    const f = path.join(REPO_ROOT, entry.file);
    let text;
    try {
      text = await readFile(f, "utf8");
    } catch {
      violations.push({ file: entry.file, line: 0, message: "entry document not found" });
      continue;
    }
    const idx = text.indexOf(entry.marker);
    if (idx === -1) {
      violations.push({
        file: entry.file,
        line: 1,
        message: `entry document must read SYSTEM.md first via ${entry.marker}`,
      });
      continue;
    }
    const before = text.slice(0, idx);
    if (/@~?\/?\.?claude\//.test(before) || /claude\/(rules|standards|skills|commands)\//.test(before)) {
      violations.push({
        file: entry.file,
        line: 1,
        message: "entry document references shared layers before SYSTEM.md",
      });
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
    path.join(REPO_ROOT, "AGENTS.md"),
    path.join(REPO_ROOT, "CLAUDE.md"),
    path.join(REPO_ROOT, "claude", "rules", "index.md"),
    path.join(REPO_ROOT, "claude", "standards", "index.md"),
  ];
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

async function checkGeneratedBlocks() {
  const violations = [];
  const blocks = [
    {
      file: "README.md",
      id: "readme-inventory",
      expected: await generateReadmeInventory(),
    },
    {
      file: "claude/standards/policy/principles.md",
      id: "validator-checks",
      expected: generateValidatorChecksBlock(),
    },
    {
      file: "AGENT-HUB.md",
      id: "agent-hub-inventory",
      expected: await generateAgentHubInventory(),
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
    const found = findGeneratedBlock(text, block.id);
    if (!found) {
      violations.push({
        file: block.file,
        line: 0,
        message: `missing generated block generated:${block.id}`,
      });
      continue;
    }
    if (normalizeGeneratedBlock(found.body) !== normalizeGeneratedBlock(block.expected)) {
      violations.push({
        file: block.file,
        line: found.line,
        message: `generated:${block.id} is stale`,
      });
    }
  }
  return { name: "generated-blocks", violations };
}

// ---------- driver ----------

const CHECKS = [
  { name: "banned-terms", fn: checkBannedTerms },
  { name: "registry-integrity", fn: checkRegistryIntegrity },
  { name: "agent-hub", fn: checkAgentHubManifest },
  { name: "rules-frontmatter", fn: checkRulesFrontmatter },
  { name: "standards-status", fn: checkStandardsStatus },
  { name: "platform-metadata", fn: checkPlatformMetadata },
  { name: "taxonomy", fn: checkTaxonomy },
  { name: "entry-documents", fn: checkEntryDocuments },
  { name: "generated-blocks", fn: checkGeneratedBlocks },
  { name: "markdown-links", fn: checkMarkdownLinks },
  { name: "length-caps", fn: checkLengthCaps },
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
