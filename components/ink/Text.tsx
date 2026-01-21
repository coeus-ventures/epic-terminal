/**
 * Text component wrapper for Ink
 * Provides styled text output for CLI
 */

import { Text as InkText, type TextProps as InkTextProps } from 'ink';
import React from 'react';

export interface TextProps extends InkTextProps {
  children: React.ReactNode;
}

/**
 * Styled text component for CLI output
 */
export function Text({ children, ...props }: TextProps) {
  return <InkText {...props}>{children}</InkText>;
}

/**
 * Success text (green)
 */
export function SuccessText({ children, ...props }: TextProps) {
  return (
    <InkText color="green" {...props}>
      {children}
    </InkText>
  );
}

/**
 * Error text (red)
 */
export function ErrorText({ children, ...props }: TextProps) {
  return (
    <InkText color="red" {...props}>
      {children}
    </InkText>
  );
}

/**
 * Warning text (yellow)
 */
export function WarningText({ children, ...props }: TextProps) {
  return (
    <InkText color="yellow" {...props}>
      {children}
    </InkText>
  );
}

/**
 * Dim/muted text
 */
export function DimText({ children, ...props }: TextProps) {
  return (
    <InkText dimColor {...props}>
      {children}
    </InkText>
  );
}
