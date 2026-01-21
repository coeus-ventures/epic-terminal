/**
 * Ink components for CLI Boilerplate
 *
 * Re-exports all Ink-based UI components
 */

// Layout components
export { Box, Row, Column, Padded, type BoxProps } from './Box.tsx';

// Text components
export {
  Text,
  SuccessText,
  ErrorText,
  WarningText,
  DimText,
  type TextProps,
} from './Text.tsx';

// Loading/progress components
export { Spinner, Progress, type SpinnerProps, type ProgressProps } from './Spinner.tsx';

// Re-export useful ink primitives
export { useApp, useInput, useStdin, useStdout } from 'ink';
