# Command-Operation Architecture Reference

> A three-layer model that separates CLI routing, business logic, and external integrations.

## Architecture Overview

```
+---------------------------+
|      COMMAND LAYER        |
|   issue.ts, project.ts    |
|   (Routing/CLI parsing)   |
+---------------------------+
              |
              v
+---------------------------+
|     OPERATION LAYER       |
|   sync/, new/, close/     |
|   (Orchestration)         |
+---------------------------+
              |
              v
+---------------------------+
|      SERVICE LAYER        |
|   (Complex business logic)|
|   (Optional)              |
+---------------------------+
              |
              v
+---------------------------+
|   INFRASTRUCTURE LAYER    |
|   Models + Integrations   |
|   (External integrations) |
+---------------------------+
```

**Critical Rule**: Data flows top to bottom only. No layer may import from layers above it.

---

## Layer Responsibilities

### Command Layer

| Component | Responsibility |
|-----------|----------------|
| **Command files** | Parse CLI arguments, route to operations |
| **epic.ts** | Top-level router for all commands |

**Location**: `commands/{command}/{command}.ts`

**Must only**:
- Parse and validate CLI arguments
- Transform arguments into typed data structures
- Call operation functions with parsed data
- Handle top-level errors and user output

**Must NOT**:
- Contain business logic
- Make API calls
- Read/write files directly

**Key principle**: Commands parse arguments and pass typed data to operations. Operations never see raw `argv` or CLI strings. This makes operations easy to test without simulating CLI input.

---

### Operation Layer

| Component | Responsibility |
|-----------|----------------|
| **Operations** | Orchestrate a single action, coordinate services and infrastructure |
| **Tests** | Co-located tests for each operation |

**Location**: `commands/{command}/{operation}/{operation}.ts`

**Receives**: Typed data structures from Command layer (not raw arguments)

**May**:
- Orchestrate service and infrastructure calls
- Call other operations
- Coordinate multiple integrations
- Return typed results

**Must NOT**:
- Parse CLI arguments
- Execute shell commands directly
- Parse external data formats directly

**Key principle**: Operations receive parsed, typed inputs and return typed outputs. This makes them easy to unit test by passing data directly without CLI simulation.

```typescript
// Good: Operation receives typed data
async function syncIssue(options: { issueId: string; force: boolean }) { ... }

// Bad: Operation parses arguments
async function syncIssue(args: string[]) { ... }
```

---

### Service Layer (Optional)

| Component | Responsibility |
|-----------|----------------|
| **Services** | Complex, reusable business logic |

**Location**: `shared/services/` or `commands/{command}/shared/services/`

**When to use**: Extract to a service when:
- Business logic is complex enough to warrant its own tests
- Logic is reused across multiple operations
- Operation file becomes too large (>200 lines)

**May**:
- Contain complex business logic
- Call infrastructure (models, integrations)
- Be shared across operations

**Must NOT**:
- Parse CLI arguments
- Import from Command or Operation layers
- Handle user output directly

**Key principle**: Services are like controllers in web development. When an operation grows too complex, extract the business logic into a service. The operation becomes a thin orchestrator.

```typescript
// Before: Complex operation
async function syncIssue(options: SyncOptions) {
  // 200+ lines of business logic
}

// After: Operation orchestrates service
async function syncIssue(options: SyncOptions) {
  const service = new IssueSyncService();
  return service.sync(options);
}
```

---

### Infrastructure Layer

| Component | Responsibility |
|-----------|----------------|
| **Models** | Data access and file-based storage |
| **Integrations** | External service clients (GitHub, Git) |

**Location**: `shared/` or `commands/{command}/shared/`

**May**:
- Execute shell commands (`gh`, `git`)
- Read/write files
- Parse data formats (YAML, JSON)
- Access external APIs

**Must NOT**:
- Import from Command or Operation layers
- Contain business logic

#### Models

| Model | Responsibility | File |
|-------|----------------|------|
| **issue** | Issue file read/write, front matter | `commands/issue/shared/models/issue.ts` |
| **settings** | Config file management | `shared/models/settings.ts` |

#### Integrations

| Integration | Responsibility | File |
|-------------|----------------|------|
| **github** | GitHub API via `gh` CLI | `shared/integrations/github.ts` |
| **git** | Git operations | `shared/integrations/git.ts` |

---

## File Locations

| Component | Location | File Pattern |
|-----------|----------|--------------|
| Command router | `commands/{command}/` | `{command}.ts` |
| Operation | `commands/{command}/{operation}/` | `{operation}.ts` (or `.tsx` for Ink UI) |
| Operation unit tests | `commands/{command}/{operation}/` | `{operation}.test.ts` |
| Operation component tests | `commands/{command}/{operation}/` | `{operation}.test.tsx` |
| Operation spec tests | `commands/{command}/{operation}/tests/` | `{operation}.spec.ts` |
| Command shared | `commands/{command}/shared/` | `services/`, `models/`, `integrations/` |
| Global shared | `shared/` | `services/`, `models/`, `integrations/`, `test/` |
| Test helpers | `shared/test/` | `cli.ts`, `index.ts` |

