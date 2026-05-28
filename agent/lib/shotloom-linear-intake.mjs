#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

function usage() {
  console.error(`Usage:
  shotloom-linear-intake.mjs detect <STL-NN|NN|linear-url> [--out <path>] [--out-dir <dir>] [--work-dir <dir>]
  shotloom-linear-intake.mjs create <title> [--problem <text>] [--ac <text>] [--affected <path>] [--priority P1|P2|P3|P4] [--label <name>] [--out <path>]
  shotloom-linear-intake.mjs get <STL-NN|NN|linear-url> --raw <path|-> [--out <path>] [--out-dir <dir>] [--work-dir <dir>]
  shotloom-linear-intake.mjs post <STL-NN|NN|linear-url> [--state <name>] [--assignee <login|me>] [--priority P1|P2|P3|P4] [--label <name>] [--out <path>] [--out-dir <dir>] [--work-dir <dir>]
  shotloom-linear-intake.mjs delete <STL-NN|NN|path> [--out-dir <dir>] [--work-dir <dir>]

Local JSON contracts for Shotloom Linear workflows. Linear MCP performs create,
get, save, and archive operations; this script builds payloads and normalizes
get_issue results.`);
}

function parseArgs(argv) {
  const [command, input, ...rest] = argv;
  const args = {
    command,
    input,
    out: "",
    outDir: "/tmp",
    workDir: "",
    raw: "",
    problem: "",
    priority: "",
    state: "",
    assignee: "",
    ac: [],
    affected: [],
    labels: [],
  };

  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    if (arg === "--out") args.out = rest[++i] || "";
    else if (arg === "--out-dir") args.outDir = rest[++i] || "";
    else if (arg === "--work-dir") args.workDir = rest[++i] || "";
    else if (arg === "--raw") args.raw = rest[++i] || "";
    else if (arg === "--problem") args.problem = rest[++i] || "";
    else if (arg === "--priority") args.priority = rest[++i] || "";
    else if (arg === "--state") args.state = rest[++i] || "";
    else if (arg === "--assignee") args.assignee = rest[++i] || "";
    else if (arg === "--ac") args.ac.push(rest[++i] || "");
    else if (arg === "--affected") args.affected.push(rest[++i] || "");
    else if (arg === "--label") args.labels.push(rest[++i] || "");
    else if (arg === "-h" || arg === "--help") {
      usage();
      process.exit(0);
    } else {
      usage();
      process.exit(2);
    }
  }

  if (!["detect", "create", "get", "post", "delete"].includes(command) || !input) {
    usage();
    process.exit(2);
  }
  if (command === "get" && !args.raw) {
    usage();
    process.exit(2);
  }

  return args;
}

function fail(message, detail = "", code = 1) {
  process.stdout.write(
    `${JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2)}\n`,
  );
  process.exit(code);
}

function issueKeyFromInput(input) {
  const value = String(input || "").trim();
  const match = value.match(/\bSTL-(\d+)\b/i) || value.match(/(?:^|[^\d])(\d+)(?:$|[^\d])/);
  if (!match) fail("unable to detect Linear issue key", value, 2);
  return `STL-${match[1]}`;
}

function defaultOutPath(issueKey, args) {
  return join(workDirFor(issueKey, args), "intake.json");
}

function workDirFor(issueKey, args) {
  return resolve(args.workDir || join(args.outDir || "/tmp", `shotloom-start-task-${issueKey}`));
}

function ensureWorkDir(issueKey, args) {
  const dir = workDirFor(issueKey, args);
  mkdirSync(dir, { recursive: true });
  return dir;
}

function pathFor(input, args) {
  if (input.endsWith(".json") || input.includes("/")) return resolve(input);
  const issueKey = issueKeyFromInput(input);
  ensureWorkDir(issueKey, args);
  return resolve(args.out || defaultOutPath(issueKey, args));
}

function intakePathFor(input, args) {
  if (input.endsWith(".json") || input.includes("/")) return resolve(input);
  const issueKey = issueKeyFromInput(input);
  ensureWorkDir(issueKey, args);
  return resolve(defaultOutPath(issueKey, args));
}

function readJsonSource(rawPath) {
  const text = rawPath === "-" ? readFileSync(0, "utf8") : readFileSync(rawPath, "utf8");
  try {
    return JSON.parse(text);
  } catch (error) {
    fail("unable to parse raw Linear JSON", error.message);
  }
}

function textField(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.name || value.title || value.displayName || "";
  return "";
}

function arrayNames(value) {
  if (!Array.isArray(value)) return [];
  return value.map(textField).filter(Boolean);
}

function normalize(raw, fallbackKey) {
  const source = raw.issue && typeof raw.issue === "object" ? raw.issue : raw;
  const id = source.identifier || source.id || source.key || fallbackKey;
  const description = source.description || source.body || "";
  const acceptanceCriteria =
    source.acceptanceCriteria ||
    source.acceptance_criteria ||
    extractAcceptanceCriteria(description);

  return {
    ok: true,
    issue: {
      id,
      title: source.title || source.name || "",
      state: textField(source.state || source.status),
      url: source.url || source.link || "",
      description,
      acceptanceCriteria,
      labels: arrayNames(source.labels),
      priority: source.priority ?? null,
      assignee: textField(source.assignee),
      project: textField(source.project),
      team: textField(source.team),
      createdAt: source.createdAt || null,
      updatedAt: source.updatedAt || null,
    },
    raw,
  };
}

