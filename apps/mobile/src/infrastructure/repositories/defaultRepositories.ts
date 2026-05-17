import { createRepositoryContainer } from "@/application/ports/repositoryContainer";
import { queryClient } from "@/application/query-keys/queryClientInstance";
import { LocalFirstShoppingListItemRepository } from "@/infrastructure/local/LocalFirstShoppingListItemRepository";
import { LocalFirstShoppingListRepository } from "@/infrastructure/local/LocalFirstShoppingListRepository";

import { SupabaseAIRepository } from "./SupabaseAIRepository";
import { SupabaseAuthRepository } from "./SupabaseAuthRepository";
import { SupabasePriceHistoryRepository } from "./SupabasePriceHistoryRepository";
import { SupabaseProductRepository } from "./SupabaseProductRepository";
import { SupabaseShoppingListItemRepository } from "./SupabaseShoppingListItemRepository";
import { SupabaseShoppingListRepository } from "./SupabaseShoppingListRepository";
import { SupabaseUserEventRepository } from "./SupabaseUserEventRepository";

const auth = new SupabaseAuthRepository();
const userEvents = new SupabaseUserEventRepository(auth);

const supabaseShoppingListItems = new SupabaseShoppingListItemRepository(auth);
const supabaseShoppingLists = new SupabaseShoppingListRepository(auth);

export const defaultRepositories = createRepositoryContainer({
  ai: new SupabaseAIRepository(),
  auth,
  priceHistory: new SupabasePriceHistoryRepository(auth),
  products: new SupabaseProductRepository(auth),
  shoppingListItems: new LocalFirstShoppingListItemRepository(
    supabaseShoppingListItems,
    auth,
    queryClient,
  ),
  shoppingLists: new LocalFirstShoppingListRepository(supabaseShoppingLists, auth, queryClient),
  userEvents,
});
