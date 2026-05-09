import { describe, expect, it, vi } from "vitest";

import type { ProductRepository } from "../../../src/application/ports/ProductRepository";
import {
  CreateProduct,
  FindDuplicateProductCandidates,
  SearchProducts,
} from "../../../src/application/use-cases/products";

const product = {
  barcode: null,
  brand: "Acme",
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "product-1",
  name: "Rice",
  unit: "kg",
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

function repository(): ProductRepository {
  return {
    create: vi.fn(async (input) => ({ ...product, ...input })),
    findDuplicateCandidates: vi.fn(async () => [
      product,
      { ...product, id: "product-2", brand: "Other" },
    ]),
    getById: vi.fn(async () => product),
    search: vi.fn(async () => [product]),
  };
}

describe("product use cases", () => {
  it("creates a product with normalized values", async () => {
    const products = repository();

    await expect(
      new CreateProduct(products).execute({ brand: " Acme ", name: " Rice ", unit: " kg " }),
    ).resolves.toMatchObject({ brand: "Acme", name: "Rice", unit: "kg" });

    expect(products.create).toHaveBeenCalledWith(
      expect.objectContaining({ brand: "Acme", name: "Rice", unit: "kg" }),
    );
  });

  it("searches products with a trimmed search term", async () => {
    const products = repository();

    await new SearchProducts(products).execute({ searchTerm: " rice " });

    expect(products.search).toHaveBeenCalledWith({ limit: undefined, searchTerm: "rice" });
  });

  it("filters duplicate candidates by product identity", async () => {
    const products = repository();
    const candidates = await new FindDuplicateProductCandidates(products).execute({
      brand: "acme",
      name: "rice",
      unit: "KG",
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].id).toBe("product-1");
  });
});
