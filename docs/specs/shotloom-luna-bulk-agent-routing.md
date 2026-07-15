# Shotloom Luna Bulk Evidence Routing Readiness

## Status

Reviewed and ready for Phase A implementation after review-fix loop 8.

Phase A is the current implementation target. It centralizes the Luna profile
and installs an executable but disabled Shotloom route. Phase B enables that
route only after Codex exposes an observable per-agent dispatcher and a locked
paired pilot passes.

## Goal

Prepare one safe, centralized Luna route for objectively large, bounded,
read-only evidence collection in the two supplemental research scouts owned by
shotloom-draft-spec, without claiming that the current agent runtime can select
or prove Luna.

## Problem

Knitten Core currently exposes deep review, fast scan, and causal-analysis
profiles. The scan-fast-readonly profile therefore covers both semantic
supporting review and high-volume mechanical evidence mapping.

OpenAI's GPT-5.6 guidance describes gpt-5.6-luna as the efficient model for
high-volume work. The two shotloom-draft-spec research scouts are plausible
consumers, but the current spawn interface does not report or accept the
effective model, sandbox, model-unavailable classification, cost, or latency.
An immediately enabled Luna route would therefore be unverifiable.

## Decision

- Add one Core-owned purpose profile: bulk-evidence-readonly.
- Keep the model, effort, sandbox, and fallback tuple only in Core.
- Add one executable Knitten-SL route resolver for the two draft-spec scouts.
- Ship that route with candidateEnabled=false in Phase A, so both roles still
  resolve to scan-fast-readonly.
- Do not duplicate the candidate profile or thresholds in skill prose.
- Keep every reviewer, readiness, RCA, implementation, and mutation role on
  its current profile.
- Treat an observable dispatcher and a passing paired pilot as Phase B
  prerequisites, not as evidence the current runtime already provides.

## Boundary

Phase A in scope:

- Core profile, fallback-pointer validation, and fallback-resolution tests.
- Disabled Knitten-SL route configuration and one executable route resolver.
- Updating shotloom-draft-spec to consume the resolver output.
- Tests proving only the two supplemental scouts are accepted by the resolver.
- A repository-wide prohibition on bulk-evidence-readonly inside skills.
- Selected-Core propagation through the Knitten-SL doctor.
- Phase B fixture and acceptance contracts in this spec.

Phase B deferred:

- Enabling candidate routing.
- Running or committing the paired pilot.
- Adding a dispatcher adapter or direct API/runtime integration.
- Claiming an effective Luna model, sandbox, cost, or latency.

Out of scope in both phases:

- Replacing scan-fast-readonly globally.
- Changing the primary Codex model.
- Routing shotloom-respond-pr, shotloom-review-task-plan,
  shotloom-review-asset-library-pr, Core review/triad, or RCA roles to Luna.
- Letting Luna output count as full-review coverage, readiness, blocker
  adjudication, or mutation authority.
- Adding a general benchmark service, a new skill, or Shotloom application
  changes.
- Committing, pushing, publishing, or refreshing plugin caches while this spec
  is under review.

## Repository And Path Conventions

- <knitten-core-root> is the selected Knitten Core source checkout.
- <knitten-sl-root> is the selected Knitten-SL source checkout.
- Knitten-SL obtains Core profiles only through
  scripts/resolve-knitten-output agent-profile.
- Cross-repository source validation sets
  KNITTEN_PATH_BIN=<knitten-core-root>/bin/knitten-path.
- Knitten-SL scripts and doctor subprocesses must preserve that exact
  KNITTEN_PATH_BIN value.
- Failure to resolve the selected Core checkout or a required profile fails
  closed.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| <knitten-core-root>/agent/config/agent-profiles.json | Yes | Only model, effort, sandbox, and fallback registry. |
| <knitten-core-root>/scripts/resolve-agent-profile.mjs | Yes | Core profile and fallback resolver. |
| <knitten-sl-root>/skills/shotloom-draft-spec/flow.md | Yes | Only initial consumer. |
| <knitten-sl-root>/scripts/test-shotloom-skills.mjs | Yes | Domain routing and skill validator. |
| <knitten-sl-root>/scripts/doctor.mjs | Yes | Selected-Core end-to-end validation owner. |
| OpenAI GPT-5.6 model guidance | Yes | Luna high-volume role guidance checked on 2026-07-13. |

The local contract below is normative. Runtime behavior must not depend on a
live documentation fetch.

## Outputs

