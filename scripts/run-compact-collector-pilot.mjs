#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { resolveOutput } from "./resolve-registered-output.mjs";

const DEFAULT_PRESET = "knitten-health";
const RAW_KIND = "compact-collector-command-output";

function usage() {
  return `Usage:
  run-compact-collector-pilot.mjs [--run=<slug>] [--preset=knitten-health] [--command=<label::command>] [--next=<text>] [--cwd=<path>]

Runs a compact collector pilot: raw command output goes under the workflow run
artifact, while summary.md, handoff.json, and next.md carry compact state.

Examples:
  node scripts/run-compact-collector-pilot.mjs
  node scripts/run-compact-collector-pilot.mjs --run=knitten-health-pilot
  node scripts/run-compact-collector-pilot.mjs --command='status::git status --short --branch'`;
}

function fail(message, code = 2) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

function nowStamp() {
  return new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, "")
    .slice(0, 14);
}

function defaultRunId() {
  return `compact-${nowStamp()}`;
}

function cleanSlug(value, label) {
  const slug = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/[-_\\.]{2,}/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  if (!/^[a-z0-9][a-z0-9._-]*$/.test(slug)) {
    throw new Error(`${label} must resolve to a workflow-run slug`);
  }
  return slug;
}

function parseCommandToken(token, index) {
  const separator = token.indexOf("::");
  if (separator > 0) {
    return {
      label: cleanSlug(token.slice(0, separator), "command label"),
      command: token.slice(separator + 2).trim(),
    };
  }
  return {
    label: `command-${String(index + 1).padStart(2, "0")}`,
    command: token.trim(),
  };
}

function presetCommands(name) {
  if (name !== "knitten-health") {
    throw new Error(`unknown preset: ${name}`);
  }
  return [
    {
      label: "repository-shell",
      command: "node scripts/validate-repository-shell.mjs",
    },
    {
      label: "doctor",
      command: "node scripts/doctor.mjs",
    },
    {
      label: "context-load-smoke",
      command: "node scripts/run-context-load-smoke-eval.mjs",
    },
  ];
}

function parseArgs(argv) {
  const options = {
    run: null,
    preset: DEFAULT_PRESET,
    commandTokens: [],
    cwd: process.cwd(),
    next: null,
  };

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === "--run") {
      options.run = argv[++index];
    } else if (arg?.startsWith("--run=")) {
      options.run = arg.slice("--run=".length);
    } else if (arg === "--preset") {
      options.preset = argv[++index];
    } else if (arg?.startsWith("--preset=")) {
      options.preset = arg.slice("--preset=".length);
    } else if (arg === "--command") {
      options.commandTokens.push(argv[++index]);
    } else if (arg?.startsWith("--command=")) {
      options.commandTokens.push(arg.slice("--command=".length));
    } else if (arg === "--cwd") {
      options.cwd = argv[++index];
    } else if (arg?.startsWith("--cwd=")) {
      options.cwd = arg.slice("--cwd=".length);
    } else if (arg === "--next") {
      options.next = argv[++index];
    } else if (arg?.startsWith("--next=")) {
      options.next = arg.slice("--next=".length);
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  const commands = options.commandTokens.length > 0
    ? options.commandTokens.map(parseCommandToken)
    : presetCommands(options.preset);
  for (const command of commands) {
    if (!command.command) throw new Error(`empty command for ${command.label}`);
  }

  return {
    runId: cleanSlug(options.run || defaultRunId(), "run"),
    preset: options.commandTokens.length > 0 ? null : options.preset,
    commands,
    cwd: path.resolve(options.cwd),
    next: options.next,
  };
}

function resolveRunArtifacts(runId, cwd) {
  const values = { slug: runId };
  const resolve = (id) => resolveOutput({ id, values, create: true, cwd });
  return {
    root: resolve("workflow-run-root"),
    raw: resolve("workflow-run-raw-dir"),
    summary: resolve("workflow-run-summary-md"),
    handoff: resolve("workflow-run-handoff-json"),
    next: resolve("workflow-run-next-md"),
  };
}

function runCommand(command, cwd) {
  const startedAt = new Date();
  const result = spawnSync(command, {
    cwd,
    shell: true,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 50 * 1024 * 1024,
  });
  const endedAt = new Date();
  return {
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMs: endedAt.getTime() - startedAt.getTime(),
    exitCode: result.status,
    signal: result.signal,
    error: result.error ? result.error.message : null,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
  };
}

