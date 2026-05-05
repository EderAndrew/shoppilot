import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "../..");
const rlsSql = readFileSync(
  resolve(repoRoot, "supabase/migrations/002_monthly_shopping_mvp_rls.sql"),
  "utf8",
).toLowerCase();

describe("append-only history and event records", () => {
  it("types price history and user events as non-updatable database rows", () => {
    const databaseTypes = readFileSync(
      resolve(process.cwd(), "src/infrastructure/supabase/database.types.ts"),
      "utf8",
    );

    expect(databaseTypes).toContain("price_history:");
    expect(databaseTypes).toContain("user_events:");
    expect(databaseTypes.match(/Update: never/g)).toHaveLength(2);
  });

  it("does not define update or delete repository methods for append-only ports", () => {
    const priceHistoryPort = readFileSync(
      resolve(process.cwd(), "src/application/ports/PriceHistoryRepository.ts"),
      "utf8",
    );
    const userEventPort = readFileSync(
      resolve(process.cwd(), "src/application/ports/UserEventRepository.ts"),
      "utf8",
    );

    expect(`${priceHistoryPort}\n${userEventPort}`).not.toMatch(/\b(update|delete|remove)\s*\(/);
    expect(priceHistoryPort).toContain("append(");
    expect(userEventPort).toContain("append(");
  });

  it("keeps RLS update and delete policies absent for append-only tables", () => {
    expect(rlsSql).not.toContain("price_history_update");
    expect(rlsSql).not.toContain("price_history_delete");
    expect(rlsSql).not.toContain("user_events_update");
    expect(rlsSql).not.toContain("user_events_delete");
  });
});