| Output | Phase | Persistence |
|--------|-------|-------------|
| Core bulk-evidence-readonly profile | A | durable |
| Disabled two-role Shotloom route | A | durable |
| Executable route resolver and tests | A | durable |
| Phase A validation evidence | A | command output |
| Observable dispatcher declaration | B | durable |
| Paired pilot inputs, runs, and acceptance | B | durable |
| Enabled conditional Luna route | B | durable |

## Contract

### Core Profile

Add this exact entry to
<knitten-core-root>/agent/config/agent-profiles.json:

~~~json
{
  "id": "bulk-evidence-readonly",
  "purpose": "Objectively large, bounded, read-only evidence collection whose output cannot decide findings, readiness, or mutation.",
  "model": "gpt-5.6-luna",
  "model_reasoning_effort": "medium",
  "sandbox_mode": "read-only",
  "fallback": {
    "modelUnavailable": "use-profile:scan-fast-readonly",
    "perAgentModelSelectionUnavailable": "do-not-spawn-run-sequential-primary-readonly",
    "sandboxUnavailable": "do-not-spawn-run-sequential-primary-readonly",
    "subagentsUnavailable": "run-lenses-sequentially"
  },
  "recordRequestedAndEffective": true
}
~~~

Update lastVerifiedAt to the implementation verification date.

The resolver validates that use-profile:<id> targets a different existing
profile and that pointer chains cannot cycle. It also supports:

~~~bash
node scripts/resolve-agent-profile.mjs bulk-evidence-readonly --fallback modelUnavailable
~~~

The fallback form returns:

~~~json
{
  "ok": true,
  "fallbackReason": "modelUnavailable",
  "requestedProfileId": "bulk-evidence-readonly",
  "resolvedProfileId": "scan-fast-readonly",
  "profile": "<complete resolved scan-fast-readonly tuple>"
}
~~~

It follows exactly one profile pointer and fails on an unknown reason,
non-pointer action, missing target, self-reference, or cycle. Existing
one-argument and --list outputs stay backward compatible. Runtime-contract
tests cover every branch.

Knitten-SL reaches the same operation through:

~~~bash
scripts/resolve-knitten-output agent-profile bulk-evidence-readonly --fallback modelUnavailable
~~~

### Phase A Executable Route

Add
<knitten-sl-root>/evals/agent-profile-routing/shotloom-routing.json
with this exact initial content:

~~~json
{
  "schemaVersion": 1,
  "candidateEnabled": false,
  "candidateProfile": "bulk-evidence-readonly",
  "baselineProfile": "scan-fast-readonly",
  "pilotAcceptancePath": "evals/agent-profile-routing/results/acceptance.json",
  "bulkGate": {
    "minCandidateSurfaces": 20,
    "minCandidateBytes": 25000,
    "operator": "any"
  },
  "roles": [
    "proof-test-scout",
    "reuse-precedent-scout"
  ]
}
~~~

Add
<knitten-sl-root>/scripts/resolve-shotloom-agent-route.mjs.
This file and the JSON fixture are the only executable decision source. The
script:

0. Exports side-effect-free decideShotloomAgentRoute and
   validateAndMeasureScoutPacket functions for unit tests; CLI I/O is a thin
   wrapper around them.
1. Accepts exactly --role and an optional --packet <JSON path>.
2. Rejects unknown roles, duplicate/unknown flags, unknown fixture keys, and
   invalid profile ids.
3. Resolves the candidate and baseline profile ids through
   scripts/resolve-knitten-output agent-profile --list.
4. Returns the baseline immediately when candidateEnabled=false, without
   reading --packet or requiring one.
5. When candidateEnabled=true, dynamically imports the Phase B acceptance
   validator. An invalid, stale, or unavailable validator returns the baseline
   before packet materialization.
6. When acceptance is valid and --packet is absent, returns a
   materialize-packet action without selecting a profile.
7. When --packet is present, validates the closed packet, requires its roleId
   to equal --role, computes both gate values and a canonical SHA-256 itself,
   and returns the candidate or baseline plus the validated packet value.
8. A missing, unreadable, or invalid packet fails closed to the baseline.

Its closed success output is:

~~~json
{
  "ok": true,
  "roleId": "proof-test-scout|reuse-precedent-scout",
  "requestedProfile": "bulk-evidence-readonly|scan-fast-readonly|null",
  "candidateEligible": false,
  "reason": "candidate-disabled|candidate-evidence-invalid|packet-required|packet-invalid|below-bulk-gate|candidate-eligible",
  "nextAction": "dispatch-profile|materialize-packet",
  "packet": null
}
~~~

