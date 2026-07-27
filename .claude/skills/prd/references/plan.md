# Plan PRD

Given the existing PRD the user references, draft or refine its body **in place**. The PRD content lives in the Epic database (the CLI materializes it as pure markdown and PATCHes your edits back via the API); write the body using the Concepts and Specification Format in `SKILL.md`.

## Process

1. Read the PRD content the CLI materialized to understand what is already captured. If the body is empty, draft from scratch; otherwise refine and improve what is there.
2. Rewrite the body below the existing `# PRD-N Title` heading (there is no front matter), following the Specification Format in `SKILL.md`.
3. **Do not create a new file** — edit this PRD's content in place.
4. **There is no front matter to edit** (PRD `id`/`status` live only in the DB row) and **do not change the `# PRD-N Title` heading.** Only rewrite the body below it.
