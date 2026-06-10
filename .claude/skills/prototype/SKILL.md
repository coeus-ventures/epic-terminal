---
name: prototype
description: Scaffold a throwaway terminal UI prototype (an Ink/React screen) to quickly explore a feature in isolation, without wiring it into the real CLI. Use when the user wants to mock up, sketch, or rapidly prototype a TUI screen. Triggers on "prototype this screen", "mock up a TUI", "sketch a terminal UI for", or "create a prototype".
---

# Prototype

Create a self-contained terminal prototype screen for the feature the user describes. The CLI provides the target prototype directory; create the screen file there.

## Instructions

1. Create `screen.tsx` in the prototype directory — an Ink/React component that implements the described feature.
2. Add `#!/usr/bin/env bun` as the first line and a default export that renders the screen with `render(<Screen />)` from `ink`.
3. Build the UI from Ink primitives (`Box`, `Text`, `useInput`, etc.). Keep the prototype self-contained — assume no extra UI dependencies are installed.
4. Implement the core TUI interaction described. Prioritize correctness of the main flow over completeness.
5. Do not modify other screens or shared components unless strictly necessary for the prototype to run.
