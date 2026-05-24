---
status: proposed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Context Standards Redirect Validation

## Purpose

Validate `context-standards` frontmatter paths through standards redirect stubs
and canonical replacement targets.

## Problem

Skill routing metadata uses `context-standards` to declare standards that a
skill should read before running. Current validation checks only the immediate
path shape and existence:

| Field | Current validator behavior | Gap |
|-------|----------------------------|-----|
| `context-standards` | Must start with `standards/` and exist. | Allows redirect stubs but does not connect them to canonical owners. |

Example:

| Skill field | Immediate file | Canonical owner |
|-------------|----------------|-----------------|
| `context-standards: standards/review/review-template.md` | `agent/standards/review/review-template.md` | `agent/document-templates/review/code-review.md` |

The field must keep the `standards/` path today because the validator only
allows standards paths in `context-standards`. The canonical owner lives outside
`standards/`. Without validation that understands the redirect, agents and
future edits can drift:

- a stub can point to a missing target;
- `standards/index.md` can disagree with the stub frontmatter;
- a skill can keep a redirect stub after the replacement path changes;
- a canonical document template can move without updating context users.

## Goals

1. Keep `context-standards` prefix rules compatible with current routing.
2. Validate that every `context-standards` entry exists.
3. If a `context-standards` entry is `status: superseded`, validate its
   `superseded-by` target exists.
4. Validate that `standards/index.md` Redirect Stubs table matches the
   frontmatter target for every standards redirect stub, not only stubs
   referenced by `context-standards`.
5. Report the resolved canonical target for redirect stubs in validator output
   only on failure.
6. Keep direct non-standards canonical paths out of `context-standards` until a
   later routing schema explicitly allows them.

## Non-Goals

- Allow `context-standards` to point directly to `agent/document-templates/`.
- Replace `standards/review/review-template.md` redirect stubs.
- Move document templates or standards files.
- Change runtime context loading behavior.
- Validate semantic equivalence between a stub and its target body.
- Change `context-rules`, `context-repo-docs`, or `context-references`
  validation.

## Current State

| Artifact | Current behavior |
|----------|------------------|
| `scripts/validate-llm-first.mjs` | `validateContextManifestPaths` checks prefix and existence for `context-rules` and `context-standards`. |
| `scripts/validate-llm-first.mjs` | `checkStandardsRedirects` checks `superseded-by` presence and target existence. |
| `agent/standards/index.md` | Lists active standards and redirect stubs, including replacements outside `standards/`. |
| `agent/standards/review/review-template.md` | Redirect stub to `../../document-templates/review/code-review.md`. |
| `review-audit-*` skills | Keep `context-standards: standards/review/review-template.md` for validator compatibility. |

## Proposed Design

### Reference Model

Validator resolves each `context-standards` entry into two paths:

| Path | Meaning |
|------|---------|
| Declared path | Exact frontmatter value, e.g. `standards/review/review-template.md`. |
| Resolved path | Same as declared path unless the file has `status: superseded`; then the normalized `superseded-by` target. |

Rules:

- Declared path must keep the existing `standards/` prefix requirement.
- Declared path must exist under `agent/`.
- If declared path is an active standard, no redirect validation is needed.
- If declared path is a redirect stub, `superseded-by` must resolve to an
  existing path.
- If declared path is a redirect stub, `agent/standards/index.md` must list the
  same stub and replacement.
- A redirect stub can target `agent/document-templates/`, `agent/skills/`,
  `docs/`, `tools/`, or a relative path, using the same resolution rule as
  `checkStandardsRedirects`.
- A replacement in `standards/index.md` that starts with `agent/`, `docs/`, or
  `tools/` resolves from the repo root.
- A replacement in `standards/index.md` that is relative, such as
  `../../skills/frontend-design/references/CSS.md`, resolves from the directory
  of the stub file named in the same row, not from `agent/standards/index.md`.

### Validator Changes

| Function | Change |
|----------|--------|
| `validateContextManifestPaths` | For `context-standards`, read the target file frontmatter and call redirect validation when `status: superseded`. |
| `checkStandardsRedirects` | Expose a shared resolver helper for `superseded-by` targets and validate every redirect stub against `standards/index.md`. |
| new helper | Parse `agent/standards/index.md` Redirect Stubs table into `stub -> replacement`. |
| new helper | Normalize redirect targets so `../../document-templates/review/code-review.md` and `agent/document-templates/review/code-review.md` compare as the same repo-relative path. |

### Failure Messages

