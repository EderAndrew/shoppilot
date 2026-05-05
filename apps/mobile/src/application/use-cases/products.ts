import { Product } from "@/domain/entities/Product";
import { buildProductEventMetadata } from "@/domain/events/eventMetadata";
import { logBusinessEvent } from "@/shared/logging/logger";

import type {
  CreateProductInput,
  ProductDuplicateCandidateInput,
  ProductRecord,
  ProductRepository,
  ProductSearchInput,
} from "../ports/ProductRepository";
import type { UserEventRepository } from "../ports/UserEventRepository";

function normalizeProductInput(input: CreateProductInput): CreateProductInput {
  const now = new Date().toISOString();
  const product = new Product({
    ...input,
    createdAt: now,
    id: "validation-only",
    updatedAt: now,
    userId: "validation-only",
  });

  return {
    barcode: product.barcode,
    brand: product.brand,
    name: product.name,
    unit: product.unit,
  };
}

export class CreateProduct {
  constructor(
    private readonly products: ProductRepository,
    private readonly userEvents?: UserEventRepository,
  ) {}

  async execute(input: CreateProductInput): Promise<ProductRecord> {
    const product = await this.products.create(normalizeProductInput(input));

    if (this.userEvents) {
      await this.userEvents.append({
        entityId: product.id,
        entityType: "product",
        eventType: "PRODUCT_CREATED",
        metadata: buildProductEventMetadata(product),
      });
      logBusinessEvent("Produto criado", {
        entityId: product.id,
        eventType: "PRODUCT_CREATED",
      });
    }

    return product;
  }
}

export class SearchProducts {
  constructor(private readonly products: ProductRepository) {}

  execute(input: ProductSearchInput = {}): Promise<ProductRecord[]> {
    return this.products.search({
      limit: input.limit,
      searchTerm: input.searchTerm?.trim() || undefined,
    });
  }
}

export class GetProduct {
  constructor(private readonly products: ProductRepository) {}

  execute(productId: string): Promise<ProductRecord | null> {
    return this.products.getById(productId);
  }
}

export class FindDuplicateProductCandidates {
  constructor(private readonly products: ProductRepository) {}

  async execute(input: ProductDuplicateCandidateInput): Promise<ProductRecord[]> {
    const normalizedInput = normalizeProductInput(input);
    const candidates = await this.products.findDuplicateCandidates(normalizedInput);

    return candidates.filter((candidate) =>
      new Product(candidate).matchesDuplicateCandidate(normalizedInput),
    );
  }
}
