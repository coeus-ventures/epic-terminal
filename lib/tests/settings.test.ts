import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { settingsManager, DEFAULT_SETTINGS } from '../../shared/models/settings.ts';

describe('Settings Manager', () => {
  const testDir = join(process.cwd(), 'test-temp-settings');
  const epicDir = join(testDir, '.epic');
  const settingsPath = join(epicDir, 'settings.json');
  const originalCwd = process.cwd();

  beforeEach(() => {
    // Create test directory structure with git
    mkdirSync(testDir, { recursive: true });
    process.chdir(testDir);

    // Initialize git repo for testing
    Bun.spawnSync(['git', 'init'], { cwd: testDir });

    // Reset settings manager
    settingsManager.reset();
  });

  afterEach(() => {
    // Restore original directory
    process.chdir(originalCwd);

    // Clean up test directory
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadSettings', () => {
    test('should create default settings.json if it does not exist', async () => {
      await settingsManager.loadSettings(testDir);

      expect(existsSync(settingsPath)).toBe(true);

      const settings = await settingsManager.getSettings(testDir);
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    test('should load existing settings from file', async () => {
      // Create custom settings
      mkdirSync(epicDir, { recursive: true });
      const customSettings = {
        baseDirectory: 'custom-docs',
        issuesDirectory: 'custom-issues',
        draftsDirectory: 'custom-drafts',
        worktreesDirectory: 'custom-worktrees'
      };
      writeFileSync(settingsPath, JSON.stringify(customSettings, null, 2));

      const settings = await settingsManager.loadSettings(testDir);

      expect(settings.baseDirectory).toBe('custom-docs');
      expect(settings.issuesDirectory).toBe('custom-issues');
      expect(settings.draftsDirectory).toBe('custom-drafts');
      expect(settings.worktreesDirectory).toBe('custom-worktrees');
    });

    test('should merge partial settings with defaults', async () => {
      // Create partial settings (missing some fields)
      mkdirSync(epicDir, { recursive: true });
      const partialSettings = {
        baseDirectory: 'my-docs'
      };
      writeFileSync(settingsPath, JSON.stringify(partialSettings, null, 2));

      const settings = await settingsManager.loadSettings(testDir);

      expect(settings.baseDirectory).toBe('my-docs');
      expect(settings.issuesDirectory).toBe(DEFAULT_SETTINGS.issuesDirectory);
      expect(settings.draftsDirectory).toBe(DEFAULT_SETTINGS.draftsDirectory);
      expect(settings.worktreesDirectory).toBe(DEFAULT_SETTINGS.worktreesDirectory);
    });

    test('should cache settings after first load', async () => {
      const settings1 = await settingsManager.loadSettings(testDir);
      const settings2 = await settingsManager.getSettings(testDir);

      expect(settings1).toBe(settings2); // Same reference
    });
  });

  describe('updateSettings', () => {
    test('should update settings file with new values', async () => {
      await settingsManager.loadSettings(testDir);

      await settingsManager.updateSettings({ baseDirectory: 'updated-docs' }, testDir);

      const settings = await settingsManager.getSettings(testDir);
      expect(settings.baseDirectory).toBe('updated-docs');
      expect(settings.issuesDirectory).toBe(DEFAULT_SETTINGS.issuesDirectory);
    });

    test('should persist updated settings to file', async () => {
      await settingsManager.loadSettings(testDir);
      await settingsManager.updateSettings({ baseDirectory: 'persistent-docs' }, testDir);

      // Reset and reload
      settingsManager.reset();
      const reloadedSettings = await settingsManager.loadSettings(testDir);

      expect(reloadedSettings.baseDirectory).toBe('persistent-docs');
    });

    test('should allow updating multiple fields', async () => {
      await settingsManager.loadSettings(testDir);

      await settingsManager.updateSettings({
        baseDirectory: 'new-base',
        issuesDirectory: 'new-issues',
        draftsDirectory: 'new-drafts'
      }, testDir);

      const settings = await settingsManager.getSettings(testDir);
      expect(settings.baseDirectory).toBe('new-base');
      expect(settings.issuesDirectory).toBe('new-issues');
      expect(settings.draftsDirectory).toBe('new-drafts');
    });
  });

  describe('default values', () => {
    test('should have correct default settings', () => {
      expect(DEFAULT_SETTINGS).toEqual({
        baseDirectory: 'docs',
        issuesDirectory: 'issues',
        draftsDirectory: 'drafts',
        worktreesDirectory: '.worktrees'
      });
    });
  });

  describe('error handling', () => {
    test('should use defaults when not in git repo', async () => {
      // Reset to clear any cached settings
      settingsManager.reset();

      // Remove .git directory
      rmSync(join(testDir, '.git'), { recursive: true, force: true });

      const settings = await settingsManager.loadSettings(testDir);

      // Should still return defaults even though not in git repo
      expect(settings.baseDirectory).toEqual(DEFAULT_SETTINGS.baseDirectory);
      expect(settings.issuesDirectory).toEqual(DEFAULT_SETTINGS.issuesDirectory);
      expect(settings.draftsDirectory).toEqual(DEFAULT_SETTINGS.draftsDirectory);
      expect(settings.worktreesDirectory).toEqual(DEFAULT_SETTINGS.worktreesDirectory);
    });
  });

  describe('settings file format', () => {
    test('should create properly formatted JSON file', async () => {
      await settingsManager.loadSettings(testDir);

      const fileContent = Bun.file(settingsPath);
      const text = await fileContent.text();
      const parsed = JSON.parse(text);

      expect(parsed).toEqual(DEFAULT_SETTINGS);
      expect(text.endsWith('\n')).toBe(true); // Should end with newline
    });

    test('should maintain formatting when updating', async () => {
      await settingsManager.loadSettings(testDir);
      await settingsManager.updateSettings({ baseDirectory: 'test' }, testDir);

      const fileContent = Bun.file(settingsPath);
      const text = await fileContent.text();

      // Check for proper indentation
      expect(text).toContain('  "baseDirectory"');
      expect(text.endsWith('\n')).toBe(true);
    });
  });
});
