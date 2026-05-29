#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

function usage() {
  console.error(`Usage:
  shotloom-linear-context.mjs discover <STL-NN|NN|intake.json> [--out-dir <dir>] [--work-dir <dir>] [--out <path>]
  shotloom-linear-context.mjs gather <STL-NN|NN|intake.json> [--related <raw.json>]... [--doc <path>]... [--out-dir <dir>] [--work-dir <dir>] [--out <path>]
  shotloom-linear-context.mjs discover --issue <intake.json> [--out <path>]
  shotloom-linear-context.mjs gather --issue <intake.json> [--related <raw.json>]... [--doc <path>]... [--out <path>]

Builds read-only Linear planning context from already-fetched JSON. This script
does not call Linear, mutate Linear, or read implementation source files.`);
}

function parseArgs(argv) {
  const [command, maybeInput, ...tail] = argv;
  const args = {
    command,
    input: maybeInput && !maybeInput.startsWith("-") ? maybeInput : "",
    issue: "",
    out: "",
    outDir: "/tmp",
    workDir: "",
    related: [],
    docs: [],
  };
  const rest = args.input ? tail : [maybeInput, ...tail].filter(Boolean);

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--issue") args.issue = rest[++i] || "";
    else if (arg === "--out") args.out = rest[++i] || "";
    else if (arg === "--out-dir") args.outDir = rest[++i] || "";
    else if (arg === "--work-dir") args.workDir = rest[++i] || "";
    else if (arg === "--related") args.related.push(rest[++i] || "");
    else if (arg === "--doc") args.docs.push(rest[++i] || "");
    else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      usage();
      process.exit(2);
    }
  }

  if (!["discover", "gather"].includes(command) || (!args.input && !args.issue)) {
    usage();
    process.exit(2);
  }
  return args;
}

function fail(message, detail = "", code = 1) {
  process.stdout.write(`${JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2)}\n`);
  process.exit(code);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail("unable to read JSON", `${path}: ${error.message}`);
  }
}

function issueKeyFromInput(input) {
  const value = String(input || "").trim();
  const match = value.match(/\bSTL-(\d+)\b/i) || value.match(/(?:^|[^\d])(\d+)(?:$|[^\d])/);
  if (!match) fail("unable to detect Linear issue key", value, 2);
  return `STL-${match[1]}`;
}

function defaultIntakePath(issueKey, outDir) {
  return resolve(outDir || "/tmp", `shotloom-start-task-${issueKey}`, "intake.json");
}

function workDirFor(issueKey, args) {
  return resolve(args.workDir || join(args.outDir || "/tmp", `shotloom-start-task-${issueKey}`));
}

