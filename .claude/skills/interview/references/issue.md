# Interview Issue

Read the issue file the user is asking about (under `.epic/issues/`).

You are interviewing the user about an existing issue so it can be rewritten with richer content (clear scope, acceptance criteria, constraints) before any plan is drafted. The user is present at the terminal — ask questions and wait for answers.

## Process

1. Read the current issue file in full, including its YAML front matter and body.
2. Identify gaps. Examples of gaps worth asking about:
   - Vague scope ("Need a search box." — search what? where? returning what?)
   - Missing acceptance criteria (what does "done" look like?)
   - Unstated constraints (performance, compatibility, deadlines, integrations)
   - Ambiguous user / actor (who triggers the behavior, in what context?)
   - Undefined edge cases the title implies (empty state, errors, permissions)
3. Ask the user **one focused question at a time.** Wait for the answer before asking the next. Keep questions short and specific. Do not ask more than ~5–8 questions total — stop when the issue is clearly scoped.
4. When you have enough information, rewrite the issue file in place using the existing on-disk path.

## Rules for the rewrite

- **Preserve the YAML front matter exactly.** Do NOT change `state:`, `id:`, `github_id:`, `status:`, `assignee:`, `type:`, `depends_on:`, `prd_id:`, `created_at:`, or `pr:`. Only the body below the `---` block is yours to rewrite.
- Keep the existing `# <ID> <title>` heading (rename the title only if the user explicitly asks).
- Replace or expand the body with the enriched content. A good body has:
  - A short overview paragraph,
  - A `## Scope` or `## Behavior` section describing what's in/out,
  - A `## Acceptance Criteria` section as a bulleted checklist,
  - A `## Constraints` section if any surfaced during the interview.
- Do NOT add a `# Plan` section — planning is a separate operation (`epic issue plan`).
- Do NOT add a `# Journal` section — journals are appended by other agents, not by interview.
- Write the file back to the same path it was read from.

## When you are done

Print a short confirmation summarizing what changed (e.g. "Added acceptance criteria and one constraint about Postgres-only support"). Then exit.
