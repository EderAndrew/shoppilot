import { create } from "zustand";

export type UiStoreState = {
  selectedShoppingListId: string | null;
  isCreateListOpen: boolean;
  isProductPickerOpen: boolean;
  isAIAssistantOpen: boolean;
  setSelectedShoppingListId: (listId: string | null) => void;
  setCreateListOpen: (isOpen: boolean) => void;
  setProductPickerOpen: (isOpen: boolean) => void;
  setAIAssistantOpen: (open: boolean) => void;
  resetTransientUi: () => void;
};

export const useUiStore = create<UiStoreState>((set) => ({
  isCreateListOpen: false,
  isProductPickerOpen: false,
  isAIAssistantOpen: false,
  selectedShoppingListId: null,
  resetTransientUi: () =>
    set({
      isAIAssistantOpen: false,
      isCreateListOpen: false,
      isProductPickerOpen: false,
    }),
  setAIAssistantOpen: (open) => set({ isAIAssistantOpen: open }),
  setCreateListOpen: (isOpen) => set({ isCreateListOpen: isOpen }),
  setProductPickerOpen: (isOpen) => set({ isProductPickerOpen: isOpen }),
  setSelectedShoppingListId: (listId) => set({ selectedShoppingListId: listId }),
}));
