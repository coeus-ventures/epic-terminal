export interface GreetOptions {
  name?: string;
}

export async function greet(options: GreetOptions): Promise<void> {
  const name = options.name || 'World';
  console.log(`Hello, ${name}!`);
}
