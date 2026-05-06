import { ChevronRight } from "@tamagui/lucide-icons-2";
import { Text, XStack, YStack } from "tamagui";

import type { ShoppingListRecord } from "@/application/ports/ShoppingListRepository";
import { formatMoney } from "@/shared/formatters/money";
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
};

export function ShoppingListCard({ list, onPress }: ShoppingListCardProps) {
  return (
    <AppCard
      elevated
      variant="actionable"
      onPress={onPress}
    >
      <XStack accessibilityLabel={`Abrir lista ${list.name}, orçamento ${formatMoney(list.budget)}, status ${statusLabels[list.status]}`} style={{ alignItems: "center", gap: 8 }}>
        <YStack flex={1} gap="$1">
          <Text
            numberOfLines={2}
            style={{
              ...typography.bodyStrong,
              color: colors.textPrimary,
            }}
          >
            {list.name}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              ...typography.caption,
              color: colors.textSecondary,
            }}
          >
            {formatMoney(list.budget)} · {statusLabels[list.status]}
          </Text>
        </YStack>
        <ChevronRight color={colors.textSecondary} size={20} />
      </XStack>
    </AppCard>
  );
}
