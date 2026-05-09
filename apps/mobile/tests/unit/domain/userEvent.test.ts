import { describe, expect, it } from "vitest";

import { sanitizeUserEventMetadata, UserEvent } from "../../../src/domain/entities/UserEvent";
import { USER_EVENT_TYPES } from "../../../src/domain/events/UserEventType";

describe("UserEvent", () => {
  it("supports the planned audit event types", () => {
    expect(USER_EVENT_TYPES).toEqual([
      "SHOPPING_LIST_CREATED",
      "SHOPPING_LIST_COMPLETED",
      "PRODUCT_CREATED",
      "ITEM_ADDED",
      "ITEM_UPDATED",
      "ITEM_REMOVED",
      "ITEM_CHECKED",
      "PRICE_RECORDED",
    ]);
  });

  it("sanitizes sensitive metadata keys recursively", () => {
    const metadata = sanitizeUserEventMetadata({
      list_id: "list-1",
      nested: {
        access_token: "secret",
        safe: true,
        session: { refresh_token: "secret" },
      },
      password: "secret",
    });

    expect(metadata).toEqual({
      list_id: "list-1",
      nested: { safe: true },
    });
  });

  it("rejects unsupported event types", () => {
    expect(
      () =>
        new UserEvent({
          createdAt: "2026-05-04T00:00:00.000Z",
          entityId: "list-1",
          entityType: "shopping_list",
          eventType: "UNSUPPORTED" as never,
          id: "event-1",
          metadata: {},
          userId: "user-1",
        }),
    ).toThrow("Unsupported user event type.");
  });
});
