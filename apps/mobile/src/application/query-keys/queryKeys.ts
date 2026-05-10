export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    session: () => ["auth", "session"] as const,
  },
  shoppingLists: {
    all: () => ["shoppingLists"] as const,
    active: () => [...(["shoppingLists"] as const), "active"] as const,
    archived: () => [...(["shoppingLists"] as const), "archived"] as const,
    detail: (listId: string) => ["shoppingList", listId] as const,
    items: (listId: string) => ["shoppingListItems", listId] as const,
  },
  products: {
    all: () => ["products"] as const,
    search: (searchTerm = "") => ["products", searchTerm] as const,
    latestPrice: (productId: string) => ["product", productId, "latestPrice"] as const,
  },
  priceHistory: {
    byProduct: (productId: string) => ["priceHistory", productId] as const,
    insight: (productId: string, currentPrice: number) =>
      ["priceInsight", productId, currentPrice] as const,
  },
} as const;

export type QueryKeys = typeof queryKeys;
