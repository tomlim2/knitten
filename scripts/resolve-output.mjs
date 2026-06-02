#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PLUGIN_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function parseArgs(argv) {
  const args = {
    create: false,
    kind: "",
    name: "",
    skill: "",
    targetRoot: "",
    workspaceRoot: process.cwd(),
  };

  for (const arg of argv) {
    if (arg === "--create") {
      args.create = true;
    } else if (arg.startsWith("--kind=")) {
      args.kind = arg.slice("--kind=".length);
    } else if (arg.startsWith("--name=")) {
      args.name = arg.slice("--name=".length);
    } else if (arg.startsWith("--skill=")) {
      args.skill = arg.slice("--skill=".length);
    } else if (arg.startsWith("--target-root=")) {
      args.targetRoot = arg.slice("--target-root=".length);
    } else if (arg.startsWith("--workspace-root=")) {
      args.workspaceRoot = arg.slice("--workspace-root=".length);
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  return `Usage:
  resolve-output.mjs [--workspace-root=<path>] [--target-root=<path>] [--skill=<skill>] [--kind=<kind>] [--name=<name>] [--create]

Prints Knitten plugin, workspace, and selected output destinations as JSON.

Skill defaults:
  ah-draft-spec -> spec
  ah-add-design-plan -> design-plan
  ah-review-spec -> review-json
  ah-review-pr -> review-json
  ah-review-implementation -> review-json
  ah-respond-pr -> response-json
  ah-report-finding -> operational-finding-json

Kinds:
  spec        docs/specs/<name>.md
  design-plan docs/design-plans/<name>.md
  temp-json   .agent-local/ah/json/<name>.json
  review-json .agent-local/ah/reviews/<name>.json
  response-json .agent-local/ah/responses/<name>.json
  operational-finding-json .agent-local/ah/operational-findings/<YYYY-MM-DD>/<name>.json
  report-md   .agent-local/ah/reports/<name>.md
  report-html .agent-local/ah/reports/<name>.html
  pull-request-json .agent-local/ah/pull-requests/<name>.json
  task-json   .agent-local/ah/tasks/<name>.json`;
}

function samePath(left, right) {
  return path.resolve(left) === path.resolve(right);
}

function slugifyName(value) {
  const slug = String(value)
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) {
    throw new Error("--name must contain at least one letter, number, dot, underscore, or hyphen");
  }
  return slug;
}

function localDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function selectedPathFor({ kind, name, workspaceRoot, workspaceLocalRoot, targetRoot, targetLocalRoot }) {
  if (!kind) return null;
  if (!String(name || "").trim()) {
    throw new Error("--name is required when --kind or --skill selects an output file");
  }

  const slug = slugifyName(name);
  const today = localDateString();
  const paths = {
    "spec": path.join(targetRoot, "docs", "specs", `${slug}.md`),
    "design-plan": path.join(targetRoot, "docs", "design-plans", `${slug}.md`),
    "temp-json": path.join(workspaceLocalRoot, "json", `${slug}.json`),
    "review-json": path.join(workspaceLocalRoot, "reviews", `${slug}.json`),
    "response-json": path.join(workspaceLocalRoot, "responses", `${slug}.json`),
    "operational-finding-json": path.join(targetLocalRoot, "operational-findings", today, `${slug}.json`),
    "report-md": path.join(workspaceLocalRoot, "reports", `${slug}.md`),
    "report-html": path.join(workspaceLocalRoot, "reports", `${slug}.html`),
    "pull-request-json": path.join(workspaceLocalRoot, "pull-requests", `${slug}.json`),
    "task-json": path.join(workspaceLocalRoot, "tasks", `${slug}.json`),
  };

  if (!Object.hasOwn(paths, kind)) {
    throw new Error(`unknown kind: ${kind}`);
  }

  return paths[kind];
}

function ownerRootFor(kind, { workspaceRoot, targetRoot }) {
  if (!kind) return null;
  const targetOwnedKinds = new Set(["spec", "design-plan", "operational-finding-json"]);
  return targetOwnedKinds.has(kind) ? targetRoot : workspaceRoot;
}

function persistenceFor(kind) {
  if (!kind) return null;
  const durableKinds = new Set(["spec", "design-plan"]);
  return durableKinds.has(kind) ? "durable" : "local";
}

function kindForSkill(skill) {
  if (!skill) return "";

  const skillKinds = {
    "ah-draft-spec": "spec",
    "ah-add-design-plan": "design-plan",
    "ah-review-spec": "review-json",
    "ah-review-pr": "review-json",
    "ah-review-implementation": "review-json",
    "ah-respond-pr": "response-json",
    "ah-report-finding": "operational-finding-json",
  };

  if (!Object.hasOwn(skillKinds, skill)) {
    throw new Error(`unknown skill default: ${skill}`);
  }

  return skillKinds[skill];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const workspaceRoot = path.resolve(args.workspaceRoot);
  const targetRoot = path.resolve(args.targetRoot || workspaceRoot);
  const workspaceLocalRoot = path.join(workspaceRoot, ".agent-local", "ah");
  const targetLocalRoot = path.join(targetRoot, ".agent-local", "ah");
  const docsRoot = path.join(targetRoot, "docs");
  const specsRoot = path.join(docsRoot, "specs");
  const designPlansRoot = path.join(docsRoot, "design-plans");
  const tempJsonRoot = path.join(workspaceLocalRoot, "json");
  const responseJsonRoot = path.join(workspaceLocalRoot, "responses");
  const operationalFindingsRoot = path.join(targetLocalRoot, "operational-findings");
  if (args.kind && args.skill) {
    throw new Error("use either --kind or --skill, not both");
  }
  const selectedKind = args.kind || kindForSkill(args.skill);
  const selectedPath = selectedPathFor({
    kind: selectedKind,
    name: args.name,
    workspaceRoot,
    workspaceLocalRoot,
    targetRoot,
    targetLocalRoot,
  });
  const selectedDir = selectedPath ? path.dirname(selectedPath) : workspaceLocalRoot;
  const selectedPersistence = persistenceFor(selectedKind);
  const selectedOwnerRoot = ownerRootFor(selectedKind, { workspaceRoot, targetRoot });

  if (args.create) {
    fs.mkdirSync(selectedDir, { recursive: true });
  }

  process.stdout.write(`${JSON.stringify({
    pluginRoot: PLUGIN_ROOT,
    workspaceRoot,
    workspaceLocalRoot,
    targetRoot,
    targetLocalRoot,
    docsRoot,
    specsRoot,
    designPlansRoot,
    tempJsonRoot,
    responseJsonRoot,
    operationalFindingsRoot,
    selectedSkill: args.skill || null,
    selectedKind: selectedKind || null,
    selectedName: args.name || null,
    selectedPath,
    selectedDir,
    selectedOwnerRoot,
    selectedPersistence,
    isPluginWorkspace: samePath(PLUGIN_ROOT, workspaceRoot),
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
