import { PriceHistory } from "@/domain/entities/PriceHistory";

import type { PriceHistoryRecord } from "@/application/ports/PriceHistoryRepository";
import type { Tables } from "../supabase/database.types";

export function priceHistoryRowToRecord(row: Tables<"price_history">): PriceHistoryRecord {
  return {
    createdAt: row.created_at,
    id: row.id,
    price: row.price,
    productId: row.product_id,
    recordedAt: row.recorded_at,
    shoppingListId: row.shopping_list_id,
    shoppingListItemId: row.shopping_list_item_id,
    userId: row.user_id,
  };
}

export function priceHistoryRowToDomain(row: Tables<"price_history">): PriceHistory {
  return new PriceHistory(priceHistoryRowToRecord(row));
}
