import { createRepositoryContainer } from "@/application/ports/repositoryContainer";

import { SupabaseAuthRepository } from "./SupabaseAuthRepository";
import { SupabaseProductRepository } from "./SupabaseProductRepository";
import { SupabaseShoppingListItemRepository } from "./SupabaseShoppingListItemRepository";
import { SupabaseShoppingListRepository } from "./SupabaseShoppingListRepository";

const auth = new SupabaseAuthRepository();

export const defaultRepositories = createRepositoryContainer({
  auth,
  priceHistory: {
    append: async () => {
      throw new Error("Price history is implemented in US2.");
    },
    getLatestPreviousPrice: async () => null,
    listByProduct: async () => [],
  },
  products: new SupabaseProductRepository(auth),
  shoppingListItems: new SupabaseShoppingListItemRepository(auth),
  shoppingLists: new SupabaseShoppingListRepository(auth),
  userEvents: {
    append: async () => {
      throw new Error("User events are implemented in US3.");
    },
    listByEntity: async () => [],
  },
});
