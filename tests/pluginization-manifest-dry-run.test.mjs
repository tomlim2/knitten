import assert from "node:assert/strict";
import test from "node:test";

import { buildPluginizationManifestDryRun } from "../scripts/pluginization-manifest-dry-run.mjs";

test("validates example skill pack as non-shotloom manifest dry run", async () => {
  const dryRun = await buildPluginizationManifestDryRun({ date: "2026-06-01" });

  assert.equal(dryRun.date, "2026-06-01");
  assert.equal(dryRun.rows.length, 1);
  assert.equal(dryRun.rows[0]["pack-id"], "example-skill-pack");
  assert.equal(dryRun.rows[0]["validation-result"], "pass");
  assert.deepEqual(dryRun.rows[0].exports, ["demo-web-review"]);
  assert.match(dryRun.markdown, /first pilot is not Shotloom \| pass/);
  assert.match(dryRun.markdown, /manifest validator passes \| pass/);
});
