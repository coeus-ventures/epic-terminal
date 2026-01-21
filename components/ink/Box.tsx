/**
 * Box component wrapper for Ink
 * Provides layout container for CLI output
 */

import { Box as InkBox, type BoxProps as InkBoxProps } from 'ink';
import React from 'react';

export interface BoxProps extends InkBoxProps {
  children?: React.ReactNode;
}

/**
 * Layout container component
 */
export function Box({ children, ...props }: BoxProps) {
  return <InkBox {...props}>{children}</InkBox>;
}

/**
 * Horizontal layout container (row)
 */
export function Row({ children, ...props }: BoxProps) {
  return (
    <InkBox flexDirection="row" {...props}>
      {children}
    </InkBox>
  );
}

/**
 * Vertical layout container (column)
 */
export function Column({ children, ...props }: BoxProps) {
  return (
    <InkBox flexDirection="column" {...props}>
      {children}
    </InkBox>
  );
}

/**
 * Padded container
 */
export function Padded({ children, padding = 1, ...props }: BoxProps & { padding?: number }) {
  return (
    <InkBox padding={padding} {...props}>
      {children}
    </InkBox>
  );
}
