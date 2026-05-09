import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("Supabase auth error mapping", () => {
  it("does not use generic record-not-found mapping for Auth sign up and sign in", async () => {
    const source = await readFile(
      join(process.cwd(), "src", "infrastructure", "repositories", "SupabaseAuthRepository.ts"),
      "utf8",
    );

    expect(source).toContain("toAuthAppError");
    expect(source).toContain("Email ou senha incorretos.");
    expect(source).not.toContain('throw toAppError(error, "validation_error")');
    expect(source).toContain('throw toAuthAppError(error, "Não foi possível criar sua conta.")');
    expect(source).toContain('throw toAuthAppError(error, "Não foi possível entrar.")');
  });
});