The exact state table is:

| State | requestedProfile | candidateEligible | reason | nextAction | packet |
|-------|------------------|-------------------|--------|------------|--------|
| candidate disabled | scan-fast-readonly | false | candidate-disabled | dispatch-profile | null |
| enabled, acceptance invalid/stale/unavailable | scan-fast-readonly | false | candidate-evidence-invalid | dispatch-profile | null |
| enabled, acceptance valid, packet absent | null | false | packet-required | materialize-packet | null |
| enabled, packet invalid/unreadable/role-mismatched | scan-fast-readonly | false | packet-invalid | dispatch-profile | null |
| enabled, valid packet below gate | scan-fast-readonly | false | below-bulk-gate | dispatch-profile | validated |
| enabled, valid packet at/above gate | bulk-evidence-readonly | true | candidate-eligible | dispatch-profile | validated |

In Phase A only the first row is reachable.

The Conditional Research Agents section of
skills/shotloom-draft-spec/flow.md contains exactly two literal helper command
templates, one with --role proof-test-scout and one with
--role reuse-precedent-scout. It invokes the appropriate role-only command
first and resolves only a returned requestedProfile when
nextAction=dispatch-profile. It materializes a packet and repeats the same
role command with --packet only when nextAction=materialize-packet.

The flow does not copy candidate profile ids, threshold numbers, enablement
state, or fallback strings. It still owns the Ready briefing, dispatch
decision, merge, and sequential execution.

The fixture validator enforces all of these before routing:

- schemaVersion is the integer 1;
- candidateEnabled is a boolean, never truthy/falsy coercion;
- candidateProfile and baselineProfile are different valid profile ids;
- pilotAcceptancePath equals exactly
  evals/agent-profile-routing/results/acceptance.json;
- bulk-gate thresholds are positive safe integers and operator is exactly any;
- roles is the exact sorted unique two-item array shown above;
- no extra object or nested keys exist.

Invalid configuration is a hard resolver error; the owning flow runs the lens
sequentially and does not spawn an agent. Unit tests include one negative case
for each field, type, unsafe path form, duplicate/unsorted role array, and
unknown key, and alternate acceptance filename.

The pure test seams are:

~~~text
canonicalizeJson(value) -> <UTF-8 canonical JSON bytes>
sha256CanonicalJson(value) -> "sha256:<hex>"

validateAndMeasureScoutPacket(rawJson, expectedRoleId) -> {
  ok: boolean,
  reason: "valid|invalid",
  packet: <validated packet or null>,
  sha256: "sha256:<hex>" | null,
  candidateSurfaceCount: number | null,
  candidateBytes: number | null
}

decideShotloomAgentRoute({
  config: <validated route fixture>,
  roleId: <validated role>,
  acceptance: { ok: boolean, reason: <validator reason> } | null,
  packetResult: <validateAndMeasureScoutPacket result> | null
}) -> <one exact resolver state>
~~~

Neither function reads files, environment, clocks, or subprocesses. Phase A
unit tests inject valid and invalid acceptance states and packet results to
cover every enabled state without implementing or importing the Phase B
scorer. CLI black-box tests cover the real disabled short-circuit, selected
Core lookup, malformed fixture behavior, and role ownership.

Phase A owns the canonicalization/hash exports. The Phase B scorer imports
those exports rather than copying the algorithm.

### Phase B Bulk Gate And Dispatch Packet

Phase A preserves the current Ready briefing, index, and authority-path scout
input and performs no content serialization or byte counting.

Only after the enabled resolver returns nextAction=materialize-packet does the
primary workflow materialize this closed packet:

~~~json
{
  "schemaVersion": 1,
  "caseId": "<task-scoped stable id>",
  "roleId": "proof-test-scout|reuse-precedent-scout",
  "readyBriefing": "<bounded briefing>",
  "constraints": ["<non-empty constraint>"],
  "authority": [
    {
      "evidenceId": "<dispatch-stable id>",
      "path": "<authority path>",
      "symbolOrSection": null,
      "kind": "reuse|test|fixture|validator|contract",
      "content": "<exact UTF-8 content delivered to the scout>"
    }
  ]
}
~~~

All keys are required. symbolOrSection is the only nullable packet field.
Strings are non-empty; constraints, evidence ids, and paths are unique; and
authority is non-empty.

