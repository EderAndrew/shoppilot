import { AlertTriangle } from "@tamagui/lucide-icons-2";

import { StatusState } from "@/shared/ui/StatusState";

export function OverBudgetAlert({ isOverBudget }: { isOverBudget: boolean }) {
  if (!isOverBudget) return null;

  return (
    <StatusState
      accessibilityLabel="Alerta de orçamento excedido"
      icon={<AlertTriangle size={18} />}
      message="Esta lista está acima do orçamento."
      tone="error"
    />
  );
}
