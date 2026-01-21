/**
 * Configuration for Epic CLI
 *
 * This module provides access to user-configurable settings from .epic/settings.json
 */

import { settingsManager } from '../shared/models/settings.ts';

/**
 * Get the base directory from settings
 */
export async function getBaseDir(cwd: string = process.cwd()): Promise<string> {
  const settings = await settingsManager.getSettings(cwd);
  return settings.baseDirectory;
}

/**
 * Get the issues directory from settings
 */
export async function getIssuesDir(cwd: string = process.cwd()): Promise<string> {
  const settings = await settingsManager.getSettings(cwd);
  return settings.issuesDirectory;
}

/**
 * Get the drafts directory from settings
 */
export async function getDraftsDir(cwd: string = process.cwd()): Promise<string> {
  const settings = await settingsManager.getSettings(cwd);
  return settings.draftsDirectory;
}

/**
 * Get the worktrees directory from settings
 */
export async function getWorktreesDir(cwd: string = process.cwd()): Promise<string> {
  const settings = await settingsManager.getSettings(cwd);
  return settings.worktreesDirectory;
}

/**
 * Get the project prefix from settings (optional)
 * Returns undefined if not set, allowing fallback to auto-detection
 */
export async function getProjectPrefixSetting(cwd: string = process.cwd()): Promise<string | undefined> {
  const settings = await settingsManager.getSettings(cwd);
  return settings.projectPrefix;
}

// Legacy exports for backward compatibility (deprecated)
export const EPIC_DIR = 'docs';
export const ISSUES_DIR = 'issues';
export const DRAFTS_DIR = 'drafts';
