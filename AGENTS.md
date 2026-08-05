# AGENTS.md

This file provides guidance to coding agents (Claude Code, Codex, Gemini) working with this repository. `.claude/CLAUDE.md` is a symlink to this file.

This is a **CLI boilerplate** — a starter template for building command-line tools with Bun, TypeScript, and Ink. It has its own architecture, distinct from the Epic web application architecture.

## Architecture Overview

A layered model that separates CLI routing, headless logic, interactive UI, and external integrations:

```
+---------------------------+
|      COMMAND LAYER        |
|   Routing / CLI parsing   |
+---------------------------+
              |
              v
+---------------------------+
|     OPERATION LAYER       |
|  headless/    (pure logic)|
|  interactive/ (Ink UI)    |
+---------------------------+
              |
              v
+---------------------------+
|      SERVICE LAYER        |
|  Complex business logic   |
|  (Optional)               |
+---------------------------+
              |
              v
+---------------------------+
|   INFRASTRUCTURE LAYER    |
|   Models + Integrations   |
+---------------------------+
```

**Critical Rule**: data flows top to bottom only. No layer may import from layers above it.

An **operation** is the unit of work. It has a headless half that holds pure logic and renders nothing, and an optional interactive half that renders Ink UI and organizes its own behaviors. The Service layer is optional: reach for it when logic outgrows a single headless entry or is shared across operations.

Two folders sit alongside the layered tree and are available to any layer that may import infrastructure:

| Folder | Responsibility |
|--------|----------------|
| `lib/` | Cross-cutting utilities (config, settings, gitignore, the Ink renderer) |
| `components/ink/` | Reusable presentational Ink components re-exported from `components/ink/index.ts` |

`components/ink/` is UI infrastructure: interactive entries and behaviors import from it, never the reverse.

See `docs/references/architecture.md` for the full reference, including import rules, the sharing hierarchy, and worked examples.

## File Locations

| Component | Location | File Pattern |
|-----------|----------|--------------|
| Top-level router | (repo root) | `cli.ts` |
| Command router | `commands/{command}/` | `{command}.ts` |
| Headless entry | `commands/{command}/operations/{operation}/headless/` | `{operation}.ts` |
| Interactive entry | `commands/{command}/operations/{operation}/interactive/` | `{operation}.tsx` |
| Behavior hook | `commands/{command}/operations/{operation}/interactive/behaviors/{b}/hooks/` | `use-{b}.ts(x)` |
| Command shared behaviors | `commands/{command}/shared/behaviors/{b}/hooks/` | `use-{b}.ts(x)` |
| Command shared services | `commands/{command}/shared/services/` | `*.ts` |
| Global shared | `shared/` | `services/`, `models/`, `integrations/`, `test/` |
| Test helpers | `shared/test/` | `cli.ts`, `index.ts` |

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
| Unit tests | `.test.ts` suffix | `hello.test.ts` |
| Component tests | `.test.tsx` suffix | `list.test.tsx` |
| Spec tests | `.spec.ts(x)` suffix | `hello.spec.ts`, `enter-name.spec.tsx` |

## Key Commands

```bash
bun run test        # Run the test suite
bun run typecheck   # TypeScript type checking
bun run build       # Build the CLI
```

## Testing

Three test types, each with a distinct suffix and runner:

| Type | Suffix | Runner | Use for |
|---|---|---|---|
| **Unit** | `.test.ts` | `bun:test`, direct function calls | Pure headless logic, shared services, models |
| **Component** | `.test.tsx` | `ink-testing-library` | Ink components — rendering, key handling, phase transitions |
| **Spec** | `.spec.ts(x)` | `runCli()` or `ink-testing-library` | Headless: spawns `cli.ts` and asserts stdout/stderr/exit/files. Behavior: renders a hook or entry in isolation |

`bunfig.toml` excludes `sandbox/**` and `.worktrees/**` from test discovery.

See `docs/references/architecture.md` for the testing strategy in full, and `docs/references/specification.md` for the specification format used by issues.

## Templates

`docs/templates/` holds the authoring formats for `command.md`, `operation.md`, and `issue.md`.

## Skills

The repository ships skills under `.claude/skills/` covering the project workflow: `prd`, `plan`, `execute`, `fix`, `verify`, `review`, `merge`, `interview`, `prototype`, and `epic`. Prefer them over ad-hoc implementation.

## Scope Note

The Epic web application architecture (Presentation → Controller → Service → Infrastructure, with TanStack Query, Services, and Policies) belongs to `epic-web` and the projects generated from it. It does not apply here. This repository's layering is Command → Operation → Service → Infrastructure, as described above.