function extractAcceptanceCriteria(description) {
  if (!description) return [];
  const lines = description.split(/\r?\n/);
  const start = lines.findIndex((line) => /acceptance criteria|수용 기준/i.test(line));
  if (start === -1) return [];
  const items = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,6}\s+\S/.test(line) && items.length > 0) break;
    const item = line.match(/^\s*(?:[-*]|\d+[.)]|\[[ xX]\])\s+(.+?)\s*$/);
    if (item) items.push(item[1]);
  }
  return items;
}

function run(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if ((result.status ?? 1) !== 0) {
    fail(`command failed: ${command} ${args.join(" ")}`, result.stderr || result.stdout);
  }
  return result.stdout.trim();
}

function shotloomTemplateSource() {
  const scriptDir = dirname(fileURLToPath(import.meta.url));
  const resolver = join(scriptDir, "resolve-repo-path.mjs");
  const root = run("node", [resolver, "shotloom"]);
  const contributing = join(root, "CONTRIBUTING.md");
  if (!existsSync(contributing)) fail("Shotloom CONTRIBUTING.md not found", contributing);
  const text = readFileSync(contributing, "utf8");
  if (!text.includes("### Issue Authoring Policy")) {
    fail("Shotloom issue template source missing Issue Authoring Policy", contributing);
  }
  return {
    path: contributing,
    section: "Issue Authoring Policy",
  };
}

function bodyFromTemplate(args) {
  const ac = args.ac.length > 0 ? args.ac : ["<acceptance criterion>"];
  const affected = args.affected.length > 0 ? args.affected : ["<module-or-directory>"];
  return [
    "## 문제 정의",
    args.problem || "<문제 정의>",
    "",
    "## acceptance criteria",
    ...ac.map((item) => `- ${item}`),
    "",
    "## 영향 모듈/디렉터리",
    ...affected.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

function priorityValue(priority, fallback = null) {
  const map = { P1: 1, P2: 2, P3: 3, P4: 4 };
  const value = String(priority || "").toUpperCase();
  if (value in map) return map[value];
  if (fallback !== null) return fallback;
  fail("priority must be one of P1, P2, P3, P4", priority, 2);
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
  return path;
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "issue";
}

const args = parseArgs(process.argv.slice(2));

if (args.command === "detect") {
  const issueKey = issueKeyFromInput(args.input);
  const workDir = ensureWorkDir(issueKey, args);
  process.stdout.write(
    `${JSON.stringify({ ok: true, issueKey, workDir, path: resolve(args.out || defaultOutPath(issueKey, args)) }, null, 2)}\n`,
  );
} else if (args.command === "create") {
  const template = shotloomTemplateSource();
  const payload = {
    team: "Shotloom",
    project: "Shotloom - alpha",
    title: args.input,
    description: bodyFromTemplate(args),
    priority: priorityValue(args.priority, 3),
    labels: args.labels,
    assignee: "me",
  };
  const outPath = resolve(args.out || join(args.outDir, `shotloom-linear-create-${slug(args.input)}.json`));
  writeJson(outPath, { ok: true, operation: "create", template, payload });
  process.stdout.write(`${JSON.stringify({ ok: true, operation: "create", path: outPath, template }, null, 2)}\n`);
} else if (args.command === "get") {
  const issueKey = issueKeyFromInput(args.input);
  ensureWorkDir(issueKey, args);
  const outPath = pathFor(args.input, args);
  const record = normalize(readJsonSource(args.raw), issueKey);
  writeJson(outPath, record);
  process.stdout.write(`${JSON.stringify({ ok: true, operation: "get", issueKey: record.issue.id, path: outPath }, null, 2)}\n`);
} else if (args.command === "post") {
  const issueKey = issueKeyFromInput(args.input);
  const intakePath = intakePathFor(args.input, args);
  if (!existsSync(intakePath)) fail("intake file not found; run get before post", intakePath);
  const intake = readJsonSource(intakePath);
  const payload = {};
  if (args.state) payload.state = args.state;
  if (args.assignee) payload.assignee = args.assignee;
  if (args.priority) payload.priority = priorityValue(args.priority);
  if (args.labels.length > 0) payload.labels = args.labels;
  const outPath = resolve(args.out || join(args.outDir, `shotloom-linear-post-${issueKey}.json`));
  writeJson(outPath, {
    ok: true,
    operation: "post",
    issueKey,
    baseUpdatedAt: intake.issue?.updatedAt || null,
    payload,
  });
  process.stdout.write(`${JSON.stringify({ ok: true, operation: "post", issueKey, path: outPath }, null, 2)}\n`);
} else if (args.command === "delete") {
  const outPath = pathFor(args.input, args);
  if (!existsSync(outPath)) fail("intake file not found", outPath);
  rmSync(outPath);
  process.stdout.write(`${JSON.stringify({ ok: true, operation: "delete", deleted: outPath }, null, 2)}\n`);
}
