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
  resolve-output.mjs [--workspace-root=<path>] [--skill=<skill>] [--kind=<kind>] [--name=<name>] [--create]

Prints Knitten plugin, workspace, and selected output destinations as JSON.

Skill defaults:
  ah-draft-spec -> spec
  ah-add-design-plan -> design-plan
  ah-review-spec -> review-json
  ah-review-pr -> review-json
  ah-review-implementation -> review-json
  ah-respond-pr -> temp-json
  ah-report-finding -> finding-json

Kinds:
  spec        docs/specs/<name>.md
  design-plan docs/design-plans/<name>.md
  temp-json   .agent-local/knitten/json/<name>.json
  review-json .agent-local/knitten/reviews/<name>.json
  finding-json .agent-local/knitten/findings/<name>.json
  report-md   .agent-local/knitten/reports/<name>.md
  report-html .agent-local/knitten/reports/<name>.html
  pull-request-json .agent-local/knitten/pull-requests/<name>.json
  task-json   .agent-local/knitten/tasks/<name>.json`;
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

function selectedPathFor({ kind, name, workspaceRoot, workspaceLocalRoot }) {
  if (!kind) return null;
  if (!String(name || "").trim()) {
    throw new Error("--name is required when --kind or --skill selects an output file");
  }

  const slug = slugifyName(name);
  const paths = {
    "spec": path.join(workspaceRoot, "docs", "specs", `${slug}.md`),
    "design-plan": path.join(workspaceRoot, "docs", "design-plans", `${slug}.md`),
    "temp-json": path.join(workspaceLocalRoot, "json", `${slug}.json`),
    "review-json": path.join(workspaceLocalRoot, "reviews", `${slug}.json`),
    "finding-json": path.join(workspaceLocalRoot, "findings", `${slug}.json`),
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
    "ah-respond-pr": "temp-json",
    "ah-report-finding": "finding-json",
  };

  if (!Object.hasOwn(skillKinds, skill)) {
    throw new Error(`unknown skill default: ${skill}`);
  }

  return skillKinds[skill];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const workspaceRoot = path.resolve(args.workspaceRoot);
  const workspaceLocalRoot = path.join(workspaceRoot, ".agent-local", "knitten");
  const docsRoot = path.join(workspaceRoot, "docs");
  const specsRoot = path.join(docsRoot, "specs");
  const designPlansRoot = path.join(docsRoot, "design-plans");
  const tempJsonRoot = path.join(workspaceLocalRoot, "json");
  if (args.kind && args.skill) {
    throw new Error("use either --kind or --skill, not both");
  }
  const selectedKind = args.kind || kindForSkill(args.skill);
  const selectedPath = selectedPathFor({
    kind: selectedKind,
    name: args.name,
    workspaceRoot,
    workspaceLocalRoot,
  });
  const selectedDir = selectedPath ? path.dirname(selectedPath) : workspaceLocalRoot;
  const selectedPersistence = persistenceFor(selectedKind);

  if (args.create) {
    fs.mkdirSync(selectedDir, { recursive: true });
  }

  process.stdout.write(`${JSON.stringify({
    pluginRoot: PLUGIN_ROOT,
    workspaceRoot,
    workspaceLocalRoot,
    docsRoot,
    specsRoot,
    designPlansRoot,
    tempJsonRoot,
    selectedSkill: args.skill || null,
    selectedKind: selectedKind || null,
    selectedName: args.name || null,
    selectedPath,
    selectedDir,
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
