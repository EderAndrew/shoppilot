import { z } from "zod";

export const suggestedItemSchema = z.object({
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(999).default(1),
  unit: z.string().max(50).optional(),
  category: z.string().max(100).optional(),
  notes: z.string().max(300).optional(),
});

export const aiSuggestionsResponseSchema = z.object({
  suggestions: z.array(suggestedItemSchema).max(20),
});

export type AISuggestionsResponse = z.infer<typeof aiSuggestionsResponseSchema>;
