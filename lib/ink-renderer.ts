/**
 * Ink rendering utilities for Epic CLI
 *
 * Provides functions to render React Ink components with
 * automatic TTY detection and non-interactive fallback
 */

import { render, type Instance } from 'ink';
import type { ReactElement } from 'react';

/**
 * Check if stdout is an interactive TTY
 */
export function isInteractive(): boolean {
  return process.stdout.isTTY === true;
}

/**
 * Check if stdin is an interactive TTY
 */
export function isInputInteractive(): boolean {
  return process.stdin.isTTY === true;
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return (
    process.env.CI === 'true' ||
    process.env.CI === '1' ||
    process.env.CONTINUOUS_INTEGRATION === 'true' ||
    process.env.GITHUB_ACTIONS === 'true' ||
    process.env.GITLAB_CI === 'true' ||
    process.env.CIRCLECI === 'true' ||
    process.env.TRAVIS === 'true'
  );
}

/**
 * Options for rendering
 */
export interface RenderOptions {
  /** Force interactive mode even if not TTY */
  forceInteractive?: boolean;
  /** Exit on Ctrl+C */
  exitOnCtrlC?: boolean;
  /** Custom stdout stream */
  stdout?: NodeJS.WriteStream;
  /** Custom stdin stream */
  stdin?: NodeJS.ReadStream;
  /** Debug mode - renders without clearing */
  debug?: boolean;
}

/**
 * Result of rendering
 */
export interface RenderResult {
  /** Ink instance for interactive renders */
  instance?: Instance;
  /** Whether render was interactive */
  interactive: boolean;
  /** Wait for render to complete */
  waitUntilExit: () => Promise<void>;
  /** Unmount the component */
  unmount: () => void;
  /** Rerender with new element */
  rerender: (element: ReactElement) => void;
  /** Clear output */
  clear: () => void;
}

/**
 * Render an Ink component with automatic TTY detection
 *
 * @param element - React element to render
 * @param options - Render options
 * @returns Render result with control methods
 *
 * @example
 * ```ts
 * import { renderInk } from '../lib/ink-renderer.ts';
 * import { Spinner } from '../components/ink/index.ts';
 *
 * const { waitUntilExit, unmount } = renderInk(<Spinner message="Loading..." />);
 *
 * // Do some work...
 * await doAsyncWork();
 *
 * unmount();
 * ```
 */
export function renderInk(element: ReactElement, options: RenderOptions = {}): RenderResult {
  const {
    forceInteractive = false,
    exitOnCtrlC = true,
    stdout = process.stdout,
    stdin = process.stdin,
    debug = false,
  } = options;

  const interactive = forceInteractive || (isInteractive() && !isCI());

  if (!interactive) {
    // Non-interactive fallback - just return no-op functions
    return {
      interactive: false,
      waitUntilExit: () => Promise.resolve(),
      unmount: () => {},
      rerender: () => {},
      clear: () => {},
    };
  }

  // Interactive render
  const instance = render(element, {
    exitOnCtrlC,
    stdout,
    stdin,
    debug,
  });

  return {
    instance,
    interactive: true,
    waitUntilExit: () => instance.waitUntilExit(),
    unmount: () => instance.unmount(),
    rerender: (el: ReactElement) => instance.rerender(el),
    clear: () => instance.clear(),
  };
}

/**
 * Render an Ink component and wait for it to exit
 *
 * @param element - React element to render
 * @param options - Render options
 *
 * @example
 * ```ts
 * await renderInkAndWait(<MyComponent />);
 * ```
 */
export async function renderInkAndWait(
  element: ReactElement,
  options: RenderOptions = {}
): Promise<void> {
  const result = renderInk(element, options);
  await result.waitUntilExit();
}

/**
 * Print plain text fallback for non-interactive mode
 *
 * @param message - Message to print
 * @param type - Message type for styling
 */
export function printFallback(
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info'
): void {
  const prefixes = {
    info: '',
    success: '[OK] ',
    error: '[ERROR] ',
    warning: '[WARN] ',
  };

  console.log(`${prefixes[type]}${message}`);
}
