#!/usr/bin/env bun

import { hello } from './hello/hello.ts';

export async function sayCommand(args: string[]) {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Say Command - Render greetings

Usage: cli say <operation> [options]

Operations:
  hello [--name <name>] [--interactive]    Greet someone (default: World)

Examples:
  cli say hello
  cli say hello --name Alice
  cli say hello --interactive
    `.trim());
    return;
  }

  const operation = args[0];
  if (!operation) {
    console.error('Missing operation. Run "cli say --help" for usage.');
    process.exit(1);
  }

  if (operation !== 'hello') {
    console.error(`Unknown operation: ${operation}. Run "cli say --help" for usage.`);
    process.exit(1);
  }

  const opArgs = args.slice(1);
  const nameIdx = opArgs.indexOf('--name');
  const name = nameIdx !== -1 ? opArgs[nameIdx + 1] : undefined;
  const interactive = opArgs.includes('--interactive');

  await hello({ name, interactive });
}

async function main() {
  const args = Bun.argv.slice(2);
  await sayCommand(args);
}

if (import.meta.main) {
  main();
}
