#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveLocalArtifactPath } from "../agent/lib/resolve-local-artifact-path.mjs";
import { gitRoot } from "./worktree-lib.mjs";

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

function tableCell(value) {
  return String(value || "").replaceAll("|", "/").replace(/\s+/g, " ").trim();
}

function titleFromArgs(args) {
  return args.title || args.summary.split(/[.!?。]/)[0].trim().slice(0, 80) || "Operational finding";
}

function reportSlug(value) {
  const maxLength = 72;
  const words = String(value || "finding")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter(Boolean);
  let slug = "";
  for (const word of words) {
    const next = slug ? `${slug}-${word}` : word;
    if (next.length > maxLength) break;
    slug = next;
  }
  return slug || "finding";
}

function reportBody(args, reportTitle, findingId) {
  const date = today();
  const fastTrack = args.urgent ? "yes" : "no";
  return `---
status: captured
created: ${date}
updated: ${date}
finding-id: ${findingId}
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
- Done When: finding is promoted, resolved, assetized, parked, or discarded.
- Possible destination: unknown

## Status

- Current State: captured
- Fast Track: ${fastTrack}
`;
}

function initialInboxBody() {
  return `# Operational Findings Inbox

Local Knitten-wide temporary intake index for operational findings.

Detailed report context lives under \`reports/\`.

| ID | Date | Report | Initial Source | Area | Context | Summary | Status |
|----|------|--------|----------------|------|---------|---------|--------|
`;
}

function resolvePath(root, args, { create = false } = {}) {
  return resolveLocalArtifactPath({ root, create, args });
}

async function ensureInbox(root, date) {
  const inbox = resolvePath(root, ["ah", "operational-findings", date, "inbox"], { create: true });
  if (!existsSync(inbox.absolutePath)) {
    await writeFile(inbox.absolutePath, initialInboxBody());
  }
  return inbox;
}

async function resolveReportPath(root, title, { dryRun = false, date = today() } = {}) {
  const baseSlug = reportSlug(title);
  for (let suffix = 0; suffix < 100; suffix++) {
    const slug = `${baseSlug}${suffix === 0 ? "" : `-${suffix + 1}`}`;
    const resolved = resolvePath(root, ["ah", "operational-findings", date, "report", slug], { create: !dryRun });
    if (!existsSync(resolved.absolutePath)) {
      return {
        absolute: resolved.absolutePath,
        repoRelative: resolved.path,
        inboxRelative: path.posix.join("reports", `${slug}.md`),
        findingId: `ah-of-${date.replaceAll("-", "")}-${slug}`,
      };
    }
  }
  throw new Error(`could not allocate report path for ${baseSlug}`);
}

async function appendInboxRow(inbox, args, report, date) {
  const row = `| ${report.findingId} | ${date} | \`${report.inboxRelative}\` | ${tableCell(args.source)} | ${tableCell(args.area)} | ${tableCell(args.context)} | ${tableCell(args.summary)} | captured |\n`;
  const current = await readFile(inbox.absolutePath, "utf8");
  await writeFile(inbox.absolutePath, current.endsWith("\n") ? current + row : `${current}\n${row}`);
}

async function capture(args) {
  const root = gitRoot(process.cwd());
  const date = today();
  const title = titleFromArgs(args);
  const report = await resolveReportPath(root, title, { dryRun: args.dryRun, date });
  const body = reportBody(args, title, report.findingId);
  const inbox = resolvePath(root, ["ah", "operational-findings", date, "inbox"]);

  if (args.dryRun) {
    console.log(`would write: ${report.repoRelative}`);
    console.log(`would update: ${inbox.path}`);
    console.log(`finding-id: ${report.findingId}`);
    return;
  }

  const ensuredInbox = await ensureInbox(root, date);
  await writeFile(report.absolute, body);
  await appendInboxRow(ensuredInbox, args, report, date);
  console.log(`report: ${report.repoRelative}`);
  console.log(`inbox: ${ensuredInbox.path}`);
  console.log(`finding-id: ${report.findingId}`);
  console.log(`cleanup: ${path.posix.dirname(ensuredInbox.path)}`);
}

async function main() {
  await capture(parseArgs(process.argv.slice(2)));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
