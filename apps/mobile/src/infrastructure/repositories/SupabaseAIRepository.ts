import type { AIPromptContext, SuggestedItem } from "@/domain/entities/AISuggestion";
import type { AIRepository } from "@/application/ports/AIRepository";
import { aiSuggestionsResponseSchema } from "@/features/ai-assistant/aiAssistant.schemas";

import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: "unavailable" | "invalid_response" | "unauthorized",
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

export class SupabaseAIRepository implements AIRepository {
  constructor(private readonly client: ShopPilotSupabaseClient = supabase) {}

  async suggestItems(prompt: string, context: AIPromptContext): Promise<SuggestedItem[]> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new AIServiceError("Request timeout", "unavailable")),
        30000,
      ),
    );

    const invokePromise = this.client.functions.invoke("suggest-items", {
      body: { prompt, context },
    });

    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (error) {
      if (error.message?.includes("401")) {
        throw new AIServiceError(error.message, "unauthorized");
      }
      throw new AIServiceError(error.message ?? "AI service unavailable", "unavailable");
    }

    let parsed: ReturnType<typeof aiSuggestionsResponseSchema.parse>;
    try {
      parsed = aiSuggestionsResponseSchema.parse(data);
    } catch {
      throw new AIServiceError("Invalid AI response schema", "invalid_response");
    }

    return parsed.suggestions.map((s) => ({
      id: crypto.randomUUID(),
      name: s.name,
      quantity: s.quantity,
      unit: s.unit,
      category: s.category,
      notes: s.notes,
      status: "pending" as const,
    }));
  }
}
