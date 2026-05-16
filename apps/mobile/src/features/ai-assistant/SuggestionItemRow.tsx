import React from "react";
import { Pressable } from "react-native";
import { XStack, YStack, Text } from "tamagui";
import { Check, Square } from "@tamagui/lucide-icons-2";

import type { SuggestedItem } from "@/domain/entities/AISuggestion";
import { colors, spacing, typography } from "@/shared/design-system/tokens";

interface Props {
  suggestion: SuggestedItem;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export const SuggestionItemRow = React.memo(function SuggestionItemRow({
  suggestion,
  isSelected,
  onToggle,
}: Props) {
  const isOnList = suggestion.status === "already_on_list";
  const nameColor = isOnList ? colors.textDisabled : colors.textPrimary;

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
      accessibilityLabel={`${suggestion.name}, ${suggestion.quantity}${suggestion.unit ? " " + suggestion.unit : ""}`}
      onPress={() => onToggle(suggestion.id)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: spacing.listItemPaddingV,
        paddingHorizontal: spacing.screenPadding,
        gap: spacing.listItemGap,
        minHeight: spacing.minTouchTarget,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      {isSelected ? (
        <Check size={20} color={colors.primary} />
      ) : (
        <Square
          size={20}
          color={isOnList ? colors.textDisabled : colors.textSecondary}
        />
      )}
      <YStack flex={1} style={{ gap: 2 }}>
        <XStack style={{ alignItems: "center", gap: spacing.listItemGap }}>
          <Text
            style={{
              fontSize: typography.body.fontSize,
              color: nameColor,
              flex: 1,
            }}
          >
            {suggestion.name}
          </Text>
          {isOnList ? (
            <Text
              style={{
                fontSize: typography.caption.fontSize,
                color: colors.textDisabled,
                fontStyle: "italic",
              }}
            >
              já na lista
            </Text>
          ) : null}
        </XStack>
        <Text
          style={{
            fontSize: typography.caption.fontSize,
            color: colors.textSecondary,
          }}
        >
          {suggestion.quantity}
          {suggestion.unit ? ` ${suggestion.unit}` : ""}
          {suggestion.category ? ` · ${suggestion.category}` : ""}
        </Text>
        {suggestion.notes ? (
          <Text
            style={{
              fontSize: typography.caption.fontSize,
              color: colors.textSecondary,
              fontStyle: "italic",
            }}
          >
            {suggestion.notes}
          </Text>
        ) : null}
      </YStack>
    </Pressable>
  );
});
