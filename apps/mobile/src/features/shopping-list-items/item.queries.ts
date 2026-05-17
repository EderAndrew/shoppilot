import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  CheckShoppingListItem,
  RemoveShoppingListItem,
  UpdateShoppingListItem,
} from "@/application/use-cases/shoppingListItems";
import type { AddShoppingListItemInput } from "@/application/ports/ShoppingListItemRepository";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";
import { createAppError } from "@/shared/errors/appError";

const itemUseCases = {
  check: new CheckShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
    defaultRepositories.userEvents,
  ),
  remove: new RemoveShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
    defaultRepositories.userEvents,
  ),
  update: new UpdateShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
    defaultRepositories.priceHistory,
    defaultRepositories.userEvents,
  ),
};

function useInvalidateList(listId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.detail(listId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.items(listId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.products.all() });
  };
}

export function useAddShoppingListItemMutation(listId: string) {
  const invalidateList = useInvalidateList(listId);

  return useMutation({
    mutationFn: async (input: Omit<AddShoppingListItemInput, "totalPrice">) => {
      const details = await defaultRepositories.shoppingLists.getDetails(input.shoppingListId);
      if (!details) {
        throw createAppError({ category: "not_found", message: "Não encontramos essa lista." });
      }
      if (details.list.status === "archived") {
        throw createAppError({
          category: "forbidden",
          message: "Esta lista está arquivada e não pode ser modificada.",
        });
      }
      const totalPrice = Math.round(input.quantity * input.unitPrice * 100) / 100;
      return defaultRepositories.shoppingListItems.add({ ...input, totalPrice });
    },
    onSuccess: invalidateList,
  });
}

export function useUpdateShoppingListItemMutation(listId: string) {
  const invalidateList = useInvalidateList(listId);

  return useMutation({
    mutationFn: (input: Parameters<typeof itemUseCases.update.execute>[0]) =>
      itemUseCases.update.execute(input),
    onSuccess: invalidateList,
  });
}

export function useRemoveShoppingListItemMutation(listId: string) {
  const invalidateList = useInvalidateList(listId);

  return useMutation({
    mutationFn: (input: Parameters<typeof itemUseCases.remove.execute>[0]) =>
      itemUseCases.remove.execute(input),
    onSuccess: invalidateList,
  });
}

export function useCheckShoppingListItemMutation(listId: string) {
  const invalidateList = useInvalidateList(listId);

  return useMutation({
    mutationFn: (input: Parameters<typeof itemUseCases.check.execute>[0]) =>
      itemUseCases.check.execute(input),
    onSuccess: invalidateList,
  });
}
