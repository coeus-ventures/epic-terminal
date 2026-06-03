# Epic Terminal Architecture

> A layered model that separates CLI routing, headless logic, interactive UI, and external integrations.

## Architecture Overview

```
+---------------------------+
|      COMMAND LAYER        |
|   say.ts, issue.ts        |
|   (Routing/CLI parsing)   |
+---------------------------+
              |
              v
+---------------------------+
|     OPERATION LAYER       |
|  operations/{op}/         |
|  ├── headless/            |  <- Pure logic, no rendering
|  └── interactive/         |  <- Ink UI + behaviors
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
- Route to the headless or interactive entry of an operation
- Handle top-level errors and user output

**Must NOT**:
- Contain business logic
- Make API calls
- Read/write files directly

**Key principle**: Commands parse arguments and pass typed data to operations. Operations never see raw `argv` or CLI strings. This makes operations easy to test without simulating CLI input. Choosing between an operation's headless and interactive entry (e.g. on `--interactive`) is routing, and belongs here.

---

### Operation Layer

Each operation lives in its own folder under `commands/{command}/operations/{operation}/` and is split into two top-level concerns: **headless** (pure logic) and **interactive** (Ink UI).

#### `headless/`

Contains the operation's pure logic entry point with no Ink, no rendering, and no JSX.

| File | Purpose |
|------|---------|
| `{operation}.ts` | Entry point — orchestrates services and infrastructure, returns a typed result |
| `tests/{operation}.test.ts` | Unit tests (call functions directly) |
| `tests/{operation}.spec.ts` | End-to-end spec (spawns the real CLI process) |
| `prompts/` | Prompt markdown files for agent-wrapper operations |

**When to have headless only**: Operations that print output and exit without an interactive UI (`get`, `sync`, `close`).

#### `interactive/`

Contains the Ink entry point and all interactive behaviors. There are no direct tests on `{operation}.tsx` itself — coverage comes from behavior tests.

```
interactive/
  {operation}.tsx          <- Ink entry point; composes components and behaviors
  components/              <- (optional) presentational Ink components
  behaviors/               <- one folder per user-triggered interaction
    {behavior-name}/
      hooks/               <- Ink/React hooks
      components/          <- (optional) Ink components specific to this behavior
      tests/
        {behavior}.spec.tsx  <- ink-testing-library
