---
name: execute
description: Execute a terminal issue end-to-end following the Epic Command/Operation/Service/Infrastructure architecture — implement the headless entry, optional interactive entry, services, infrastructure, wire the router, and write unit/spec/behavior tests. Use when the user wants to implement a planned issue. Triggers on "execute an issue", "implement this issue", or "build out this operation".
---

# Execute

Implement a complete terminal issue following the architecture from `docs/references/terminal/architecture.md` and the spec format from `docs/references/terminal/specification.md`.

## Architecture

```
Command        commands/[command]/[command].ts           (parse args, route)
  -> Operation commands/[command]/operations/[operation]/
       headless/[operation].ts                           (pure logic, no Ink)
       interactive/[operation].tsx                       (Ink UI — only when needed)
         -> Service (optional)                           (complex business logic)
              -> Infrastructure  shared/ or commands/[command]/shared/
                                 (models, integrations)
```

Data flows top to bottom. No layer may import from layers above it.

## Command Structure Issue

IF the issue is to implement a new command:

1. Create the folder structure:

```
commands/[command]/
  [command].ts              # Router — parses args, routes to operations
  operations/               # One folder per operation
    [operation]/
      headless/
        [operation].ts      # Headless entry — pure logic
        tests/
          [operation].test.ts  # Unit tests
          [operation].spec.ts  # End-to-end spec tests
      interactive/          # Only for operations with a persistent Ink UI
        [operation].tsx     # Ink entry — composes behaviors
        behaviors/          # One folder per user-triggered interaction
          [behavior-name]/
            hooks/
            tests/
  shared/                   # (Optional) command-scoped shared code
    models/
    integrations/
    services/
    behaviors/              # Behaviors shared across 2+ operations
```

2. Implement the router in `[command].ts`:
   - Parse CLI arguments into typed data structures
   - Route parsed data to operation functions (never pass raw `argv` to an operation)
   - Handle `--help` / `-h`
   - Surface top-level errors to the user with a non-zero exit code

3. Register the command in `epic.ts`.

## Operation Issue

IF the issue is to implement an operation:

### 1. Reuse or extend shared infrastructure

Start at the narrowest scope and promote only when a second consumer appears.

- **Operation-level** (default): helpers that exist only inside the operation folder.
- **Command-level shared** (`commands/[command]/shared/`): used by 2+ operations within the same command.
- **Global shared** (`shared/`): used by 2+ commands.

Infrastructure categories:
- `models/` — data access and file-based storage
- `integrations/` — external service clients (e.g. `gh`, `git`)
- `services/` — reusable business logic extracted from operations

### 2. Implement the headless entry

**Location**: `commands/[command]/operations/[operation]/headless/[operation].ts`

The headless entry is required for every operation. It contains pure logic — no Ink, no rendering, no JSX.

Implementation steps:
1. Export an async function named after the operation (e.g. `syncIssue`, `createProject`).
2. Accept typed data, not raw argv:
   ```typescript
   async function syncIssue(options: SyncOptions): Promise<SyncResult>
   ```
3. Orchestrate calls to models, integrations, and services.
4. Return a typed result or throw a descriptive error mapped to a Rule from the Specification.

The headless entry **must not**:
- Parse CLI arguments (that is the command router's job)
- Execute shell commands directly (use an integration)
- Parse external data formats directly (use a model)
- Import Ink, React, or any rendering code

### 3. Implement the interactive entry (only when needed)

**Location**: `commands/[command]/operations/[operation]/interactive/[operation].tsx`

Add an interactive entry only when the operation renders a persistent Ink view (a form, a list, a live-updating panel). Operations that print output and exit do not need one.

The interactive entry:
- Is a thin Ink component that composes behaviors and presents output
- Contains no business logic — it calls the headless entry or delegates to behaviors
- Each user-triggered interaction (key binding, form submission) lives in its own behavior folder:

```
interactive/behaviors/[behavior-name]/
  hooks/use-[behavior].ts(x)
  tests/[behavior].spec.tsx
```

Behaviors shared across 2+ operations of the same command go in `commands/[command]/shared/behaviors/`.

### 4. Extract a service (only when needed)

Extract to `services/` when:
- The operation exceeds ~200 lines, OR
- Logic is reused across 2+ operations

Scope the service to match its consumers:
- `commands/[command]/shared/services/[service].ts` — within one command
- `shared/services/[service].ts` — across commands

### 5. Wire the operation into the router

**Location**: `commands/[command]/[command].ts`

- Import the operation function(s) from their new paths
- Route the parsed, typed arguments to them
- Update `--help` output

### 6. Write tests

**Unit tests** (headless logic):

Location: `commands/[command]/operations/[operation]/headless/tests/[operation].test.ts`

- Call the headless function directly with typed inputs
- Cover each Rule from the Specification (happy paths and error paths)
- Use isolated temp directories; clean up in `beforeEach` / `afterEach`

**Spec tests** (end-to-end, headless):

Location: `commands/[command]/operations/[operation]/headless/tests/[operation].spec.ts`

- Spawn the CLI via `runCli` from `shared/test/`
- Assert on stdout, stderr, exit code, and file system changes
- Required for any user-visible behavior: new arguments, flags, output strings, error messages, exit codes

**Behavior tests** (interactive, when applicable):

Location: `commands/[command]/operations/[operation]/interactive/behaviors/[b]/tests/[b].spec.tsx`

- Render behavior hooks with `ink-testing-library`
- Cover each interaction flow for that behavior

**Run tests:**

```bash
bun test commands/[command]/operations/[operation]/
```

## Common Patterns

1. **Typed boundaries**: operations receive and return typed data structures — never raw argv, never untyped blobs.
2. **Infrastructure is the boundary**: shell commands live in integrations, file I/O lives in models. Operations orchestrate, they don't `spawn` or `readFileSync`.
3. **`.ts` extensions in imports**: Bun supports them natively (e.g. `import { foo } from './bar.ts'`).
4. **Bun APIs first**: prefer `Bun.file()`, `Bun.write()`, `Bun.spawn()` over Node equivalents.
5. **Descriptive errors**: throw with a message that the command router can surface directly to the user.
6. **headless vs interactive**: if the operation exits immediately after producing output, headless only is correct — no interactive entry needed.

## Testing Checklist

- [ ] Unit test for each Rule (happy path + error cases) defined in the Specification
- [ ] Spec test for every new or changed CLI argument, flag, output string, or exit code
- [ ] Temp directories are isolated per test and cleaned up in `afterEach`
- [ ] Behavior tests for each interactive key binding / form submission (if interactive entry exists)
