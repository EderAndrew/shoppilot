import { ChevronRight } from "@tamagui/lucide-icons";
import { Button, Text, XStack, YStack } from "tamagui";

import type { ShoppingListRecord } from "@/application/ports/ShoppingListRepository";
import { formatMoney } from "@/shared/formatters/money";

export type ShoppingListCardProps = {
  list: ShoppingListRecord;
  onPress: () => void;
};

export function ShoppingListCard({ list, onPress }: ShoppingListCardProps) {
  return (
    <Button chromeless onPress={onPress} style={{ justifyContent: "flex-start", padding: 0 }}>
      <XStack
        gap="$3"
        style={{
          alignItems: "center",
          borderRadius: 8,
          borderWidth: 1,
          flex: 1,
          padding: 16,
        }}
      >
        <YStack flex={1} gap="$1">
          <Text fontSize="$6" fontWeight="700">
            {list.name}
          </Text>
          <Text color="$gray10">
            {formatMoney(list.budget)} · {list.status}
          </Text>
        </YStack>
        <ChevronRight size={20} />
      </XStack>
    </Button>
  );
}
