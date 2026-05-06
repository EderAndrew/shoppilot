import { Check, Square, Trash2 } from "@tamagui/lucide-icons-2";
import { XStack } from "tamagui";

import type { ShoppingListItemRecord } from "@/application/ports/ShoppingListItemRepository";
import { formatMoney } from "@/shared/formatters/money";
import { colors } from "@/shared/design-system/tokens";
import { AppButton } from "@/shared/ui/AppButton";
import { AppListItem } from "@/shared/ui/AppListItem";

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
      style={{
        alignItems: "center",
        borderBottomWidth: 1,
        borderColor: colors.border,
      }}
    >
      <AppButton
        accessibilityLabel={
          item.bought ? "Marcar item como não comprado" : "Marcar item como comprado"
        }
        icon={item.bought ? <Check size={20} /> : <Square size={20} />}
        iconOnly
        variant="subtle"
        onPress={() => onToggleBought(!item.bought)}
      />
      <AppListItem
        accessibilityLabel={`Editar ${item.productName ?? "item da lista"}`}
        subtitle={`${item.quantity} × ${formatMoney(item.unitPrice)}`}
        title={item.productName ?? `Produto ${item.productId.slice(0, 8)}`}
        value={formatMoney(item.totalPrice)}
        variant={item.bought ? "completed" : "default"}
        onPress={onEdit}
      />
      <AppButton
        accessibilityLabel={`Remover ${item.productName ?? "item da lista"}`}
        icon={<Trash2 size={20} />}
        iconOnly
        variant="subtle"
        onPress={onRemove}
      />
    </XStack>
  );
}
