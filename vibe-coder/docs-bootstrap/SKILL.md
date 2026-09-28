---
name: vibe-coder/docs-bootstrap
description: Use when a new project needs a full documentation suite (PRD, AGENTS, DESIGN_SYSTEM, ARCHITECTURE, TASKS, PROGRESS) via a staged interview.
type: technique
---

# Vibe Coding Document Generator — Meta-Prompt / Skill

## Purpose

This is a reusable meta-prompt (skill) for any AI coding agent. When invoked, the agent does **NOT** start writing code or documentation blindly. Instead, it runs a structured, staged interview with the user, and only after each stage is confirmed does it produce the corresponding document. Output of this skill is a set of Markdown files that become the project's persistent context: `PRD.md`, `AGENTS.md`, `DESIGN_SYSTEM.md` (conditional), `ARCHITECTURE.md`, `TASKS.md`, `PROGRESS.md`.

**Portability note:** this prompt is plain Markdown with no platform‑specific syntax or tool calls. It is written to be pasted as the operating instructions for any AI coding agent — including but not limited to a Claude‑based chat/agent session or an Antigravity‑style agentic IDE session. Paste this entire file as the agent's system instructions (or as the seed content of its root‑level rules file) at the start of a project.

## When to use this skill

- A new project is starting and no `/docs` folder or root‑level context files exist yet.
- An existing project's context files are outdated or incomplete and need to be rebuilt.
- The user explicitly asks to "set up project docs", "generate PRD/AGENTS/architecture", or similar.

Do **NOT** use this skill for small one‑off scripts or throwaway prototypes with no multi‑session lifespan — the overhead is not justified there.

---

## Global operating rules (apply to every stage)

1. **Ask, don't assume.** If a required detail is missing, ask a direct question. Never invent product scope, tech stack, or design decisions on the user's behalf. If the user's answer is itself uncertain, mark the resulting line in the document as `(assumption, unverified)` rather than stating it as settled fact.
2. **One stage at a time.** Complete and get explicit confirmation on one document before moving to the next. Each stage's questions may reference answers from earlier stages — do not re‑ask something already answered.
3. **Carry context forward, don't just append.** Before drafting a later document, briefly restate the relevant constraints from earlier documents (e.g. before ARCHITECTURE.md, restate the scope from PRD.md) so the user can catch a mismatch before it's written down.
4. **Scale check.** Whenever a proposed technical decision (stack, service, infrastructure) is clearly larger or more expensive than what the PRD's scope requires, say so explicitly and ask whether the user wants the simpler option instead. Do not silently propose the more complex option "to be safe."
5. **Conflict resolution rule (embed this literally into AGENTS.md, not just this prompt):** if two documents contradict each other, or a needed decision is missing, the agent must stop and ask the user rather than guessing which document takes precedence.
6. **Every generated file gets a header:**
   ```
   Status: Draft | Active | Deprecated
   Last updated: YYYY‑MM‑DD
   ```
7. **Append‑only files.** `TASKS.md` and `PROGRESS.md` are never rewritten from scratch after initial creation — new entries are added, old entries are not silently deleted or edited away. This preserves decision history.
8. **Feedback loop.** If, during later stages (especially TASKS/PROGRESS), a fact emerges that contradicts PRD.md or ARCHITECTURE.md (e.g. a requirement turns out technically unrealistic, or a chosen architecture turns out to be the wrong scale), the agent must flag this explicitly and propose an update to the upstream document — not just log it silently in PROGRESS.md.
9. **Existing‑input check, every stage.** Before running a stage's own questions, always ask first: "Do you already have material for this document (a draft, notes, an existing file), or should we build it from scratch through questions?"
   - If the user provides existing material: do not accept it as‑is. Check it against that stage's output template section by section. Only ask questions for sections that are missing, unclear, or contradict an earlier confirmed document. Do not re‑run the full interview for parts already covered.
   - If nothing exists yet: run that stage's full question list as written below.
   - This check applies to every stage (PRD, AGENTS, DESIGN_SYSTEM, ARCHITECTURE, TASKS, PROGRESS) — not only to DESIGN_SYSTEM.md.

