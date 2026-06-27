#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function usage() {
  console.error(
    "Usage: node scripts/measure-skill-exposure.mjs <plugin-root> [<plugin-root> ...]",
  );
  process.exit(2);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function listSkillFiles(pluginRoot) {
  const skillsRoot = path.join(pluginRoot, "skills");
  if (!fs.existsSync(skillsRoot)) return [];
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(skillsRoot, entry.name, "SKILL.md"))
    .filter((filePath) => fs.existsSync(filePath))
    .sort();
}

function parseFrontmatter(markdown, fallbackName) {
  if (!markdown.startsWith("---\n")) {
    return { name: fallbackName, description: "" };
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { name: fallbackName, description: "" };
  }

  const values = {};
  const frontmatter = markdown.slice(4, end).split(/\r?\n/);
  for (const line of frontmatter) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^["']|["']$/g, "").trim();
  }

  return {
    name: values.name || fallbackName,
    description: values.description || "",
  };
}

function approxTokens(chars) {
  return Math.ceil(chars / 4);
}

function measurePlugin(pluginRoot) {
  const manifestPath = path.join(pluginRoot, ".codex-plugin", "plugin.json");
  const manifest = readJson(manifestPath);
  const skillFiles = listSkillFiles(pluginRoot);
  const skills = skillFiles.map((filePath) => {
    const markdown = fs.readFileSync(filePath, "utf8");
    const fallbackName = path.basename(path.dirname(filePath));
    const { name, description } = parseFrontmatter(markdown, fallbackName);
    const exposedName = `${manifest.name}:${name}`;
    const listChars = `${exposedName} ${description}`.trim().length;

    return {
      name,
      exposedName,
      path: path.relative(pluginRoot, filePath),
      description,
      descriptionChars: description.length,
      listChars,
      listApproxTokens: approxTokens(listChars),
      skillMdChars: markdown.length,
      skillMdApproxTokens: approxTokens(markdown.length),
    };
  });

  const totals = skills.reduce(
    (acc, skill) => {
      acc.listChars += skill.listChars;
      acc.listApproxTokens += skill.listApproxTokens;
      acc.skillMdChars += skill.skillMdChars;
      acc.skillMdApproxTokens += skill.skillMdApproxTokens;
      return acc;
    },
    { listChars: 0, listApproxTokens: 0, skillMdChars: 0, skillMdApproxTokens: 0 },
  );

  return {
    plugin: manifest.name,
    version: manifest.version,
    root: pluginRoot,
    skillCount: skills.length,
    ...totals,
    topDescriptions: [...skills]
      .sort((a, b) => b.descriptionChars - a.descriptionChars)
      .slice(0, 10),
    topSkillBodies: [...skills]
      .sort((a, b) => b.skillMdChars - a.skillMdChars)
      .slice(0, 10),
  };
}

function printTable(rows) {
  console.log(
    "| Plugin | Skills | List chars | List approx tokens | SKILL.md chars | SKILL.md approx tokens |",
  );
  console.log("|---|---:|---:|---:|---:|---:|");
  for (const row of rows) {
    console.log(
      `| ${row.plugin} | ${row.skillCount} | ${row.listChars} | ${row.listApproxTokens} | ${row.skillMdChars} | ${row.skillMdApproxTokens} |`,
    );
  }
}

function printTop(title, rows, field, tokenField) {
  console.log(`\n### ${title}`);
  console.log("| Plugin | Skill | Chars | Approx tokens |");
  console.log("|---|---|---:|---:|");
  for (const row of rows) {
    for (const skill of row[field]) {
      console.log(
        `| ${row.plugin} | ${skill.name} | ${skill[field === "topDescriptions" ? "descriptionChars" : "skillMdChars"]} | ${skill[tokenField]} |`,
      );
    }
  }
}

const roots = process.argv.slice(2).map((arg) => path.resolve(arg));
if (roots.length === 0) usage();

const rows = roots.map(measurePlugin);
printTable(rows);
printTop("Top Description Metadata", rows, "topDescriptions", "listApproxTokens");
printTop("Top SKILL.md Bodies", rows, "topSkillBodies", "skillMdApproxTokens");