The route resolver computes candidateSurfaceCount as the number of unique
authority evidence ids and candidateBytes as the UTF-8 byte length of
JSON.stringify(packet.authority). It measures the exact payload delivered to
the scout, not whole source files. Invalid JSON/UTF-8, duplicate ids, missing
content, or uncountable inputs return the packet-invalid baseline state.

For a valid packet, the resolver output packet field is:

~~~text
{
  "sha256": "sha256:<canonical packet hash>",
  "candidateSurfaceCount": 20,
  "candidateBytes": 24999,
  "value": <the validated closed packet object>
}
~~~

The hash uses the Phase B canonical-JSON algorithm. The flow dispatches exactly
packet.value from this resolver response and does not reread the input file or
reconstruct authority content. The recorded route evidence includes the hash
and both computed counts. This binds eligibility to the exact dispatched
payload.

The resolver locks this truth table:

| Candidate enabled | Acceptance | Packet | Surfaces | Bytes | Route |
|-------------------|------------|--------|----------|-------|-------|
| false | any | absent | n/a | n/a | baseline |
| true | invalid/stale | absent | n/a | n/a | baseline |
| true | valid | invalid | n/a | n/a | baseline |
| true | valid | valid | 19 | 24,999 | baseline |
| true | valid | valid | 20 | 24,999 | candidate |
| true | valid | valid | 19 | 25,000 | candidate |

### Evidence-Only Output

The two scouts return:

~~~json
{
  "roleId": "proof-test-scout|reuse-precedent-scout",
  "evidence": [
    {
      "id": "<packet evidence id>",
      "path": "<packet authority path>",
      "symbolOrSection": null,
      "kind": "reuse|test|fixture|validator|contract",
      "relevance": "<one grounded sentence>",
      "verificationHint": "<smallest primary-agent verification>"
    }
  ],
  "unresolved": [
    {
      "path": null,
      "question": "<missing or ambiguous evidence>"
    }
  ]
}
~~~

All keys are required. Arrays may be empty. symbolOrSection and
unresolved[].path are the only nullable fields. Evidence ids are unique and
must come from the packet. Every report evidence object joins by id to exactly
one packet authority entry and its path, symbolOrSection, and kind must equal
that same entry. Every non-null unresolved path must also be packet authority.

The scouts do not emit P0-P3 findings. Their output cannot count as review
coverage, readiness, blocker adjudication, or mutation authority. The primary
agent verifies every item it uses and never infers absence from an empty list.

### Existing Role Protection

No existing semantic role moves to Luna:

| Consumer | Preserved contract |
|----------|--------------------|
| shotloom-respond-pr | Both focused reviewers remain scan-fast-readonly. |
| shotloom-review-task-plan | Highest-risk role remains review-deep-readonly; two supporting roles remain scan-fast-readonly. |
| shotloom-review-asset-library-pr | Existing deep/scan split remains. |
| shotloom-review-before-pr | Inherited Core review/triad routing remains. |
| shotloom-triad-rca | All roles remain causal-analysis-readonly. |

scripts/test-shotloom-skills.mjs keeps its existing operative-prose checks for
those roles and additionally requires:

- bulk-evidence-readonly does not occur anywhere under skills/;
- only the two exact role ids occur in the Shotloom route fixture;
- resolve-shotloom-agent-route.mjs occurs under skills/ only in
  skills/shotloom-draft-spec/flow.md;
- that flow contains exactly two literal helper command templates, one for
  --role proof-test-scout and one for --role reuse-precedent-scout;
- the flow does not contain candidate profile ids, threshold values, or a
  second profile-choice branch;
- the route resolver state table and bulk truth table pass, including
  candidate-evidence-invalid and packet-invalid baseline results;
- every profile id in the fixture exists in the selected Core inventory.

This validates the operative helper and bans the candidate from semantic skill
prose instead of adding inert declarations to unchanged flows.

### Phase B Dispatcher Prerequisite

Phase B cannot start on the current spawn interface. A follow-up implementation
may set candidateEnabled=true only after naming a supported dispatcher that
provides all of these machine-readable facts:

- pre-dispatch read-only sandbox capability;
- pre-dispatch exact per-agent model-selection capability;
- observed selected model for each completed run;
- observed selected reasoning effort for each completed run;
- explicit model_unavailable classification;
- monotonic dispatch-start and structured-response-complete timestamps;
- estimated cost when available;
- a stable dispatcher id and contract version.

The dispatcher id and contract version become pilot-manifest fields and digest
inputs. Prompt claims, resolved profile values, and runtime-selected/unreported
sentinels are not observations and cannot pass the pilot.

