import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const testDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(testDir, "../../../..");
const schemaSql = readFileSync(
  resolve(repoRoot, "supabase/migrations/001_monthly_shopping_mvp_schema.sql"),
  "utf8",
);
const rlsSql = readFileSync(
  resolve(repoRoot, "supabase/migrations/002_monthly_shopping_mvp_rls.sql"),
  "utf8",
);

const normalizeSql = (sql: string) => sql.replace(/\s+/g, " ").toLowerCase();

const normalizedSchema = normalizeSql(schemaSql);
const normalizedRls = normalizeSql(rlsSql);

const tables = [
  "shopping_lists",
  "products",
  "shopping_list_items",
  "price_history",
  "user_events",
] as const;

const mutableTables = ["shopping_lists", "products", "shopping_list_items"] as const;
const deletableTables = ["products", "shopping_list_items"] as const;
const appendOnlyTables = ["price_history", "user_events"] as const;

describe("Supabase RLS policy migration", () => {
  it.each(tables)("enables RLS for %s", (table) => {
    expect(normalizedRls).toContain(`alter table public.${table} enable row level security`);
    expect(normalizedRls).toContain(`alter table public.${table} force row level security`);
  });

  it.each(tables)("scopes SELECT on %s to the authenticated owner", (table) => {
    expect(normalizedRls).toContain(`create policy "${table}_select_own"`);
    expect(normalizedRls).toContain(
      `on public.${table} for select to authenticated using (user_id = auth.uid())`,
    );
  });

  it.each(tables)("requires INSERT ownership for %s", (table) => {
    expect(normalizedRls).toContain(`create policy "${table}_insert_own"`);
    expect(normalizedRls).toContain(
      `on public.${table} for insert to authenticated with check (user_id = auth.uid())`,
    );
  });

  it.each(mutableTables)("allows UPDATE only when %s remains owned by auth.uid()", (table) => {
    expect(normalizedRls).toContain(`create policy "${table}_update_own"`);
    expect(normalizedRls).toContain(
      `on public.${table} for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())`,
    );
  });

  it.each(deletableTables)("allows DELETE only for owned mutable rows in %s", (table) => {
    expect(normalizedRls).toContain(`create policy "${table}_delete_own"`);
    expect(normalizedRls).toContain(
      `on public.${table} for delete to authenticated using (user_id = auth.uid())`,
    );
  });

  it.each(appendOnlyTables)(
    "does not expose UPDATE or DELETE policies for append-only %s rows",
    (table) => {
      expect(normalizedRls).not.toContain(`"${table}_update_own"`);
      expect(normalizedRls).not.toContain(`"${table}_delete_own"`);
    },
  );

  it("does not allow normal shopping list deletes", () => {
    expect(normalizedRls).not.toContain('"shopping_lists_delete_own"');
  });

  it("documents append-only expectations for history and event tables", () => {
    expect(normalizedRls).toContain("comment on table public.price_history");
    expect(normalizedRls).toContain("comment on table public.user_events");
    expect(normalizedRls).toContain("append-only");
  });
});

describe("Supabase ownership constraints", () => {
  it.each(tables)("defines user ownership on %s", (table) => {
    expect(normalizedSchema).toContain(`create table public.${table}`);
    expect(normalizedSchema).toContain("user_id uuid not null references auth.users(id)");
  });

  it("keeps list items tied to a list and product owned by the same user", () => {
    expect(normalizedSchema).toContain(
      "constraint shopping_list_items_list_owner_fk foreign key (shopping_list_id, user_id) references public.shopping_lists (id, user_id)",
    );
    expect(normalizedSchema).toContain(
      "constraint shopping_list_items_product_owner_fk foreign key (product_id, user_id) references public.products (id, user_id)",
    );
  });

  it("keeps price history tied to product and list context owned by the same user", () => {
    expect(normalizedSchema).toContain(
      "constraint price_history_product_owner_fk foreign key (product_id, user_id) references public.products (id, user_id)",
    );
    expect(normalizedSchema).toContain(
      "constraint price_history_list_owner_fk foreign key (shopping_list_id, user_id) references public.shopping_lists (id, user_id)",
    );
  });
});
