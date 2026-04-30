import { render } from 'ink';
import { createElement } from 'react';
import { HelloInteractive } from './hello-interactive.tsx';

export interface HelloOptions {
  name?: string;
  interactive?: boolean;
}

export async function hello(options: HelloOptions): Promise<void> {
  if (options.interactive) {
    const instance = render(createElement(HelloInteractive, { initialName: options.name }));
    await instance.waitUntilExit();
    return;
  }

  const name = options.name || 'World';
  console.log(`Hello, ${name}!`);
}
