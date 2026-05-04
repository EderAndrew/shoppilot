import { z } from "zod";

export const shoppingListItemSchema = z.object({
  shoppingListId: z.string().uuid("Choose a valid shopping list."),
  productId: z.string().uuid("Choose a valid product."),
  quantity: z.coerce
    .number<number>()
    .finite("Quantity must be a valid number.")
    .positive("Quantity must be greater than zero.")
    .max(999_999_999.999, "Quantity is too high.")
    .transform((value) => Math.round(value * 1_000) / 1_000),
  unitPrice: z.coerce
    .number<number>()
    .finite("Unit price must be a valid number.")
    .positive("Unit price must be greater than zero.")
    .max(9_999_999_999.99, "Unit price is too high.")
    .transform((value) => Math.round(value * 100) / 100),
  bought: z.boolean().optional().default(false),
});

export const updateShoppingListItemSchema = shoppingListItemSchema
  .omit({ shoppingListId: true, productId: true })
  .extend({
    itemId: z.string().uuid("Choose a valid item."),
    productId: z.string().uuid("Choose a valid product.").optional(),
  });

export type ShoppingListItemFormValues = z.infer<typeof shoppingListItemSchema>;
export type UpdateShoppingListItemFormValues = z.infer<
  typeof updateShoppingListItemSchema
>;
