# Generate PRD

Given the product or feature **description** the user provides, fill in the PRD body with a complete product requirements document. Write the body using the Concepts and Specification Format in `SKILL.md`.

The CLI creates the PRD file (with front matter and a `# PRD-N Title` heading) before invoking you; your job is to write the body.

## Rules

- **Do not edit the front matter** (`id`, `status`) or the `# PRD-N Title` heading. Only write the body below the heading.
- If the file already has an empty body, draft it from scratch following the Specification Format in `SKILL.md`.
- Capture an MVP — only the most essential commands and operations. Iterate later.
- Keep it tight: every command earns its place by enabling at least one operation in a flow; every operation maps to a concrete user goal.