The reachable Phase B state table is:

| Read-only supported | Exact model selection supported | Attempt result | Action |
|---------------------|---------------------------------|----------------|--------|
| no | any | none | run the lens sequentially; do not spawn |
| yes | no | none | run the lens sequentially; do not spawn |
| yes | yes | success | record observed candidate model |
| yes | yes | explicit model_unavailable | resolve Core modelUnavailable fallback and attempt baseline once |
| yes | yes | any other failure | run sequentially |

The fallback attempt is never recursive. A failed fallback runs sequentially.

### Phase B Paired Pilot

Phase B adds:

- evals/agent-profile-routing/pilot.json
- packets/reuse-scout.json and packets/proof-scout.json
- oracles/reuse-scout.json and oracles/proof-scout.json
- eight canonical run files under runs/
- results/acceptance.json
- scripts/score-agent-profile-pilot.mjs

score-agent-profile-pilot.mjs has no import-time side effects and exports this
read-only interface:

~~~text
validatePilotAcceptance({
  acceptancePath: "evals/agent-profile-routing/results/acceptance.json",
  knittenPathBin: <absolute executable selected Core knitten-path>
}) -> Promise<{
  ok: boolean,
  reason: "valid|missing|invalid|stale|core-unavailable"
}>

buildPilotAcceptance({
  acceptancePath: "evals/agent-profile-routing/results/acceptance.json",
  knittenPathBin: <absolute executable selected Core knitten-path>,
  generatedAt: <current RFC3339 UTC supplied by CLI>
}) -> Promise<{
  ok: boolean,
  reason: "valid|pilot-failed|core-unavailable",
  acceptance: <closed acceptance object or null>
}>
~~~

Both exports are side-effect-free and never write. The route resolver
dynamically imports validatePilotAcceptance only when candidateEnabled=true and
passes the exact KNITTEN_PATH_BIN environment value. Any result except ok=true
and reason=valid returns the candidate-evidence-invalid baseline state.

The same module exposes this CLI contract:

~~~bash
KNITTEN_PATH_BIN=<knitten-core-root>/bin/knitten-path \
  node scripts/score-agent-profile-pilot.mjs --check \
  evals/agent-profile-routing/results/acceptance.json
~~~

Exit 0 means valid, exit 1 means missing/invalid/stale evidence, and exit 2
means usage or selected-Core resolution failure.

The CLI also creates the result:

~~~bash
KNITTEN_PATH_BIN=<knitten-core-root>/bin/knitten-path \
  node scripts/score-agent-profile-pilot.mjs --write \
  evals/agent-profile-routing/results/acceptance.json
~~~

--write calls buildPilotAcceptance, refuses to write unless every pilot gate
passes, serializes the closed result as two-space JSON plus one final LF, and
atomically replaces only the named acceptance file using a same-directory
exclusive temporary file followed by rename. A failure before rename leaves an
existing result untouched; the CLI removes only its own temporary file.
Exit 0 means written and valid, exit 1 means the pilot failed with no write,
exit 2 means usage/Core resolution failure, and exit 3 means filesystem write
failure. The implementation immediately runs --check after --write.

Both exports and both CLI modes accept only the exact canonical acceptance path
shown above. Before any read, directory creation, temporary-file creation, or
write, they reject absolute paths, dot segments, backslashes, alternate roots,
and every other filename. Negative CLI tests cover each unsafe form and prove
that neither the destination nor a temporary artifact is created.

pilot.json has this exact closed shape:

~~~json
{
  "schemaVersion": 1,
  "candidateProfile": "bulk-evidence-readonly",
  "baselineProfile": "scan-fast-readonly",
  "repeats": 2,
  "dispatcher": {
    "id": "<stable non-empty id>",
    "contractVersion": "<stable non-empty version>"
  },
  "thresholds": {
    "costImprovementRatio": 0.1,
    "latencyImprovementRatio": 0.2
  },
  "cases": [
    {
      "id": "reuse-scout",
      "roleId": "reuse-precedent-scout",
      "packetPath": "evals/agent-profile-routing/packets/reuse-scout.json",
      "oraclePath": "evals/agent-profile-routing/oracles/reuse-scout.json"
    },
    {
      "id": "proof-scout",
      "roleId": "proof-test-scout",
      "packetPath": "evals/agent-profile-routing/packets/proof-scout.json",
      "oraclePath": "evals/agent-profile-routing/oracles/proof-scout.json"
    }
  ],
  "runOrder": [
    {"caseId": "reuse-scout", "profile": "candidate", "repeat": 1},
    {"caseId": "reuse-scout", "profile": "baseline", "repeat": 1},
    {"caseId": "proof-scout", "profile": "baseline", "repeat": 1},
    {"caseId": "proof-scout", "profile": "candidate", "repeat": 1},
    {"caseId": "reuse-scout", "profile": "baseline", "repeat": 2},
    {"caseId": "reuse-scout", "profile": "candidate", "repeat": 2},
    {"caseId": "proof-scout", "profile": "candidate", "repeat": 2},
    {"caseId": "proof-scout", "profile": "baseline", "repeat": 2}
  ]
}
~~~

