import { ShoppingList } from "@/domain/entities/ShoppingList";

import type { ShoppingListRecord } from "@/application/ports/ShoppingListRepository";
import type { Tables } from "../supabase/database.types";

export function shoppingListRowToRecord(
  row: Tables<"shopping_lists">,
): ShoppingListRecord {
  return {
    archivedAt: row.archived_at,
    budget: Number(row.budget),
    completedAt: row.completed_at,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    status: row.status,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function shoppingListRowToDomain(row: Tables<"shopping_lists">): ShoppingList {
  return new ShoppingList(shoppingListRowToRecord(row));
}
