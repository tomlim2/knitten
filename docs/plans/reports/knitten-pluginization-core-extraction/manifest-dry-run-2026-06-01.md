---
status: report
created: 2026-06-01
owner: agent-hub
spec: ../../proposed/knitten-pluginization-core-extraction.md
---

# Pluginization Manifest Dry Run 2026-06-01

## Purpose

Validate candidate artifact-pack manifests without moving production files.

## Candidate Manifests

| manifest path | pack id | visibility | owner domain | exports | compatibility aliases | validation result |
|---------------|---------|------------|--------------|---------|-----------------------|-------------------|
| examples/artifact-packs/example-skill-pack/artifact-pack.json | example-skill-pack | public | domain | demo-web-review | old-demo-web-review | pass |

## Validation Commands

- `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack examples/artifact-packs/example-skill-pack/artifact-pack.json` -> pass

## Gate Result

| Gate | Result |
|------|--------|
| no production file movement | pass |
| first pilot is not Shotloom | pass |
| manifest validator passes | pass |
