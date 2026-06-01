import assert from "node:assert/strict";
import test from "node:test";

import { buildPluginizationInventoryReport } from "../scripts/pluginization-inventory-report.mjs";

test("builds pluginization inventory summaries and candidate rows", async () => {
  const report = await buildPluginizationInventoryReport({ date: "2026-06-01" });

  assert.equal(report.date, "2026-06-01");
  assert.ok(report.inventory.rows.length > 0);
  assert.ok(report.summaries.some((row) => row.pack === "knitten-core"));
  assert.ok(report.summaries.some((row) => row.pack === "repo-private-pack"));
  assert.ok(report.rows.some((row) => row["row-id"] === "skill:agent/skills/shotloom-review-before-pr/SKILL.md"));
  assert.match(report.markdown, /# Pluginization Inventory 2026-06-01/);
  assert.match(report.markdown, /candidate pack \| row id \| owner domain/);
  assert.match(report.markdown, /final skill classification deferred \| pass/);
});

test("lists required migration report fields on every candidate row", async () => {
  const report = await buildPluginizationInventoryReport({ date: "2026-06-01" });
  const row = report.rows.find((item) => item["row-id"] === "skill:agent/skills/shotloom-review-before-pr/SKILL.md");

  for (const field of [
    "candidate-pack",
    "row-id",
    "owner-domain",
    "privacy-risk",
    "dependencies",
    "support-files",
    "output-ids",
    "local-artifact-identities",
    "templates",
    "scripts",
    "compatibility-need",
    "blocker-status",
  ]) {
    assert.ok(Object.hasOwn(row, field), `missing ${field}`);
  }
  assert.equal(row["candidate-pack"], "repo-private-pack");
  assert.equal(row["privacy-risk"], "needs-scrub");
  assert.match(row["blocker-status"], /privacy:needs-scrub/);
});
