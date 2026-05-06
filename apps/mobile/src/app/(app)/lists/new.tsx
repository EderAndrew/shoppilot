import { type Href, Stack, useRouter } from "expo-router";

import { ShoppingListForm } from "../../../features/shopping-list/ShoppingListForm";
import { useCreateShoppingListMutation } from "../../../features/shopping-list/shoppingList.queries";
import { ScreenContainer } from "../../../shared/ui/ScreenContainer";
import { SectionHeader } from "../../../shared/ui/SectionHeader";

export default function NewShoppingListScreen() {
  const router = useRouter();
  const createList = useCreateShoppingListMutation();

  return (
    <>
      <Stack.Screen options={{ title: "Nova lista" }} />
      <ScreenContainer scrollable>
        <SectionHeader title="Nova lista" />
        <ShoppingListForm
          error={createList.error}
          isSubmitting={createList.isPending}
          onSubmit={(values) =>
            createList.mutate(values, {
              onSuccess: (result) => router.replace(`/(app)/lists/${result.list.id}` as Href),
            })
          }
        />
      </ScreenContainer>
    </>
  );
}
