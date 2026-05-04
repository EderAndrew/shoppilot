import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  AddShoppingListItem,
  CheckShoppingListItem,
  RemoveShoppingListItem,
  UpdateShoppingListItem,
} from "@/application/use-cases/shoppingListItems";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const itemUseCases = {
  add: new AddShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
  ),
  check: new CheckShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
  ),
  remove: new RemoveShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
  ),
  update: new UpdateShoppingListItem(
    defaultRepositories.shoppingListItems,
    defaultRepositories.shoppingLists,
  ),
};

function useInvalidateList(listId: string) {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.detail(listId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.items(listId) });
  };
}

export function useAddShoppingListItemMutation(listId: string) {
  const invalidateList = useInvalidateList(listId);

  return useMutation({
    mutationFn: (input: Parameters<typeof itemUseCases.add.execute>[0]) =>
      itemUseCases.add.execute(input),
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
