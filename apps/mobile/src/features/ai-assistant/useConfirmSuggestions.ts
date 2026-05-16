import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { SuggestedItem } from "@/domain/entities/AISuggestion";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { SearchProducts, CreateProduct } from "@/application/use-cases/products";
import { AddShoppingListItem } from "@/application/use-cases/shoppingListItems";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const searchProducts = new SearchProducts(defaultRepositories.products);
const createProduct = new CreateProduct(
  defaultRepositories.products,
  defaultRepositories.userEvents,
);
const addItem = new AddShoppingListItem(
  defaultRepositories.shoppingListItems,
  defaultRepositories.shoppingLists,
  defaultRepositories.priceHistory,
  defaultRepositories.userEvents,
);

export function useConfirmSuggestions(listId: string) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [progress, setProgress] = useState(0);

  async function confirm(selected: SuggestedItem[]) {
    if (selected.length === 0) return;
    setIsConfirming(true);
    setProgress(0);

    for (let i = 0; i < selected.length; i++) {
      const suggestion = selected[i];
      setProgress(i + 1);

      try {
        const existing = await searchProducts.execute({
          searchTerm: suggestion.name,
          limit: 1,
        });

        const exactMatch = existing.find(
          (p) => p.name.toLowerCase().trim() === suggestion.name.toLowerCase().trim()
        );

        const productId = exactMatch
          ? exactMatch.id
          : (await createProduct.execute({ name: suggestion.name, unit: suggestion.unit })).id;

        await addItem.execute({
          shoppingListId: listId,
          productId,
          quantity: suggestion.quantity,
          unitPrice: 0,
        });
      } catch {
        // Individual failures are silent — remaining items continue
      }
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.detail(listId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.items(listId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all() }),
    ]);

    setIsConfirming(false);
  }

  return { confirm, isConfirming, progress };
}
