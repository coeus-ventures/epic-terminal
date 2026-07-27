# Interview PRD

Read the PRD content the user is asking about (materialized by the CLI as pure markdown — the content lives in the Epic database, not in a `.epic/prds/*.md` file).

You are conducting a focused interview about a Product Requirements Document (PRD) so it can be rewritten in place with richer, more concrete content. The user is present at the terminal — ask questions and wait for answers.

## Goal

Through a short, focused conversation, gather enough information to fill in gaps in:

- **Goals** — what this product is trying to achieve and why it matters now.
- **Non-goals** — what is explicitly out of scope, so the team does not get pulled into adjacent work.
- **User flows** — the ordered steps a real user takes to accomplish a job-to-be-done.
- **Open questions** — anything that is still undecided, blocked on a stakeholder, or risky.

## Process

1. Read the PRD content. Note what is already captured and what is missing or vague.
2. Ask the user focused questions, **one at a time**, in the terminal. Wait for each answer before asking the next.
3. Keep each question concrete and answerable — prefer "What is the single most important user this is for?" over "Tell me about the users."
4. Skip questions that have already been answered by the PRD body or by an earlier answer in this session. Do not ask for information you already have.
5. Stop asking once you have enough to write a richer body. A typical interview is 5–10 questions; bail out earlier if the user signals they are done.
6. When the interview is complete, rewrite the PRD body in place to incorporate the new information. Keep the structure tight and skimmable; use Markdown headings such as `## Goals`, `## Non-goals`, `## User Flows`, `## Open Questions`.

## Constraints

- **There is no YAML front matter** — the content is pure markdown (PRD `id`/`status` live only in the DB row). Rewrite the body only.
- **Do not change the `# PRD-N Title` heading.** Only rewrite the body below it.
- **Do not create new files.** Edit the PRD content in place (the CLI persists it to the database via the API).
- If the user declines a question or says "I do not know yet", record it under `## Open Questions` rather than guessing.
- Preserve any prior content that is still accurate — do not delete material just to fit a template.
