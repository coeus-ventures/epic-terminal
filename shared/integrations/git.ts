#!/usr/bin/env bun

/**
 * Git Integration
 * Provides functions for interacting with git repositories
 */

export interface CommandResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Run a shell command and return the result
 */
export async function runCommand(
  command: string[],
  cwd?: string
): Promise<CommandResult> {
  const result = Bun.spawn(command, {
    stdout: 'pipe',
    stderr: 'pipe',
    cwd: cwd || process.cwd()
  });

  const [stdout, stderr] = await Promise.all([
    new Response(result.stdout).text(),
    new Response(result.stderr).text()
  ]);

  await result.exited;

  return {
    success: result.exitCode === 0,
    output: stdout.trim(),
    error: stderr.trim()
  };
}

/**
 * Get the git repository root directory
 */
export async function getGitRoot(startDir?: string): Promise<string> {
  const result = await runCommand(
    ['git', 'rev-parse', '--show-toplevel'],
    startDir
  );

  if (!result.success) {
    throw new Error('Not in a git repository');
  }

  return result.output;
}

/**
 * Get the repository name from the git remote URL
 */
export async function getRepoName(cwd?: string): Promise<string | null> {
  const result = await runCommand(
    ['git', 'remote', 'get-url', 'origin'],
    cwd
  );

  if (!result.success) {
    return null;
  }

  const remoteUrl = result.output;
  // Extract repo name from various URL formats:
  // https://github.com/owner/repo.git
  // git@github.com:owner/repo.git
  // https://github.com/owner/repo
  const match = remoteUrl.match(/\/([^\/]+?)(?:\.git)?$/);
  return match?.[1] || null;
}

/**
 * Get the repository owner from the git remote URL
 */
export async function getRepoOwner(cwd?: string): Promise<string | null> {
  const result = await runCommand(
    ['git', 'remote', 'get-url', 'origin'],
    cwd
  );

  if (!result.success) {
    return null;
  }

  const remoteUrl = result.output;
  // Extract owner from various URL formats
  // https://github.com/owner/repo.git -> owner
  // git@github.com:owner/repo.git -> owner
  const httpsMatch = remoteUrl.match(/github\.com\/([^\/]+)\//);
  if (httpsMatch) {
    return httpsMatch[1] ?? null;
  }

  const sshMatch = remoteUrl.match(/github\.com:([^\/]+)\//);
  if (sshMatch) {
    return sshMatch[1] ?? null;
  }

  return null;
}

/**
 * Get the current branch name
 */
export async function getCurrentBranch(cwd?: string): Promise<string> {
  const result = await runCommand(
    ['git', 'rev-parse', '--abbrev-ref', 'HEAD'],
    cwd
  );

  if (!result.success) {
    throw new Error('Could not get current branch');
  }

  return result.output;
}

/**
 * Check if a branch exists
 */
export async function branchExists(branchName: string, cwd?: string): Promise<boolean> {
  const result = await runCommand(
    ['git', 'rev-parse', '--verify', branchName],
    cwd
  );
  return result.success;
}

/**
 * Create a new branch
 */
export async function createBranch(branchName: string, cwd?: string): Promise<boolean> {
  const result = await runCommand(
    ['git', 'branch', branchName],
    cwd
  );
  return result.success;
}

/**
 * List all git worktrees
 */
export async function listWorktrees(cwd?: string): Promise<string[]> {
  const result = await runCommand(
    ['git', 'worktree', 'list', '--porcelain'],
    cwd
  );

  if (!result.success) {
    return [];
  }

  const worktrees: string[] = [];
  const lines = result.output.split('\n');

  for (const line of lines) {
    if (line.startsWith('worktree ')) {
      worktrees.push(line.replace('worktree ', ''));
    }
  }

  return worktrees;
}

/**
 * Create a git worktree
 */
export async function createWorktree(
  path: string,
  branchName: string,
  cwd?: string
): Promise<CommandResult> {
  return runCommand(
    ['git', 'worktree', 'add', path, '-b', branchName],
    cwd
  );
}

/**
 * Remove a git worktree
 */
export async function removeWorktree(
  path: string,
  cwd?: string
): Promise<CommandResult> {
  return runCommand(
    ['git', 'worktree', 'remove', path, '--force'],
    cwd
  );
}

/**
 * Delete a git branch
 */
export async function deleteBranch(
  branchName: string,
  force: boolean = false,
  cwd?: string
): Promise<CommandResult> {
  const flag = force ? '-D' : '-d';
  return runCommand(
    ['git', 'branch', flag, branchName],
    cwd
  );
}

/**
 * Get the project prefix for issue IDs
 * First checks settings, then derives from repo name
 */
export async function getProjectPrefix(cwd?: string): Promise<string> {
  // Try to get project name from git remote
  const repoName = await getRepoName(cwd);
  if (repoName) {
    return repoName.substring(0, 3).toUpperCase();
  }

  // Fallback to directory name
  const gitRoot = await getGitRoot(cwd);
  const { basename } = await import('path');
  const dirName = basename(gitRoot);
  return dirName.substring(0, 3).toUpperCase();
}
