---
status: report
created: 2026-06-01
owner: agent-hub
spec: ../../proposed/knitten-pluginization-core-extraction.md
---

# Pluginization Pilot Verification 2026-06-01

## Purpose

Verify the low-risk pilot pack without moving production artifacts.

## Pilot

| Field | Value |
|-------|-------|
| manifest | examples/artifact-packs/example-skill-pack/artifact-pack.json |
| pack id | example-skill-pack |
| first pilot is Shotloom | no |

## Route Results

| scenario | result kind | primary candidate | emitted candidates | body loads | secondary candidates |
|----------|-------------|-------------------|--------------------|------------|----------------------|
| route-evidence | primary | pack:example-skill-pack:demo-web-review:none:none | 2 | 0 | 0 |
| compatibility-alias | primary | pack:example-skill-pack:demo-web-review:alias:old-demo-web-review | 2 | 0 | 1 |

## Gate Result

| Gate | Result |
|------|--------|
| route evidence selects pilot | pass |
| compatibility alias selects canonical artifact | pass |
| resolver body loads remain zero | pass |
