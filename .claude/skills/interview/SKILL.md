---
name: interview
description: Interview the user about an existing issue or PRD, then rewrite that file in place with richer, more concrete content (scope, acceptance criteria, goals, flows) before any plan is drafted. Use when the user wants to flesh out, clarify, or enrich an issue or PRD through a guided Q&A. Triggers on "interview me about this issue", "interview the PRD", "flesh out this issue", or "enrich this PRD".
---

# Interview

Conduct a focused, interactive interview about an existing **issue** or **PRD**, then rewrite that file in place with the richer content the conversation surfaces. The user is present at the terminal — ask questions one at a time and wait for each answer. Never invent answers.

This mirrors the `epic issue interview` and `epic prd interview` CLI commands, merged into one skill. Issue and PRD content lives in the Epic database (read/written over the API); the CLI materializes the markdown into an ephemeral buffer the agent edits, then PATCHes it back — there are no `.epic/issues|prds/*.md` files. The two targets share the same shape (read the content → find gaps → ask focused questions one at a time → rewrite the body in place) but enrich different sections.

## Choosing the target

Decide what is being interviewed from the request and the reference:

- An **issue** (e.g. `PROJ-12`), or the user says "issue". → Follow `references/issue.md`.
- A **PRD** (e.g. `PRD-3`), or the user says "PRD". → Follow `references/prd.md`.

If it is ambiguous which item or which type, ask the user which one to interview before starting.

## Workflow (both targets)

1. Read the target content in full (the CLI materializes it as pure markdown — a `# <ID> <title>` heading followed by the body; there is no YAML front matter).
2. Identify the gaps worth asking about (the matching reference lists what to probe).
3. Ask the user **one focused question at a time** and wait for the answer. Keep questions concrete and answerable. Cap at roughly 5–10 questions; stop early once the content is clearly scoped or the user signals they are done.
4. Rewrite the body **in place** in the buffer the CLI provides, following the rules in the matching reference (the CLI persists it to the database via the API).
5. Print a short confirmation summarizing what changed, then stop.

## Hard rules (both targets)

- **The content is pure markdown — there is no YAML front matter to preserve** (issue/PRD state lives only in the DB row). Rewrite the body only.
- **Keep the existing top-level heading** (`# <ID> <title>` for issues, `# PRD-N Title` for PRDs) unless the user explicitly asks for a rename.
- **Edit the content in place — do not create new files.**
- Preserve prior content that is still accurate; don't delete material just to fit a template.
- If the user declines a question or says "I don't know yet", record it (under `## Open Questions` for PRDs) rather than guessing.

## References

- `references/issue.md` — full prompt for interviewing an **issue** (enriches scope, acceptance criteria, constraints).
- `references/prd.md` — full prompt for interviewing a **PRD** (enriches goals, non-goals, user flows, open questions).
