import type { PriceInsight } from "../services/priceInsight";
import type { UserEventMetadata } from "@shop-pilot/shared/events/userEvents";

export type ShoppingListEventMetadataInput = {
  id: string;
  status: string;
  budget: number;
};

export type ProductEventMetadataInput = {
  id: string;
  brand?: string | null;
  unit?: string | null;
};

export type ItemEventMetadataInput = {
  id: string;
  shoppingListId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  bought: boolean;
};

export type PriceRecordedEventMetadataInput = {
  productId: string;
  shoppingListId: string;
  shoppingListItemId?: string | null;
  price: number;
  priceInsight?: PriceInsight;
};

export function buildShoppingListEventMetadata(
  list: ShoppingListEventMetadataInput,
): UserEventMetadata {
  return {
    budget: list.budget,
    list_id: list.id,
    status: list.status,
  };
}

export function buildProductEventMetadata(product: ProductEventMetadataInput): UserEventMetadata {
  return {
    product_id: product.id,
    ...(product.brand ? { brand: product.brand } : {}),
    ...(product.unit ? { unit: product.unit } : {}),
  };
}

export function buildItemEventMetadata(item: ItemEventMetadataInput): UserEventMetadata {
  return {
    bought: item.bought,
    item_id: item.id,
    list_id: item.shoppingListId,
    product_id: item.productId,
    quantity: item.quantity,
    total_price: item.totalPrice,
    unit_price: item.unitPrice,
  };
}

export function buildPriceRecordedEventMetadata(
  input: PriceRecordedEventMetadataInput,
): UserEventMetadata {
  return {
    list_id: input.shoppingListId,
    price: input.price,
    product_id: input.productId,
    ...(input.shoppingListItemId ? { item_id: input.shoppingListItemId } : {}),
    ...(input.priceInsight?.previousPrice !== null &&
    input.priceInsight?.previousPrice !== undefined
      ? { previous_price: input.priceInsight.previousPrice }
      : {}),
    ...(input.priceInsight?.absoluteDifference !== undefined
      ? { absolute_difference: input.priceInsight.absoluteDifference }
      : {}),
    ...(input.priceInsight?.percentageDifference !== undefined
      ? { percentage_difference: input.priceInsight.percentageDifference }
      : {}),
    ...(input.priceInsight ? { comparison_status: input.priceInsight.status } : {}),
  };
}
