#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLUGIN_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REGISTRY_PATH = path.join(PLUGIN_ROOT, "agent", "config", "agent-profiles.json");
const PROFILE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REQUIRED_FALLBACKS = [
  "modelUnavailable",
  "perAgentModelSelectionUnavailable",
  "sandboxUnavailable",
  "subagentsUnavailable",
];

function usage() {
  return `Usage:
  resolve-agent-profile.mjs <profile-id>
  resolve-agent-profile.mjs --list

Resolves Knitten Core-owned agent model, reasoning, sandbox, and fallback policy.`;
}

function readRegistry() {
  const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
  const problems = [];
  if (registry.schemaVersion !== 1) problems.push("schemaVersion must be 1");
  if (registry.owner !== "knitten-core") problems.push("owner must be knitten-core");
  if (!Array.isArray(registry.profiles) || registry.profiles.length === 0) {
    problems.push("profiles must be a non-empty array");
  }

  const ids = new Set();
  for (const profile of registry.profiles || []) {
    const label = profile?.id || "<missing id>";
    if (!PROFILE_ID.test(String(profile?.id || ""))) problems.push(`${label}: invalid id`);
    if (ids.has(profile?.id)) problems.push(`${label}: duplicate id`);
    ids.add(profile?.id);
    for (const field of ["purpose", "model", "model_reasoning_effort", "sandbox_mode"]) {
      if (typeof profile?.[field] !== "string" || !profile[field].trim()) {
        problems.push(`${label}: ${field} must be a non-empty string`);
      }
    }
    for (const field of REQUIRED_FALLBACKS) {
      if (typeof profile?.fallback?.[field] !== "string" || !profile.fallback[field].trim()) {
        problems.push(`${label}: fallback.${field} must be a non-empty string`);
      }
    }
    if (profile?.recordRequestedAndEffective !== true) {
      problems.push(`${label}: recordRequestedAndEffective must be true`);
    }
  }
  if (problems.length) throw new Error(`invalid agent profile registry: ${problems.join("; ")}`);
  return registry;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1 || args[0] === "-h" || args[0] === "--help") {
    process.stdout.write(`${usage()}\n`);
    process.exit(args[0] === "-h" || args[0] === "--help" ? 0 : 2);
  }

  const registry = readRegistry();
  if (args[0] === "--list") {
    process.stdout.write(`${JSON.stringify({
      ok: true,
      schemaVersion: registry.schemaVersion,
      owner: registry.owner,
      registryPath: REGISTRY_PATH,
      profiles: registry.profiles,
    }, null, 2)}\n`);
    return;
  }

  const profile = registry.profiles.find((entry) => entry.id === args[0]);
  if (!profile) {
    throw new Error(`unknown agent profile: ${args[0]}`);
  }
  process.stdout.write(`${JSON.stringify({
    ok: true,
    schemaVersion: registry.schemaVersion,
    owner: registry.owner,
    registryPath: REGISTRY_PATH,
    profile,
  }, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
