import { Check, Square, Trash2 } from "@tamagui/lucide-icons-2";
import { XStack } from "tamagui";

import type { ShoppingListItemRecord } from "@/application/ports/ShoppingListItemRepository";
import { formatMoney } from "@/shared/formatters/money";
import { colors } from "@/shared/design-system/tokens";
import { AppButton } from "@/shared/ui/AppButton";
import { AppListItem } from "@/shared/ui/AppListItem";
import { SyncStatusBadge } from "@/shared/ui/SyncStatusBadge";

export type ShoppingListItemRowProps = {
  item: ShoppingListItemRecord;
  isReadOnly?: boolean;
  onEdit: () => void;
  onToggleBought: (bought: boolean) => void;
  onRemove: () => void;
};

export function ShoppingListItemRow({
  item,
  isReadOnly = false,
  onEdit,
  onRemove,
  onToggleBought,
}: ShoppingListItemRowProps) {
  return (
    <XStack
      style={{ alignItems: "center" }}
      borderBottomWidth={1}
      borderColor={colors.border}
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
        subtitle={[item.productBrand, `${item.quantity} × ${formatMoney(item.unitPrice)}`]
          .filter(Boolean)
          .join(" · ")}
        title={item.productName ?? `Produto ${item.productId.slice(0, 8)}`}
        value={formatMoney(item.totalPrice)}
        variant={item.bought ? "completed" : "default"}
        onPress={isReadOnly ? undefined : onEdit}
      />
      <SyncStatusBadge syncStatus={item.syncStatus} />
      {!isReadOnly ? (
        <AppButton
          accessibilityLabel={`Remover ${item.productName ?? "item da lista"}`}
          icon={<Trash2 size={20} />}
          iconOnly
          variant="subtle"
          onPress={onRemove}
        />
      ) : null}
    </XStack>
  );
}
