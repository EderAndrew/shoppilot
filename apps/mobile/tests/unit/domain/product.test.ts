import { describe, expect, it } from "vitest";

import { Product } from "../../../src/domain/entities/Product";

const productProps = {
  barcode: null,
  brand: "Acme",
  createdAt: "2026-05-04T00:00:00.000Z",
  id: "product-1",
  name: "Rice",
  unit: "kg",
  updatedAt: "2026-05-04T00:00:00.000Z",
  userId: "user-1",
};

describe("Product", () => {
  it("trims required and optional fields", () => {
    const product = new Product({
      ...productProps,
      brand: "  Acme  ",
      name: "  Rice  ",
      unit: "  kg  ",
    });

    expect(product.toRecord()).toMatchObject({ brand: "Acme", name: "Rice", unit: "kg" });
  });

  it("rejects a blank name", () => {
    expect(() => new Product({ ...productProps, name: "   " })).toThrow(RangeError);
  });

  it("matches duplicate candidates by normalized name, brand, and unit", () => {
    const product = new Product(productProps);

    expect(product.matchesDuplicateCandidate({ brand: " acme ", name: " rice ", unit: "KG" })).toBe(
      true,
    );
    expect(product.matchesDuplicateCandidate({ brand: "Other", name: "Rice", unit: "kg" })).toBe(
      false,
    );
  });

  it("matches duplicate candidates by barcode when both sides have one", () => {
    const product = new Product({ ...productProps, barcode: "789" });

    expect(product.matchesDuplicateCandidate({ barcode: " 789 ", name: "Different" })).toBe(true);
  });
});
