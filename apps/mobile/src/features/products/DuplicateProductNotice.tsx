import type { ProductRecord } from "@/application/ports/ProductRepository";
import { Text, YStack } from "tamagui";

import { AppCard } from "@/shared/ui/AppCard";
import { colors, typography } from "@/shared/design-system/tokens";

export type DuplicateProductNoticeProps = {
  candidates: ProductRecord[];
};

export function DuplicateProductNotice({ candidates }: DuplicateProductNoticeProps) {
  if (candidates.length === 0) return null;

  return (
    <AppCard variant="warning">
      <YStack gap="$2">
        <Text {...typography.bodyStrong} color={colors.warning}>
          Já existe um produto parecido
        </Text>
        {candidates.slice(0, 3).map((candidate) => (
          <Text key={candidate.id} {...typography.caption} color={colors.textSecondary}>
            {candidate.name}
            {candidate.brand ? `, ${candidate.brand}` : ""}
            {candidate.unit ? ` (${candidate.unit})` : ""}
          </Text>
        ))}
      </YStack>
    </AppCard>
  );
}
