import type { AuthRepository } from "./AuthRepository";
import type { PriceHistoryRepository } from "./PriceHistoryRepository";
import type { ProductRepository } from "./ProductRepository";
import type { ShoppingListItemRepository } from "./ShoppingListItemRepository";
import type { ShoppingListRepository } from "./ShoppingListRepository";
import type { UserEventRepository } from "./UserEventRepository";

export type RepositoryContainer = {
  auth: AuthRepository;
  shoppingLists: ShoppingListRepository;
  products: ProductRepository;
  shoppingListItems: ShoppingListItemRepository;
  priceHistory: PriceHistoryRepository;
  userEvents: UserEventRepository;
};

export function createRepositoryContainer(
  repositories: RepositoryContainer,
): Readonly<RepositoryContainer> {
  return Object.freeze({ ...repositories });
}
