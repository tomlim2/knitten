import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const DEFAULT_COPY_EXCLUDES = new Set([
  ".agent-local",
  ".git",
  ".DS_Store",
  "__pycache__",
  "node_modules",
]);
const BOOTSTRAP_RELATIVES = [
  "agent/config/agent-profiles.json",
  "scripts/plugin-source-files.mjs",
  "scripts/resolve-agent-profile.mjs",
];

function normalizedRelative(value) {
  return value.split(path.sep).join("/");
}

function isOmitted(relative, omitPrefixes) {
  return omitPrefixes.some((prefix) => relative === prefix || relative.startsWith(`${prefix}/`));
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function hasSymlinkComponent(root, target) {
  const relative = path.relative(root, target);
  if (!isInside(root, target)) return true;
  let current = root;
  for (const part of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}

function destinationFromLinkBody(value) {
  const body = value.trim();
  if (!body) return "";
  if (body.startsWith("<")) {
    let escaped = false;
    for (let index = 1; index < body.length; index += 1) {
      const character = body[index];
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === ">") {
        return body.slice(1, index).replace(/\\(.)/g, "$1");
      }
    }
    return "";
  }

  let escaped = false;
  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (/\s/.test(character)) {
      return body.slice(0, index).replace(/\\(.)/g, "$1");
    }
  }
  return body.replace(/\\(.)/g, "$1");
}

export function markdownLinkDestinations(markdown) {
  const destinations = [];
  let cursor = 0;
  while (cursor < markdown.length) {
    const start = markdown.indexOf("](", cursor);
    if (start === -1) break;
    let depth = 1;
    let escaped = false;
    let end = start + 2;
    for (; end < markdown.length; end += 1) {
      const character = markdown[end];
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    if (depth !== 0) {
      cursor = start + 2;
      continue;
    }
    const destination = destinationFromLinkBody(markdown.slice(start + 2, end));
    if (destination) destinations.push(destination);
    cursor = end + 1;
  }
  return destinations;
}

function directSkillReferences(root, tracked, copyExcludes) {
  const references = [];
  const realRoot = fs.realpathSync(root);
  for (const relative of tracked) {
    if (!/^skills\/[^/]+\/SKILL\.md$/.test(relative)) continue;
    const skillDirectory = path.dirname(relative);
    const skillRoot = path.resolve(root, skillDirectory);
    const realSkillRoot = fs.realpathSync(skillRoot);
    const body = fs.readFileSync(path.join(root, relative), "utf8");
    for (let target of markdownLinkDestinations(body)) {
      target = target.split("#", 1)[0];
      if (!target || path.isAbsolute(target) || /^[a-z][a-z\d+.-]*:/i.test(target)) continue;

      const absolute = path.resolve(skillRoot, target);
      if (!isInside(skillRoot, absolute) || !fs.existsSync(absolute)) continue;
      if (hasSymlinkComponent(root, absolute) || !fs.lstatSync(absolute).isFile()) continue;

      const realTarget = fs.realpathSync(absolute);
      if (!isInside(realRoot, realTarget) || !isInside(realSkillRoot, realTarget)) continue;
      const repoRelative = normalizedRelative(path.relative(root, absolute));
      if (repoRelative.split("/").some((part) => copyExcludes.has(part))) continue;
      references.push(repoRelative);
    }
  }
  return references;
}

export function sourcePluginFiles(root, {
  copyExcludes = DEFAULT_COPY_EXCLUDES,
  omitPrefixes = [],
} = {}) {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd: root,
    encoding: "buffer",
  });
  if (result.status !== 0) {
    throw new Error((result.stderr.toString("utf8") || "git ls-files failed").trim());
  }
  const tracked = result.stdout
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .filter((relative) => fs.existsSync(path.join(root, relative)))
    .filter((relative) => !relative.split("/").some((part) => copyExcludes.has(part)))
    .filter((relative) => !isOmitted(relative, omitPrefixes))
    .filter((relative) => fs.lstatSync(path.join(root, relative)).isFile());
  for (const relative of BOOTSTRAP_RELATIVES) {
    if (
      fs.existsSync(path.join(root, relative))
      && !tracked.includes(relative)
      && !isOmitted(relative, omitPrefixes)
    ) {
      tracked.push(relative);
    }
  }
  return [...new Set([
    ...tracked,
    ...directSkillReferences(root, tracked, copyExcludes),
  ])]
    .filter((relative) => !isOmitted(relative, omitPrefixes))
    .sort();
}

export function filesystemPluginFiles(root, {
  copyExcludes = DEFAULT_COPY_EXCLUDES,
  omitPrefixes = [],
} = {}) {
  const files = [];
  const stack = [[root, ""]];
  while (stack.length) {
    const [current, prefix] = stack.pop();
    if (!fs.existsSync(current)) continue;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (copyExcludes.has(entry.name)) continue;
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (isOmitted(relative, omitPrefixes)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push([absolute, relative]);
      else if (entry.isFile()) files.push(relative);
    }
  }
  return files.sort();
}
