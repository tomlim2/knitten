#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  currentBranch,
  gitRoot,
  isClean,
  runGit,
  slugify,
  statusPorcelain,
  tryGit,
} from "./worktree-lib.mjs";

const FINDINGS_BRANCH = "operational-findings";
const INBOX_PATH = "docs/briefings/operational-findings-inbox.md";
const REPORT_DIR = "docs/briefings/operational-findings/reports";
const AREA_VALUES = new Set(["skill", "rule", "standard", "validator", "docs", "config", "workflow", "routing", "ux", "other", "unknown"]);

function parseArgs(argv) {
  const args = {
    title: null,
    summary: null,
    source: "user-report",
    area: "unknown",
    context: "general",
    evidence: "",
    urgent: false,
    dryRun: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "capture") continue;
    if (arg === "--title") args.title = argv[++i];
    else if (arg.startsWith("--title=")) args.title = arg.slice("--title=".length);
    else if (arg === "--summary") args.summary = argv[++i];
    else if (arg.startsWith("--summary=")) args.summary = arg.slice("--summary=".length);
    else if (arg === "--source") args.source = argv[++i];
    else if (arg.startsWith("--source=")) args.source = arg.slice("--source=".length);
    else if (arg === "--area") args.area = argv[++i];
    else if (arg.startsWith("--area=")) args.area = arg.slice("--area=".length);
    else if (arg === "--context") args.context = argv[++i];
    else if (arg.startsWith("--context=")) args.context = arg.slice("--context=".length);
    else if (arg === "--evidence") args.evidence = argv[++i];
    else if (arg.startsWith("--evidence=")) args.evidence = arg.slice("--evidence=".length);
    else if (arg === "--urgent") args.urgent = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  if (!args.summary) throw new Error("--summary is required");
  if (!AREA_VALUES.has(args.area)) throw new Error(`--area must be one of ${[...AREA_VALUES].join("|")}`);
  return args;
}

function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function datestamp() {
  return today().replaceAll("-", "");
}

function tableCell(value) {
  return String(value || "").replaceAll("|", "/").replace(/\s+/g, " ").trim();
}

function titleFromArgs(args) {
  return args.title || args.summary.split(/[.!?。]/)[0].trim().slice(0, 80) || "Operational finding";
}

function reportBody(args, reportTitle) {
  const date = today();
  const fastTrack = args.urgent ? "yes" : "no";
  return `---
status: captured
created: ${date}
updated: ${date}
initial-source: ${args.source}
area: ${args.area}
contexts:
  - ${args.context}
promotion-target: unknown
urgent: ${args.urgent ? "true" : "false"}
---

# ${reportTitle}

## Summary

${args.summary}

## Observations

### 1. Initial capture

- Observed In: ${args.context}
- Rough Finding: ${args.summary}
- Why It Matters: <clarify during triage>
- Evidence: ${args.evidence || "<add evidence during triage>"}
- Follow-up Guess: <clarify during triage>
- Needs Clarification: yes

## Suggested Follow-up

- Next pass should clarify: root cause, owner, and promotion target.
- Problem: <clarify during triage>
- Likely Scope: ${args.area}
- Done When: finding is promoted, merged, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: ${fastTrack}
`;
}

function initialInboxBody() {
  return `# Operational Findings Inbox

Canonical Knitten-wide intake index for operational findings.

Detailed report context lives under \`${REPORT_DIR}/\`.

| Date | Report | Initial Source | Area | Context | Summary | Status |
|------|--------|----------------|------|---------|---------|--------|
`;
}

async function ensureInbox(root) {
  const inbox = path.join(root, INBOX_PATH);
  if (!existsSync(inbox)) {
    await mkdir(path.dirname(inbox), { recursive: true });
    await writeFile(inbox, initialInboxBody());
  }
}

async function resolveReportPath(root, title, { dryRun = false } = {}) {
  const baseSlug = slugify(title);
  const dir = path.join(root, REPORT_DIR);
  if (!dryRun) {
    await mkdir(dir, { recursive: true });
  }
  for (let suffix = 0; suffix < 100; suffix++) {
    const name = `${datestamp()}-${baseSlug}${suffix === 0 ? "" : `-${suffix + 1}`}.md`;
    const absolute = path.join(dir, name);
    if (!existsSync(absolute)) {
      return {
        absolute,
        repoRelative: `${REPORT_DIR}/${name}`,
        inboxRelative: `operational-findings/reports/${name}`,
      };
    }
  }
  throw new Error(`could not allocate report path for ${baseSlug}`);
}

async function appendInboxRow(root, args, report) {
  const inbox = path.join(root, INBOX_PATH);
  const row = `| ${today()} | \`${report.inboxRelative}\` | ${tableCell(args.source)} | ${tableCell(args.area)} | ${tableCell(args.context)} | ${tableCell(args.summary)} | captured |\n`;
  const current = await readFile(inbox, "utf8");
  await writeFile(inbox, current.endsWith("\n") ? current + row : `${current}\n${row}`);
}

function changedFiles(root) {
  const result = tryGit(["status", "--porcelain"], { cwd: root });
  if (!result.ok) return [];
  return result.stdout
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean);
}

function assertOnlyAllowedFiles(root, reportPath) {
  const allowed = new Set([INBOX_PATH, reportPath]);
  const changed = changedFiles(root);
  const unexpected = changed.filter((file) => !allowed.has(file));
  if (unexpected.length > 0) {
    throw new Error(`unexpected files changed; refusing commit:\n${unexpected.join("\n")}`);
  }
}

async function capture(args) {
  const root = gitRoot(process.cwd());
  if (!args.dryRun && currentBranch(root) !== FINDINGS_BRANCH) {
    throw new Error(`run capture from ${FINDINGS_BRANCH} branch`);
  }
  if (!args.dryRun && !isClean(root)) {
    throw new Error(`findings worktree is dirty before capture:\n${statusPorcelain(root)}`);
  }

  if (!args.dryRun) {
    runGit(["pull", "--ff-only"], { cwd: root, stdio: "inherit" });
  }
  const title = titleFromArgs(args);
  const report = await resolveReportPath(root, title, { dryRun: args.dryRun });
  const body = reportBody(args, title);

  if (args.dryRun) {
    console.log(`would write: ${report.repoRelative}`);
    console.log(`would update: ${INBOX_PATH}`);
    console.log("would commit and push findings capture");
    return;
  }

  await ensureInbox(root);
  await writeFile(report.absolute, body);
  await appendInboxRow(root, args, report);
  assertOnlyAllowedFiles(root, report.repoRelative);
  runGit(["add", INBOX_PATH, report.repoRelative], { cwd: root, stdio: "inherit" });
  runGit(["commit", "-m", `docs: capture operational finding ${path.basename(report.repoRelative, ".md")}`], {
    cwd: root,
    stdio: "inherit",
  });
  runGit(["push"], { cwd: root, stdio: "inherit" });
  const commit = runGit(["rev-parse", "--short", "HEAD"], { cwd: root });
  console.log(`report: ${report.repoRelative}`);
  console.log(`commit: ${commit}`);
}

async function main() {
  await capture(parseArgs(process.argv.slice(2)));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
