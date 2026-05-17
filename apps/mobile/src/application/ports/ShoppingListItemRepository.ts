export type ShoppingListItemRecord = {
  id: string;
  userId: string;
  shoppingListId: string;
  productId: string;
  productName?: string | null;
  productBrand?: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  bought: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus?: import("@/infrastructure/local/sync.types").SyncStatus;
};

export type AddShoppingListItemInput = {
  shoppingListId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productName?: string | null;
  productBrand?: string | null;
};

export type UpdateShoppingListItemInput = {
  itemId: string;
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
  bought?: boolean;
};

export type SetShoppingListItemBoughtInput = {
  itemId: string;
  bought: boolean;
};

export type ShoppingListItemRepository = {
  add(input: AddShoppingListItemInput): Promise<ShoppingListItemRecord>;
  update(input: UpdateShoppingListItemInput): Promise<ShoppingListItemRecord>;
  remove(itemId: string): Promise<void>;
  setBought(input: SetShoppingListItemBoughtInput): Promise<ShoppingListItemRecord>;
  listByShoppingList(shoppingListId: string): Promise<ShoppingListItemRecord[]>;
};
