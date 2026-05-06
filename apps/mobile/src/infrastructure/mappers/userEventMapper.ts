import { UserEvent } from "@/domain/entities/UserEvent";

import type { UserEventRecord } from "@/application/ports/UserEventRepository";
import type { UserEventMetadata } from "@shop-pilot/shared/events/userEvents";
import type { Tables } from "../supabase/database.types";

export function userEventRowToRecord(row: Tables<"user_events">): UserEventRecord {
  return {
    createdAt: row.created_at,
    entityId: row.entity_id,
    entityType: row.entity_type,
    eventType: row.event_type,
    id: row.id,
    metadata: (row.metadata ?? {}) as UserEventMetadata,
    userId: row.user_id,
  };
}

export function userEventRowToDomain(row: Tables<"user_events">): UserEvent {
  return new UserEvent(userEventRowToRecord(row));
}
