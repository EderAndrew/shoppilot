import { z } from "zod";

const optionalTrimmedText = z
  .string()
  .trim()
  .max(80, "Valor muito longo.")
  .optional()
  .transform((value) => (value && value.length > 0 ? value : null));

export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "O nome do produto é obrigatório.")
    .max(120, "Nome do produto muito longo."),
  brand: optionalTrimmedText,
  barcode: z
    .string()
    .trim()
    .max(64, "Código de barras muito longo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : null)),
  unit: optionalTrimmedText,
});

export const productSearchSchema = z.object({
  searchTerm: z
    .string()
    .trim()
    .max(120, "Termo de busca muito longo.")
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
});

export type ProductFormValues = z.infer<typeof productSchema>;
export type ProductSearchValues = z.infer<typeof productSearchSchema>;
