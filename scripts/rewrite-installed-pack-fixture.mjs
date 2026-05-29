#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : null;
if (!root) {
  console.error("usage: node scripts/rewrite-installed-pack-fixture.mjs <fixture-temp-root>");
  process.exit(2);
}

const replacements = {
  __FIXTURE_ROOT__: root,
  __PACK_SOURCE__: path.join(root, "pack-source"),
  __REGISTRY__: path.join(root, "registry.json"),
  __HARNESS_TARGET__: path.join(root, "harness-target"),
  __LINK_TARGET__: path.join(root, "harness-target", "skills", "demo-skill"),
};

async function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function rewriteText(text) {
  let out = text;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(token).join(value);
  }
  return out;
}

async function ensurePackSource() {
  const packSource = replacements.__PACK_SOURCE__;
  const manifest = path.join(packSource, "artifact-pack.json");
  if (existsSync(manifest)) return;
  await fs.mkdir(path.join(packSource, "skills", "demo-skill"), { recursive: true });
  await fs.writeFile(manifest, `${JSON.stringify({
    "schema-version": 1,
    "pack-id": "fixture-pack",
    "display-name": "Fixture Pack",
    version: "1.0.0",
    visibility: "public",
    "owner-domain": "domain",
    description: "Installed pack lifecycle fixture.",
    exports: [{
      "artifact-id": "demo-skill",
      "artifact-type": "skill",
      path: "skills/demo-skill",
      shape: "directory",
      mount: { layer: "skills", target: "demo-skill", mode: "link" },
      entrypoint: "skills/demo-skill/SKILL.md",
      load: "on-demand",
      dependencies: ["core:manifest-schema"],
      "privacy-risk": "public-safe",
      platforms: ["all"],
    }],
  }, null, 2)}\n`);
  await fs.writeFile(path.join(packSource, "skills", "demo-skill", "SKILL.md"), "---\ndescription: Installed pack lifecycle fixture skill.\n---\n\n# demo-skill\n\nFixture body.\n");
}

async function main() {
  if (!root.startsWith(os.tmpdir())) {
    console.error("fixture rewrite root must be under the system temp directory");
    process.exit(1);
  }
  await fs.mkdir(root, { recursive: true });
  await ensurePackSource();
  for (const file of await walk(root)) {
    const text = await fs.readFile(file, "utf8");
    const next = rewriteText(text);
    if (next !== text) await fs.writeFile(file, next);
  }
  await fs.mkdir(path.dirname(replacements.__LINK_TARGET__), { recursive: true });
  if (root.includes("link-non-owned-symlink")) {
    const nonOwnedTarget = path.join(root, "non-owned-source");
    await fs.writeFile(nonOwnedTarget, "non-owned\n");
    try {
      await fs.symlink(nonOwnedTarget, replacements.__LINK_TARGET__);
    } catch (err) {
      if (err.code !== "EEXIST") throw err;
    }
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
