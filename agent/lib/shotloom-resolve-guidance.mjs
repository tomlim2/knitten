#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function argValue(name) {
  const prefix = `${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function runGit(args, cwd) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function configuredShotloomRoot() {
  try {
    const output = execFileSync(
      "node",
      [path.join(scriptDir, "resolve-repo-path.mjs"), "shotloom"],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();
    const match = output.match(/^RESOLVED_PATH=(.+)$/m);
    const resolved = match ? match[1] : output.split(/\r?\n/).find(Boolean);
    return resolved ? path.resolve(resolved) : "";
  } catch {
    return "";
  }
}

function isShotloomRoot(root) {
  const remote = runGit(["remote", "get-url", "origin"], root);
  return /(^|[:/])CINEV\/shotloom(\.git)?$/.test(remote);
}

function repoRoot() {
  const explicit = argValue("--repo");
  if (explicit) {
    const root = path.resolve(explicit);
    if (isShotloomRoot(root)) return root;
    console.error(`ERROR: --repo is not a Shotloom checkout: ${root}`);
    process.exit(1);
  }
  const cwdRoot = runGit(["rev-parse", "--show-toplevel"], process.cwd());
  if (cwdRoot && isShotloomRoot(cwdRoot)) return cwdRoot;
  const configuredRoot = configuredShotloomRoot();
  if (configuredRoot && isShotloomRoot(configuredRoot)) return configuredRoot;
  console.error("ERROR: cannot resolve configured Shotloom checkout");
  process.exit(1);
}

function diffFiles(root) {
  const diff = runGit(["diff", "--name-only", "origin/main...HEAD"], root);
  return diff ? diff.split("\n").filter(Boolean) : [];
}

function collectPaths(value, paths = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectPaths(item, paths));
    return paths;
  }
  if (!value || typeof value !== "object") return paths;
  for (const [key, child] of Object.entries(value)) {
    if (
      typeof child === "string" &&
      ["file", "path", "source", "target"].includes(key)
    ) {
      paths.push(child);
    } else {
      collectPaths(child, paths);
    }
  }
  return paths;
}

function inputNames(root, input) {
  if (!input) return [];
  if ([".", "branch-diff", "origin/main...HEAD"].includes(input)) return [];
  const absolute = path.isAbsolute(input) ? input : path.join(root, input);
  if (input.endsWith(".json") && existsSync(absolute)) {
    try {
      return collectPaths(JSON.parse(readFileSync(absolute, "utf8")));
    } catch {
      return [];
    }
  }
  if (input.endsWith(".md") && existsSync(absolute)) {
    const text = readFileSync(absolute, "utf8");
    return Array.from(
      text.matchAll(
        /\b(?:apps|crates|docs|tests)\/[A-Za-z0-9._/@-]+\.(?:rs|ts|tsx|js|jsx|md|json)\b/g,
      ),
      (match) => match[0],
    );
  }
  if (/\.(rs|ts|tsx|js|jsx|md|json)$/.test(input)) {
    return [input];
  }
  return [input];
}

function detectSurfaces(files, input, root) {
  const requested = argValue("--surface");
  if (requested === "mixed") return ["rust", "ts", "bridge", "docs"];
  if (requested) return requested.split(",").map((item) => item.trim()).filter(Boolean);
  const explicitNames = inputNames(root, input);
  const names = explicitNames.length > 0 ? explicitNames : files;
  const has = (test) => names.some(test);
  const surfaces = [];
  if (has((name) => name.includes("bridge") || name.includes("ipc"))) {
    surfaces.push("bridge");
  }
  if (has((name) => name.endsWith(".rs") || name.includes("/crates/"))) {
    surfaces.push("rust");
  }
  if (has((name) => /\.(ts|tsx|js|jsx)$/.test(name))) {
    surfaces.push("ts");
  }
  if (has((name) => /\.(md|mdx)$/.test(name) || name.startsWith("docs/"))) {
    surfaces.push("docs");
  }
  if (has((name) => /(^|\/)(tests?|__tests__)\//.test(name))) {
    surfaces.push("test");
  }
  return surfaces;
}

function existing(root, rels) {
  const seen = new Set();
  return rels
    .filter((rel) => !seen.has(rel) && seen.add(rel))
    .map((rel) => ({
      path: rel,
      exists: existsSync(path.join(root, rel)),
    }));
}

function relevantAdrs(root, files) {
  const adrDir = path.join(root, "docs/adr");
  if (!existsSync(adrDir)) return [];
  const crates = files
    .map((file) => file.match(/^crates\/([^/]+)/)?.[1])
    .filter(Boolean);
  const adrFiles = readdirSync(adrDir)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .map((name) => `docs/adr/${name}`);
  if (crates.length === 0) return [];
  return adrFiles.filter((rel) => {
    const lower = rel.toLowerCase();
    return crates.some((crateName) =>
      crateName
        .toLowerCase()
        .split("-")
        .some((part) => part.length > 3 && lower.includes(part)),
    );
  });
}

const root = repoRoot();
const input = argValue("--input");
const files = diffFiles(root);
const surfaces = detectSurfaces(files, input, root);
const surface =
  surfaces.length === 0 ? "unknown" : surfaces.length === 1 ? surfaces[0] : "mixed";
const base = ["AGENTS.md", "CONTRIBUTING.md", "WORKFLOW.md", "docs/adr/README.md"];
const profile = argValue("--profile");
const profileGuidance = {
  "review-code": [
    "docs/guidelines/code-review-guideline.md",
    "docs/guidelines/pr-guideline.md",
  ],
  "review-docs": [
    "docs/guidelines/pr-guideline.md",
    "docs/guidelines/commit-guideline.md",
    "docs/guidelines/documentation-standard.md",
    "docs/guidelines/adr-template.md",
    "docs/guidelines/code-review-guideline.md",
    "docs/guidelines/review-typescript.md",
    "package.json",
    "apps/editor/package.json",
    ".github/workflows/code.yml",
  ],
  "review-triad": [
    "docs/guidelines/code-review-guideline.md",
    "docs/guidelines/pr-guideline.md",
  ],
};
const reviewFindingGuidance = input.endsWith(".json")
  ? ["docs/guidelines/code-review-guideline.md"]
  : [];
const bySurface = {
  rust: [
    "docs/guidelines/error-handling.md",
    "docs/guidelines/review-rust.md",
    ...relevantAdrs(root, files),
  ],
  ts: [
    "docs/guidelines/review-typescript.md",
    "package.json",
    "apps/editor/package.json",
    ".github/workflows/code.yml",
  ],
  bridge: ["docs/ipc/bridge-contract.md", "docs/guidelines/review-typescript.md"],
  docs: ["docs/guidelines/documentation-standard.md"],
  test: [
    "docs/guidelines/review-typescript.md",
    "package.json",
    "apps/editor/package.json",
    ".github/workflows/code.yml",
  ],
};

const surfaceList = surfaces.flatMap((item) => bySurface[item] ?? []);
const guidance = existing(root, [
  ...base,
  ...(profileGuidance[profile] ?? []),
  ...reviewFindingGuidance,
  ...surfaceList,
]);
const output = {
  repo: root,
  profile,
  surface,
  surfaces,
  diffFiles: files,
  guidance,
  read: guidance.filter((item) => item.exists).map((item) => item.path),
  missing: guidance.filter((item) => !item.exists).map((item) => item.path),
};

console.log(JSON.stringify(output, null, 2));
