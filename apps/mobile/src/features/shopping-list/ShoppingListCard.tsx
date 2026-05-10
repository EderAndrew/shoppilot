import { ChevronRight } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";

import type { ShoppingListRecord } from "@/application/ports/ShoppingListRepository";
import { formatMoney } from "@/shared/formatters/money";
import { formatArchivedDate } from "@/shared/formatters/date";
import { AppCard } from "@/shared/ui/AppCard";
import { colors, typography } from "@/shared/design-system/tokens";

const statusLabels: Record<ShoppingListRecord["status"], string> = {
  active: "ativa",
  archived: "arquivada",
  completed: "concluída",
};

export type ShoppingListCardProps = {
  list: ShoppingListRecord;
  onPress: () => void;
  showArchivedDate?: boolean;
};

export function ShoppingListCard({ list, onPress, showArchivedDate = false }: ShoppingListCardProps) {
  return (
    <AppCard
      accessibilityLabel={`Abrir lista ${list.name}, orçamento ${formatMoney(list.budget)}, status ${statusLabels[list.status]}`}
      elevated
      variant="actionable"
      onPress={onPress}
    >
      <XStack alignItems="center" gap={8}>
        <YStack flex={1} gap="$1">
          <Text numberOfLines={2} {...typography.bodyStrong} color={colors.textPrimary}>
            {list.name}
          </Text>
          <Text numberOfLines={1} {...typography.caption} color={colors.textSecondary}>
            {formatMoney(list.budget)} · {statusLabels[list.status]}
          </Text>
          {showArchivedDate && list.archivedAt ? (
            <Text numberOfLines={1} {...typography.caption} color={colors.textDisabled}>
              {formatArchivedDate(list.archivedAt)}
            </Text>
          ) : null}
        </YStack>
        <ChevronRight color={colors.textSecondary} size={20} />
      </XStack>
    </AppCard>
  );
}
