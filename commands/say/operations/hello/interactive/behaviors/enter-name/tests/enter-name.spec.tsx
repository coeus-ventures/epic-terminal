import { describe, expect, it } from "bun:test";
import { render } from "ink-testing-library";
import { HelloInteractive } from "../../../hello.tsx";

const flush = () =>
  new Promise<void>((resolve) => {
    setImmediate(() => setImmediate(() => setImmediate(() => resolve())));
  });

describe("enter-name (behavior)", () => {
  it("shows the prompt by default", async () => {
    const { lastFrame, unmount } = render(<HelloInteractive />);
    try {
      await flush();
      expect(lastFrame()).toContain("What is your name?");
    } finally {
      unmount();
    }
  });

  it("echoes typed input and captures the name on Enter", async () => {
    let captured: string | undefined;
    const { stdin, lastFrame, unmount } = render(
      <HelloInteractive onComplete={(name) => { captured = name; }} />,
    );
    try {
      stdin.write("Alice");
      await flush();
      expect(lastFrame()).toContain("Alice");

      stdin.write("\r");
      await flush();
      expect(captured).toBe("Alice");
    } finally {
      unmount();
    }
  });

  it("captures empty input on Enter (defaults to World downstream)", async () => {
    let captured: string | undefined;
    const { stdin, unmount } = render(
      <HelloInteractive onComplete={(name) => { captured = name; }} />,
    );
    try {
      stdin.write("\r");
      await flush();
      expect(captured).toBe("");
    } finally {
      unmount();
    }
  });
});
