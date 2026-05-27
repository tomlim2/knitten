# shotloom-review-code promoted patterns

Supplementary review patterns promoted from real Shotloom PR review findings.

Load this file after `reference.md`. These entries are intentionally separated
from the stable catalog so recent review-derived lessons can be audited,
trimmed, or merged later without losing provenance.

Entry rules:

- Add entries only through `/shotloom-promote-review-patterns`.
- Keep entries grep-catchable and review-actionable.
- Include compact source evidence as `PR NNN`, reviewer/check type, and file:line
  or check name when useful.
- Do not include private Shotloom PR URLs or markdown links.
- Do not add feature summaries.

## Pattern V — Validator / manifest contract

Origin: promoted from repeated Shotloom review findings around S2M asset
validators, manifest path safety, Git LFS pointer detection, and script
enforcement.

Trigger when the diff adds or changes a validator, manifest, package script,
file IO path, asset importer, loader, saver, path resolver, or diagnostic
contract.

Before reading the implementation, build a bad-input matrix:

| Column | Required content |
|---|---|
| Contract claim | The exact accepted and rejected input shape. |
| Negative fixture | The bad input that proves rejection behavior. |
| Boundary rule | The ownership, path, platform, or schema boundary. |
| Error order | The primary failure reported before secondary failures. |
| Enforcement surface | CLI, CI, unit test, integration test, or runtime guard. |
| Regression proof | The test or validator run that fails without the fix. |

### V1: changed validator / manifest surface

```bash
git diff origin/main...HEAD --name-only \
  | rg '(^|/)(validate|validator|manifest|catalog|schema|config|package\.json|Cargo\.toml|\.github/workflows/)'
```

For each hit, require a negative fixture or a named reason that no negative
input exists for this change.

### V2: path containment before filesystem access

```bash
git diff origin/main...HEAD --unified=0 -- '*.rs' '*.ts' '*.tsx' '*.js' '*.mjs' \
  | rg '^\+' \
  | rg 'path\.join|PathBuf::from|fs::|readFile|writeFile|copyFile|rename|remove'
```

Flag `path.join(root, relative)` or `PathBuf::from(root).join(relative)` when
the code reads or writes before proving the final path remains inside `root`.
Require canonicalization or an equivalent containment proof before IO.

### V3: short read before prefix / schema checks

```bash
git diff origin/main...HEAD --unified=0 -- '*.rs' '*.ts' '*.tsx' '*.js' '*.mjs' \
  | rg '^\+' \
  | rg 'read_to_string|readFile|JSON\.parse|serde_json|toml|yaml|startsWith|strip_prefix'
```

If parsing, prefix checks, or schema validation happen after partial file reads,
verify the primary error path still reports the caller's bad input rather than a
secondary parse or missing-file error.

### V4: package / CI enforcement gap

```bash
git diff origin/main...HEAD --name-only -- 'package.json' '.github/workflows/*' 'scripts/*' \
  | sort -u
```

When a new package script or validator entry lands, require at least one of:
local validation notes, CI workflow coverage, README/guideline surface, or a
validator inventory update.

Finding format:

```text
V2: <path>:<line> +<path operation> - IO occurs before root-containment proof.
    Fix: resolve/canonicalize the candidate path, reject paths outside the root, and add a negative fixture.
```

```text
V4: <path>:<line> +<script-or-validator> - no CI, README, or validator inventory surface runs it.
    Fix: wire it into the smallest relevant gate or document the manual command in the validation notes.
```

## Pattern U — Speculative public API surface

Origin: promoted from recurring review-time maintainability findings about
barrel drift and public symbols without consumers.

Barrel `index.ts` re-exports, public Rust `pub fn` / `pub use` items, and
similar widenings of a module's contract surface are justified when an
out-of-module consumer already needs them. Speculative re-exports turn future
renames or removals into breaking changes for callers that do not exist yet.

Rule: every newly exported symbol from a barrel / `pub` item needs at least
one out-of-module consumer in the same diff. If the new symbol is only used by
siblings reachable via relative imports / `crate::` paths inside the same
module, prefer the direct import over the re-export.

### U1: barrel widening without an external consumer (TS)

```bash
# 1. New `export {...}` / `export type {...}` lines added in any index.ts under apps/<x>/src
git diff origin/main...HEAD --unified=0 -- 'apps/*/src/**/index.ts' \
  | rg '^\+export\s+(\{[^}]+\}|type\s+\{[^}]+\}|\*)' -o
# 2. For each new symbol name, grep for an import outside the symbol's own folder.
ident="DebugSidebar"
folder="apps/editor/src/components/debug"
rg -l "from \".*${folder##*/components/}" apps/ --type ts --type tsx \
  | rg -v "^${folder}/" \
  | xargs -I{} rg -l "\\b${ident}\\b" {} 2>/dev/null
```

Zero out-of-folder hits -> finding.

### U2: speculative `pub` symbol without an external consumer (Rust)

