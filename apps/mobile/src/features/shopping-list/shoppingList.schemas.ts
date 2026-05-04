import { z } from "zod";

export const shoppingListSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "List name is required.")
    .max(80, "List name is too long."),
  budget: z.coerce
    .number<number>()
    .finite("Budget must be a valid number.")
    .positive("Budget must be greater than zero.")
    .max(9_999_999_999.99, "Budget is too high.")
    .transform((value) => Math.round(value * 100) / 100),
});

export type ShoppingListFormValues = z.infer<typeof shoppingListSchema>;
