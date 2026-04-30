#!/usr/bin/env bun

import { sayCommand } from './commands/say/say.ts';

const COMMANDS = {
  say: sayCommand,
} as const;

function showHelp() {
  console.log(`
CLI Boilerplate - A minimal CLI starter template

Usage: cli <command> [options]

Commands:
  say        Render greetings (example command)

Run 'cli <command> --help' for more information on a specific command.
  `.trim());
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showHelp();
    process.exit(0);
  }

  const command = args[0]!;
  const commandArgs = args.slice(1);

  if (!(command in COMMANDS)) {
    console.error(`Unknown command: ${command}`);
    console.error();
    showHelp();
    process.exit(1);
  }

  try {
    await COMMANDS[command as keyof typeof COMMANDS](commandArgs);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
