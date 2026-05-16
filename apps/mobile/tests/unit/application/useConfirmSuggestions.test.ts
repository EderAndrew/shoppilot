import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSearchExecute, mockCreateExecute, mockAddItemExecute, mockInvalidateQueries } =
  vi.hoisted(() => ({
    mockSearchExecute: vi.fn(),
    mockCreateExecute: vi.fn(),
    mockAddItemExecute: vi.fn(),
    mockInvalidateQueries: vi.fn(),
  }));

vi.mock("@/application/use-cases/products", () => ({
  SearchProducts: vi.fn(function () {
    return { execute: mockSearchExecute };
  }),
  CreateProduct: vi.fn(function () {
    return { execute: mockCreateExecute };
  }),
}));

vi.mock("@/application/use-cases/shoppingListItems", () => ({
  AddShoppingListItem: vi.fn(function () {
    return { execute: mockAddItemExecute };
  }),
}));

vi.mock("@/infrastructure/repositories/defaultRepositories", () => ({
  defaultRepositories: {
    products: {},
    userEvents: {},
    shoppingListItems: {},
    shoppingLists: {},
    priceHistory: {},
  },
}));

vi.mock("react", () => ({
  useState: vi.fn((init: unknown) => [init, vi.fn()]),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: vi.fn(() => ({ invalidateQueries: mockInvalidateQueries })),
}));

import { useConfirmSuggestions } from "../../../src/features/ai-assistant/useConfirmSuggestions";
import type { SuggestedItem } from "../../../src/domain/entities/AISuggestion";

function suggestion(name: string, quantity = 1): SuggestedItem {
  return { id: `s-${name}`, name, quantity, status: "pending" };
}

function product(id: string, name: string) {
  return {
    id,
    name,
    barcode: null,
    brand: null,
    createdAt: "",
    unit: null,
    updatedAt: "",
    userId: "",
  };
}

describe("useConfirmSuggestions", () => {
  beforeEach(() => {
    mockSearchExecute.mockReset();
    mockCreateExecute.mockReset();
    mockAddItemExecute.mockReset();
    mockInvalidateQueries.mockReset();
    mockAddItemExecute.mockResolvedValue({});
  });

  it("reuses existing product when exact name match found", async () => {
    mockSearchExecute.mockResolvedValue([product("p-1", "Arroz")]);

    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([suggestion("Arroz")]);

    expect(mockCreateExecute).not.toHaveBeenCalled();
    expect(mockAddItemExecute).toHaveBeenCalledWith(expect.objectContaining({ productId: "p-1" }));
  });

  it("creates new product when no exact match found", async () => {
    mockSearchExecute.mockResolvedValue([]);
    mockCreateExecute.mockResolvedValue({ id: "p-new", name: "Feijão" });

    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([suggestion("Feijão")]);

    expect(mockCreateExecute).toHaveBeenCalledWith(expect.objectContaining({ name: "Feijão" }));
    expect(mockAddItemExecute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "p-new" }),
    );
  });

  it("calls AddShoppingListItem with quantity from suggestion and unitPrice 0", async () => {
    mockSearchExecute.mockResolvedValue([product("p-1", "Arroz")]);

    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([suggestion("Arroz", 3)]);

    expect(mockAddItemExecute).toHaveBeenCalledWith({
      shoppingListId: "list-1",
      productId: "p-1",
      quantity: 3,
      unitPrice: 0,
    });
  });

  it("invalidates queries after all items added", async () => {
    mockSearchExecute.mockResolvedValue([product("p-1", "Arroz")]);

    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([suggestion("Arroz"), suggestion("Feijão", 2)]);

    // 3 invalidations (detail + items + products) happen after the full loop completes
    expect(mockInvalidateQueries).toHaveBeenCalledTimes(3);
    expect(mockInvalidateQueries).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(["list-1"]) }),
    );
  });

  it("continues adding remaining items if one item fails", async () => {
    mockSearchExecute.mockResolvedValue([]);
    mockCreateExecute
      .mockResolvedValueOnce({ id: "p-1", name: "Arroz" })
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({ id: "p-3", name: "Macarrão" });

    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([suggestion("Arroz"), suggestion("Feijão"), suggestion("Macarrão")]);

    // Feijão failed at createProduct — Arroz and Macarrão still added
    expect(mockAddItemExecute).toHaveBeenCalledTimes(2);
    expect(mockAddItemExecute).toHaveBeenCalledWith(expect.objectContaining({ productId: "p-1" }));
    expect(mockAddItemExecute).toHaveBeenCalledWith(expect.objectContaining({ productId: "p-3" }));
  });

  it("does nothing when called with empty selection", async () => {
    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([]);

    expect(mockSearchExecute).not.toHaveBeenCalled();
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it("uses case-insensitive trim comparison to match existing products", async () => {
    mockSearchExecute.mockResolvedValue([product("p-existing", "  ARROZ  ")]);

    const { confirm } = useConfirmSuggestions("list-1");
    await confirm([suggestion("arroz")]);

    expect(mockCreateExecute).not.toHaveBeenCalled();
    expect(mockAddItemExecute).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "p-existing" }),
    );
  });
});