No extra keys are allowed. Profile, case, role, and path values are exact.
repeats is exactly 2; threshold ratios are finite numbers strictly between 0
and 1; dispatcher strings are non-empty; and runOrder is exactly the array
above.

The reuse packet has exactly 20 authority entries and fewer than 25,000
candidate bytes. The proof packet has 1 through 19 authority entries and
25,000 through 26,000 candidate bytes. Each packet includes at least one
distractor evidence id outside its oracle allowedEvidenceIds.

Each oracle contains:

~~~json
{
  "schemaVersion": 1,
  "caseId": "reuse-scout|proof-scout",
  "roleId": "proof-test-scout|reuse-precedent-scout",
  "allowedEvidenceIds": ["<packet evidence id>"],
  "requiredAssertions": [
    {
      "evidenceId": "<allowed packet evidence id>",
      "kind": "reuse|test|fixture|validator|contract",
      "relevanceMustInclude": ["<case-specific normalized phrase>"],
      "verificationHintMustInclude": ["<case-specific normalized phrase>"]
    }
  ]
}
~~~

allowedEvidenceIds is a non-empty proper subset of packet evidence ids.
requiredAssertions is non-empty, unique by evidenceId, and references only
allowed ids. Each phrase array contains at least one non-empty case-specific
phrase. The scorer lowercases, trims, and collapses whitespace before literal
substring comparison.

Each run record has this exact closed shape:

~~~json
{
  "schemaVersion": 1,
  "caseId": "reuse-scout|proof-scout",
  "roleId": "reuse-precedent-scout|proof-test-scout",
  "profileId": "bulk-evidence-readonly|scan-fast-readonly",
  "repeat": 1,
  "requestedProfile": "<same as profileId>",
  "resolvedProfile": "<same as profileId>",
  "resolved": {
    "model": "<Core-resolved model>",
    "effort": "<Core-resolved effort>",
    "sandbox": "read-only"
  },
  "observed": {
    "model": "<dispatcher-observed model>",
    "effort": "<dispatcher-observed effort>",
    "sandbox": "read-only",
    "dispatcherId": "<manifest dispatcher id>",
    "dispatcherContractVersion": "<manifest dispatcher version>"
  },
  "timing": {
    "startedMonotonicMs": 0,
    "completedMonotonicMs": 1,
    "latencyMs": 1
  },
  "metrics": {
    "inputTokens": null,
    "outputTokens": null,
    "estimatedCostUsd": null
  },
  "execution": "separate-agent",
  "report": {
    "roleId": "reuse-precedent-scout|proof-test-scout",
    "evidence": [],
    "unresolved": []
  }
}
~~~

No extra keys are allowed. repeat is 1 or 2. Timing values are finite
non-negative numbers, completion is greater than start, and latency equals
completion minus start. The scorer derives latency from both timestamps and
rejects a supplied mismatch. Token and cost metrics are null or finite
non-negative numbers. Resolved and observed strings are non-empty. For the run
profileId, the entire resolved model/effort/sandbox tuple must equal the
currently selected Core resolver tuple and the corresponding acceptance
candidate/baseline tuple. Observed model and effort must equal that resolved
tuple; observed and resolved sandbox must both be read-only. The report
satisfies the closed evidence-only output contract.

Cross-artifact identities are exact:

- manifest case id = packet case id = oracle case id = run case id = run
  filename case component;
- manifest role id = packet role id = oracle role id = run top-level role id =
  report role id;
- every report evidence id joins exactly one packet authority entry and its
  path, symbolOrSection, and kind equal that same entry;
- run profile id = requested profile = resolved profile = filename profile
  component; pilot fallback is forbidden;
- run repeat = filename repeat component;
- dispatcher id/version in every run = manifest dispatcher id/version;
- each run resolved tuple = the selected Core tuple for its profile id = the
  corresponding acceptance candidate/baseline tuple;
