import { CheckCircle, Plus } from "@tamagui/lucide-icons-2";
import { type Href, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Alert } from "react-native";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

import { AsyncState } from "../../../shared/feedback/AsyncState";
import { BudgetSummary } from "../../../features/shopping-list/BudgetSummary";
import { OverBudgetAlert } from "../../../features/shopping-list/OverBudgetAlert";
import {
  useCompleteShoppingListMutation,
  useShoppingListDetailsQuery,
} from "../../../features/shopping-list/shoppingList.queries";
import { useActiveListRealtime } from "../../../features/shopping-list/useActiveListRealtime";
import { ShoppingListItemRow } from "../../../features/shopping-list-items/ShoppingListItemRow";
import {
  useCheckShoppingListItemMutation,
  useRemoveShoppingListItemMutation,
} from "../../../features/shopping-list-items/item.queries";

const statusLabels = {
  active: "ativa",
  archived: "arquivada",
  completed: "concluída",
} as const;

export default function ShoppingListDetailsScreen() {
  const router = useRouter();
  const { listId } = useLocalSearchParams<{ listId: string }>();
  const details = useShoppingListDetailsQuery(listId);
  const completeList = useCompleteShoppingListMutation();
  const removeItem = useRemoveShoppingListItemMutation(listId);
  const checkItem = useCheckShoppingListItemMutation(listId);
  useActiveListRealtime(listId);

  const confirmCompleteList = () => {
    Alert.alert("Lista completa?", "Isso remove a lista da lista de compras ativas.", [
      { style: "cancel", text: "Cancelar" },
      {
        onPress: () => completeList.mutate(listId),
        text: "Completo",
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Compra do Mês",
        }}
      />
      <ScrollView flex={1}>
        <YStack gap="$4" style={{ padding: 16 }}>
          <AsyncState
            error={details.error}
            isLoading={details.isLoading}
            onRetry={() => details.refetch()}
          >
            {details.data ? (
              <>
                <XStack
                  style={{
                    justifyContent: "space-between",
                    flex: 1,
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <YStack>
                    <Text fontSize="$8" fontWeight="700">
                      {details.data.list.name}
                    </Text>
                    <Text color="$gray10">{statusLabels[details.data.list.status]}</Text>
                  </YStack>
                  <XStack gap="$2">
                    <Button onPress={() => router.push(`/(app)/lists/${listId}/insights` as Href)}>
                      Comparativo
                    </Button>
                    {details.data.list.status === "active" ? (
                      <Button
                        disabled={completeList.isPending}
                        icon={CheckCircle}
                        onPress={confirmCompleteList}
                      >
                        Completo
                      </Button>
                    ) : null}
                    <Button
                      icon={Plus}
                      onPress={() => router.push(`/(app)/lists/${listId}/item-new` as Href)}
                    >
                      Item
                    </Button>
                  </XStack>
                </XStack>
                <BudgetSummary summary={details.data.budgetSummary} />
                <OverBudgetAlert isOverBudget={details.data.budgetSummary.isOverBudget} />
                <AsyncState emptyMessage="Lista vazia" isEmpty={details.data.items.length === 0}>
                  <YStack>
                    {details.data.items.map((item) => (
                      <ShoppingListItemRow
                        item={item}
                        key={item.id}
                        onEdit={() => router.push(`/(app)/lists/${listId}/item-${item.id}` as Href)}
                        onRemove={() =>
                          removeItem.mutate({ itemId: item.id, shoppingListId: listId })
                        }
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
    </>
  );
}
