import type { RealtimeChannel, RealtimePostgresChangesPayload } from "@supabase/supabase-js";

import type { Tables } from "@/infrastructure/supabase/database.types";

import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";

type ShoppingListRow = Tables<"shopping_lists">;
type ShoppingListItemRow = Tables<"shopping_list_items">;

export type ActiveListRealtimeChange =
  | {
      table: "shopping_lists";
      eventType: "UPDATE";
      row: ShoppingListRow;
    }
  | {
      table: "shopping_list_items";
      eventType: "INSERT" | "UPDATE";
      row: ShoppingListItemRow;
    }
  | {
      table: "shopping_list_items";
      eventType: "DELETE";
      oldRow: Partial<ShoppingListItemRow>;
    };

export type ActiveListSubscription = {
  unsubscribe: () => void;
};

export type SubscribeToActiveListOptions = {
  listId: string;
  userId: string;
  onChange: (change: ActiveListRealtimeChange) => void;
  client?: ShopPilotSupabaseClient;
};

function handleListPayload(
  payload: RealtimePostgresChangesPayload<ShoppingListRow>,
  onChange: (change: ActiveListRealtimeChange) => void,
): void {
  if (payload.eventType !== "UPDATE") return;
  onChange({ eventType: "UPDATE", row: payload.new, table: "shopping_lists" });
}

function handleItemPayload(
  payload: RealtimePostgresChangesPayload<ShoppingListItemRow>,
  onChange: (change: ActiveListRealtimeChange) => void,
): void {
  if (payload.eventType === "DELETE") {
    onChange({ eventType: "DELETE", oldRow: payload.old, table: "shopping_list_items" });
    return;
  }

  onChange({ eventType: payload.eventType, row: payload.new, table: "shopping_list_items" });
}

export function subscribeToActiveList({
  client = supabase,
  listId,
  onChange,
  userId,
}: SubscribeToActiveListOptions): ActiveListSubscription {
  if (!listId || !userId) {
    return { unsubscribe: () => undefined };
  }

  const channelName = `active-list:${userId}:${listId}`;

  // Supabase v2 reuses channels by name. If a prior cleanup is still in progress
  // (removeChannel is async), the existing subscribed channel is returned and
  // calling .on() on it throws. Return early and reuse the live channel instead.
  const existingChannel = client
    .getChannels()
    .find((ch) => ch.topic === `realtime:${channelName}`);
  if (existingChannel?.joinedOnce) {
    return { unsubscribe: () => void removeChannel(client, existingChannel) };
  }

  const channel = client
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        filter: `id=eq.${listId}`,
        schema: "public",
        table: "shopping_lists",
      },
      (payload) =>
        handleListPayload(payload as RealtimePostgresChangesPayload<ShoppingListRow>, onChange),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        filter: `shopping_list_id=eq.${listId}`,
        schema: "public",
        table: "shopping_list_items",
      },
      (payload) =>
        handleItemPayload(payload as RealtimePostgresChangesPayload<ShoppingListItemRow>, onChange),
    )
    .subscribe();

  return {
    unsubscribe: () => {
      void removeChannel(client, channel);
    },
  };
}

function removeChannel(
  client: ShopPilotSupabaseClient,
  channel: RealtimeChannel,
): Promise<unknown> {
  return client.removeChannel(channel);
}
