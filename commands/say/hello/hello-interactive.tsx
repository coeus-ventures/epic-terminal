import { useState } from 'react';
import { useApp, useInput } from 'ink';
import { Box, Text, DimText } from '../../../components/ink/index.ts';

export interface HelloInteractiveProps {
  initialName?: string;
}

export function HelloInteractive({ initialName }: HelloInteractiveProps) {
  const [name, setName] = useState(initialName ?? '');
  const [submitted, setSubmitted] = useState(false);
  const { exit } = useApp();

  useInput((input, key) => {
    if (submitted) return;

    if (key.return) {
      setSubmitted(true);
      setTimeout(exit, 0);
      return;
    }

    if (key.backspace || key.delete) {
      setName((prev) => prev.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      setName((prev) => prev + input);
    }
  });

  const display = name || 'World';

  if (submitted) {
    return (
      <Box>
        <Text>Hello, {display}!</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      <Text>
        What is your name? <Text color="cyan">{name}</Text>
      </Text>
      <DimText>(press Enter — empty defaults to "World")</DimText>
    </Box>
  );
}