```bash
# New `pub fn` / `pub struct` / `pub enum` / `pub use` in lib.rs / mod.rs entries
git diff origin/main...HEAD --unified=0 -- 'crates/*/src/lib.rs' 'crates/*/src/**/mod.rs' \
  | rg '^\+\s*pub\s+(fn|struct|enum|use|type)\s+([A-Za-z_][A-Za-z0-9_]*)' -o -r '$2' \
  | sort -u
# For each symbol, check if any other crate consumes it.
ident="DebugSidebar"
rg -n "use\s+[a-z_]+::${ident}\b|::${ident}\b" crates/ 2>/dev/null \
  | rg -v "^crates/${owning_crate}/"
```

Zero out-of-crate hits -> finding. Downgrade to `pub(crate)` if siblings need
it; drop entirely if the symbol is only used inside its own module.

Finding format:

```text
U1: <path>:<line> +export {<symbol>} - no out-of-module consumer in the diff.
    Fix: drop the re-export; siblings can keep using the direct relative import. Re-export later when an outside consumer arrives.
```

```text
U2: <crate>/src/<file>.rs +pub <kind> <symbol> - no out-of-crate consumer.
    Fix: downgrade to `pub(crate)` (if siblings need it) or drop the `pub` entirely.
```

Tie-in: this is the "speculative public API" defect class - the more general
form of `~/.claude/rules/code-write.md` "Start small, prove, then grow".

## Pattern J — TypeScript defensive-shape patterns

Origin: promoted from recurring editor PR review findings about defensive but
lying TypeScript shapes.

Trigger: `ts_changed > 0`. Three patterns the Shotloom in-repo
`docs/guidelines/review-typescript.md` did not yet name when this group was
added. They weaken the type system, hide call shapes, or make alarm-bell paths
unreachable.

Each hit is a candidate defect needing human triage. Grep is best-effort; the
judgment is whether the literal/guard/parser actually has a live consumer that
justifies the defensive form.

- **J1 - Nullish-coalescing literal that fake-narrows `T | undefined`.** Find
  lines that paper over a `Maybe<T>` with a magic literal. Typical shape:
  `const X = something()?.field ?? "literal"`. The literal often makes the
  type appear `string` when it is really `string | undefined`, hiding the
  missing case from downstream callers. Triage rule: confirm the literal is a
  meaningful domain default; a placeholder keyword borrowed from the first
  array entry is the defect form.
- **J2 - Function signature widened beyond actual callers + dead `if (!arg)`
  guard.** Find `if (!<name>) return undefined` or equivalent added in the diff
  where the surrounding function's argument type includes `| undefined` /
  `| null`. Cross-check: does any current caller actually pass `undefined`? If
  every call site narrows beforehand, the widening + guard misstates the
  contract.
- **J3 - Parser over-tolerance: silently collapsing invalid input into valid
  input.** Find URL / path / query parsers added in the diff that use
  `.split(<sep>).find(<filter>)` or `array[0]` to extract a single token. These
  patterns silently drop the rest of the input. Preserve enough structure that
  invalid input flows through the existing unknown / fallback UI.

Sweep commands:

```bash
# J1 - nullish-coalescing literal in production code
git diff origin/main...HEAD -- 'apps/editor/src/**/*.ts' 'apps/editor/src/**/*.tsx' \
  | rg '^\+' | rg '\?\?\s*"[a-z][\w-]*"' | rg -v '__tests__|\.test\.'

# J2 - defensive `!arg` guard added on a widened signature
git diff origin/main...HEAD -- 'apps/editor/src/**/*.ts' 'apps/editor/src/**/*.tsx' \
  | rg '^\+' | rg 'if \(!\w+\)\s*return (undefined|null|\{|\[|\"\")'

# J3 - first-non-empty path/URL extraction
git diff origin/main...HEAD -- 'apps/editor/src/**/*.ts' 'apps/editor/src/**/*.tsx' \
  | rg '^\+' | rg '\.split\("/"\)\.(find|filter)\(' \
  | rg -v 'filter\(.*\)\.join\('
```

Findings default to P2 unless the nearest Shotloom guideline or directly
related contract raises or lowers priority. When the in-repo
`docs/guidelines/review-typescript.md` ships parallel section names for J1/J2/J3,
prune these entries from this promoted file in the same PR.

## Pattern B — Bridge contract and diagnostic surfaces

Origin: promoted from Shotloom PR 384 and PR 388 review findings around
bridge-visible command contracts, shared helpers, diagnostic display hardening,
and representative test coverage.

Trigger when the diff adds or changes bridge handlers, bridge events,
rejection codes, command-specific diagnostics, bounded display helpers,
tracing fields, or tests for any of those surfaces.

### B1: shared bridge helpers do not reduce public command coverage

Shared helpers can reduce implementation duplication, but they do not erase the
public contract of each bridge command. A helper-level test is not enough when
different commands expose distinct rejection codes, event kinds, event order, or
parse/lookup precedence.

Sweep:

