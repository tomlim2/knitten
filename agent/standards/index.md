# Standards Index

On-demand reference docs. For always-applied rules see [`agent/rules/index.md`](../rules/index.md).

Use active standards as policy. Use redirect stubs only to find the skill-owned replacement reference.

## Active Standards

| Standard | Status | Read when |
|----------|--------|-----------|
| [`system-glossary.md`](../../docs/reference/system-glossary.md) | accepted | a system term needs an exact meaning before editing policy, entry docs, plans, manifests, or validators |
| [`multi-agent/agent-workflow.md`](multi-agent/agent-workflow.md) | accepted | designing a multi-pass agent pipeline |
| [`multi-agent/delegation.md`](multi-agent/delegation.md) | accepted | delegating a task to a subagent |
| [`policy/garden-review.md`](policy/garden-review.md) | accepted | pre-tag, after 30+ days clean, or structural review requested |
| [`policy/harness-deployment-plan.md`](policy/harness-deployment-plan.md) | draft | editing the draft harness deployment plan |
| [`policy/harness-deployment.md`](policy/harness-deployment.md) | accepted | editing harness deployment mechanics |
| [`policy/llm-first-docs.md`](policy/llm-first-docs.md) | accepted | editing SYSTEM.md, entry documents, rules, skills, or standards |
| [`policy/llm-first-policy.md`](policy/llm-first-policy.md) | accepted | designing a new layer or resolving an artifact conflict |
| [`policy/metaphor-style.md`](policy/metaphor-style.md) | accepted | picking metaphor domain when explaining technical concepts |
| [`policy/naming.md`](policy/naming.md) | accepted | naming a new rule, standard, skill, plan, or vault file |
| [`policy/platform-adapters.md`](policy/platform-adapters.md) | accepted | classifying artifacts for multiple harnesses |
| [`policy/principles.md`](policy/principles.md) | accepted | checking whether a pattern fits the layer model |
| [`policy/temporary-runtime-files.md`](policy/temporary-runtime-files.md) | accepted | writing temporary runtime files that wrapup must clean |
| [`authoring/document-templates.md`](authoring/document-templates.md) | accepted | changing a document template or finding its canonical owner |
| [`research/research-methodology.md`](research/research-methodology.md) | accepted | doing research |
| [`review/review-code-unreal-cpp.md`](review/review-code-unreal-cpp.md) | accepted | reviewing UE C++ code |
| [`review/review-code-unreal-python.md`](review/review-code-unreal-python.md) | accepted | reviewing UE Python code |
| [`review/review-ux-python-gui.md`](review/review-ux-python-gui.md) | accepted | reviewing Python GUI UX |
| [`system/repo-paths-keys.md`](system/repo-paths-keys.md) | accepted | registering repo keys or setting up a new machine |
| [`unreal/unreal-engine-cpp.md`](unreal/unreal-engine-cpp.md) | accepted | writing UE C++ code |

## Redirect Stubs

| Stub | Replacement |
|------|-------------|
| [`cinev/cci-slack.md`](cinev/cci-slack.md) | `agent/skills/cci-serve-mcp/references/CCI-SLACK.md` |
| [`cinev/cinev-character-asset-naming.md`](cinev/cinev-character-asset-naming.md) | `agent/skills/cci-validate-character-mat-slot-names/references/CINEV-CHARACTER-ASSET-NAMING.md` |
| [`cinev/cinev-git-workflow.md`](cinev/cinev-git-workflow.md) | `agent/skills/cci-manage-art-branch/references/CINEV-GIT-WORKFLOW.md` |
| [`cinev/cinev-vrm-shading.md`](cinev/cinev-vrm-shading.md) | `agent/skills/cci-validate-vrm/references/CINEV-VRM-SHADING.md` |
| [`language/css-reference.md`](language/css-reference.md) | `../../skills/frontend-design/references/CSS-REFERENCE.md` |
| [`language/css.md`](language/css.md) | `../../skills/frontend-design/references/CSS.md` |
| [`language/design-system.md`](language/design-system.md) | `../../skills/frontend-design/references/DESIGN-SYSTEM.md` |
| [`language/javascript-reference.md`](language/javascript-reference.md) | `../../skills/frontend-design/references/JAVASCRIPT-REFERENCE.md` |
| [`language/javascript.md`](language/javascript.md) | `../../skills/frontend-design/references/JAVASCRIPT.md` |
| [`language/three-shader-language.md`](language/three-shader-language.md) | `../../skills/frontend-design/references/THREE-SHADER-LANGUAGE.md` |
| [`language/ui-design.md`](language/ui-design.md) | `../../skills/frontend-design/references/UI-DESIGN.md` |
| [`obsidian/note-inspection-checklist.md`](obsidian/note-inspection-checklist.md) | `agent/skills/obsidian-fix-format/references/NOTE-INSPECTION-CHECKLIST.md` |
| [`obsidian/obsidian-format.md`](obsidian/obsidian-format.md) | `agent/skills/obsidian-obsidian-markdown/references/OBSIDIAN-FORMAT.md` |
| [`obsidian/obsidian-tag-taxonomy.md`](obsidian/obsidian-tag-taxonomy.md) | `agent/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md` |
| [`obsidian/vault-audience.md`](obsidian/vault-audience.md) | `agent/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md` |
| [`research/tech-spec-template.md`](research/tech-spec-template.md) | `agent/document-templates/agent-hub/technical-spec.md` |
| [`review/review-template.md`](review/review-template.md) | `agent/document-templates/review/code-review.md` |
| [`review/review-3d-rendering.md`](review/review-3d-rendering.md) | `agent/skills/review-audit-3d/references/REVIEW-3D-RENDERING.md` |
| [`review/review-ai-motion.md`](review/review-ai-motion.md) | `agent/skills/review-audit-ai-motion/references/REVIEW-AI-MOTION.md` |
| [`review/review-code-astro.md`](review/review-code-astro.md) | `agent/skills/review-audit-web/references/REVIEW-CODE-ASTRO.md` |
| [`review/review-code-css.md`](review/review-code-css.md) | `agent/skills/review-audit-web/references/REVIEW-CODE-CSS.md` |
| [`review/review-code-javascript.md`](review/review-code-javascript.md) | `agent/skills/review-audit-web/references/REVIEW-CODE-JAVASCRIPT.md` |
| [`review/review-code-tsl.md`](review/review-code-tsl.md) | `agent/skills/review-audit-3d/references/REVIEW-CODE-TSL.md` |
| [`review/review-spec-doc.md`](review/review-spec-doc.md) | `agent/skills/review-audit-web-spec/references/REVIEW-SPEC-DOC.md` |
| [`review/review-ux-writing.md`](review/review-ux-writing.md) | `agent/skills/review-audit-ux/references/REVIEW-UX-WRITING.md` |
| [`review/review-ux.md`](review/review-ux.md) | `agent/skills/review-audit-ux/references/REVIEW-UX.md` |
| [`unreal/arp-skeleton.md`](unreal/arp-skeleton.md) | `../../skills/review-audit-ai-motion/references/ARP-SKELETON.md` |
| [`unreal/unreal-engine-asset.md`](unreal/unreal-engine-asset.md) | `agent/skills/ue-validate-asset-name/references/UNREAL-ENGINE-ASSET.md` |
