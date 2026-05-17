export interface SuggestedItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  notes?: string;
  status: "pending" | "already_on_list";
}

export interface AIPromptContext {
  listName: string;
  existingItemNames: string[];
}