```

The interactive entry typically also exports a thin wrapper (e.g. `run{Operation}Interactive`) that calls `render()` and awaits `waitUntilExit()`, so the command layer can launch it without touching Ink.

**When to have interactive only**: Operations that render a persistent Ink view without a non-interactive code path (e.g. `list`).

**When to have both**: Operations with both a CLI-flag path and an interactive UI (`new`, `hello`, `show`).

#### Behaviors

A behavior is a single user-triggered interaction in the interactive UI. Each distinct key binding or user action that produces a meaningful effect is its own behavior.

Examples:
- Type a name and press `Enter` to submit → `enter-name/`
- `Enter` to open a selected issue → `open-issue/`
- `x` to close the selected issue → `close-issue/`
- `q`/`Esc` to exit → `exit/`

Behaviors shared across multiple operations of the same command live in `commands/{command}/shared/behaviors/` and are imported by the operations that use them.

#### Agent-Wrapper Operations

Operations that run an agent and render a shared `Viewer` split their single `.tsx` file into a headless entry (agent invocation + state transition) and a thin interactive wrapper (renders `<Viewer>`). No operation-level `behaviors/` folder — interactive behaviors (`stop`, `detach`, `resume`) are owned by the shared `Viewer` component.

**Receives**: Typed data structures from the Command layer (not raw arguments)

**May**:
- Orchestrate service and infrastructure calls
- Render Ink UI (interactive entry points only)
- Call other operations
- Coordinate multiple integrations
- Return typed results

**Must NOT**:
- Parse CLI arguments
- Execute shell commands directly (use integrations)
- Mix headless logic into interactive files

---

### Service Layer (Optional)

| Component | Responsibility |
|-----------|----------------|
| **Services** | Complex, reusable business logic |

**Location**: `shared/services/` or `commands/{command}/shared/services/`

**When to use**: Extract to a service when:
- Business logic is complex enough to warrant its own tests
- Logic is reused across multiple operations
- An operation file becomes too large (>200 lines)

**May**:
- Contain complex business logic
- Call infrastructure (models, integrations)
- Be shared across operations

**Must NOT**:
- Parse CLI arguments
- Import from Command or Operation layers
- Handle user output directly

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
| **settings** | Config file management | `shared/models/settings.ts` |

#### Integrations

| Integration | Responsibility | File |
|-------------|----------------|------|
| **git** | Git operations | `shared/integrations/git.ts` |
| **github** | GitHub API via `gh` CLI | `shared/integrations/github.ts` |

---

## Supporting Folders

Two folders sit alongside the layered tree and are available to any layer that may import infrastructure:

| Folder | Responsibility |
|--------|----------------|
| `lib/` | Cross-cutting utilities (config, settings, gitignore, the Ink renderer) |
| `components/ink/` | Reusable presentational Ink components (`Box`, `Text`, `Spinner`, …) re-exported from `components/ink/index.ts` |

`components/ink/` is UI infrastructure: interactive entries and behaviors import from it, never the reverse.

---

## File Locations

| Component | Location | File Pattern |
|-----------|----------|--------------|
| Top-level router | (repo root) | `cli.ts` |
| Command router | `commands/{command}/` | `{command}.ts` |
| Headless entry | `commands/{command}/operations/{operation}/headless/` | `{operation}.ts` |
| Headless unit tests | `commands/{command}/operations/{operation}/headless/tests/` | `{operation}.test.ts` |
| Headless spec tests | `commands/{command}/operations/{operation}/headless/tests/` | `{operation}.spec.ts` |
| Interactive entry | `commands/{command}/operations/{operation}/interactive/` | `{operation}.tsx` |
| Behavior hook | `commands/{command}/operations/{operation}/interactive/behaviors/{b}/hooks/` | `use-{b}.ts(x)` |
| Behavior tests | `commands/{command}/operations/{operation}/interactive/behaviors/{b}/tests/` | `{b}.spec.tsx` |
| Command shared behaviors | `commands/{command}/shared/behaviors/{b}/hooks/` | `use-{b}.ts(x)` |
| Command shared services | `commands/{command}/shared/services/` | `*.ts` |
| Global shared | `shared/` | `services/`, `models/`, `integrations/`, `test/` |
| Test helpers | `shared/test/` | `cli.ts`, `index.ts` |

---

## Example Structure

This is the `say` command as shipped in this template, alongside what a richer `issue` command looks like.

```
shared/
  models/
    settings.ts            <- Global config management
  integrations/
    git.ts                 <- Git operations
    github.ts              <- GitHub API via gh CLI
  test/
    cli.ts                 <- Test helpers (runCli, setupTestRepo)
    index.ts               <- Test helper exports

components/
  ink/
    Box.tsx
    Text.tsx
    Spinner.tsx
    index.ts               <- Re-exports all Ink components + primitives

commands/
  say/
    say.ts                                            <- Command router (routing only)
    operations/
      hello/
        headless/
          hello.ts                                    <- Pure greeting logic, returns typed result
          tests/
            hello.test.ts                             <- Unit tests
            hello.spec.ts                             <- E2E spec (spawns cli.ts)
        interactive/
          hello.tsx                                   <- Ink entry; composes behaviors + run wrapper
          behaviors/
            enter-name/
              hooks/
                use-enter-name.tsx                    <- Capture input + submit on Enter
              tests/
                enter-name.spec.tsx                   <- Behavior spec (ink-testing-library)

  issue/
    issue.ts
    shared/
      services/
        issue-naming.ts
      behaviors/                                      <- Shared across list + show
        close-issue/hooks/use-close-issue.tsx
        exit/hooks/use-exit.tsx
    operations/
      close/
        headless/
          close.ts
          tests/
            close.test.ts
            close.spec.ts
      list/
        interactive/
          list.tsx
          behaviors/
            open-issue/
              hooks/use-open-issue.tsx
              tests/open-issue.spec.tsx
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
- `headless/` and `interactive/` within the same operation may import each other; `interactive/` often calls headless functions

