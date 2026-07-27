# Generate PRD

Given the product or feature **description** the user provides, fill in the PRD body with a complete product requirements document. Write the body using the Concepts and Specification Format in `SKILL.md`.

The CLI materializes the PRD as pure markdown (a `# PRD-N Title` heading, no front matter — the content lives in the Epic database) before invoking you; your job is to write the body. The CLI persists what you write to the database via the API.

## Rules

- **There is no front matter to edit** (PRD `id`/`status` live only in the DB row) and **do not change the `# PRD-N Title` heading.** Only write the body below the heading.
- If the body is empty, draft it from scratch following the Specification Format in `SKILL.md`.
- Capture an MVP — only the most essential commands and operations. Iterate later.
- Keep it tight: every command earns its place by enabling at least one operation in a flow; every operation maps to a concrete user goal.
