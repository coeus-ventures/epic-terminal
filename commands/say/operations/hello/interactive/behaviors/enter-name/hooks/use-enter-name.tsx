import { useState } from 'react';
import { useInput } from 'ink';

export interface UseEnterNameOptions {
  initialName?: string;
  onSubmit: (name: string) => void;
}

export interface EnterNameState {
  name: string;
  submitted: boolean;
}

/**
 * Behavior: capture the user's name and submit on Enter.
 *
 * Owns a single user-triggered interaction — typing characters, backspace, and
 * pressing Enter to confirm. Holds no rendering; the interactive entry decides
 * what to draw from the returned state.
 */
export function useEnterName({ initialName, onSubmit }: UseEnterNameOptions): EnterNameState {
  const [name, setName] = useState(initialName ?? '');
  const [submitted, setSubmitted] = useState(false);

  useInput((input, key) => {
    if (submitted) return;

    if (key.return) {
      setSubmitted(true);
      onSubmit(name);
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

  return { name, submitted };
}