---

## Example Structure

```
shared/
  models/
    settings.ts           <- Global config management
  integrations/
    github.ts             <- GitHub API via gh CLI
    git.ts                <- Git operations
  test/
    cli.ts                <- Test helpers (runCli, setupTestRepo)
    index.ts              <- Test helper exports

commands/
  issue/
    issue.ts                          <- Command router (routing only)
    shared/
      models/
        issue.ts                      <- Issue file read/write
      services/
        issue-sync.ts                 <- Complex sync business logic
    get/
      get.ts                          <- Operation
      get.test.ts                     <- Unit tests (call functions directly)
    new/
      new.ts                          <- Operation entry point
      new-interactive.tsx             <- Ink/React UI
      new-interactive.test.tsx        <- Component tests (ink-testing-library)
    sync/
      sync.ts
      sync.test.ts
    build/
      build.tsx
      tests/
        build.spec.ts                 <- Spec tests (spawn CLI process)
  project/
    project.ts
    shared/
      models/
        project.ts
    new/
      new.ts
      new-interactive.tsx
      new-interactive.test.tsx
      tests/
        new.spec.ts
```

---

## Import Rules

| From / To | Command | Operation | Service | Infrastructure |
|-----------|---------|-----------|---------|----------------|
| **Command** | Yes | Yes | No | No |
| **Operation** | No | Yes | Yes | Yes |
| **Service** | No | No | Yes | Yes |
| **Infrastructure** | No | No | No | Yes |

- Commands import operations only
- Operations import services and infrastructure (models, integrations)
- Services import other services and infrastructure
- Infrastructure imports only other infrastructure
- No layer imports from layers above it

---

## Sharing Hierarchy

Code can be shared at three levels, following the same structure at each scope:

```
shared/                              <- Global: shared across all commands
  services/
  models/
  integrations/

commands/{command}/
  shared/                            <- Command-level: shared between operations
    services/
    models/
    integrations/
  {operation}/
    {operation}.ts                   <- Operation-level: specific to this operation
```

### Scope Rules

| Scope | Location | Shared Between |
|-------|----------|----------------|
| **Operation** | `commands/{command}/{operation}/` | Nothing (operation-specific) |
| **Command** | `commands/{command}/shared/` | Operations within the same command |
| **Global** | `shared/` | All commands and operations |

### When to Use Each Level

**Operation-level** (default):
- Helpers and logic specific to one operation
- Start here; promote to higher levels only when needed

**Command-level shared**:
- Services, models, or integrations used by 2+ operations in the same command
- Example: issue model used by sync, start, and close operations

**Global shared**:
- Services, models, or integrations used by 2+ commands
- Core utilities used throughout the CLI
- Example: GitHub integration used by issue and project commands

### Example

```
shared/
  integrations/
    github.ts               <- used by issue and project commands
    git.ts                  <- used by multiple commands
  models/
    settings.ts             <- global config management

commands/
  issue/
    shared/
      models/
        issue.ts            <- issue file read/write
      services/
        issue-sync.ts       <- complex sync logic
    sync/
      sync.ts               <- uses shared/models/issue.ts
    start/
      start.ts              <- uses shared/models/issue.ts
    close/
      close.ts              <- uses shared/models/issue.ts
  project/
    shared/
      models/
        project.ts
    new/
      new.ts
```

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Command | lowercase | `issue`, `project` |
| Operation | lowercase verb | `sync`, `new`, `close` |
| Operation folder | matches operation name | `sync/sync.ts` |
| Ink UI files | `.tsx` extension | `new-interactive.tsx` |
| Unit test files | `.test.ts` suffix | `sync.test.ts` |
| Component test files | `.test.tsx` suffix | `viewer.test.tsx` |
| Spec test files | `.spec.ts` suffix | `build.spec.ts` |

---

## Testing Strategy

The CLI uses three test types, each with a distinct suffix and runner:

| Type | Suffix | Runner | Use for |
|---|---|---|---|
| **Unit** | `.test.ts` | `bun:test`, direct function calls | Pure logic in `shared/`, models, services |
| **Component** | `.test.tsx` | `ink-testing-library` | Ink components — rendering, key handling, phase transitions |
| **Spec** | `.spec.ts` | `runCli()` from `shared/test/` | End-to-end: spawns `epic.ts`, asserts on stdout/stderr/exit/files |

`bunfig.toml` excludes `sandbox/**` and `.worktrees/**` from test discovery.

### Unit Tests (`.test.ts`)

Unit tests call functions directly without spawning processes. They test operations and services in isolation.