```bash
git diff origin/main...HEAD --name-only \
  | rg 'crates/shotloom-engine/src/bridge/(handlers|tests)|crates/shotloom-core/src/bridge|apps/editor/src/bridge|docs/ipc/bridge-contract\.md'

git diff origin/main...HEAD --unified=0 -- '*.rs' '*.ts' '*.tsx' '*.md' \
  | rg '^\+' \
  | rg 'BridgeEvent|bundle_changed|rejection|reject|command_id|commit_|handler|SHOT_NOT_FOUND|INVALID_|ASSET_NOT_FOUND'
```

For each shared helper used by multiple bridge commands, require one of:

- table-driven or parameterized regression across every public command surface;
- an explicit shared-contract comment plus representative input-class tests;
- an existing direct per-command test named in the review evidence.

Finding format:

```text
B1: <path>:<line> shared bridge helper has only helper-level coverage.
    Fix: add per-command rejection/event coverage, or document and test the shared contract boundary explicitly.
```

Source evidence: PR 384, reviewer, `crates/shotloom-engine/src/bridge/tests/stage.rs`.

### B2: diagnostic helper wrappers preserve ownership shape

When a helper only standardizes a lower-level diagnostic API call, preserve the
lower-level ownership shape. Narrowing an owned-or-borrowed API such as
`impl Into<String>` to a borrowed-only helper such as `impl AsRef<str>` needs an
intentional, documented contract.

Sweep:

```bash
git diff origin/main...HEAD --unified=0 -- '*.rs' \
  | rg '^\+' \
  | rg 'BoundedDisplay|impl AsRef<str>|impl Into<String>|to_string\(\)|escape_debug|tracing::|warn!|error!'
```

Finding format:

```text
B2: <path>:<line> helper narrows the wrapped diagnostic API ownership shape.
    Fix: match the wrapped API signature, or document why this helper intentionally requires borrowed input.
```

Source evidence: PR 388, reviewer, `crates/shotloom-engine/src/bridge/handlers/stage.rs`.

### B3: escaped diagnostic display tests separate source and render bounds

Diagnostic display tests should distinguish source-side truncation from rendered
escape expansion. A rendered string containing escaped control characters can be
much longer than the original source, so one mixed `MAX_LEN + N` assertion can
prove the ASCII path while pretending to cover escape-heavy input.

Sweep:

```bash
git diff origin/main...HEAD --unified=0 -- '*.rs' '*.ts' '*.tsx' \
  | rg '^\+' \
  | rg 'MAX_LEN|escape_debug|BoundedDisplay|truncate|truncated|control|\\n|\\u|diagnostic|rejection'
```

Require both input classes when user-controlled diagnostic strings are bounded:

- ASCII-overlong input with a tight rendered-length ceiling.
- Control-heavy or escape-heavy input that verifies truncation and escaping
  without reusing the same rendered-length ceiling.

Finding format:

```text
B3: <path>:<line> bounded diagnostic test mixes source length and escaped render length.
    Fix: split ASCII-overlong and escape-heavy cases, and assert the correct property for each.
```

Source evidence: PR 388, reviewer, `crates/shotloom-engine/src/bridge/tests/stage.rs`.

### B4: representative shared-helper tests state their coverage assumption

A shared-helper smoke test can represent many call sites only when the test name,
comment, or assertion shape makes that assumption explicit. Otherwise the reader
cannot tell whether untested rejection codes are intentional inheritance or
accidental gaps.

Trigger: one helper is called from multiple bridge rejection, event, validation,
or logging paths, but only one path has a direct regression test.

Fix shape: either parameterize across public rejection/event codes, or name the
test as a shared-helper smoke test and cover the meaningful input classes that
all call sites inherit.

Finding format:

```text
B4: <path>:<line> one path tests a helper used by multiple bridge surfaces without naming the shared-helper assumption.
    Fix: parameterize across public surfaces or make the representative shared-helper scope explicit.
```

Source evidence: PR 388, reviewer, `crates/shotloom-engine/src/bridge/tests/stage.rs`.

## Pattern G — Architecture gate exceptions

Origin: promoted from Shotloom PR 384 review findings around hand-written
mutation lifecycle code bypassing the documented BundleEditor mutation facade.

Trigger when a diff repeats a documented facade or gate lifecycle by hand,
especially for clone/mutate/validate/rollback, dirty marking, persistence,
bridge contracts, runtime scheduling, or import/export boundaries.

Rule: architecture gates are audit points. Code either goes through the gate, or
the owning architecture document names a narrow exception with preserved
invariants and a migration path back to the gate.

Sweep:

```bash
git diff origin/main...HEAD --unified=0 -- '*.rs' '*.md' \
  | rg '^\+' \
  | rg 'edit_with_scope|rollback|dirty|validate|facade|temporary|exception|mutation|BundleEditor|bridge handler'
```

Finding format:

```text
G1: <path>:<line> reimplements a documented architecture gate lifecycle without an owning-doc exception.
    Fix: use the facade, or document a narrow exception with preserved invariants and a migration commitment.
```

Source evidence: PR 384, reviewer, `docs/arch/bundle-editor-mutation-facade.md`.
