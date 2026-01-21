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
| **cli.ts** | Top-level router for all commands |

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
| Command unit tests | `commands/{command}/` | `{command}.test.ts` |
| Command spec tests | `commands/{command}/` | `{command}.spec.ts` |
| Operation | `commands/{command}/{operation}/` | `{operation}.ts` |
| Operation unit tests | `commands/{command}/{operation}/` | `{operation}.test.ts` |
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
    issue.ts              <- Command router
    issue.test.ts         <- Unit tests (call functions directly)
    issue.spec.ts         <- Spec tests (spawn CLI process)
    shared/
      models/
        issue.ts          <- Issue file read/write
      services/
        issue-sync.ts     <- Complex sync business logic
    get/
      get.ts              <- Operation
      get.test.ts         <- Operation unit tests
    new/
      new.ts
      new.test.ts
    sync/
      sync.ts
      sync.test.ts
  project/
    project.ts
    project.spec.ts       <- Spec tests for project command
    shared/
      models/
        project.ts
    new/
      new.ts
      new.test.ts
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
| Unit test files | `.test.ts` suffix | `sync.test.ts` |
| Spec test files | `.spec.ts` suffix | `issue.spec.ts` |

---

## Testing Strategy

The CLI uses two types of tests:

### Unit Tests (`.test.ts`)

Unit tests call functions directly without spawning processes. They test operations and services in isolation.

**Location**: Co-located with the code being tested
- `commands/{command}/{operation}/{operation}.test.ts`
- `commands/{command}/{command}.test.ts`

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

### Spec Tests (`.spec.ts`)

Spec tests spawn actual terminal processes to run CLI commands. They validate real-world behavior end-to-end.

**Location**: At the command level
- `commands/{command}/{command}.spec.ts`

**Characteristics**:
- Spawn `bun run cli.ts` as subprocess
- Test against temporary git repositories
- Validate stdout, stderr, and exit codes
- Verify file system changes
- Slower but higher confidence

```typescript
// issue.spec.ts
import { runCli, setupTestRepo } from '../../shared/test/index.ts';

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
| Testing operation business logic | Unit test |
| Testing argument parsing | Spec test |
| Testing CLI output format | Spec test |
| Testing file creation/modification | Both |
| Testing error messages | Spec test |
| Testing integration between layers | Spec test |

---

## Adding a New Operation

1. Create folder: `commands/{command}/{operation}/`
2. Create operation file: `{operation}.ts`
3. Create test file: `{operation}.test.ts`
4. Export main function from operation file
5. Import and route in `{command}.ts`

---

## Adding a New Command

1. Create folder: `commands/{command}/`
2. Create command router: `{command}.ts`
3. Create spec tests: `{command}.spec.ts`
4. Create operations as subfolders
5. Add route in `cli.ts`
