# shotloom-check-gates reference

Detail for `/shotloom-check-gates`. `SKILL.md` holds the helper workflow. This
file records why the helper set exists and how it relates to Shotloom repo
guidance.

---

## Guideline Leak Fixes

Shotloom repo guidelines are the first source of commit, push, and PR policy.
This reference records helper-local leak fixes: extra evidence gates added after
real failures escaped the repo-guideline flow.

| Leak / failure mode | Helper behavior | Evidence source |
|---|---|---|
| `shotloom-desktop` has a pre-existing Tauri icon issue that produces false reds in workspace Rust gates | Exclude `shotloom-desktop` from `cargo check`, `cargo clippy`, and `cargo test` | Shotloom harness meta rule |
| Manual iteration needs a cheaper check path than full evidence runs | Bare `/shotloom-check-gates` uses `--fast`; callers that need evidence pass `--full` | Align Shotloom gate policy finding |

The helper set is additive evidence. It does not replace, weaken, or redefine
Shotloom repo guidance.
