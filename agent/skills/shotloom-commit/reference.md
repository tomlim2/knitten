# shotloom-commit reference

Detail for `/shotloom-commit`. `SKILL.md` holds the commit workflow. This file
holds guideline leak fixes.

---

## Guideline Leak Fixes

Shotloom repo guidelines are the first source of commit and push policy. This
reference records commit-local leak fixes: extra evidence gates added after real
failures escaped the repo-guideline flow.

| Leak / failure mode | Fix | Evidence source |
|---|---|---|
| Commit helper starts owning gate policy instead of delivering Shotloom repo guidance | Remove commit-local gate flags. Follow Shotloom repo guidance; run helper evidence only when the repo guidance or user asks for it | Align Shotloom gate policy finding |

Commit-local fixes are additive. They do not replace, weaken, or redefine
Shotloom repo guidance.