---

## Stage 0: Intake

Ask before anything else:

1. "Does this project have a user‑facing visual interface (web/mobile UI), or is it backend‑only / CLI / automation with no UI?"
   → If no UI: skip Stage 3 (DESIGN_SYSTEM.md) entirely. Do not create an empty placeholder for it.

From Stage 1 onward, apply Global Rule 9 (existing‑input check) at the start of every stage before asking that stage's specific questions.

---

## Stage 1: PRD.md

### Questions to ask
- What is the product, in one sentence?
- What problem does it solve, and for whom specifically?
- What is the single most important outcome for v1 (not a wishlist — the one thing that must work)?
- List the core features for v1. For each, ask: is this must‑have (P0), should‑have (P1), or nice‑to‑have (P2)?
- What are the key user flows (the paths a user actually takes through the product)?
- Are there any fixed constraints — budget, timeline, an existing stack that must be reused, a platform requirement? (Do not skip this — this directly affects Stage 4.)
- How will you know this is working? (success metrics)
- What is explicitly out of scope for v1?

### Output template
```markdown
# Product Requirements Document
Status: Draft
Last updated: YYYY‑MM‑DD

## Product Overview
Product: <name>
One‑line description: <...>
Vision: <...>

## Problem
<the user problem being solved>

## Goal
<the single most important outcome for v1>

## Target Users
- <...>

## Assumptions and Constraints
- Budget: <stated, or "not specified — ask before assuming unlimited">
- Timeline: <...>
- Existing stack / must‑reuse components: <...>
- Platform requirement: <...>

## Core Features (v1)
| Feature | Priority (P0/P1/P2) | Notes |
|---|---|---|
| ... | ... | ... |

## User Flows
- <flow 1>
- <flow 2>

## Requirements
- Functional: <...>
- UX: <...>
- Performance: <...>
- Platform: <...>

## Success Metrics
- <...>

## Out of Scope (v1)
- <...>
```

**Confirm with the user before proceeding to Stage 2.**

---

## Stage 2: AGENTS.md

### Questions to ask
- What language/framework conventions must be followed (e.g. TypeScript strict mode, specific linting rules)?
- Is there an existing folder structure or component library to reuse before creating anything new?
- What are the install/dev/build/lint/test commands for this project?
- What must the agent **NEVER** do without asking first (e.g. add a new dependency, change the database schema, modify auth logic)?
- Is there a git/commit convention to follow (e.g. Conventional Commits, branch naming)?
- What counts as "done" for a task — is there a required test pass, a manual check, a specific command that must succeed?

### Output template
```markdown
# Agent Instructions
Status: Active
Last updated: YYYY‑MM‑DD

## Project Context
<one paragraph: what this product is and what stack it uses — kept in sync with PRD.md and ARCHITECTURE.md>

## Before You Start
- Read PRD.md
- Read ARCHITECTURE.md
- Read DESIGN_SYSTEM.md (if this project has a UI)
- Read TASKS.md — check current task status before starting new work
- Inspect existing components/modules before creating new ones

## General Rules
- <language/framework conventions>
- Reuse existing components/modules; do not duplicate
- Keep changes scoped to the current task in TASKS.md
- Ask before making major architectural changes or adding new dependencies

## Conflict Resolution Rule
If PRD.md, ARCHITECTURE.md, DESIGN_SYSTEM.md, or TASKS.md contradict each other, or a needed decision is missing from all of them, STOP and ask the user. Do not guess which document takes precedence.

## Definition of Done
A task in TASKS.md is only marked done when:
- All automated tests pass (if any)
- Manual QA checklist is completed
- Relevant documentation (AGENTS.md, TASKS.md entry) is updated
- The change is merged following the git conventions
```

**Confirm with the user before proceeding to Stage 3 (if applicable).**

---

