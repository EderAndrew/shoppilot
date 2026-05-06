import { createRepositoryContainer } from "@/application/ports/repositoryContainer";

import { SupabaseAuthRepository } from "./SupabaseAuthRepository";
import { SupabasePriceHistoryRepository } from "./SupabasePriceHistoryRepository";
import { SupabaseProductRepository } from "./SupabaseProductRepository";
import { SupabaseShoppingListItemRepository } from "./SupabaseShoppingListItemRepository";
import { SupabaseShoppingListRepository } from "./SupabaseShoppingListRepository";
import { SupabaseUserEventRepository } from "./SupabaseUserEventRepository";

const auth = new SupabaseAuthRepository();
const userEvents = new SupabaseUserEventRepository(auth);

export const defaultRepositories = createRepositoryContainer({
  auth,
  priceHistory: new SupabasePriceHistoryRepository(auth),
  products: new SupabaseProductRepository(auth),
  shoppingListItems: new SupabaseShoppingListItemRepository(auth),
  shoppingLists: new SupabaseShoppingListRepository(auth),
  userEvents,
});
