# Interview Issue

Read the issue content the user is asking about (materialized by the CLI as pure markdown — the content lives in the Epic database, not in a `.epic/issues/*.md` file).

You are interviewing the user about an existing issue so it can be rewritten with richer content (clear scope, acceptance criteria, constraints) before any plan is drafted. The user is present at the terminal — ask questions and wait for answers.

## Process

1. Read the issue content in full — a `# <ID> <title>` heading followed by the body.
2. Identify gaps. Examples of gaps worth asking about:
   - Vague scope ("Need a search box." — search what? where? returning what?)
   - Missing acceptance criteria (what does "done" look like?)
   - Unstated constraints (performance, compatibility, deadlines, integrations)
   - Ambiguous user / actor (who triggers the behavior, in what context?)
   - Undefined edge cases the title implies (empty state, errors, permissions)
3. Ask the user **one focused question at a time.** Wait for the answer before asking the next. Keep questions short and specific. Do not ask more than ~5–8 questions total — stop when the issue is clearly scoped.
4. When you have enough information, rewrite the body in place in the buffer the CLI provides.

## Rules for the rewrite

- **There is no YAML front matter** — the content is pure markdown. Issue state (`statusId`, `jobStatus`, dependencies, assignee, PRD link) lives only in the DB row and is not yours to write. Rewrite the body only.
- Keep the existing `# <ID> <title>` heading (rename the title only if the user explicitly asks).
- Replace or expand the body with the enriched content. A good body has:
  - A short overview paragraph,
  - A `## Scope` or `## Behavior` section describing what's in/out,
  - A `## Acceptance Criteria` section as a bulleted checklist,
  - A `## Constraints` section if any surfaced during the interview.
- Do NOT add a `# Plan` section — planning is a separate operation (`epic issue plan`).
- Do NOT add a `# Journal` section — journals are appended by other agents, not by interview.
- **Do not create new files.** Edit the content in place (the CLI persists it to the database via the API).

## When you are done

Print a short confirmation summarizing what changed (e.g. "Added acceptance criteria and one constraint about Postgres-only support"). Then exit.
