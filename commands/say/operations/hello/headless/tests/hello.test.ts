import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import { hello } from "../hello.ts";

describe("hello", () => {
  let consoleSpy: ReturnType<typeof spyOn>;
  let logs: string[];

  beforeEach(() => {
    logs = [];
    consoleSpy = spyOn(console, "log").mockImplementation((...args) => {
      logs.push(args.join(" "));
    });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("greets World by default", async () => {
    const result = await hello({});
    expect(logs).toContain("Hello, World!");
    expect(result.greeting).toBe("Hello, World!");
  });

  it("greets the provided name", async () => {
    const result = await hello({ name: "Alice" });
    expect(logs).toContain("Hello, Alice!");
    expect(result.greeting).toBe("Hello, Alice!");
  });
});
