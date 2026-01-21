#!/usr/bin/env bun

import { greet } from './greet/greet.ts';

export async function helloCommand(args: string[]) {
  const command = args[0];

  // Parse flags
  const flags = args.filter(arg => arg.startsWith('--'));
  const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Hello Command - Example command demonstrating CLI architecture

Usage: cli hello <operation> [options]

Operations:
  greet [--name <name>]    Greet someone (default: World)

Examples:
  cli hello greet
  cli hello greet --name Alice
    `.trim());
    return;
  }

  if (!command || command !== 'greet') {
    console.error('Unknown operation. Run "cli hello --help" for usage.');
    process.exit(1);
  }

  try {
    switch (command) {
      case 'greet':
        const nameIndex = flags.indexOf('--name');
        const name = nameIndex !== -1 ? args[args.indexOf('--name') + 1] : undefined;
        await greet({ name });
        break;
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

async function main() {
  const args = Bun.argv.slice(2);
  await helloCommand(args);
}

if (import.meta.main) {
  main();
}
