import { z } from "zod";

const optionalTrimmedText = z
  .string()
  .trim()
  .max(80, "Value is too long.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Product name is required.")
    .max(120, "Product name is too long."),
  brand: optionalTrimmedText,
  barcode: z
    .string()
    .trim()
    .max(64, "Barcode is too long.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  unit: optionalTrimmedText,
});

export const productSearchSchema = z.object({
  searchTerm: z
    .string()
    .trim()
    .max(120, "Search term is too long.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductSearchValues = z.infer<typeof productSearchSchema>;
