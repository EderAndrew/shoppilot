import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { parseMobileEnv } from "../../../../packages/config/src/env/mobile";

describe("mobile public environment contract", () => {
  it("parses only public Supabase URL and anon key values", () => {
    const parsed = parseMobileEnv({
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      EXPO_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    });

    expect(parsed).toEqual({
      EXPO_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      EXPO_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    });
    expect(Object.keys(parsed).join(" ")).not.toMatch(/service/i);
  });

  it("documents no service role key in the mobile env example", () => {
    const example = readFileSync(resolve(process.cwd(), ".env.example"), "utf8");

    expect(example).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
    expect(example).not.toMatch(/service[_-]?role/i);
  });
});
