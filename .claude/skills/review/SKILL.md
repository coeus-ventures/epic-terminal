---
name: review
description: Review a terminal issue's implementation by inspecting the worktree branch's diff against main and writing a `# Review` section back into the issue file, judging how well the diff matches the Specification. Use after an issue is implemented and you want a written, criteria-checked review captured in the issue. Triggers on "review this issue", "write a review for the issue", or "review the branch against the spec".
---

# Review

You are reviewing the implementation of a terminal issue. Read the issue file, inspect the worktree branch's diff against `main`, and write a `# Review` section back into the issue file summarizing what changed and how well it matches the Specification.

## Workflow

1. Read the issue file the user provides. Identify:
   - The front matter `id` and current `state`.
   - The `# Specification` section (operation, rules, examples).
   - The `# Plan` section (steps and their checklists).
   - The `# Journal` section (if present — captures what agents have already done).
2. Gather the diff. Run from the current working directory (the issue's worktree):
   - `git diff --name-status main...HEAD` — added / modified / deleted files
   - `git diff --stat main...HEAD` — line-count overview
   - `git log --oneline main..HEAD` — commit messages
   - `git diff main...HEAD` — full patch (read selectively; you don't need to dump it all back into the issue)
3. Open and skim the files listed in `git diff --name-status` so the review is grounded in the actual code, not just commit messages.
4. Compose the `# Review` section using the structure below.

## `# Review` Section Structure

The `# Review` section must contain exactly these four subsections, in this order:

```markdown
# Review

## Summary

[1-3 sentences. What does this branch do? Frame it in terms of the issue's stated goal.]

## Acceptance Criteria

- [ ] [criterion derived from a Specification Rule — name the Rule]
- [ ] [criterion derived from a Specification Example — name the scenario]
- [x] [check the box when the diff visibly satisfies the criterion]

(One checklist item per Rule and per Example. Mark `[x]` only when the diff clearly satisfies it; leave `[ ]` when uncertain or unmet, and explain why in Risks below.)

## Files Changed

- `path/to/file.ts` — [one-line note: what changed and why it's part of this issue]
- `path/to/test.spec.ts` — [one-line note]
- ...

(Group related files; skip generated files / lockfiles unless their change is meaningful.)

## Risks / Follow-ups

- [Concern: e.g. "unbounded recursion in X if Y is missing"]
- [Gap: e.g. "Rule Z is not covered by the diff or by a test"]
- [Follow-up: e.g. "extract helper into shared/services once a third caller appears"]

(If nothing is risky, write `None.` rather than omitting the section.)
```

## Write Strategy

Edit the issue file in place. Two cases:

1. **A `# Review` section already exists**: replace its entire body (from the `# Review` heading up to but not including the next `#`-level heading or end of file) with your new content.
2. **No `# Review` section exists**: insert your new section immediately before the `# Journal` heading. If there is no `# Journal` heading either, append the section to the end of the file (preceded by a blank line).

Hard rules:

- **Do not modify the YAML front matter.** Not the `state`, not the `pr`, not any field. The reviewer is not allowed to advance workflow state.
- **Do not modify any other top-level section** (`# Specification`, `# Plan`, `# Notes`, `# Journal`). Their bytes must be identical before and after this run.
- **Do not run git mutating commands.** No `git commit`, `git add`, `git push`, `git merge`, `git rebase`, `git reset`. Only `git diff` / `git log` / `git status` queries.
- **Do not edit files outside the issue file itself.** This operation is documentation-only.

## When you are done

After writing the `# Review` section, print a one-line confirmation on stdout in the form `Review written to <absolute issue file path>`, then exit normally.