- each run observed model/effort/sandbox = its resolved tuple;
- each run path is
  evals/agent-profile-routing/runs/<case-id>.<profile-id>.<repeat>.json;
- run paths equal the eight paths derived from manifest runOrder in fixed
  order, replacing candidate/baseline with their manifest profile ids.

The scorer fails on every identity or tuple mismatch and has one negative test
per join, per evidence path/symbol-or-section/kind field, and per model,
effort, and sandbox field for both profiles.

Quality passes only when the candidate:

- has required-assertion recall 1.0;
- has allowed-id precision 1.0 and returns no distractor;
- satisfies every kind, relevance, and verification-hint assertion;
- is no worse than the baseline on each quality metric.

Efficiency uses cost when all eight cost values are observable; candidate
median cost must be at least 10 percent lower. Otherwise it uses latency when
all eight latency values are observable; candidate median latency must be at
least 20 percent lower. Otherwise the pilot fails.

Latency starts immediately before the dispatcher call and ends when the closed
structured report is complete. No other work occurs inside that interval.
Runs use the fixed interleaved order. For four sorted values [a,b,c,d], median
is (b+c)/2.

The scorer canonicalizes JSON by recursively sorting object keys in Unicode
code-point order, preserving array order, applying JSON.stringify without
extra whitespace, and encoding UTF-8. It records a SHA-256 hash for each of the
eight canonical run files in fixed order.

pilotDigest is SHA-256 over canonical JSON containing:

- pilot manifest;
- both packets and both oracles;
- bulk-gate values;
- both currently resolved Core tuples;
- scorer script SHA-256;
- route-resolver script SHA-256, because it owns packet canonicalization and
  gate computation;
- the ordered eight run-path and run-hash pairs.

results/acceptance.json has this exact closed shape:

~~~json
{
  "schemaVersion": 1,
  "pilotDigest": "sha256:<64 lowercase hex>",
  "generatedAt": "<RFC3339 UTC timestamp>",
  "dispatcher": {
    "id": "<manifest dispatcher id>",
    "contractVersion": "<manifest dispatcher version>"
  },
  "contractHashes": {
    "scorerSha256": "<64 lowercase hex>",
    "routeResolverSha256": "<64 lowercase hex>"
  },
  "candidateTuple": {
    "profileId": "bulk-evidence-readonly",
    "model": "<Core-resolved model>",
    "effort": "<Core-resolved effort>",
    "sandbox": "read-only"
  },
  "baselineTuple": {
    "profileId": "scan-fast-readonly",
    "model": "<Core-resolved model>",
    "effort": "<Core-resolved effort>",
    "sandbox": "read-only"
  },
  "runHashes": [
    {
      "path": "<canonical run path>",
      "sha256": "<64 lowercase hex>"
    }
  ],
  "quality": {
    "candidateRecall": 1,
    "candidatePrecision": 1,
    "candidateAssertionPassRate": 1,
    "baselineRecall": 1,
    "baselinePrecision": 1,
    "baselineAssertionPassRate": 1
  },
  "efficiency": {
    "metric": "estimatedCostUsd|latencyMs",
    "candidateMedian": 0,
    "baselineMedian": 1,
    "improvementRatio": 1
  },
  "passed": true
}
~~~

No extra keys are allowed. generatedAt is a valid UTC RFC3339 string.
runHashes contains exactly eight unique entries in manifest order. Run and
contract hash fields match the declared format and current files. Tuple strings
are non-empty and equal the selected Core resolver output. Quality values and
improvementRatio are finite numbers from 0 through 1; candidate quality values
are exactly 1 and no worse than baseline. Efficiency medians are finite
non-negative numbers, baselineMedian is greater than zero, and improvementRatio equals
(baselineMedian-candidateMedian)/baselineMedian. passed is true only when
every check succeeds. Any run or contract change invalidates the result.

This is a one-time Phase B release gate. Repository validation rechecks the
digest. It is not rerun for every draft-spec task.

## Validation

### Phase A Core

- node scripts/resolve-agent-profile.mjs --list
- node scripts/resolve-agent-profile.mjs bulk-evidence-readonly
- node scripts/resolve-agent-profile.mjs bulk-evidence-readonly --fallback modelUnavailable
- node scripts/validate-repository-shell.mjs
- node scripts/validate-runtime-contracts.mjs

### Phase A Knitten-SL

