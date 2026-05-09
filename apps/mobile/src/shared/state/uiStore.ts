import { create } from "zustand";

export type UiStoreState = {
  selectedShoppingListId: string | null;
  isCreateListOpen: boolean;
  isProductPickerOpen: boolean;
  setSelectedShoppingListId: (listId: string | null) => void;
  setCreateListOpen: (isOpen: boolean) => void;
  setProductPickerOpen: (isOpen: boolean) => void;
  resetTransientUi: () => void;
};

export const useUiStore = create<UiStoreState>((set) => ({
  isCreateListOpen: false,
  isProductPickerOpen: false,
  selectedShoppingListId: null,
  resetTransientUi: () =>
    set({
      isCreateListOpen: false,
      isProductPickerOpen: false,
    }),
  setCreateListOpen: (isOpen) => set({ isCreateListOpen: isOpen }),
  setProductPickerOpen: (isOpen) => set({ isProductPickerOpen: isOpen }),
  setSelectedShoppingListId: (listId) => set({ selectedShoppingListId: listId }),
}));
