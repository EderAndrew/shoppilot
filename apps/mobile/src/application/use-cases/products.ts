import type { CreateProductInput, ProductRecord, ProductRepository } from "../ports/ProductRepository";

export class CreateProduct {
  constructor(private readonly products: ProductRepository) {}

  execute(input: CreateProductInput): Promise<ProductRecord> {
    return this.products.create(input);
  }
}