- KNITTEN_PATH_BIN=<knitten-core-root>/bin/knitten-path node
  scripts/test-shotloom-skills.mjs
- node scripts/validate-activation.mjs
- node scripts/validate-boundary.mjs
- rg -n 'bulk-evidence-readonly' skills returns no matches
- rg -n 'gpt-[0-9]|model_reasoning_effort|sandbox_mode' skills returns no
  matches

Update <knitten-sl-root>/scripts/doctor.mjs so both source-tree and copied-plugin
test-shotloom-skills.mjs subprocesses receive the selected KNITTEN_PATH_BIN.
After an explicitly requested materialization, both plugin doctors must pass.

### Phase B

- The named dispatcher capability probe passes.
- KNITTEN_PATH_BIN=<knitten-core-root>/bin/knitten-path node
  scripts/score-agent-profile-pilot.mjs --check
  evals/agent-profile-routing/results/acceptance.json
- The Phase A validation set still passes with candidateEnabled=true.

## Acceptance Criteria

### Phase A

- Core owns and resolves the exact bulk-evidence-readonly tuple.
- Core validates and resolves the one-step modelUnavailable pointer.
- The Shotloom route fixture is disabled and names only the two draft scouts.
- The executable route resolver returns scan-fast-readonly for both roles at
  every input while disabled and rejects every other role.
- shotloom-draft-spec consumes the resolver output without copying candidate
  ids, thresholds, or fallback policy.
- Disabled routing does not materialize a Phase B packet or count payload
  surfaces/bytes.
- The route helper occurs under skills/ only in shotloom-draft-spec and only
  for the two literal scout roles.
- bulk-evidence-readonly appears nowhere under Knitten-SL skills/.
- Existing semantic reviewer and RCA route tests remain green.
- Knitten-SL doctor subprocesses use the explicitly selected Core checkout.
- Core and Knitten-SL validators pass.
- No Luna execution or effective-setting claim is made.

### Phase B

- A supported observable dispatcher is named and versioned.
- The paired pilot passes identity, quality, efficiency, tuple, and digest
  checks.
- candidateEnabled changes to true only in the same reviewed change as the
  valid acceptance result.
- Only the two draft scouts can receive the candidate, and only above the bulk
  gate.
- Any invalid or stale acceptance fails closed to scan-fast-readonly.
- Luna output remains evidence-only and non-authoritative.

## Open Questions

- None. The absent observable dispatcher is a known Phase B prerequisite, not
  an assumption or a reason to claim current enablement.

## Design Plan

### Phase A Sequence

1. Add the Core profile and fallback operation.
2. Add the disabled Knitten-SL route fixture and executable resolver.
3. Update shotloom-draft-spec to consume only the resolver output.
4. Extend routing, boundary, and negative tests.
5. Fix Knitten-SL doctor propagation of the selected Core path.
6. Run the Phase A validators.

### Phase A Files

- <knitten-core-root>/agent/config/agent-profiles.json
- <knitten-core-root>/agent/AGENTS.md
- <knitten-core-root>/scripts/resolve-agent-profile.mjs
- Core repository-shell and runtime-contract validators
- <knitten-sl-root>/AGENTS.md
- <knitten-sl-root>/evals/agent-profile-routing/shotloom-routing.json
- <knitten-sl-root>/scripts/resolve-shotloom-agent-route.mjs
- <knitten-sl-root>/scripts/test-shotloom-skills.mjs
- <knitten-sl-root>/scripts/doctor.mjs
- <knitten-sl-root>/skills/shotloom-draft-spec/flow.md

### Phase B Sequence

1. Identify and document a supported observable dispatcher.
2. Add the locked pilot packets, oracles, scorer, and negative tests.
3. Run the fixed eight-dispatch pilot.
4. Generate acceptance with --write and immediately verify it with --check.
5. Commit the run hashes and passing acceptance result.
6. Set candidateEnabled=true in the same reviewed change.
7. Run Phase A and Phase B validators.

Phase B requires a follow-up reviewed implementation task. It is not silently
included in Phase A.

## Review Notes

- Review loops 1 and 2 narrowed Luna from semantic reviewers to two
  supplemental evidence scouts, separated requested/resolved/observed settings,
  and introduced objective volume and paired-pilot gates.
- Loop 3 confirmed that the current spawn interface cannot produce a passing
  pilot, that inert route markers did not protect operative behavior, and that
  run evidence and negative quality cases needed stronger binding.
- This revision stages current-safe readiness separately from later observable
  enablement.
