#!/usr/bin/env bun

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

export interface Settings {
  baseDirectory: string;
  issuesDirectory: string;
  draftsDirectory: string;
  worktreesDirectory: string;
  projectPrefix?: string;
}

const DEFAULT_SETTINGS: Settings = {
  baseDirectory: 'docs',
  issuesDirectory: 'issues',
  draftsDirectory: 'drafts',
  worktreesDirectory: '.worktrees'
};

const SETTINGS_DIR = '.behave';
const SETTINGS_FILE = 'settings.json';

class SettingsManager {
  private static instance: SettingsManager;
  private settings: Settings | null = null;
  private settingsPath: string | null = null;

  private constructor() {}

  static getInstance(): SettingsManager {
    if (!SettingsManager.instance) {
      SettingsManager.instance = new SettingsManager();
    }
    return SettingsManager.instance;
  }

  /**
   * Get git root directory
   */
  private async getGitRoot(startPath: string): Promise<string> {
    const result = Bun.spawn(['git', 'rev-parse', '--show-toplevel'], {
      cwd: startPath,
      stdout: 'pipe',
      stderr: 'pipe'
    });

    await result.exited;

    if (result.exitCode !== 0) {
      throw new Error('Not in a git repository');
    }

    const output = await new Response(result.stdout).text();
    return output.trim();
  }

  /**
   * Initialize settings file if it doesn't exist
   */
  private initializeSettings(settingsPath: string): void {
    const settingsDir = dirname(settingsPath);

    // Create .behave directory if it doesn't exist
    if (!existsSync(settingsDir)) {
      mkdirSync(settingsDir, { recursive: true });
    }

    // Create default settings.json if it doesn't exist
    if (!existsSync(settingsPath)) {
      writeFileSync(
        settingsPath,
        JSON.stringify(DEFAULT_SETTINGS, null, 2) + '\n',
        'utf-8'
      );
      console.log(`✅ Created default settings at ${settingsPath}`);
    }
  }

  /**
   * Load settings from .behave/settings.json
   */
  async loadSettings(cwd: string = process.cwd()): Promise<Settings> {
    // Return cached settings if already loaded
    if (this.settings && this.settingsPath) {
      return this.settings;
    }

    try {
      // Find git root
      const gitRoot = await this.getGitRoot(cwd);
      this.settingsPath = join(gitRoot, SETTINGS_DIR, SETTINGS_FILE);

      // Initialize settings if needed
      this.initializeSettings(this.settingsPath);

      // Read and parse settings
      const settingsContent = readFileSync(this.settingsPath, 'utf-8');
      const loadedSettings = JSON.parse(settingsContent) as Partial<Settings>;

      // Merge with defaults to ensure all fields exist
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...loadedSettings
      };

      return this.settings;
    } catch (error) {
      // If not in a git repo or other error, use defaults
      console.warn('⚠️  Could not load settings, using defaults');
      this.settings = { ...DEFAULT_SETTINGS };
      return this.settings;
    }
  }

  /**
   * Get current settings (load if not already loaded)
   */
  async getSettings(cwd: string = process.cwd()): Promise<Settings> {
    if (!this.settings) {
      return await this.loadSettings(cwd);
    }
    return this.settings;
  }

  /**
   * Update settings and save to file
   */
  async updateSettings(updates: Partial<Settings>, cwd: string = process.cwd()): Promise<void> {
    const currentSettings = await this.getSettings(cwd);
    const newSettings = { ...currentSettings, ...updates };

    if (this.settingsPath) {
      writeFileSync(
        this.settingsPath,
        JSON.stringify(newSettings, null, 2) + '\n',
        'utf-8'
      );
      this.settings = newSettings;
      console.log(`✅ Settings updated at ${this.settingsPath}`);
    } else {
      throw new Error('Settings path not initialized');
    }
  }

  /**
   * Reset settings cache (useful for testing)
   */
  reset(): void {
    this.settings = null;
    this.settingsPath = null;
  }
}

// Export singleton instance
export const settingsManager = SettingsManager.getInstance();

// Export default settings for reference
export { DEFAULT_SETTINGS };