function writeRawResult(rawDir, runId, command, index, result) {
  const step = String(index + 1).padStart(3, "0");
  const rawPath = path.join(rawDir.absolutePath, `${step}-${command.label}.json`);
  const payload = {
    schemaVersion: 1,
    kind: RAW_KIND,
    runId,
    step: index + 1,
    label: command.label,
    command: command.command,
    cwd: result.cwd,
    startedAt: result.startedAt,
    endedAt: result.endedAt,
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    signal: result.signal,
    error: result.error,
    stdout: result.stdout,
    stderr: result.stderr,
  };
  writeFileSync(rawPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return rawPath;
}

function relativeToRunRoot(artifacts, absolutePath) {
  return path.relative(artifacts.root.absolutePath, absolutePath);
}

function commandStatus(result) {
  return result.exitCode === 0 && !result.error ? "pass" : "fail";
}

function compactLine(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}

function buildNextAction(failed, explicitNext) {
  if (explicitNext) return explicitNext;
  if (failed.length > 0) {
    return `Inspect failed raw evidence for: ${failed.map((item) => item.label).join(", ")}.`;
  }
  return "Use summary.md and handoff.json as compact context for the next workflow step.";
}

function writeSummary(artifacts, runId, preset, cwd, commandResults, nextAction) {
  const passed = commandResults.filter((item) => item.status === "pass").length;
  const status = passed === commandResults.length ? "pass" : "fail";
  const lines = [
    `# Compact Collector Run: ${runId}`,
    "",
    `Status: ${status}`,
    `Preset: ${preset || "custom"}`,
    `Working directory: ${cwd}`,
    `Raw evidence: ${artifacts.raw.path}`,
    "",
    "| Step | Label | Result | Raw Evidence |",
    "|------|-------|--------|--------------|",
  ];

  for (const item of commandResults) {
    lines.push(
      `| ${item.step} | \`${item.label}\` | ${item.status} | \`${item.rawPathRelative}\` |`,
    );
  }

  const failed = commandResults.filter((item) => item.status !== "pass");
  if (failed.length > 0) {
    lines.push("", "## Failed Commands", "");
    for (const item of failed) {
      const detail = compactLine(item.stderr || item.stdout || item.error || "No stderr/stdout captured.");
      lines.push(`- \`${item.label}\`: ${detail}`);
    }
  }

  lines.push("", "## Next", "", nextAction, "");
  writeFileSync(artifacts.summary.absolutePath, lines.join("\n"), "utf8");
}

function writeHandoff(artifacts, runId, preset, cwd, commandResults, nextAction) {
  const passed = commandResults.filter((item) => item.status === "pass").length;
  const status = passed === commandResults.length ? "pass" : "fail";
  const payload = {
    schemaVersion: 1,
    kind: "compact-collector-handoff",
    runId,
    status,
    preset,
    cwd,
    generatedAt: new Date().toISOString(),
    artifacts: {
      root: artifacts.root.path,
      raw: artifacts.raw.path,
      summary: artifacts.summary.path,
      handoff: artifacts.handoff.path,
      next: artifacts.next.path,
    },
    commands: commandResults.map((item) => ({
      step: item.step,
      label: item.label,
      command: item.command,
      status: item.status,
      exitCode: item.exitCode,
      rawPath: item.rawPathRelative,
      durationMs: item.durationMs,
    })),
    nextAction,
  };
  writeFileSync(artifacts.handoff.absolutePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function writeNext(artifacts, nextAction) {
  writeFileSync(artifacts.next.absolutePath, `${nextAction}\n`, "utf8");
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error.message);
  }

  const artifacts = resolveRunArtifacts(options.runId, options.cwd);
  mkdirSync(artifacts.raw.absolutePath, { recursive: true });

  const commandResults = options.commands.map((command, index) => {
    const result = runCommand(command.command, options.cwd);
    result.cwd = options.cwd;
    const rawPath = writeRawResult(artifacts.raw, options.runId, command, index, result);
    const rawPathRelative = relativeToRunRoot(artifacts, rawPath);
    return {
      step: index + 1,
      label: command.label,
      command: command.command,
      status: commandStatus(result),
      exitCode: result.exitCode,
      error: result.error,
      stderr: result.stderr,
      stdout: result.stdout,
      durationMs: result.durationMs,
      rawPath,
      rawPathRelative,
    };
  });

  const failed = commandResults.filter((item) => item.status !== "pass");
  const nextAction = buildNextAction(failed, options.next);
  writeSummary(artifacts, options.runId, options.preset, options.cwd, commandResults, nextAction);
  writeHandoff(artifacts, options.runId, options.preset, options.cwd, commandResults, nextAction);
  writeNext(artifacts, nextAction);

  const compact = {
    ok: failed.length === 0,
    runId: options.runId,
    preset: options.preset || "custom",
    status: failed.length === 0 ? "pass" : "fail",
    summary: `${commandResults.length - failed.length}/${commandResults.length} commands passed`,
    artifacts: {
      summary: artifacts.summary.path,
      handoff: artifacts.handoff.path,
      next: artifacts.next.path,
      raw: artifacts.raw.path,
    },
    failed: failed.map((item) => ({
      label: item.label,
      exitCode: item.exitCode,
      rawPath: item.rawPathRelative,
    })),
  };
  process.stdout.write(`${JSON.stringify(compact, null, 2)}\n`);
  if (failed.length > 0) process.exitCode = 1;
}

main();
