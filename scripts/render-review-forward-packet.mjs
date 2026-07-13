#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKET_ROOT = path.join(REPO_ROOT, "evals/review-forward-packets");

function usage() {
  return "Usage: render-review-forward-packet.mjs <case-id>";
}

function main() {
  const caseId = process.argv[2];
  if (!caseId || !/^[a-z0-9-]+$/.test(caseId)) {
    throw new Error(usage());
  }
  const packetPath = path.join(PACKET_ROOT, `${caseId}.json`);
  if (!fs.existsSync(packetPath)) {
    throw new Error(`unknown forward packet: ${caseId}`);
  }
  const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
  const rendered = {
    schemaVersion: packet.schemaVersion,
    caseId: packet.caseId,
    reviewMode: packet.dispatch.reviewMode,
    role: packet.dispatch.role,
    reviewBrief: packet.reviewBrief,
    inventory: packet.inventory,
    assignedSurfaceIds: packet.dispatch.assignedSurfaceIds,
    evidence: packet.evidence,
  };
  process.stdout.write(`${JSON.stringify(rendered, null, 2)}\n`);
}

main();
