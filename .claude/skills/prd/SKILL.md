---
name: prd
description: Author and break down a Product Requirements Document (PRD) in .epic/prds for a terminal CLI, capturing the MVP commands, operations, and flows. Works in three modes — generate a brand-new PRD from a description, plan (fill in / refine) the body of an existing PRD in place, or break an existing PRD into implementation issues. Use when the user wants to spec out a new CLI or feature, flesh out a PRD, or turn a PRD into issues. Triggers on "create a PRD", "generate a PRD", "write a PRD", "plan this PRD", "break the PRD into issues", or "spec out this CLI".
---

# PRD

Author and break down a Product Requirements Document in `.epic/prds/` for a terminal CLI project. This skill works in three modes. Pick the mode first, then follow its reference, using the shared concepts and format below for the modes that write the PRD body.

This mirrors the `epic prd generate`, `epic prd plan`, and `epic prd break` CLI commands, merged into one skill.

## Choosing the mode

- **generate** — there is no PRD yet (or only an empty scaffold). The user hands you a product or feature **description** and wants the PRD body written from it. → Follow `references/generate.md`.
- **plan** — a PRD file already exists and its body should be drafted or refined **in place**. → Follow `references/plan.md`.
- **break** — a PRD file already exists and the user wants it turned into implementation **issues** in `.epic/issues/`. This mode reads the PRD and creates issue files; it does not edit the PRD body. → Follow `references/break.md`.

Route by what the user asks for:

- "break the PRD" / "turn it into issues" / `prd break` → **break**.
- A description with no existing PRD body → **generate**.
- An existing PRD to flesh out / refine → **plan**.

If it is genuinely ambiguous, ask which one before starting.

## Concepts (both modes)

- Capture an **MVP** — only the most essential commands and operations. Iterate later.
- Focus on the project's core **job to be done**.
- An **Operation** is an action the user can perform within a Command.
- A **job story** focuses on the job a user is trying to accomplish rather than the user themselves, emphasizing the context, motivation, and desired outcome:

  ```
  When <situation>, I want to <motivation>, so I can <expected outcome>.
  ```

- A **Flow** is a user workflow that connects operations across commands in order; each step depends on the ones before it. Flows capture the implicit dependencies between operations. Capture them carefully — the **break** mode uses Flows to order issues and populate each issue's `depends_on`.

## Specification Format (both modes)

Write the PRD **body** using this exact structure (the front matter and `# PRD-N Title` heading sit above it and are handled by the mode reference):

```
## Overview

[Brief description of what this CLI does and its purpose]

## [command-name]

[Brief command description and when to use it]

### Arguments & Flags

- `<required-arg>`: [What this argument represents]
- `[optional-arg]`: [What this optional argument does]
- `--flag-name`: [What this flag enables/changes]

### Operations

- **[operation-name]**: [Single sentence describing what this operation does]
- **[operation-name]**: [Single sentence describing what this operation does]

## [command-name]

[Brief command description]

### Arguments & Flags

- `<required-arg>`: [Description]
- `--flag`: [Description]

### Operations

- **[operation-name]**: [Description]

## Flows

### [Flow Name]
[One sentence describing the user goal]

1. [verb] [subject] -- command operation
2. [verb] [subject] -- command operation
3. [verb] [subject] -- command operation

### [Flow Name]
[One sentence describing the user goal]

1. [verb] [subject] -- command operation
2. [verb] [subject] -- another-command operation
```

Keep it tight: every command earns its place by enabling at least one operation in a flow; every operation maps to a concrete user goal. Once the PRD is written, the **break** mode turns it into individual implementation issues.

## References

- `references/generate.md` — fill in the body of a new (or scaffolded) PRD from a description.
- `references/plan.md` — draft or refine the body of an **existing** PRD in place.
- `references/break.md` — break an **existing** PRD into implementation issues.
