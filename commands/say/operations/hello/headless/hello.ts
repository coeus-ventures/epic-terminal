export interface HelloOptions {
  name?: string;
}

export interface HelloResult {
  greeting: string;
}

/**
 * Pure, non-interactive greeting logic.
 *
 * Headless entry point: no Ink, no rendering, no JSX. Receives typed options
 * from the command layer, prints the greeting, and returns a typed result.
 */
export async function hello(options: HelloOptions): Promise<HelloResult> {
  const name = options.name || 'World';
  const greeting = `Hello, ${name}!`;
  console.log(greeting);
  return { greeting };
}
