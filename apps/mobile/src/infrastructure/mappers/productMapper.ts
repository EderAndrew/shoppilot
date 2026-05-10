import { Product } from "@/domain/entities/Product";

import type { ProductRecord } from "@/application/ports/ProductRepository";
import type { Tables } from "../supabase/database.types";

export function productRowToRecord(row: Tables<"products">): ProductRecord {
  return {
    barcode: row.barcode,
    brand: row.brand,
    createdAt: row.created_at,
    id: row.id,
    name: row.name,
    unit: row.unit,
    updatedAt: row.updated_at,
    userId: row.user_id,
  };
}

export function productRowToDomain(row: Tables<"products">): Product {
  return new Product(productRowToRecord(row));
}
