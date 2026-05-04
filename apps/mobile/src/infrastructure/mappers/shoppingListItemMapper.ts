import { ShoppingListItem } from "@/domain/entities/ShoppingListItem";

import type { ShoppingListItemRecord } from "@/application/ports/ShoppingListItemRepository";
import type { Tables } from "../supabase/database.types";

export function shoppingListItemRowToRecord(
  row: Tables<"shopping_list_items">,
): ShoppingListItemRecord {
  return {
    bought: row.bought,
    createdAt: row.created_at,
    id: row.id,
    productId: row.product_id,
    quantity: Number(row.quantity),
    shoppingListId: row.shopping_list_id,
    totalPrice: Number(row.total_price),
    unitPrice: Number(row.unit_price),
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function shoppingListItemRowToDomain(
  row: Tables<"shopping_list_items">,
): ShoppingListItem {
  return new ShoppingListItem(shoppingListItemRowToRecord(row));
}
