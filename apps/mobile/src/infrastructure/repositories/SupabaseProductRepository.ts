import type { AuthRepository } from "@/application/ports/AuthRepository";
import type {
  CreateProductInput,
  ProductDuplicateCandidateInput,
  ProductRecord,
  ProductRepository,
  ProductSearchInput,
} from "@/application/ports/ProductRepository";

import { productRowToRecord } from "../mappers/productMapper";
import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";
import { mapSupabaseError, requireCurrentUserId } from "./supabaseRepositoryUtils";

export class SupabaseProductRepository implements ProductRepository {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly client: ShopPilotSupabaseClient = supabase,
  ) {}

  async create(input: CreateProductInput): Promise<ProductRecord> {
    const userId = await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("products")
      .insert({
        barcode: input.barcode ?? null,
        brand: input.brand ?? null,
        name: input.name.trim(),
        unit: input.unit ?? null,
        user_id: userId,
      })
      .select()
      .single();

    if (error) mapSupabaseError(error);
    return productRowToRecord(data);
  }

  async search(input: ProductSearchInput): Promise<ProductRecord[]> {
    await requireCurrentUserId(this.authRepository);
    let query = this.client
      .from("products")
      .select()
      .order("name", { ascending: true })
      .limit(input.limit ?? 20);

    if (input.searchTerm?.trim()) {
      query = query.ilike("name", `%${input.searchTerm.trim()}%`);
    }

    const { data, error } = await query;
    if (error) mapSupabaseError(error);
    return (data ?? []).map(productRowToRecord);
  }

  async getById(productId: string): Promise<ProductRecord | null> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("products")
      .select()
      .eq("id", productId)
      .maybeSingle();

    if (error) mapSupabaseError(error);
    return data ? productRowToRecord(data) : null;
  }

  async findDuplicateCandidates(input: ProductDuplicateCandidateInput): Promise<ProductRecord[]> {
    return this.search({ limit: 10, searchTerm: input.barcode ?? input.name });
  }
}
