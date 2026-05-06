import { type Href, Stack, useRouter } from "expo-router";
import { ScrollView, Text, YStack } from "tamagui";

import { ShoppingListForm } from "../../../features/shopping-list/ShoppingListForm";
import { useCreateShoppingListMutation } from "../../../features/shopping-list/shoppingList.queries";

export default function NewShoppingListScreen() {
  const router = useRouter();
  const createList = useCreateShoppingListMutation();

  return (
    <ScrollView flex={1}>
      <Stack.Screen
        options={{
          title: "Nova lista",
        }}
      />
      <YStack gap="$4" style={{ padding: 16 }}>
        <Text fontSize="$8" fontWeight="700">
          Nova lista
        </Text>
        <ShoppingListForm
          error={createList.error}
          isSubmitting={createList.isPending}
          onSubmit={(values) =>
            createList.mutate(values, {
              onSuccess: (result) => router.replace(`/(app)/lists/${result.list.id}` as Href),
            })
          }
        />
      </YStack>
    </ScrollView>
  );
}
