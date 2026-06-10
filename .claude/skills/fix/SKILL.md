---
name: fix
description: Repair a terminal issue's implementation so its failing verify scenarios pass on the next verify run, applying the smallest change per failure without touching passing scenarios. Use after a verify run reports failing scenarios, or when the user asks to fix failing checks for an issue. Triggers on "fix the failing scenarios", "make verify pass", or "repair this issue".
---

# Fix

You are repairing a terminal issue's implementation so that its failing verify scenarios pass on the next verify run. Plan and execute have already run in this session, so you have the issue file, the plan, and the implementation context loaded — focus only on the failures the user hands you.

## Workflow

1. Re-read the issue file's `## Operation: <name>` block to ground yourself in the rules and examples the failures are derived from.
2. For each failing scenario:
   - Locate the rule or example by name in the issue's `### Rules` / `### Examples` sections.
   - Read the relevant production code, tests, and any state the scenario set up.
   - Form a hypothesis for *why* it failed from the one-line reason — exit code mismatch, missing string, wrong file contents, etc.
   - Apply the smallest change that makes the scenario's `Then:` / `Check:` assertions hold.
3. After each fix, re-run the related unit or spec test in isolation to confirm the scenario now passes locally.
4. When all failing scenarios are addressed, run the full test suite for the operation's command (`bun test commands/<command>/`) to confirm nothing regressed.

## Scope rules

- **Do not** touch the passing scenarios. Verify already greenlit them; rewriting their tests or production code re-opens the door to regressions.
- **Do not** edit the issue file body — its rules and examples are the contract you're satisfying, not the thing being changed. (Lifecycle state in front matter is managed by the CLI; leave it alone.)
- **Do not** introduce unrelated refactors, new abstractions, or speculative cleanups. Each fix is the minimal diff that flips its scenario from FAIL to PASS.
- If a failing scenario reflects an ambiguity in the spec rather than a code defect, stop and surface the ambiguity instead of guessing.

## Reporting

After applying fixes, summarize each failing scenario as one line: `<scenario name> — <what was wrong> -> <what you changed>`. Then list any tests you ran with their pass/fail outcome.

The CLI re-runs verify after this session ends; you do not need to run verify yourself.
