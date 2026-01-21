# CLI Boilerplate

A minimal starter template for building command-line tools with Bun and TypeScript. This boilerplate demonstrates a modular operations-based architecture pattern for organizing CLI commands.

## Installation

```bash
# Install dependencies
bun install

# Link globally to use the cli command
bun link
```

## Requirements

- [Bun](https://bun.sh/) runtime
- Git
- Unix-like environment recommended

## Quick Start

```bash
# Run the hello command
bun run cli.ts hello greet
# Output: Hello, World!

# Run with a custom name
bun run cli.ts hello greet --name Alice
# Output: Hello, Alice!

# Show help
bun run cli.ts --help
```

## Architecture

This boilerplate follows a **modular operations-based pattern**:

```
cli-boilerplate/
  cli.ts                    # Main entry point (command router)
  commands/
    hello/                  # Example command
      hello.ts              # Command router
      greet/                # Operation directory
        greet.ts            # Operation implementation
        greet.test.ts       # Operation tests
  shared/
    models/
      settings.ts           # Settings management
    integrations/
      git.ts                # Git utilities
  lib/                      # Shared utilities
  components/
    ink/                    # React-based terminal UI components
  docs/
    references/
      architecture.md       # Architecture documentation
    templates/              # Templates for new commands/operations
```

### Key Principles

1. **Separation of Concerns** - Command files handle routing only; business logic lives in operations
2. **Testability** - Operations receive typed data, not raw CLI args
3. **Modularity** - Each operation is isolated in its own directory

## Adding New Commands

1. Create command directory: `commands/{command}/`
2. Create command router: `commands/{command}/{command}.ts`
3. Add operations in subdirectories
4. Register in `cli.ts`

## Adding New Operations

1. Create operation directory: `commands/{command}/{operation}/`
2. Create operation file: `{operation}.ts`
3. Create test file: `{operation}.test.ts`
4. Add routing in the command router

## Configuration

The CLI uses a settings file at `.epic/settings.json` for project-specific configuration. Settings are automatically created with defaults on first use.

## Testing

```bash
# Run all tests
bun test

# Run specific tests
bun test commands/hello/greet/

# Type check
bun run typecheck
```

## Building

```bash
bun run build
```

## Documentation

- [Architecture Reference](docs/references/architecture.md) - Detailed architecture documentation
- [Command Template](docs/templates/command.md) - Template for new commands
- [Operation Template](docs/templates/operation.md) - Template for new operations
