import { describe, expect, it } from 'bun:test';
import { resolve } from 'node:path';

const CLI_PATH = resolve(import.meta.dir, '../../../../cli.ts');

async function runCli(
  args: string[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  const proc = Bun.spawn(['bun', 'run', CLI_PATH, ...args], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;
  return { exitCode, stdout, stderr };
}

describe('say hello (spec)', () => {
  it('greets World by default', async () => {
    const result = await runCli(['say', 'hello']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello, World!');
  });

  it('greets the provided name', async () => {
    const result = await runCli(['say', 'hello', '--name', 'Alice']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('Hello, Alice!');
  });

  it('shows help for the say command', async () => {
    const result = await runCli(['say', '--help']);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('hello');
  });

  it('exits non-zero on unknown operation', async () => {
    const result = await runCli(['say', 'bogus']);
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr).toContain('Unknown operation');
  });
});
