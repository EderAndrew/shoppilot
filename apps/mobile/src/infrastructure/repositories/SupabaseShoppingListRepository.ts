import type {
  ArchiveShoppingListInput,
  CompleteShoppingListInput,
  CreateShoppingListInput,
  ShoppingListDetails,
  ShoppingListRecord,
  ShoppingListRepository,
} from "@/application/ports/ShoppingListRepository";
import type { AuthRepository } from "@/application/ports/AuthRepository";
import { createAppError } from "@/shared/errors/appError";

import { shoppingListItemRowToRecord } from "../mappers/shoppingListItemMapper";
import { shoppingListRowToRecord } from "../mappers/shoppingListMapper";
import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";
import { mapSupabaseError, requireCurrentUserId } from "./supabaseRepositoryUtils";

export class SupabaseShoppingListRepository implements ShoppingListRepository {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly client: ShopPilotSupabaseClient = supabase,
  ) {}

  async create(input: CreateShoppingListInput): Promise<ShoppingListRecord> {
    const userId = await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_lists")
      .insert({
        budget: input.budget,
        name: input.name.trim(),
        status: "active",
        user_id: userId,
      })
      .select()
      .single();

    if (error) mapSupabaseError(error);
    return shoppingListRowToRecord(data);
  }

  async list(): Promise<ShoppingListRecord[]> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_lists")
      .select()
      .order("created_at", { ascending: false });

    if (error) mapSupabaseError(error);
    return (data ?? []).map(shoppingListRowToRecord);
  }

  async getDetails(listId: string): Promise<ShoppingListDetails | null> {
    await requireCurrentUserId(this.authRepository);
    const { data: list, error: listError } = await this.client
      .from("shopping_lists")
      .select()
      .eq("id", listId)
      .maybeSingle();

    if (listError) mapSupabaseError(listError);
    if (!list) return null;

    const { data: items, error: itemsError } = await this.client
      .from("shopping_list_items")
      .select()
      .eq("shopping_list_id", listId)
      .order("created_at", { ascending: true });

    if (itemsError) mapSupabaseError(itemsError);

    const productIds = Array.from(new Set((items ?? []).map((item) => item.product_id)));
    const productNamesById = new Map<string, string>();

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await this.client
        .from("products")
        .select("id, name")
        .in("id", productIds);

      if (productsError) mapSupabaseError(productsError);
      for (const product of products ?? []) {
        productNamesById.set(product.id, product.name);
      }
    }

    return {
      items: (items ?? []).map((item) =>
        shoppingListItemRowToRecord(item, productNamesById.get(item.product_id)),
      ),
      list: shoppingListRowToRecord(list),
    };
  }

  async complete(input: CompleteShoppingListInput): Promise<ShoppingListRecord> {
    return this.setStatus(input.listId, {
      completed_at: input.completedAt ?? new Date().toISOString(),
      status: "completed",
    });
  }

  async archive(input: ArchiveShoppingListInput): Promise<ShoppingListRecord> {
    return this.setStatus(input.listId, {
      archived_at: input.archivedAt ?? new Date().toISOString(),
      status: "archived",
    });
  }

  private async setStatus(
    listId: string,
    values: { status: "completed" | "archived"; completed_at?: string; archived_at?: string },
  ): Promise<ShoppingListRecord> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("shopping_lists")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", listId)
      .select()
      .single();

    if (error) mapSupabaseError(error);
    if (!data) {
      throw createAppError({ category: "not_found", message: "Não encontramos esse registro." });
    }

    return shoppingListRowToRecord(data);
  }
}
