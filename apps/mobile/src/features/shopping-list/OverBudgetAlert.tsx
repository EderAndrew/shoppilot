import { AlertTriangle } from "@tamagui/lucide-icons";
import { Text, XStack } from "tamagui";

export function OverBudgetAlert({ isOverBudget }: { isOverBudget: boolean }) {
  if (!isOverBudget) return null;

  return (
    <XStack
      gap="$2"
      style={{
        alignItems: "center",
        backgroundColor: "#fee2e2",
        borderColor: "#fca5a5",
        borderRadius: 8,
        borderWidth: 1,
        padding: 12,
      }}
    >
      <AlertTriangle color="$red10" size={18} />
      <Text color="$red11" flex={1}>
        This list is over budget.
      </Text>
    </XStack>
  );
}
