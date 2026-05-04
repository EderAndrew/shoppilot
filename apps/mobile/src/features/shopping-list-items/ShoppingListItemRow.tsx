import { Check, Square, Trash2 } from "@tamagui/lucide-icons";
import { Button, Text, XStack, YStack } from "tamagui";

import type { ShoppingListItemRecord } from "@/application/ports/ShoppingListItemRepository";
import { formatMoney } from "@/shared/formatters/money";

export type ShoppingListItemRowProps = {
  item: ShoppingListItemRecord;
  onEdit: () => void;
  onToggleBought: (bought: boolean) => void;
  onRemove: () => void;
};

export function ShoppingListItemRow({
  item,
  onEdit,
  onRemove,
  onToggleBought,
}: ShoppingListItemRowProps) {
  return (
    <XStack
      gap="$2"
      style={{ alignItems: "center", borderBottomWidth: 1, paddingVertical: 12 }}
    >
      <Button
        accessibilityLabel={item.bought ? "Mark item as not bought" : "Mark item as bought"}
        chromeless
        icon={item.bought ? Check : Square}
        onPress={() => onToggleBought(!item.bought)}
      />
      <Button
        chromeless
        onPress={onEdit}
        style={{ flex: 1, justifyContent: "flex-start", padding: 0 }}
      >
        <YStack flex={1}>
          <Text fontWeight={item.bought ? "400" : "700"} textDecorationLine={item.bought ? "line-through" : "none"}>
            Product {item.productId.slice(0, 8)}
          </Text>
          <Text color="$gray10">
            {item.quantity} × {formatMoney(item.unitPrice)}
          </Text>
        </YStack>
      </Button>
      <Text fontWeight="700">{formatMoney(item.totalPrice)}</Text>
      <Button accessibilityLabel="Remove item" chromeless icon={Trash2} onPress={onRemove} />
    </XStack>
  );
}
