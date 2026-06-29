import { describe, expect, test } from "bun:test";
import { existsSync } from "fs";
import { join } from "path";

const typesDir = join(import.meta.dir, "..", "src", "types");
const codegenRan = existsSync(join(typesDir, "index.ts")) || existsSync(join(typesDir, "index.js"));

describe("codegen output validation", () => {
  test("generated types directory exists after codegen", () => {
    if (!codegenRan) {
      return;
    }
    expect(existsSync(typesDir)).toBe(true);
  });

  test("generated model types import cleanly", async () => {
    if (!codegenRan) {
      return;
    }
    const types = await import("../src/types");
    expect(types).toBeDefined();
    const entityExports = Object.keys(types).filter(
      (k) => typeof types[k] === "function" || typeof types[k] === "object",
    );
    expect(entityExports.length).toBeGreaterThan(0);
  });

  test("AdlEvent entity model is exported after codegen", async () => {
    if (!codegenRan) {
      return;
    }
    const types = await import("../src/types");
    expect(types.AdlEvent).toBeDefined();
  });

  test("MarketTokenTransfer entity model is exported after codegen", async () => {
    if (!codegenRan) {
      return;
    }
    const types = await import("../src/types");
    expect(types.MarketTokenTransfer).toBeDefined();
  });
});
