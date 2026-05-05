import { AlertTriangle } from "@tamagui/lucide-icons-2";
import { Text, XStack } from "tamagui";

export function OverBudgetAlert({ isOverBudget }: { isOverBudget: boolean }) {
  if (!isOverBudget) return null;

  return (
    <XStack
      accessibilityLabel="Alerta de orçamento excedido"
      accessibilityRole="alert"
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
        Esta lista está acima do orçamento.
      </Text>
    </XStack>
  );
}
