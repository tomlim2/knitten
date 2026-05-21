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
local command documented in the PR body, CI workflow coverage, README/guideline
surface, or a validator inventory update.

Finding format:

```text
V2: <path>:<line> +<path operation> - IO occurs before root-containment proof.
    Fix: resolve/canonicalize the candidate path, reject paths outside the root, and add a negative fixture.
```

```text
V4: <path>:<line> +<script-or-validator> - no CI, README, or validator inventory surface runs it.
    Fix: wire it into the smallest relevant gate or document the manual command in the PR body.
```

## Pattern U — Speculative public API surface

Origin: promoted from recurring review-time maintainability findings about
barrel drift and public symbols without consumers.

Barrel `index.ts` re-exports, public Rust `pub fn` / `pub use` items, and
similar widenings of a module's contract surface should only land when an
out-of-module consumer already needs them. Speculative re-exports turn future
renames or removals into breaking changes for callers that do not exist yet.

Rule: every newly exported symbol from a barrel / `pub` item must have at least
one out-of-module consumer in the same diff. If the new symbol is only used by
siblings reachable via relative imports / `crate::` paths inside the same
module, drop the re-export; siblings should keep using the direct import.

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
  every call site narrows beforehand, the widening + guard is dead code that
  lies about the contract.
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
