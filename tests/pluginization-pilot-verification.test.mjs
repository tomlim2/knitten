import assert from "node:assert/strict";
import test from "node:test";

import { buildPluginizationPilotVerification } from "../scripts/pluginization-pilot-verification.mjs";

test("verifies example skill pack pilot routing and alias behavior", async () => {
  const verification = await buildPluginizationPilotVerification({ date: "2026-06-01" });

  assert.equal(verification.manifest["pack-id"], "example-skill-pack");
  assert.equal(verification.scenarios.length, 2);
  assert.ok(verification.scenarios.every((row) => row["result-kind"] === "primary"));
  assert.ok(verification.scenarios.every((row) => row["resolver-body-load-count"] === 0));
  assert.match(verification.scenarios.find((row) => row.name === "compatibility-alias")["primary-candidate-id"], /old-demo-web-review/);
  assert.match(verification.markdown, /route evidence selects pilot \| pass/);
  assert.match(verification.markdown, /compatibility alias selects canonical artifact \| pass/);
});
