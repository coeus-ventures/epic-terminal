---
name: merge
description: Merge an issue's feature branch into the project's target branch from the main repo, resolving conflicts in favor of the feature branch's intent, or aborting cleanly when a conflict needs human judgment. Use when an issue is verified and approved and its branch should land on the target branch. Triggers on "merge this issue", "merge the branch into main", or "land this feature branch".
---

# Merge

You are merging an issue's feature branch into the project's target branch. The CLI has already verified the branch exists, has commits ahead of the target branch, and that you are running in the **main repo** (not the feature worktree). The CLI provides the issue id and title, the feature branch name, the target branch name, and the worktree path (for reference only — never run commands there).

## Workflow

1. Confirm you are in the main repo's working tree (`pwd` should match the main repo root, not the worktree path).
2. Confirm the target branch is currently checked out (`git rev-parse --abbrev-ref HEAD`). If a different branch is checked out, abort with a one-line error explaining the situation and exit non-zero. Do **not** run `git checkout` to switch.
3. Run `git merge --no-ff <feature-branch>` in the main repo.
4. If the merge succeeds (exit 0, no conflict markers, `MERGE_HEAD` cleaned up by git): you are done. Emit a one-line summary `Merged <feature-branch> into <target-branch> for <issue-id>` and stop.
5. If the merge surfaces conflicts:
   - Inspect each conflicting file with `git status` and the unified diff. Read both versions before editing.
   - Resolve each conflict by editing the file in the main repo (not the worktree). Prefer the resolution that preserves the feature branch's intent — the worktree contains the canonical implementation for this issue.
   - After resolving every conflicting file, `git add` the resolved paths and run `git commit --no-edit` to finalize the merge commit.
   - Emit the one-line summary above and stop.
6. If the conflict is genuinely unresolvable (the rule or example in the issue file is ambiguous, both sides need a human judgment call, or a file is binary and you cannot reason about it):
   - Run `git merge --abort` so the main repo is left clean — no `MERGE_HEAD`, no half-applied changes, no conflict markers in the working tree.
   - Print a one-line summary of which files conflicted and why you stopped.
   - Exit non-zero. The CLI preserves the worktree and branch so the operator can resolve the conflict manually.

## Hard rules

- **Run only inside the main repo.** Do not `cd` into the worktree path. Do not run git commands with `-C <worktree-path>`.
- **No destructive operations against the target branch.** Never `git reset --hard`, never `git push --force`, never delete tags or branches other than the merge target on success (the CLI removes the worktree and feature branch after you exit cleanly).
- **No force-push.** This operation is local. The push step is owned by the CLI.
- **Do not modify the feature branch.** Conflict resolution edits land on the target branch as part of the merge commit, not on the feature branch.
- **Do not edit the issue file.** Its `state` field is owned by the CLI build lifecycle.
- **Exit non-zero on failure.** The CLI relies on your exit code to decide whether to clean up the worktree.
