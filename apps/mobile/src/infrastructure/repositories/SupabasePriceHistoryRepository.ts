import type { AuthRepository } from "@/application/ports/AuthRepository";
import type {
  AppendPriceHistoryInput,
  LatestPreviousPriceInput,
  PriceHistoryRecord,
  PriceHistoryRepository,
} from "@/application/ports/PriceHistoryRepository";

import { priceHistoryRowToRecord } from "../mappers/priceHistoryMapper";
import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";
import { mapSupabaseError, requireCurrentUserId } from "./supabaseRepositoryUtils";

export class SupabasePriceHistoryRepository implements PriceHistoryRepository {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly client: ShopPilotSupabaseClient = supabase,
  ) {}

  async append(input: AppendPriceHistoryInput): Promise<PriceHistoryRecord> {
    const userId = await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("price_history")
      .insert({
        price: input.price,
        product_id: input.productId,
        recorded_at: input.recordedAt,
        shopping_list_id: input.shoppingListId,
        shopping_list_item_id: input.shoppingListItemId ?? null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) mapSupabaseError(error);
    return priceHistoryRowToRecord(data);
  }

  async getLatestPreviousPrice(
    input: LatestPreviousPriceInput,
  ): Promise<PriceHistoryRecord | null> {
    await requireCurrentUserId(this.authRepository);
    let query = this.client
      .from("price_history")
      .select()
      .eq("product_id", input.productId)
      .order("recorded_at", { ascending: false })
      .limit(1);

    if (input.beforeRecordedAt) {
      query = query.lt("recorded_at", input.beforeRecordedAt);
    }

    const { data, error } = await query.maybeSingle();
    if (error) mapSupabaseError(error);
    return data ? priceHistoryRowToRecord(data) : null;
  }

  async listByProduct(productId: string): Promise<PriceHistoryRecord[]> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("price_history")
      .select()
      .eq("product_id", productId)
      .order("recorded_at", { ascending: false });

    if (error) mapSupabaseError(error);
    return (data ?? []).map(priceHistoryRowToRecord);
  }
}
