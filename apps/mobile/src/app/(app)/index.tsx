import { Plus, Archive } from "@tamagui/lucide-icons-2";
import { type Href, Stack, useRouter } from "expo-router";
import { Alert } from "react-native";
import { YStack } from "tamagui";

import { AsyncState } from "../../shared/feedback/AsyncState";
import { AppButton } from "../../shared/ui/AppButton";
import { ScreenContainer } from "../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../shared/ui/SectionHeader";
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
    <ScreenContainer scrollable>
      <Stack.Screen options={{ title: "Listas" }} />
      <SectionHeader
        title="Listas"
        action={
          <AppButton
            accessibilityLabel="Nova lista"
            icon={<Plus size={18} />}
            size="sm"
            onPress={() => router.push("/(app)/lists/new" as Href)}
          >
            Nova
          </AppButton>
        }
      />
      <AsyncState
        emptyActionLabel="Criar lista"
        emptyMessage="Crie sua primeira lista mensal."
        error={lists.error}
        isEmpty={(lists.data?.length ?? 0) === 0}
        isLoading={lists.isLoading}
        onEmptyAction={() => router.push("/(app)/lists/new" as Href)}
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
                <YStack alignItems="flex-end">
                  <AppButton
                    accessibilityLabel={`Arquivar lista ${list.name}`}
                    icon={<Archive size={16} />}
                    size="sm"
                    variant="secondary"
                    disabled={archiveList.isPending}
                    onPress={() => confirmArchiveList(list.id)}
                  >
                    Arquivar
                  </AppButton>
                </YStack>
              ) : null}
            </YStack>
          ))}
        </YStack>
      </AsyncState>
    </ScreenContainer>
  );
}
