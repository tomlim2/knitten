#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CASES_PATH = "evals/context-load-smoke/cases.json";
const SURFACES_PATH = "evals/context-load-smoke/match-surfaces.json";
const REPORT_PATH = ".agent-local/workflow/evals/context-load-smoke/latest.json";
const PILOT_SKILLS = ["implement", "draft-spec", "review", "report-finding"];
const GROUP_COUNTS = { implementation: 5, spec: 4, review: 4, finding: 3, reject: 4 };
const THRESHOLDS = {
  matchCorrect: 18,
  rejectCorrect: 4,
  referencePrecision: 0.8,
  safetyMissCount: 0,
  averageSavingsRate: 0.3,
};

function usage() {
  return `Usage:
  run-context-load-smoke-eval.mjs [--report] [--print-json]

Runs the deterministic Knitten context-load smoke eval.`;
}

function parseArgs(argv) {
  const args = { report: false, printJson: false };
  for (const arg of argv) {
    if (arg === "--report") {
      args.report = true;
    } else if (arg === "--print-json") {
      args.printJson = true;
    } else if (arg === "-h" || arg === "--help") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return args;
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8"));
}

function readText(relativePath) {
  return fs.readFileSync(path.join(REPO_ROOT, relativePath), "utf8");
}

function estimateTokens(text) {
  return Math.ceil(String(text).length / 4);
}

function uniqueSorted(values) {
  return [...new Set(values)].sort();
}

function sameSet(left, right) {
  const a = uniqueSorted(left);
  const b = uniqueSorted(right);
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function includesAny(haystack, needles) {
  const lower = String(haystack).toLowerCase();
  return needles.some((needle) => lower.includes(String(needle).toLowerCase()));
}

function predictedSkillFor(request) {
  const text = String(request).toLowerCase();
  if (/\b(weather|image|install)\b/.test(text) || /\b(commit and push|commit\/push)\b/.test(text)) return "reject";
  if (/\b(record|log|save)\b/.test(text) && /\b(finding|failure|stale|doctor|validator|reproducible|missing config)\b/.test(text)) {
    return "report-finding";
  }
  if (/\b(make|create|draft|write)\b/.test(text) && /\b(spec|pre-work plan|implementation contract|design plan)\b/.test(text)) {
    return "draft-spec";
  }
  if (/\b(implement|apply|fix|update|make)\b/.test(text) && /\b(spec|plan|finding|blocker|config|script|code|files?)\b/.test(text)) {
    return "implement";
  }
  if (/\b(triad review|single read-only review|read-only review|review|find p0-p2 blockers?)\b/.test(text)) {
    return "review";
  }
  if (/\b(draft|spec|pre-work|implementation contract|design plan|plan)\b/.test(text)) {
    return "draft-spec";
  }
  return "reject";
}

function validateCases(cases) {
  const problems = [];
  const counts = {};
  const ids = new Set();
  for (const item of cases) {
    for (const key of ["id", "group", "request", "expectedSkill", "expectedReferences", "safetyCheckRequired", "notes"]) {
      if (!Object.hasOwn(item, key)) problems.push(`${item.id || "<missing id>"} missing ${key}`);
    }
    if (ids.has(item.id)) problems.push(`duplicate case id: ${item.id}`);
    ids.add(item.id);
    counts[item.group] = (counts[item.group] || 0) + 1;
    if (!Object.hasOwn(GROUP_COUNTS, item.group)) problems.push(`${item.id} has invalid group ${item.group}`);
    if (item.group === "reject" && item.expectedSkill !== "reject") problems.push(`${item.id} reject group must expect reject`);
    if (item.expectedSkill !== "reject" && !PILOT_SKILLS.includes(item.expectedSkill)) problems.push(`${item.id} invalid expectedSkill ${item.expectedSkill}`);
    if (!Array.isArray(item.expectedReferences)) problems.push(`${item.id} expectedReferences must be an array`);
    if (typeof item.safetyCheckRequired !== "boolean") problems.push(`${item.id} safetyCheckRequired must be boolean`);
  }
  for (const [group, expected] of Object.entries(GROUP_COUNTS)) {
    if ((counts[group] || 0) !== expected) problems.push(`group ${group} count ${(counts[group] || 0)} != ${expected}`);
  }
  if (cases.length !== 20) problems.push(`case count ${cases.length} != 20`);
  return problems;
}

function validateSurfaces(surfaces) {
  const problems = [];
  const bySkill = new Map();
  for (const item of surfaces) {
    for (const key of ["skill", "matchText", "references", "safetyTerms"]) {
      if (!Object.hasOwn(item, key)) problems.push(`${item.skill || "<missing skill>"} missing ${key}`);
    }
    if (bySkill.has(item.skill)) problems.push(`duplicate surface skill: ${item.skill}`);
    bySkill.set(item.skill, item);
    if (!PILOT_SKILLS.includes(item.skill)) problems.push(`${item.skill} is not a pilot skill`);
    if (!Array.isArray(item.references)) problems.push(`${item.skill} references must be an array`);
    if (!Array.isArray(item.safetyTerms)) problems.push(`${item.skill} safetyTerms must be an array`);
    const skillPath = `skills/${item.skill}/SKILL.md`;
    if (!fs.existsSync(path.join(REPO_ROOT, skillPath))) problems.push(`${item.skill} missing ${skillPath}`);
    for (const reference of item.references || []) {
      if (!fs.existsSync(path.join(REPO_ROOT, reference))) problems.push(`${item.skill} missing reference ${reference}`);
    }
  }
  for (const skill of PILOT_SKILLS) {
    if (!bySkill.has(skill)) problems.push(`missing match surface for ${skill}`);
  }
  return { problems, bySkill };
}

function runEval({ writeReport }) {
  const cases = readJson(CASES_PATH).cases;
  const surfaces = readJson(SURFACES_PATH).surfaces;
  const problems = [...validateCases(cases)];
  const { problems: surfaceProblems, bySkill } = validateSurfaces(surfaces);
  problems.push(...surfaceProblems);

  const fullSkillTextBySkill = new Map(PILOT_SKILLS.map((skill) => [skill, readText(`skills/${skill}/SKILL.md`)]));
  const baselineTokens = [...fullSkillTextBySkill.values()].reduce((sum, text) => sum + estimateTokens(text), 0);
  const matchTokens = [...bySkill.values()].reduce((sum, surface) => sum + estimateTokens(surface.matchText), 0);
  const caseResults = [];

  for (const item of cases) {
    const predictedSkill = predictedSkillFor(item.request);
    const predictedSurface = bySkill.get(predictedSkill);
    const loadedReferences = predictedSkill === "reject" ? [] : predictedSurface?.references || [];
    const referencePrecise = sameSet(loadedReferences, item.expectedReferences);
    const safetyMiss = Boolean(
      item.safetyCheckRequired
        && predictedSkill !== "reject"
        && (!predictedSurface || !includesAny(predictedSurface.matchText, predictedSurface.safetyTerms || [])),
    );
    const referenceTokens = loadedReferences.reduce((sum, reference) => sum + estimateTokens(readText(reference)), 0);
    const loadedTokens = matchTokens + referenceTokens;
    const savingsRate = baselineTokens === 0 ? 0 : (baselineTokens - loadedTokens) / baselineTokens;
    caseResults.push({
      id: item.id,
      group: item.group,
      expectedSkill: item.expectedSkill,
      predictedSkill,
      expectedReferences: item.expectedReferences,
      loadedReferences,
      matchCorrect: predictedSkill === item.expectedSkill,
      rejectCorrect: item.group !== "reject" || predictedSkill === "reject",
      referencePrecise,
      safetyCheckRequired: item.safetyCheckRequired,
      safetyMiss,
      baselineTokens,
      loadedTokens,
      savingsRate,
    });
  }

  const matchCorrect = caseResults.filter((item) => item.matchCorrect).length;
  const rejectCorrect = caseResults.filter((item) => item.group === "reject" && item.rejectCorrect).length;
  const referencePrecise = caseResults.filter((item) => item.referencePrecise).length;
  const referencePrecision = caseResults.length === 0 ? 0 : referencePrecise / caseResults.length;
  const safetyMissCount = caseResults.filter((item) => item.safetyMiss).length;
  const averageSavingsRate = caseResults.reduce((sum, item) => sum + item.savingsRate, 0) / caseResults.length;

  const blockers = [...problems];
  if (matchCorrect < THRESHOLDS.matchCorrect) blockers.push(`match accuracy ${matchCorrect}/20 below ${THRESHOLDS.matchCorrect}/20`);
  if (rejectCorrect < THRESHOLDS.rejectCorrect) blockers.push(`reject accuracy ${rejectCorrect}/4 below ${THRESHOLDS.rejectCorrect}/4`);
  if (referencePrecision < THRESHOLDS.referencePrecision) blockers.push(`reference precision ${referencePrecision.toFixed(2)} below ${THRESHOLDS.referencePrecision}`);
  if (safetyMissCount !== THRESHOLDS.safetyMissCount) blockers.push(`safety miss count ${safetyMissCount} != ${THRESHOLDS.safetyMissCount}`);
  if (averageSavingsRate < THRESHOLDS.averageSavingsRate) blockers.push(`average savings rate ${averageSavingsRate.toFixed(2)} below ${THRESHOLDS.averageSavingsRate}`);

  const report = {
    ok: blockers.length === 0,
    generatedAt: new Date().toISOString(),
    thresholds: THRESHOLDS,
    metrics: {
      totalCases: caseResults.length,
      matchAccuracy: { correct: matchCorrect, total: 20 },
      rejectAccuracy: { correct: rejectCorrect, total: 4 },
      referencePrecision: { correct: referencePrecise, total: caseResults.length, rate: referencePrecision },
      safetyMissCount,
      averageSavingsRate,
      baselineTokens,
      matchTokens,
    },
    blockers,
    cases: caseResults,
    reportPath: writeReport ? path.join(REPO_ROOT, REPORT_PATH) : null,
  };

  if (writeReport) {
    const absoluteReportPath = path.join(REPO_ROOT, REPORT_PATH);
    fs.mkdirSync(path.dirname(absoluteReportPath), { recursive: true });
    fs.writeFileSync(absoluteReportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  return report;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = runEval({ writeReport: args.report });
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

main();
