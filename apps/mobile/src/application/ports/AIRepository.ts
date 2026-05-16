import type { AIPromptContext, SuggestedItem } from "@/domain/entities/AISuggestion";

export type AIRepository = {
  suggestItems(prompt: string, context: AIPromptContext): Promise<SuggestedItem[]>;
};
