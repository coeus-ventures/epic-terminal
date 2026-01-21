import { describe, expect, it, beforeEach, afterEach, spyOn } from 'bun:test';
import { greet } from './greet.ts';

describe('greet', () => {
  let consoleSpy: ReturnType<typeof spyOn>;
  let logs: string[];

  beforeEach(() => {
    logs = [];
    consoleSpy = spyOn(console, 'log').mockImplementation((...args) => {
      logs.push(args.join(' '));
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should greet World by default', async () => {
    await greet({});
    expect(logs).toContain('Hello, World!');
  });

  it('should greet with custom name', async () => {
    await greet({ name: 'Alice' });
    expect(logs).toContain('Hello, Alice!');
  });

  it('should greet with another name', async () => {
    await greet({ name: 'Bob' });
    expect(logs).toContain('Hello, Bob!');
  });
});