| Failure | Message shape |
|---------|---------------|
| Missing declared path | `context-standards path does not exist: <declared>` |
| Missing redirect target | `context-standards redirect target does not exist: <declared> -> <target>` |
| Missing index row | `standards index missing redirect row for standards redirect stub: <stub>` |
| Index mismatch | `standards index redirect mismatch: <declared> frontmatter=<target> index=<target>` |
| Invalid prefix | keep current `context-standards entry must start with standards/: <value>` |

## Execution Plan

### S0 - Baseline Re-check

Input:
- Current `context-routing` validator code.
- Current standards redirect stubs.
- Current `standards/index.md` Redirect Stubs table.

Output:
- Confirmed list of context standards that are redirect stubs.

Non-output:
- No routing schema change.

Failure:
- Stop if existing redirect validation is already failing.

Proof:
- `node scripts/validate-llm-first.mjs --check standards-redirects`
- `node scripts/validate-llm-first.mjs --check context-routing`
- `rg -n "context-standards: .*review-template.md" agent/skills`

### S1 - Add Shared Redirect Resolver

Input:
- `scripts/validate-llm-first.mjs`
- `agent/standards/**/*.md`

Output:
- One helper resolves `superseded-by` into repo-relative and absolute paths.
- `checkStandardsRedirects` uses the helper.

Non-output:
- No change to existing pass/fail behavior.

Failure:
- Stop if existing redirect tests or checks change unexpectedly.

Proof:
- `node scripts/validate-llm-first.mjs --check standards-redirects`

### S2 - Parse Standards Redirect Index

Input:
- `agent/standards/index.md`

Output:
- Helper returns redirect rows as normalized `stub -> replacement` mappings.
- Relative replacements resolve from each row's stub file directory.

Non-output:
- No generated rewrite of the index.

Failure:
- Stop if the parser cannot distinguish Active Standards and Redirect Stubs
  sections.

Proof:
- Add a small negative fixture or scripted dry-run that removes one Redirect
  Stubs row and confirms the validator reports `standards index missing
  redirect row for standards redirect stub: <stub>`.

### S3 - Extend Context Routing Validation

Input:
- `validateContextManifestPaths`
- redirect resolver helper
- redirect index helper

Output:
- `context-routing` fails when a `context-standards` redirect stub target or
  index row is stale.
- `standards-redirects` fails when any standards redirect stub and
  `standards/index.md` disagree.

Non-output:
- No direct `context-standards` support for non-standards paths.

Failure:
- Stop if valid existing redirect stubs are rejected.

Proof:
- `node scripts/validate-llm-first.mjs --check context-routing`
- `node scripts/validate-llm-first.mjs`

### S4 - Document Metadata Contract

Input:
- `agent/rules/task-context-routing.md`
- `docs/plans/active/skill-oriented-context-loading.md`
- this spec

Output:
- Update routing docs only if they currently claim existence-only validation.

Non-output:
- No broad context-routing rewrite.

Failure:
- Stop if doc updates would duplicate validator details that belong only in this
  spec.

Proof:
- `rg -n "context-standards|superseded-by|Redirect Stubs" agent/rules docs/plans/active`

## Validation

Run:

```bash
node scripts/validate-llm-first.mjs --check standards-redirects
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

Review checks:

- `context-standards` still rejects direct `agent/document-templates/` values;
- redirect standards used by skills have existing canonical targets;
- `standards/index.md` Redirect Stubs table agrees with redirect frontmatter;
- active standards without `superseded-by` keep current behavior;
- failure output names both declared and resolved paths.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Validator becomes too strict for compatibility stubs | Existing valid skills fail context-routing. | Allow standards redirect stubs when target and index row are valid. |
| Index parser is brittle | Markdown table edits create false failures. | Parse only the Redirect Stubs section and normalize code/link cells. |
| Direct canonical paths are allowed too early | Routing schema becomes ambiguous. | Keep prefix rule unchanged in this spec. |
| Duplicate redirect logic appears | Future drift between checks. | Share one redirect target resolver between standards and context checks. |

## Acceptance Criteria

1. `context-routing` validates `context-standards` redirect stubs beyond file
   existence.
2. `standards-redirects` and `context-routing` share redirect target resolution
   logic.
3. `standards/index.md` redirect rows are checked against redirect frontmatter.
4. Skills can keep `context-standards: standards/review/review-template.md`
   while the canonical body lives at
   `agent/document-templates/review/code-review.md`.
5. Direct `context-standards: agent/document-templates/...` remains invalid.
6. Full validation passes.

## Open Decisions

1. Should future routing metadata add a separate `context-templates` field for
   document template bodies?
2. Should validator output include resolved canonical targets in a non-failure
   report mode?
3. Should redirect index rows be generated from frontmatter instead of manually
   maintained?
