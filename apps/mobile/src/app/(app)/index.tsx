import { Archive, Plus } from "@tamagui/lucide-icons-2";
import { type Href, Stack, useRouter } from "expo-router";
import { Alert } from "react-native";
import { Button, ScrollView, Text, XStack, YStack } from "tamagui";

import { AsyncState } from "../../shared/feedback/AsyncState";
import { ShoppingListCard } from "../../features/shopping-list/ShoppingListCard";
import {
  useArchiveShoppingListMutation,
  useShoppingListsQuery,
} from "../../features/shopping-list/shoppingList.queries";

export default function ShoppingListsScreen() {
  const router = useRouter();
  const lists = useShoppingListsQuery();
  const archiveList = useArchiveShoppingListMutation();

  const confirmArchiveList = (listId: string) => {
    Alert.alert("Arquivar lista?", "Listas arquivadas continuam disponíveis no histórico.", [
      { style: "cancel", text: "Cancelar" },
      {
        onPress: () => archiveList.mutate(listId),
        text: "Arquivar",
      },
    ]);
  };

  return (
    <ScrollView flex={1}>
      <Stack.Screen
        options={{
          title: "Listas",
        }}
      />
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
              <YStack gap="$2" key={list.id}>
                <ShoppingListCard
                  list={list}
                  onPress={() => router.push(`/(app)/lists/${list.id}` as Href)}
                />
                {list.status === "completed" ? (
                  <Button
                    disabled={archiveList.isPending}
                    icon={Archive}
                    onPress={() => confirmArchiveList(list.id)}
                    size="$3"
                    style={{ alignSelf: "flex-end" }}
                  >
                    Arquivar
                  </Button>
                ) : null}
              </YStack>
            ))}
          </YStack>
        </AsyncState>
      </YStack>
    </ScrollView>
  );
}
