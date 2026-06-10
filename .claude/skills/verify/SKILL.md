---
name: verify
description: Verify that an implemented terminal issue works by exercising it from the shell, running every rule and example from the issue's Specification and reporting PASS/FAIL per scenario. Use after implementing an issue, or when the user asks to verify/confirm a CLI behavior works. Triggers on "verify this issue", "verify the operation", or "check the issue works".
---

# Verify

You are verifying that a terminal issue's implementation is working correctly by exercising it from the shell.

## Workflow

1. Read the issue file. Locate its `# Functional Specification` section.
2. Inside it, find the `## Operation: <name>` block. Treat that block as the source of truth for what to verify.
3. Enumerate **every scenario** you need to verify:
   - **Each `#### <rule-name>` under `### Rules`** — a rule is a declarative `When:` / `Then:` constraint. Treat it as one verifiable scenario: set up the When conditions, then check that the Then outcomes hold.
   - **Each `#### <example-name>` under `### Examples`** — a worked walkthrough with optional `#### PreState`, required `#### Steps` (using `Run:` / `Check:` keywords), and optional `#### PostState`. Follow the Steps in order.
4. For each scenario, in order:
   - If the scenario has `#### PreState`, set up the listed files / git state / sidecar contents using `Write` / `Bash` before invoking the CLI.
   - Drive the CLI per the rule's `When:` conditions or the example's `Run:` steps. Use `Bash` to invoke commands; capture stdout, stderr, and the exit code.
   - Confirm the rule's `Then:` outcomes or the example's `Check:` assertions match — exact strings where the spec is exact, semantic match where it's described in prose.
   - If the scenario has `#### PostState`, inspect the resulting files / sidecar via `Read` / `Glob` / `Grep` and confirm they match.
   - Record: PASS or FAIL, with a one-line reason.

## Running commands

Use the `Bash` tool to invoke the CLI. Examples:

```bash
# happy path
epic issue list

# command that should fail — capture exit code explicitly
epic issue plan NONEXISTENT-999
echo "exit: $?"

# stdin-driven scenario
printf 'y\n' | epic issue close PROJ-1
```

When the spec describes filesystem effects (created files, sidecar contents, gitignore entries), inspect them with `Read` / `Glob` / `Grep` rather than re-running the CLI.

When verifying state-mutating scenarios, work in a throwaway directory (e.g., `mktemp -d`) so you don't touch the user's real `.epic/` or `.git`.

## Verification Report

After verifying all scenarios, print a report with exactly this shape:

```
── Verification Report ─────────────────
[PASS] <scenario name>   <one-line reason>
[FAIL] <scenario name>   <one-line reason>
...

Score: <passed>/<total> scenarios passed
```

If a scenario fails, the one-line reason should describe what was expected vs what actually happened (exit codes, missing strings, wrong file contents, etc.). If any scenario fails, hand the failures to the **fix** skill, then verify again.
