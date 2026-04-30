import { describe, expect, it } from 'bun:test';
import { render } from 'ink-testing-library';
import { HelloInteractive } from './hello-interactive.tsx';

const flush = () =>
  new Promise<void>((resolve) => {
    setImmediate(() => setImmediate(() => setImmediate(() => resolve())));
  });

describe('HelloInteractive', () => {
  it('shows the prompt by default', async () => {
    const { lastFrame, unmount } = render(<HelloInteractive />);
    try {
      await flush();
      expect(lastFrame()).toContain('What is your name?');
    } finally {
      unmount();
    }
  });

  it('renders typed name and greeting on Enter', async () => {
    const { stdin, lastFrame, unmount } = render(<HelloInteractive />);
    try {
      stdin.write('Alice');
      await flush();
      expect(lastFrame()).toContain('Alice');

      stdin.write('\r');
      await flush();
      expect(lastFrame()).toContain('Hello, Alice!');
    } finally {
      unmount();
    }
  });

  it('falls back to World on empty input', async () => {
    const { stdin, lastFrame, unmount } = render(<HelloInteractive />);
    try {
      stdin.write('\r');
      await flush();
      expect(lastFrame()).toContain('Hello, World!');
    } finally {
      unmount();
    }
  });
});
