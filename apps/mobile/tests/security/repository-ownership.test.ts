import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = resolve(process.cwd(), "../..");
const schemaSql = readFileSync(
  resolve(repoRoot, "supabase/migrations/001_monthly_shopping_mvp_schema.sql"),
  "utf8",
).replace(/\s+/g, " ");

const repositoryFiles = [
  "SupabaseShoppingListRepository.ts",
  "SupabaseProductRepository.ts",
  "SupabaseShoppingListItemRepository.ts",
  "SupabasePriceHistoryRepository.ts",
  "SupabaseUserEventRepository.ts",
] as const;

function repositorySource(file: (typeof repositoryFiles)[number]): string {
  return readFileSync(resolve(process.cwd(), "src/infrastructure/repositories", file), "utf8");
}

describe("repository ownership boundaries", () => {
  it.each(repositoryFiles)("requires the authenticated user before %s data access", (file) => {
    expect(repositorySource(file)).toContain("requireCurrentUserId");
  });

  it("denies cross-user list/product/item/history linkage with owner composite constraints", () => {
    expect(schemaSql).toContain(
      "constraint shopping_list_items_list_owner_fk foreign key (shopping_list_id, user_id) references public.shopping_lists (id, user_id)",
    );
    expect(schemaSql).toContain(
      "constraint shopping_list_items_product_owner_fk foreign key (product_id, user_id) references public.products (id, user_id)",
    );
    expect(schemaSql).toContain(
      "constraint price_history_product_owner_fk foreign key (product_id, user_id) references public.products (id, user_id)",
    );
    expect(schemaSql).toContain(
      "constraint price_history_list_owner_fk foreign key (shopping_list_id, user_id) references public.shopping_lists (id, user_id)",
    );
  });

  it("does not expose user_id as caller-controlled repository input", () => {
    const portDir = resolve(process.cwd(), "src/application/ports");
    const portSources = [
      "ShoppingListRepository.ts",
      "ProductRepository.ts",
      "ShoppingListItemRepository.ts",
      "PriceHistoryRepository.ts",
      "UserEventRepository.ts",
    ].map((file) => readFileSync(resolve(portDir, file), "utf8"));

    expect(portSources.join("\n")).not.toMatch(/Input\s*=\s*{[^}]*userId/s);
  });
});
