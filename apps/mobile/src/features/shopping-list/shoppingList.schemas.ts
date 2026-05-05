import { z } from "zod";

export const shoppingListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome da lista é obrigatório.")
    .max(80, "Nome da lista muito longo."),
  budget: z.coerce
    .number<number>()
    .finite("O orçamento deve ser um número válido.")
    .positive("O orçamento deve ser maior que zero.")
    .max(9_999_999_999.99, "Orçamento muito alto.")
    .transform((value) => Math.round(value * 100) / 100),
});

export type ShoppingListFormValues = z.infer<typeof shoppingListSchema>;
