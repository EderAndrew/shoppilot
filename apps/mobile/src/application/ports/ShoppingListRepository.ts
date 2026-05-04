import type { ShoppingListStatus } from "@shop-pilot/shared/domain-types/shopping";

import type { ShoppingListItemRecord } from "./ShoppingListItemRepository";

export type ShoppingListRecord = {
  id: string;
  userId: string;
  name: string;
  budget: number;
  status: ShoppingListStatus;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  archivedAt: string | null;
};

export type CreateShoppingListInput = {
  name: string;
  budget: number;
};

export type CompleteShoppingListInput = {
  listId: string;
  completedAt?: string;
};

export type ArchiveShoppingListInput = {
  listId: string;
  archivedAt?: string;
};

export type ShoppingListDetails = {
  list: ShoppingListRecord;
  items: ShoppingListItemRecord[];
};

export type ShoppingListRepository = {
  create(input: CreateShoppingListInput): Promise<ShoppingListRecord>;
  list(): Promise<ShoppingListRecord[]>;
  getDetails(listId: string): Promise<ShoppingListDetails | null>;
  complete(input: CompleteShoppingListInput): Promise<ShoppingListRecord>;
  archive(input: ArchiveShoppingListInput): Promise<ShoppingListRecord>;
};
