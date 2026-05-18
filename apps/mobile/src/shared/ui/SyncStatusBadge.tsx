import { Text } from "tamagui";

import type { SyncStatus } from "@/infrastructure/local/sync.types";
import { colors, typography } from "@/shared/design-system/tokens";

export type SyncStatusBadgeProps = {
  syncStatus?: SyncStatus;
};

export function SyncStatusBadge({ syncStatus }: SyncStatusBadgeProps) {
  if (!syncStatus || syncStatus === "synced") return null;

  return (
    <Text
      style={{
        fontSize: typography.caption.fontSize,
        color: colors.textSecondary,
      }}
    >
      Pendente
    </Text>
  );
}
