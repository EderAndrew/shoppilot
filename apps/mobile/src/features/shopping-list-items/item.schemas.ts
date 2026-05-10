import { z } from "zod";

export const shoppingListItemSchema = z.object({
  shoppingListId: z.string().uuid("Escolha uma lista válida."),
  productId: z.string().uuid("Escolha um produto válido."),
  quantity: z.coerce
    .number<number>()
    .finite("A quantidade deve ser um número válido.")
    .positive("A quantidade deve ser maior que zero.")
    .max(999_999_999.999, "Quantidade muito alta.")
    .transform((value) => Math.round(value * 1_000) / 1_000),
  unitPrice: z.coerce
    .number<number>()
    .finite("O preço unitário deve ser um número válido.")
    .positive("O preço unitário deve ser maior que zero.")
    .max(9_999_999_999.99, "Preço unitário muito alto.")
    .transform((value) => Math.round(value * 100) / 100),
  bought: z.boolean().optional().default(false),
});

export const updateShoppingListItemSchema = shoppingListItemSchema
  .omit({ shoppingListId: true, productId: true })
  .extend({
    itemId: z.string().uuid("Escolha um item válido."),
    productId: z.string().uuid("Escolha um produto válido.").optional(),
  });

export type ShoppingListItemFormValues = z.infer<typeof shoppingListItemSchema>;
export type UpdateShoppingListItemFormValues = z.infer<typeof updateShoppingListItemSchema>;