---

## Sharing Hierarchy

Code can be shared at three levels:

```
shared/                                      <- Global: shared across all commands
  services/
  models/
  integrations/

commands/{command}/
  shared/                                    <- Command-level: shared between operations
    services/
    models/
    behaviors/                               <- Shared interactive behaviors
      {behavior-name}/
        hooks/
  operations/
    {operation}/
      headless/                              <- Operation-level logic
      interactive/                           <- Operation-level UI
        behaviors/
          {behavior-name}/                   <- Behavior-specific to this operation
```

### Scope Rules

| Scope | Location | Shared Between |
|-------|----------|----------------|
| **Behavior** | `operations/{op}/interactive/behaviors/{b}/` | Nothing (behavior-specific) |
| **Operation** | `operations/{op}/` | headless and interactive of the same operation |
| **Command** | `commands/{command}/shared/` | Operations within the same command |
| **Global** | `shared/` | All commands and operations |

### When to Use Each Level

**Behavior-level** (default):
- Hooks and components specific to one user interaction in one operation

**Command-level `shared/behaviors/`**:
- Behaviors used by 2+ operations within the same command
- Example: `close-issue`, `exit` appear in both `list` and `show`

**Command-level `shared/services/`**:
- Services and models used by 2+ operations in the same command

**Global `shared/`**:
- Models and integrations used by 2+ commands
- Core utilities used throughout the CLI

---

## Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Command | lowercase | `say`, `issue` |
| Operation | lowercase verb | `hello`, `sync`, `close` |
| Operation folder | matches operation name | `operations/hello/` |
| Headless entry | `.ts` extension | `headless/hello.ts` |
| Interactive entry | `.tsx` extension | `interactive/hello.tsx` |
| Behavior folder | kebab-case noun | `enter-name/`, `open-issue/` |
| Behavior hook | `use-` prefix | `use-enter-name.tsx` |
| Unit test files | `.test.ts` suffix | `hello.test.ts` |
| Component test files | `.test.tsx` suffix | `list.test.tsx` |
| Spec test files | `.spec.ts(x)` suffix | `hello.spec.ts`, `enter-name.spec.tsx` |

---

## Testing Strategy

The CLI uses three test types, each with a distinct suffix and runner:

| Type | Suffix | Runner | Use for |
|---|---|---|---|
| **Unit** | `.test.ts` | `bun:test`, direct function calls | Pure headless logic, shared services, models |
| **Component** | `.test.tsx` | `ink-testing-library` | Ink components — rendering, key handling, phase transitions |
| **Spec** | `.spec.ts(x)` | `runCli()` or `ink-testing-library` | Headless: spawns `cli.ts`, asserts stdout/stderr/exit/files. Behavior: renders a hook/entry in isolation |

`bunfig.toml` excludes `sandbox/**` and `.worktrees/**` from test discovery.

### Unit Tests (`.test.ts`)

Unit tests call headless functions directly without spawning processes.

**Location**: `commands/{command}/operations/{operation}/headless/tests/{operation}.test.ts`, or under `shared/.../*.test.ts` for shared library code.

```typescript
// operations/hello/headless/tests/hello.test.ts
import { hello } from '../hello.ts';

it('greets the provided name', async () => {
  const result = await hello({ name: 'Alice' });
  expect(result.greeting).toBe('Hello, Alice!');
});
```

### Component Tests (`.test.tsx`)

Component tests render Ink/React components or behavior hooks in-process using `ink-testing-library`.

**Pattern**:
- Render with `interactive={true}` so `useInput` activates without a real TTY
- Use a `flush()` helper (`setImmediate` x2-3) between actions and assertions
- Assert on `lastFrame()` for snapshots, `frames` for history, `stdin.write(...)` for input

