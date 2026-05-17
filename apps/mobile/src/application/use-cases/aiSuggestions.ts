import type { AIPromptContext, SuggestedItem } from "@/domain/entities/AISuggestion";

import type { AIRepository } from "../ports/AIRepository";

interface Input {
  prompt: string;
  listId: string;
  listName: string;
  existingItemNames: string[];
}

interface Output {
  suggestions: SuggestedItem[];
}

export class SuggestShoppingListItems {
  constructor(private readonly ai: AIRepository) {}

  async execute(input: Input): Promise<Output> {
    const context: AIPromptContext = {
      listName: input.listName,
      existingItemNames: input.existingItemNames,
    };
    const raw = await this.ai.suggestItems(input.prompt, context);

    const normalizedExisting = input.existingItemNames.map((n) => n.toLowerCase().trim());

    const suggestions = raw.map((s) => ({
      ...s,
      id: crypto.randomUUID(),
      status: normalizedExisting.includes(s.name.toLowerCase().trim())
        ? ("already_on_list" as const)
        : ("pending" as const),
    }));

    return { suggestions };
  }
}
