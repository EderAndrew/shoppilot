import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  ArchiveShoppingList,
  CompleteShoppingList,
  CreateShoppingList,
  GetShoppingListDetails,
  ListShoppingLists,
} from "@/application/use-cases/shoppingLists";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const listUseCases = {
  archive: new ArchiveShoppingList(defaultRepositories.shoppingLists),
  complete: new CompleteShoppingList(
    defaultRepositories.shoppingLists,
    defaultRepositories.userEvents,
  ),
  create: new CreateShoppingList(defaultRepositories.shoppingLists, defaultRepositories.userEvents),
  details: new GetShoppingListDetails(defaultRepositories.shoppingLists),
  list: new ListShoppingLists(defaultRepositories.shoppingLists),
};

export function useShoppingListsQuery() {
  return useQuery({
    queryFn: () => listUseCases.list.execute(),
    queryKey: queryKeys.shoppingLists.all(),
  });
}

export function useShoppingListDetailsQuery(listId: string) {
  return useQuery({
    enabled: Boolean(listId),
    queryFn: () => listUseCases.details.execute(listId),
    queryKey: queryKeys.shoppingLists.detail(listId),
  });
}

export function useCreateShoppingListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Parameters<typeof listUseCases.create.execute>[0]) =>
      listUseCases.create.execute(input),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.all() });
      queryClient.setQueryData(queryKeys.shoppingLists.detail(result.list.id), {
        budgetSummary: result.budgetSummary,
        items: [],
        list: result.list,
      });
    },
  });
}

export function useCompleteShoppingListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => listUseCases.complete.execute(listId),
    onSuccess: async (list) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.all() });
      await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.detail(list.id) });
    },
  });
}

export function useArchiveShoppingListMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => listUseCases.archive.execute(listId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.shoppingLists.all() });
    },
  });
}
