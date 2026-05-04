import { Plus } from "@tamagui/lucide-icons";
import { type Href, useRouter } from "expo-router";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

import { AsyncState } from "../../shared/feedback/AsyncState";
import { ShoppingListCard } from "../../features/shopping-list/ShoppingListCard";
import { useShoppingListsQuery } from "../../features/shopping-list/shoppingList.queries";

export default function ShoppingListsScreen() {
  const router = useRouter();
  const lists = useShoppingListsQuery();

  return (
    <ScrollView flex={1}>
      <YStack gap="$4" style={{ padding: 16 }}>
        <XStack style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Text fontSize="$8" fontWeight="700">
            Listas
          </Text>
          <Button icon={Plus} onPress={() => router.push("/(app)/lists/new" as Href)}>
            Nova
          </Button>
        </XStack>
        <AsyncState
          emptyMessage="Crie sua primeira lista mensal."
          error={lists.error}
          isEmpty={(lists.data?.length ?? 0) === 0}
          isLoading={lists.isLoading}
          onRetry={() => lists.refetch()}
        >
          <YStack gap="$3">
            {lists.data?.map((list) => (
              <ShoppingListCard
                key={list.id}
                list={list}
                onPress={() => router.push(`/(app)/lists/${list.id}` as Href)}
              />
            ))}
          </YStack>
        </AsyncState>
      </YStack>
    </ScrollView>
  );
}
