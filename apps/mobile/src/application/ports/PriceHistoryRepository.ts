export type PriceHistoryRecord = {
  id: string;
  userId: string;
  productId: string;
  shoppingListId: string;
  shoppingListItemId: string | null;
  price: number;
  recordedAt: string;
  createdAt: string;
};

export type AppendPriceHistoryInput = {
  productId: string;
  shoppingListId: string;
  shoppingListItemId?: string | null;
  price: number;
  recordedAt?: string;
};

export type LatestPreviousPriceInput = {
  productId: string;
  beforeRecordedAt?: string;
};

export type PriceHistoryRepository = {
  append(input: AppendPriceHistoryInput): Promise<PriceHistoryRecord>;
  getLatestPreviousPrice(input: LatestPreviousPriceInput): Promise<PriceHistoryRecord | null>;
  listByProduct(productId: string): Promise<PriceHistoryRecord[]>;
};
