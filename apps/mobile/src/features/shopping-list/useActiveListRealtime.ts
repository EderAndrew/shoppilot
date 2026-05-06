import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { ShoppingListDetailsResult } from "@/application/use-cases/shoppingLists";
import { queryKeys } from "@/application/query-keys/queryKeys";
import { subscribeToActiveList } from "@/infrastructure/realtime/activeListSubscription";

import { useAuthSession } from "../auth/useAuthSession";
import { patchActiveListDetailsCache } from "./activeListCache";

export function useActiveListRealtime(listId: string): void {
  const { isAuthenticated, user } = useAuthSession();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!listId || !isAuthenticated || !user?.id) return undefined;

    const subscription = subscribeToActiveList({
      listId,
      onChange: (change) => {
        queryClient.setQueryData<ShoppingListDetailsResult>(
          queryKeys.shoppingLists.detail(listId),
          (current) => patchActiveListDetailsCache(current, change),
        );
      },
      userId: user.id,
    });

    return () => subscription.unsubscribe();
  }, [isAuthenticated, listId, queryClient, user?.id]);
}
