---
name: plan
description: Update a terminal issue file with a detailed implementation plan following the Epic issue template — Specification (Operation, Rules, Examples, Function/Integration/Model layout) plus ordered Plan steps. Use when the user wants to plan an issue before implementing it. Triggers on "plan an issue", "plan this issue", or "update the issue with a plan".
---

# Plan

Given the issue file the user provides, update it with a detailed implementation plan following the issue template below.

The Specification combines behavioral rules with the technical layout: Rules (When/Then) and Examples with PreState/Steps/PostState come from `docs/references/terminal/specification.md`; Function/Integration/Model layout follows the architecture (Command → Operation → (Service) → Infrastructure) from `docs/references/terminal/architecture.md`. File paths must follow the documented layout.

## Issue Template

```markdown
# [Issue title]

Brief overview of what this issue accomplishes.


# Specification

## Operation: [operation-name]

Directory: `commands/[command]/operations/[operation]/`

[One paragraph describing what this operation does and when users would run it.]

**Headless entry** (`headless/[operation].ts`): pure logic, no Ink. Required for all operations.
**Interactive entry** (`interactive/[operation].tsx`): Ink UI. Include only if the operation renders a persistent interactive view or form.

### Dependencies (optional — omit if none)

1. [prerequisite operation]
2. [another prerequisite operation]

### Rules

#### [Rule Name]
- When:
  - [precondition]
- Then:
  - [expected outcome]

#### [Rule Name]
- When:
  - [precondition]
  - [another precondition — multiple conditions are implicitly AND]
- Then:
  - [expected outcome]

### Examples

#### [Scenario name]

##### PreState
files:
path, content
[path], "[content]"

##### Steps
* Run: epic [command] [operation] [args]
* Check: Output contains "[expected output]"
* Check: [file assertion]

##### PostState
files:
path, content
[path], "[expected content]"

## Function: [operationName](options: [OptionsType]): Promise<[ResultType]>

File: `commands/[command]/operations/[operation]/headless/[operation].ts`

[Single sentence describing what this function does.]

- Given: [typed input parameters received from the command router]
- Returns: [typed result]
- Throws: [error conditions mapped to Rules above]
- Calls: [direct dependencies — other functions, models, integrations]

### Implementation

* Accept typed inputs (never raw argv — the command router parses)
* [Validate preconditions defined in Rules]
* [Call models for file I/O / integrations for shell commands]
* [Extract a service if logic exceeds ~200 lines or is reused across operations]
* Return the typed result

## Integration: [IntegrationName] (if the operation wraps an external tool)

File: `shared/integrations/[integration].ts` (global) or `commands/[command]/shared/integrations/[integration].ts` (command-scoped)

[What external service or CLI this wraps.]

### Methods Used

- `[method](args): Promise<[Result]>`: [what it does]

## Model: [ModelName] (if the operation reads/writes structured files)

File: `shared/models/[model].ts` or `commands/[command]/shared/models/[model].ts`

[What data this manages.]

### Methods Used

- `[method](args): [Result]`: [what it does]


# Plan

Ordered steps with rationale. Each step has a Why and a checklist of tasks.

1. **[Step name]**
   - Why: [reason this step exists]
   - [ ] [task]
   - [ ] [task]

2. **[Step name]**
   - Why: [reason this step exists]
   - [ ] [task]
   - [ ] [task]

3. **[Step name]**
   - Why: [reason this step exists]
   - [ ] [task]


# Notes

Additional implementation considerations and decisions.


# Journal

Append-only log of agent actions. Each entry: `- YYYY-MM-DD HH:MM [agent] — message`. Newest at the bottom; existing entries are never edited.
```

## Naming convention

Issues tend to follow this naming convention:

- Implement [name of the operation] in [name of the command]
- Change [name of the operation] in [name of the command] to X
- Fix [name of the bug] in [name of the operation]

## Process

1. Before writing the plan, read the existing operation folder at `commands/[command]/operations/[operation]/` if it exists, and the router at `commands/[command]/[command].ts`, to understand what is already implemented. Also review any shared models or integrations the operation will depend on. Don't change anything — you are only exploring in this phase.
2. Update the issue file following the issue template. Only update the issue file; don't start implementing yet. Instructions for the Specification and Plan you write:
   - If the operation already exists, focus on what needs to change.
   - Derive the Rules from the spec's behaviors; each Rule maps to a unit or spec test.
   - Keep Examples concrete — include the exact CLI invocation and file paths.
   - Respect the import rules from `docs/references/terminal/architecture.md`: Command → Operation → Service → Infrastructure. No layer may import from layers above it.
   - Plan steps should be ordered so each one is independently shippable; the Why explains the rationale, the checklist breaks it into tasks.
   - Leave the Journal section empty — agents append entries as work is performed.