## Stage 3: DESIGN_SYSTEM.md (only if UI exists)

*(questions and template omitted for brevity – they follow the same pattern: ask colour tokens, typography, spacing, components, accessibility, motion, breakpoints, etc., then output a markdown file with sections for each).*

**Confirm with the user before proceeding to Stage 4.**

---

## Stage 4: ARCHITECTURE.md

### Questions to ask
- What is the overall tech stack (frontend framework, backend language, database, cloud provider, etc.)?
- List any external services or APIs that will be consumed.
- Which environments are required (dev, staging, prod)? What are the key differences?
- What is the testing strategy (unit, integration, e2e, contract tests)?
- How will logging, monitoring, and alerting be handled?
- How will the app be deployed (CI/CD pipeline, containerisation, serverless, etc.)?
- Are there any scalability or performance concerns that affect architectural decisions?

### Output template
```markdown
# Architecture Document
Status: Draft
Last updated: YYYY‑MM‑DD

## Overview
<short paragraph summarising the system>

## Tech Stack
- Frontend: <...>
- Backend: <...>
- Database: <...>
- Cloud / hosting: <...>
- Other services: <...>

## Environments
| Env | Purpose | Key Config |
|---|---|---|
| dev | <...> | <...> |
| staging | <...> | <...> |
| prod | <...> | <...> |

## Data Flow / Component Diagram
*(provide a high‑level description; optional mermaid diagram can be added later)*

## Testing Strategy
- Unit tests: <framework>
- Integration tests: <framework>
- End‑to‑end tests: <framework>
- Contract tests: <...>

## Logging & Monitoring
- Logs: <...>
- Metrics: <...>
- Alerts: <...>

## Deployment & CI/CD
- Repository layout: <...>
- Build pipeline: <...>
- Deployment method: <...>

## Scalability & Performance Considerations
- Expected traffic: <...>
- Bottleneck mitigation: <...>
- Future growth plan: <...>
```

**Confirm with the user before proceeding to Stage 5.**

---

## Stage 5: TASKS.md

Derive concrete tasks from the features listed in PRD.md and the components described in ARCHITECTURE.md. Each task is a single, implementable unit of work.

### Output template (append‑only)
```markdown
# Project Backlog
Status: Active
Last updated: YYYY‑MM‑DD

| ID | Task | Origin (PRD/ARCH) | Priority | Status | Notes |
|---|---|---|---|---|---|
| T1 | <...> | PRD – Feature X | P0 | To Do | <...> |
| T2 | <...> | ARCH – Service Y | P1 | In Progress | <...> |
```

**Confirm with the user before proceeding to Stage 6.**

---

## Stage 6: PROGRESS.md

A simple log that is **never overwritten**; new entries are always appended to the bottom.

### Output template (append‑only)
```markdown
# Progress Log
Status: Active
Last updated: YYYY‑MM‑DD

## YYYY‑MM‑DD
- Completed task T1 (implemented feature X).
- Updated ARCHITECTURE.md to add Service Y.
- Noted a conflict: PRD.md says feature Z must be P0, but ARCHITECTURE.md shows it as optional. Flagged for review.
```

---

## Stage 7: Cross‑Document Review

Before finishing, run a consistency check across all generated documents:
- Every feature in PRD.md appears as a task in TASKS.md.
- Every stack/component mentioned in ARCHITECTURE.md is reflected in AGENTS.md.
- If DESIGN_SYSTEM.md exists, all UI components referenced in PRD/ARCHITECTURE have a design token.
- No placeholder `<...>` remains.
- All timestamps are recent (within the last 7 days).

If any mismatch is found, **stop**, inform the user of the exact inconsistency, and **re‑enter** the appropriate stage to fix it. Once the review passes, announce that the documentation set is complete and ready for development.

---

**Final note:** After the skill finishes, the generated files live under the project’s `/docs` folder. They become the single source of truth for any subsequent coding, testing, or deployment work. The skill itself does not write code; it only prepares the documentation scaffolding.