### Spec Tests (`.spec.ts` / `.spec.tsx`)

Two kinds of spec test share the suffix:

**Headless specs** spawn an actual `bun run cli.ts` subprocess to validate end-to-end behavior.

**Location**: `commands/{command}/operations/{operation}/headless/tests/{operation}.spec.ts`

```typescript
// operations/hello/headless/tests/hello.spec.ts
const result = await runCli(['say', 'hello', '--name', 'Alice']);
expect(result.exitCode).toBe(0);
expect(result.stdout).toContain('Hello, Alice!');
```

**Behavior specs** render a behavior's hook or its operation's interactive entry using `ink-testing-library` and exercise a single interaction flow end-to-end (phases, I/O, transitions).

**Location**: `commands/{command}/operations/{operation}/interactive/behaviors/{b}/tests/{b}.spec.tsx`

```typescript
// behaviors/enter-name/tests/enter-name.spec.tsx
import { render } from 'ink-testing-library';
import { HelloInteractive } from '../../../hello.tsx';

it('renders typed name and greeting on Enter', async () => {
  const { stdin, lastFrame, unmount } = render(<HelloInteractive />);
  try {
    stdin.write('Alice');
    await flush();
    stdin.write('\r');
    await flush();
    expect(lastFrame()).toContain('Hello, Alice!');
  } finally {
    unmount();
  }
});
```

### Test Helpers

Global test utilities live in `shared/test/`:

| Helper | Purpose |
|--------|---------|
| `runCli(args, options)` | Spawn CLI process, capture output |
| `setupTestRepo(options)` | Create temp directory with git and settings |

### When to Use Each

| Scenario | Test Type |
|----------|-----------|
| Pure headless logic in an operation or service | Unit (`.test.ts`) |
| Helpers in `shared/` (parsers, formatters, models) | Unit (`.test.ts`) |
| Behavior hook logic, state transitions | Component (`.test.tsx`) |
| Ink component rendering, key bindings, phase transitions | Component (`.test.tsx`) |
| Behavior interaction flows (multi-phase rendering) | Spec (`.spec.tsx`) |
| Argument parsing, CLI output format, exit codes | Spec (`.spec.ts`) |
| End-to-end behavior across layers | Spec (`.spec.ts`) |

Do **not** use `.unit.ts`. Use `.test.ts` for unit, `.test.tsx` for component, `.spec.ts`/`.spec.tsx` for spec.

---

## Adding a New Operation

1. Create folder: `commands/{command}/operations/{operation}/`
2. For headless logic (always): create `headless/{operation}.ts` and `headless/tests/`
3. For interactive UI: create `interactive/{operation}.tsx` plus a `run{Operation}Interactive` wrapper
4. For each user-triggered interaction: create `interactive/behaviors/{behavior-name}/hooks/use-{behavior}.ts(x)` and `tests/`
5. Export the entry function(s) and route to them in `{command}.ts`
6. If a behavior is used by 2+ operations, move it to `commands/{command}/shared/behaviors/`

### Checklist for headless-only operations

- [ ] `headless/{operation}.ts` — pure logic, returns typed result
- [ ] `headless/tests/{operation}.test.ts` — unit tests
- [ ] `headless/tests/{operation}.spec.ts` — e2e spec via `runCli()`
- [ ] Export and route in `{command}.ts`

### Checklist for interactive operations

- [ ] `headless/{operation}.ts` (if there is also a non-interactive path)
- [ ] `interactive/{operation}.tsx` — Ink entry, composes behaviors, exports run wrapper
- [ ] `interactive/behaviors/{b}/hooks/use-{b}.ts(x)` per interaction
- [ ] `interactive/behaviors/{b}/tests/{b}.spec.tsx` per behavior
- [ ] Export and route in `{command}.ts`

---

## Adding a New Command

1. Create folder: `commands/{command}/`
2. Create command router: `{command}.ts` (routing only)
3. Create `operations/` with each operation following the checklist above
4. Add the route in `cli.ts`
