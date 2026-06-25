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
    hubRoot: "",
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
    } else if (arg.startsWith("--hub-root=")) {
      args.hubRoot = arg.slice("--hub-root=".length);
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
  resolve-output.mjs [--workspace-root=<path>] [--target-root=<path>] [--hub-root=<path>] [--skill=<skill>] [--kind=<kind>] [--name=<name>] [--create]

Prints Knitten plugin, workspace, and selected output destinations as JSON.

Skill defaults:
  kc-draft-spec -> spec
  kc-report-finding -> operational-finding-json
  kc-review-fix-loop -> review-json

Kinds:
  spec        <targetRoot>/docs/specs/<name>.md
  design-plan <targetRoot>/docs/design-plans/<name>.md
  temp-json   <hubRoot>/.agent-local/ah/json/<name>.json
  review-json <hubRoot>/.agent-local/ah/reviews/<name>.json
  operational-finding-json <hubRoot>/.agent-local/ah/operational-findings/<YYYY-MM-DD>/<name>.json
  report-md   <hubRoot>/.agent-local/ah/reports/<name>.md
  report-html <hubRoot>/.agent-local/ah/reports/<name>.html
  task-json   <hubRoot>/.agent-local/ah/tasks/<name>.json`;
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

function readJsonIfExists(file) {
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function hasKnittenManifest(root) {
  const manifestPath = path.join(root, ".codex-plugin", "plugin.json");
  if (!fs.existsSync(manifestPath)) return false;
  try {
    return readJsonIfExists(manifestPath)?.name === "knitten";
  } catch {
    return false;
  }
}

function resolveHubRoot(explicitHubRoot) {
  const candidateReaders = [
    () => explicitHubRoot,
    () => process.env.KNITTEN_HUB_ROOT,
    () => PLUGIN_ROOT,
  ];

  for (const readCandidate of candidateReaders) {
    const candidate = readCandidate();
    if (!String(candidate || "").trim()) continue;
    const hubRoot = path.resolve(candidate);
    if (hasKnittenManifest(hubRoot)) return hubRoot;
  }

  throw new Error(
    "could not resolve Knitten hub root; set --hub-root or KNITTEN_HUB_ROOT to a Knitten plugin root",
  );
}

function selectedPathFor({ kind, name, hubLocalRoot, targetRoot }) {
  if (!kind) return null;
  if (!String(name || "").trim()) {
    throw new Error("--name is required when --kind or --skill selects an output file");
  }

  const slug = slugifyName(name);
  const today = localDateString();
  const paths = {
    "spec": path.join(targetRoot, "docs", "specs", `${slug}.md`),
    "design-plan": path.join(targetRoot, "docs", "design-plans", `${slug}.md`),
    "temp-json": path.join(hubLocalRoot, "json", `${slug}.json`),
    "review-json": path.join(hubLocalRoot, "reviews", `${slug}.json`),
    "operational-finding-json": path.join(hubLocalRoot, "operational-findings", today, `${slug}.json`),
    "report-md": path.join(hubLocalRoot, "reports", `${slug}.md`),
    "report-html": path.join(hubLocalRoot, "reports", `${slug}.html`),
    "task-json": path.join(hubLocalRoot, "tasks", `${slug}.json`),
  };

  if (!Object.hasOwn(paths, kind)) {
    throw new Error(`unknown kind: ${kind}`);
  }

  return paths[kind];
}

function durableOwnerRootFor(kind, targetRoot) {
  if (!kind) return null;
  const targetOwnedKinds = new Set(["spec", "design-plan"]);
  return targetOwnedKinds.has(kind) ? targetRoot : null;
}

function persistenceFor(kind) {
  if (!kind) return null;
  const durableKinds = new Set(["spec", "design-plan"]);
  return durableKinds.has(kind) ? "durable" : "local";
}

function kindForSkill(skill) {
  if (!skill) return "";

  const skillKinds = {
    "kc-draft-spec": "spec",
    "kc-report-finding": "operational-finding-json",
    "kc-review-fix-loop": "review-json",
  };

  if (!Object.hasOwn(skillKinds, skill)) {
    throw new Error(`unknown skill default: ${skill}`);
  }

  return skillKinds[skill];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const hubRoot = resolveHubRoot(args.hubRoot);
  const workspaceRoot = path.resolve(args.workspaceRoot);
  const targetRoot = path.resolve(args.targetRoot || workspaceRoot);
  const hubLocalRoot = path.join(hubRoot, ".agent-local", "ah");
  const workspaceLocalRoot = path.join(workspaceRoot, ".agent-local", "ah");
  const targetLocalRoot = path.join(targetRoot, ".agent-local", "ah");
  const docsRoot = path.join(targetRoot, "docs");
  const specsRoot = path.join(docsRoot, "specs");
  const designPlansRoot = path.join(docsRoot, "design-plans");
  const tempJsonRoot = path.join(hubLocalRoot, "json");
  const responseJsonRoot = path.join(hubLocalRoot, "responses");
  const operationalFindingsRoot = path.join(hubLocalRoot, "operational-findings");
  if (args.kind && args.skill) {
    throw new Error("use either --kind or --skill, not both");
  }
  const selectedKind = args.kind || kindForSkill(args.skill);
  const selectedPath = selectedPathFor({
    kind: selectedKind,
    name: args.name,
    hubLocalRoot,
    targetRoot,
  });
  const selectedDir = selectedPath ? path.dirname(selectedPath) : hubLocalRoot;
  const selectedPersistence = persistenceFor(selectedKind);
  const selectedOwnerRoot = selectedPersistence === "local"
    ? hubRoot
    : durableOwnerRootFor(selectedKind, targetRoot);

  if (args.create) {
    fs.mkdirSync(selectedDir, { recursive: true });
  }

  process.stdout.write(`${JSON.stringify({
    pluginRoot: PLUGIN_ROOT,
    hubRoot,
    hubLocalRoot,
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
    selectedTargetRoot: targetRoot,
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
