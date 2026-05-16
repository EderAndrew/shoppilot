import { useMutation } from "@tanstack/react-query";

import { SuggestShoppingListItems } from "@/application/use-cases/aiSuggestions";
import { defaultRepositories } from "@/infrastructure/repositories/defaultRepositories";

const suggestUseCase = new SuggestShoppingListItems(defaultRepositories.ai);

interface Input {
  prompt: string;
  listId: string;
  listName: string;
  existingItemNames: string[];
}

export function useAISuggestMutation() {
  return useMutation({
    mutationFn: (input: Input) => suggestUseCase.execute(input),
  });
}
