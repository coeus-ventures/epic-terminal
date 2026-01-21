/**
 * Utilities for managing .gitignore entries
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Ensure that a pattern is present in .gitignore
 * @param gitRoot - The git repository root directory
 * @param pattern - The gitignore pattern to ensure (e.g., '.worktrees/')
 * @param comment - Optional comment to add before the pattern
 * @returns true if pattern was added, false if it already existed
 */
export function ensureGitignoreEntry(
  gitRoot: string,
  pattern: string,
  comment?: string
): boolean {
  const gitignorePath = join(gitRoot, '.gitignore');

  try {
    let content = '';
    let fileExists = false;

    // Read existing .gitignore if it exists
    if (existsSync(gitignorePath)) {
      content = readFileSync(gitignorePath, 'utf-8');
      fileExists = true;

      // Check if pattern already exists
      const lines = content.split('\n');
      if (lines.some(line => line.trim() === pattern)) {
        return false; // Pattern already exists
      }
    }

    // Add the pattern
    let newContent = content;

    // Ensure file ends with newline before adding new content
    if (fileExists && content.length > 0 && !content.endsWith('\n')) {
      newContent += '\n';
    }

    // Add a blank line before our section if file is not empty
    if (fileExists && content.length > 0) {
      newContent += '\n';
    }

    // Add comment if provided
    if (comment) {
      newContent += `# ${comment}\n`;
    }

    // Add the pattern
    newContent += `${pattern}\n`;

    // Write back to .gitignore
    writeFileSync(gitignorePath, newContent, 'utf-8');

    return true; // Pattern was added
  } catch (error) {
    throw new Error(`Failed to update .gitignore: ${error instanceof Error ? error.message : error}`);
  }
}

/**
 * Check if a pattern exists in .gitignore
 * @param gitRoot - The git repository root directory
 * @param pattern - The gitignore pattern to check
 * @returns true if pattern exists, false otherwise
 */
export function hasGitignoreEntry(gitRoot: string, pattern: string): boolean {
  const gitignorePath = join(gitRoot, '.gitignore');

  if (!existsSync(gitignorePath)) {
    return false;
  }

  try {
    const content = readFileSync(gitignorePath, 'utf-8');
    const lines = content.split('\n');
    return lines.some(line => line.trim() === pattern);
  } catch {
    return false;
  }
}
