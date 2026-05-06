import { Check, Square, Trash2 } from "@tamagui/lucide-icons-2";
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
    <XStack gap="$2" style={{ alignItems: "center", borderBottomWidth: 1, paddingVertical: 12 }}>
      <Button
        accessibilityLabel={
          item.bought ? "Marcar item como não comprado" : "Marcar item como comprado"
        }
        chromeless
        icon={item.bought ? Check : Square}
        onPress={() => onToggleBought(!item.bought)}
        style={{ minHeight: 44, minWidth: 44 }}
      />
      <Button
        accessibilityLabel={`Editar ${item.productName ?? "item da lista"}`}
        chromeless
        onPress={onEdit}
        style={{ flex: 1, justifyContent: "flex-start", minHeight: 44, padding: 0 }}
      >
        <YStack flex={1}>
          <Text
            fontWeight={item.bought ? "400" : "700"}
            textDecorationLine={item.bought ? "line-through" : "none"}
          >
            {item.productName ?? `Produto ${item.productId.slice(0, 8)}`}
          </Text>
          <Text color="$gray10">
            {item.quantity} × {formatMoney(item.unitPrice)}
          </Text>
        </YStack>
      </Button>
      <Text fontWeight="700">{formatMoney(item.totalPrice)}</Text>
      <Button
        accessibilityLabel={`Remover ${item.productName ?? "item da lista"}`}
        chromeless
        icon={Trash2}
        onPress={onRemove}
        style={{ minHeight: 44, minWidth: 44 }}
      />
    </XStack>
  );
}
