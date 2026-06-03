import { render } from 'ink';
import { createElement } from 'react';
import { Box, Text, DimText, useApp } from '../../../../../components/ink/index.ts';
import { useEnterName } from './behaviors/enter-name/hooks/use-enter-name.tsx';
import { hello } from '../headless/hello.ts';

export interface HelloInteractiveProps {
  initialName?: string;
  /** Called with the captured name when the user submits. */
  onComplete?: (name: string) => void;
}

/**
 * Ink entry point for the interactive `say hello`.
 *
 * Captures input only — it composes the `enter-name` behavior and reports the
 * chosen name via `onComplete`. The final greeting is printed by the headless
 * `hello()` after the UI exits, so it survives Ink tearing down the frame.
 */
export function HelloInteractive({ initialName, onComplete }: HelloInteractiveProps) {
  const { exit } = useApp();
  const { name } = useEnterName({
    initialName,
    onSubmit: (submitted) => {
      onComplete?.(submitted);
      exit();
    },
  });

  return (
    <Box flexDirection="column">
      <Text>
        What is your name? <Text color="cyan">{name}</Text>
      </Text>
      <DimText>(press Enter — empty defaults to "World")</DimText>
    </Box>
  );
}

/**
 * Thin interactive wrapper: renders the Ink prompt, waits for the user to
 * submit, then delegates to the headless entry to print the greeting.
 * Called by the command layer when `--interactive` is passed.
 */
export async function runHelloInteractive(options: { name?: string }): Promise<void> {
  let chosen = options.name ?? '';
  const instance = render(
    createElement(HelloInteractive, {
      initialName: options.name,
      onComplete: (name) => {
        chosen = name;
      },
    }),
  );
  await instance.waitUntilExit();
  await hello({ name: chosen });
}
