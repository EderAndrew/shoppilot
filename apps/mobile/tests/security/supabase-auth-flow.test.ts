import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("Supabase mobile auth flow", () => {
  it("uses implicit auth flow to avoid WebCrypto-only PKCE on React Native iOS", async () => {
    const source = await readFile(
      join(process.cwd(), "src", "infrastructure", "supabase", "client.ts"),
      "utf8",
    );

    expect(source).toContain('flowType: "implicit"');
    expect(source).not.toContain('flowType: "pkce"');
  });
});
