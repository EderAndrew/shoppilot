import { type Href, Stack, useRouter } from "expo-router";
import { YStack } from "tamagui";

import { AsyncState } from "../../../../shared/feedback/AsyncState";
import { ScreenContainer } from "../../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../../shared/ui/SectionHeader";
import { ShoppingListCard } from "../../../../features/shopping-list/ShoppingListCard";
import { useArchivedShoppingListsQuery } from "../../../../features/shopping-list/shoppingList.queries";

export default function ArchivedScreen() {
  const router = useRouter();
  const lists = useArchivedShoppingListsQuery();

  return (
    <ScreenContainer scrollable>
      <Stack.Screen options={{ title: "Arquivados" }} />
      <SectionHeader title="Arquivados" />
      <AsyncState
        emptyMessage="Nenhuma lista arquivada."
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
              showArchivedDate
              onPress={() => router.push(`/(app)/(tabs)/archived/${list.id}` as Href)}
            />
          ))}
        </YStack>
      </AsyncState>
    </ScreenContainer>
  );
}