**Location**: Co-located with the code being tested — `commands/{command}/{operation}/{operation}.test.ts`, or under `shared/.../*.test.ts` for shared library code.

**Characteristics**:
- Fast execution
- Mock external dependencies (GitHub, git)
- Test individual functions with typed inputs
- Good for testing business logic

```typescript
// sync/sync.test.ts
import { syncIssue } from './sync.ts';

test('syncs issue to GitHub', async () => {
  const result = await syncIssue({ issueId: 'TEST-1', direction: 'push' });
  expect(result.status).toBe('success');
});
```

### Component Tests (`.test.tsx`)

Component tests render Ink/React components in-process using `ink-testing-library`. They cover the rendering surface — what reaches `lastFrame()` after a sequence of events or keystrokes — without spawning the CLI or depending on a real TTY.

**Location**: Co-located with the component — `{operation}-interactive.test.tsx` next to `{operation}-interactive.tsx`, or `{component}.test.tsx` next to a shared component.

**Pattern** (canonical example: `shared/integrations/agents/viewer.test.tsx`):
- Render with `interactive={true}` so `useInput` activates without a real TTY
- For components driven by async streams, subclass the producer (e.g., `TestSession extends AgentSession`) and `push()` events from the test
- Use a `flush()` helper (`setImmediate` x2-3) between actions and assertions so React commits and any async tail loops drain
- Assert on `lastFrame()` for snapshot-style checks, `frames` for full render history, `stdin.write(...)` for input

```typescript
// viewer.test.tsx
import { render } from 'ink-testing-library';
import { Viewer } from './viewer.tsx';

test('renders assistant text content into the feed', async () => {
  const { session, repo } = setup();
  const { lastFrame, unmount } = render(
    <Viewer session={session} pid={FAKE_PID} interactive />,
  );
  try {
    session.push({
      type: 'assistant',
      raw: { message: { content: [{ type: 'text', text: 'planning the change' }] } },
    });
    await flush();
    expect(lastFrame()).toContain('planning the change');
  } finally {
    unmount();
    repo.cleanup();
  }
});
```

What component tests deliberately don't cover: real subprocess spawns, file/network IO triggered by side-effecting actions, real TTY behavior. Push those down to spec tests.

### Spec Tests (`.spec.ts`)

Spec tests spawn an actual `bun run epic.ts` subprocess to validate end-to-end behavior.

**Location**: Per-operation, under a `tests/` subfolder — `commands/{command}/{operation}/tests/{operation}.spec.ts`. Each operation owns its own spec; the command-level router file (`{command}.ts`) is routing-only and doesn't need its own spec.

**Characteristics**:
- Spawn `bun run epic.ts` as subprocess
- Test against temporary git repositories from `setupTestRepo()`
- Validate stdout, stderr, and exit codes
- Verify file system changes
- Slower but higher confidence; use sparingly for the golden path and shape-of-output assertions

```typescript
// commands/project/new/tests/new.spec.ts
import { runCli, setupTestRepo } from '../../../../shared/test/index.ts';

test('creates issue file', async () => {
  const repo = setupTestRepo();
  const result = await runCli(['issue', 'new', 'Test', '--no-sync'], { cwd: repo.path });

  expect(result.exitCode).toBe(0);
  expect(result.stdout).toContain('TEST-1');
  repo.cleanup();
});
```

### Test Helpers

Global test utilities live in `shared/test/`:

| Helper | Purpose |
|--------|---------|
| `runCli(args, options)` | Spawn CLI process, capture output |
| `setupTestRepo(options)` | Create temp directory with git and settings |
| `createIssueFile(repo, options)` | Create test issue files |

### When to Use Each

| Scenario | Test Type |
|----------|-----------|
| Pure business logic in an operation or service | Unit |
| Helpers in `shared/` (parsers, formatters, models) | Unit |
| Ink component rendering, key bindings, phase transitions | Component |
| Stream-driven UI (event-to-frame mapping) | Component |
| Argument parsing, CLI output format, exit codes | Spec |
| End-to-end behavior across layers (subprocess + temp repo + `gh` stubs) | Spec |
| Error messages surfaced to the user | Spec |

Do **not** use `.unit.ts`. Use `.test.ts` for unit, `.test.tsx` for component, `.spec.ts` for spec.

---

## Adding a New Operation

1. Create folder: `commands/{command}/{operation}/`
2. Create operation file: `{operation}.ts` (or `{operation}.tsx` if it renders Ink UI)
3. Add tests next to it as needed:
   - `{operation}.test.ts` for unit tests
   - `{operation}-interactive.test.tsx` for Ink component tests
   - `tests/{operation}.spec.ts` for end-to-end specs
4. Export the main function and route to it in `{command}.ts`

---

## Adding a New Command

1. Create folder: `commands/{command}/`
2. Create command router: `{command}.ts` (routing only)
3. Create operations as subfolders, each with its own tests as above
4. Add the route in `epic.ts`
