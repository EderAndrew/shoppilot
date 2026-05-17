import { describe, expect, it, vi } from "vitest";

vi.mock("@/infrastructure/supabase/client", () => ({
  supabase: { functions: { invoke: vi.fn() } },
}));

import {
  AIServiceError,
  SupabaseAIRepository,
} from "../../../src/infrastructure/repositories/SupabaseAIRepository";
import type { ShopPilotSupabaseClient } from "../../../src/infrastructure/supabase/client";

const validPayload = {
  suggestions: [
    { name: "Arroz", quantity: 2, unit: "kg", category: "Grãos" },
    { name: "Feijão", quantity: 1 },
  ],
};

function makeRepo(result: { data: unknown; error: unknown }): SupabaseAIRepository {
  const client = {
    functions: { invoke: vi.fn().mockResolvedValue(result) },
  } as unknown as ShopPilotSupabaseClient;
  return new SupabaseAIRepository(client);
}

const ctx = { listName: "Compras", existingItemNames: [] };

describe("SupabaseAIRepository", () => {
  it("returns SuggestedItem[] for valid response", async () => {
    const repo = makeRepo({ data: validPayload, error: null });
    const items = await repo.suggestItems("churrasco", ctx);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ name: "Arroz", quantity: 2, status: "pending" });
    expect(items[0].id).toBeTruthy();
    expect(items[1]).toMatchObject({ name: "Feijão", quantity: 1, status: "pending" });
  });

  it("throws AIServiceError('invalid_response') when Zod parse fails", async () => {
    const repo = makeRepo({ data: { suggestions: [{ name: "", quantity: 1 }] }, error: null });
    const err = await repo.suggestItems("test", ctx).catch((e) => e);
    expect(err).toBeInstanceOf(AIServiceError);
    expect(err.code).toBe("invalid_response");
  });

  it("throws AIServiceError('unavailable') when invoke returns error", async () => {
    const repo = makeRepo({ data: null, error: { message: "Network error" } });
    const err = await repo.suggestItems("test", ctx).catch((e) => e);
    expect(err).toBeInstanceOf(AIServiceError);
    expect(err.code).toBe("unavailable");
  });

  it("throws AIServiceError('unauthorized') for 401 error", async () => {
    const repo = makeRepo({ data: null, error: { message: "401 Unauthorized" } });
    const err = await repo.suggestItems("test", ctx).catch((e) => e);
    expect(err).toBeInstanceOf(AIServiceError);
    expect(err.code).toBe("unauthorized");
  });

  it("rejects suggestion with empty name via Zod validation", async () => {
    const repo = makeRepo({
      data: {
        suggestions: [
          { name: "", quantity: 1 },
          { name: "Arroz", quantity: 1 },
        ],
      },
      error: null,
    });
    const err = await repo.suggestItems("test", ctx).catch((e) => e);
    expect(err).toBeInstanceOf(AIServiceError);
    expect(err.code).toBe("invalid_response");
  });

  it("assigns status 'pending' to all returned items", async () => {
    const repo = makeRepo({ data: validPayload, error: null });
    const items = await repo.suggestItems("test", ctx);
    expect(items.every((i) => i.status === "pending")).toBe(true);
  });

  it("generates a unique id for each returned item", async () => {
    const repo = makeRepo({ data: validPayload, error: null });
    const items = await repo.suggestItems("test", ctx);
    const ids = items.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