function ensureWorkDir(issueKey, args) {
  const dir = workDirFor(issueKey, args);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function issuePathFor(args) {
  const input = args.issue || args.input;
  if (input.endsWith(".json") || input.includes("/")) return resolve(input);
  return join(ensureWorkDir(issueKeyFromInput(input), args), "intake.json");
}

function textField(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.name || value.title || value.displayName || value.identifier || "";
  return "";
}

function arrayNames(value) {
  if (!Array.isArray(value)) return [];
  return value.map(textField).filter(Boolean);
}

function normalizeIssue(raw, fallbackKey = "") {
  const source = raw.issue && typeof raw.issue === "object" ? raw.issue : raw;
  const id = source.identifier || source.id || source.key || fallbackKey;
  const description = source.description || source.body || "";
  return {
    id,
    title: source.title || source.name || "",
    state: textField(source.state || source.status),
    url: source.url || source.link || "",
    description,
    labels: arrayNames(source.labels),
    assignee: textField(source.assignee),
    project: textField(source.project),
    team: textField(source.team),
    parent: textField(source.parent),
    relations: collectRelationSummaries(source),
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
  };
}

function collectRelationSummaries(source) {
  const buckets = [];
  for (const key of ["relations", "related", "relatedIssues", "blockedBy", "blocks", "children"]) {
    const value = source[key];
    if (!Array.isArray(value)) continue;
    for (const item of value) {
      if (!item || typeof item !== "object") continue;
      buckets.push({
        kind: key,
        id: item.identifier || item.id || item.key || "",
        title: item.title || item.name || "",
        url: item.url || item.link || "",
        state: textField(item.state || item.status),
      });
    }
  }
  return buckets.filter((item) => item.id || item.title || item.url);
}

function collectText(value, depth = 0) {
  if (depth > 6 || value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((item) => collectText(item, depth + 1)).join("\n");
  if (typeof value === "object") return Object.values(value).map((item) => collectText(item, depth + 1)).join("\n");
  return "";
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function issueKeysFromText(text, ownKey = "") {
  const keys = [];
  for (const match of text.matchAll(/\bSTL-\d+\b/gi)) keys.push(match[0].toUpperCase());
  return unique(keys).filter((key) => key !== ownKey);
}

function urlsFromText(text) {
  return unique([...text.matchAll(/https?:\/\/[^\s)<>"']+/g)].map((match) => match[0].replace(/[.,;:]+$/, "")));
}

function docHintsFromText(text) {
  const hints = [];
  for (const match of text.matchAll(/(?:docs|design|spec|prd|briefings|plans)\/[A-Za-z0-9._/-]+/g)) {
    hints.push(match[0].replace(/[.,;:]+$/, ""));
  }
  return unique(hints);
}

function searchTerms(issue) {
  return unique(
    [issue.id, ...issue.title.split(/[^A-Za-z0-9]+/)]
      .map((item) => item.trim())
      .filter((item) => item.length >= 3)
      .slice(0, 12),
  );
}

function summarizeDoc(path) {
  if (!existsSync(path)) fail("document not found", path, 2);
  const text = readFileSync(path, "utf8");
  const heading = text.match(/^#\s+(.+)$/m)?.[1] || basename(path);
  return {
    path: resolve(path),
    title: heading,
    mentions: issueKeysFromText(text),
  };
}

function writeResult(args, value) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (args.out) writeFileSync(args.out, text);
  process.stdout.write(text);
}

const args = parseArgs(process.argv.slice(2));
const intakePath = issuePathFor(args);
if (!existsSync(intakePath)) fail("intake file not found; run shotloom-linear-intake.mjs get first", intakePath, 2);
const intake = readJson(intakePath);
const issue = normalizeIssue(intake);
const workDir = ensureWorkDir(issue.id, args);
const haystack = collectText(intake);
const referencedIssueKeys = unique([
  ...issueKeysFromText(haystack, issue.id),
  ...issue.relations.map((item) => item.id).filter((id) => /^STL-\d+$/i.test(id)).map((id) => id.toUpperCase()),
]);

if (args.command === "discover") {
  const outPath = args.out || join(workDir, "context-discover.json");
  writeResult({ ...args, out: outPath }, {
    ok: true,
    operation: "discover",
    workDir,
    path: outPath,
    intakePath,
    issueKey: issue.id,
    referencedIssueKeys,
    urls: urlsFromText(haystack),
    documentHints: docHintsFromText(haystack),
    searchTerms: searchTerms(issue),
  });
} else {
  const relatedIssues = args.related.map((path) => normalizeIssue(readJson(path)));
  const documents = args.docs.map(summarizeDoc);
  const outPath = args.out || join(workDir, "context.json");
  writeResult({ ...args, out: outPath }, {
    ok: true,
    operation: "gather",
    workDir,
    path: outPath,
    intakePath,
    issue,
    referencedIssueKeys,
    relatedIssues,
    urls: urlsFromText(haystack),
    documentHints: docHintsFromText(haystack),
    documents,
    openQuestions: [],
    counts: {
      referencedIssueKeys: referencedIssueKeys.length,
      relatedIssues: relatedIssues.length,
      urls: urlsFromText(haystack).length,
      documentHints: docHintsFromText(haystack).length,
      documents: documents.length,
    },
  });
}
