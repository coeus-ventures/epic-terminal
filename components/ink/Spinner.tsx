/**
 * Spinner component for Ink
 * Shows loading indicator with optional message
 */

import { Text } from 'ink';
import React, { useEffect, useState } from 'react';
import { Box } from './Box.tsx';

const SPINNER_FRAMES = ['|', '/', '-', '\\'];
const DOTS_FRAMES = ['.  ', '.. ', '...', '   '];

export interface SpinnerProps {
  /** Message to display next to spinner */
  message?: string;
  /** Spinner animation type */
  type?: 'line' | 'dots';
  /** Animation speed in ms */
  interval?: number;
}

/**
 * Animated spinner component
 */
export function Spinner({ message, type = 'line', interval = 100 }: SpinnerProps) {
  const frames = type === 'dots' ? DOTS_FRAMES : SPINNER_FRAMES;
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, interval);

    return () => clearInterval(timer);
  }, [frames.length, interval]);

  const frame = frames[frameIndex];

  return (
    <Box>
      <Text color="cyan">{frame}</Text>
      {message && <Text> {message}</Text>}
    </Box>
  );
}

export interface ProgressProps {
  /** Current progress value (0-100) */
  value: number;
  /** Width of progress bar in characters */
  width?: number;
  /** Label to display */
  label?: string;
}

/**
 * Progress bar component
 */
export function Progress({ value, width = 20, label }: ProgressProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const filled = Math.round((clampedValue / 100) * width);
  const empty = width - filled;
  const bar = '#'.repeat(filled) + '-'.repeat(empty);

  return (
    <Box>
      {label && <Text>{label} </Text>}
      <Text>[</Text>
      <Text color="green">{bar.slice(0, filled)}</Text>
      <Text dimColor>{bar.slice(filled)}</Text>
      <Text>] </Text>
      <Text>{clampedValue}%</Text>
    </Box>
  );
}
