import { Plus } from "@tamagui/lucide-icons";
import { type Href, useLocalSearchParams, useRouter } from "expo-router";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

import { AsyncState } from "../../../shared/feedback/AsyncState";
import { BudgetSummary } from "../../../features/shopping-list/BudgetSummary";
import { OverBudgetAlert } from "../../../features/shopping-list/OverBudgetAlert";
import { useShoppingListDetailsQuery } from "../../../features/shopping-list/shoppingList.queries";
import { ShoppingListItemRow } from "../../../features/shopping-list-items/ShoppingListItemRow";
import {
  useCheckShoppingListItemMutation,
  useRemoveShoppingListItemMutation,
} from "../../../features/shopping-list-items/item.queries";

export default function ShoppingListDetailsScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const details = useShoppingListDetailsQuery(listId);
  const removeItem = useRemoveShoppingListItemMutation(listId);
  const checkItem = useCheckShoppingListItemMutation(listId);

  return (
    <ScrollView flex={1}>
      <YStack gap="$4" style={{ padding: 16 }}>
        <AsyncState
          error={details.error}
          isLoading={details.isLoading}
          onRetry={() => details.refetch()}
        >
          {details.data ? (
            <>
              <XStack style={{ alignItems: "center", justifyContent: "space-between" }}>
                <YStack flex={1}>
                  <Text fontSize="$8" fontWeight="700">
                    {details.data.list.name}
                  </Text>
                  <Text color="$gray10">{details.data.list.status}</Text>
                </YStack>
                <Button icon={Plus} onPress={() => router.push(`/(app)/lists/${listId}/item-new` as Href)}>
                  Item
                </Button>
              </XStack>
              <BudgetSummary summary={details.data.budgetSummary} />
              <OverBudgetAlert isOverBudget={details.data.budgetSummary.isOverBudget} />
              <AsyncState
                emptyMessage="No items yet."
                isEmpty={details.data.items.length === 0}
              >
                <YStack>
                  {details.data.items.map((item) => (
                    <ShoppingListItemRow
                      item={item}
                      key={item.id}
                      onEdit={() => router.push(`/(app)/lists/${listId}/item-${item.id}` as Href)}
                      onRemove={() => removeItem.mutate({ itemId: item.id, shoppingListId: listId })}
                      onToggleBought={(bought) =>
                        checkItem.mutate({ bought, itemId: item.id, shoppingListId: listId })
                      }
                    />
                  ))}
                </YStack>
              </AsyncState>
            </>
          ) : null}
        </AsyncState>
      </YStack>
    </ScrollView>
  );
}
