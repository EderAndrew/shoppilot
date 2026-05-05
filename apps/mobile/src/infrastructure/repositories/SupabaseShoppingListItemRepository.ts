import type { AuthRepository } from "@/application/ports/AuthRepository";
import type {
  AddShoppingListItemInput,
  SetShoppingListItemBoughtInput,
  ShoppingListItemRecord,
  ShoppingListItemRepository,
  UpdateShoppingListItemInput,
} from "@/application/ports/ShoppingListItemRepository";

import { shoppingListItemRowToRecord } from "../mappers/shoppingListItemMapper";
import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";
import { mapSupabaseError, requireCurrentUserId } from "./supabaseRepositoryUtils";

export class SupabaseShoppingListItemRepository implements ShoppingListItemRepository {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly client: ShopPilotSupabaseClient = supabase,
  ) {}

  async add(input: AddShoppingListItemInput): Promise<ShoppingListItemRecord> {
    const userId = await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_list_items")
      .insert({
        product_id: input.productId,
        quantity: input.quantity,
        shopping_list_id: input.shoppingListId,
        total_price: input.totalPrice,
        unit_price: input.unitPrice,
        user_id: userId,
      })
      .select()
      .single();

    if (error) mapSupabaseError(error);
    return shoppingListItemRowToRecord(data);
  }

  async update(input: UpdateShoppingListItemInput): Promise<ShoppingListItemRecord> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_list_items")
      .update({
        bought: input.bought,
        quantity: input.quantity,
        total_price: input.totalPrice,
        unit_price: input.unitPrice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.itemId)
      .select()
      .single();

    if (error) mapSupabaseError(error);
    return shoppingListItemRowToRecord(data);
  }

  async remove(itemId: string): Promise<void> {
    await requireCurrentUserId(this.authRepository);
    const { error } = await this.client.from("shopping_list_items").delete().eq("id", itemId);
    if (error) mapSupabaseError(error);
  }

  async setBought(input: SetShoppingListItemBoughtInput): Promise<ShoppingListItemRecord> {
    return this.update({ bought: input.bought, itemId: input.itemId });
  }

  async listByShoppingList(shoppingListId: string): Promise<ShoppingListItemRecord[]> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_list_items")
      .select()
      .eq("shopping_list_id", shoppingListId)
      .order("created_at", { ascending: true });

    if (error) mapSupabaseError(error);
    return (data ?? []).map((row) => shoppingListItemRowToRecord(row));
  }
}
