import type { AuthRepository } from "@/application/ports/AuthRepository";
import type {
  AppendUserEventInput,
  UserEventRecord,
  UserEventRepository,
} from "@/application/ports/UserEventRepository";
import { sanitizeUserEventMetadata } from "@/domain/entities/UserEvent";

import { userEventRowToRecord } from "../mappers/userEventMapper";
import { supabase, type ShopPilotSupabaseClient } from "../supabase/client";
import { mapSupabaseError, requireCurrentUserId } from "./supabaseRepositoryUtils";

export class SupabaseUserEventRepository implements UserEventRepository {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly client: ShopPilotSupabaseClient = supabase,
  ) {}

  async append(input: AppendUserEventInput): Promise<UserEventRecord> {
    const userId = await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("user_events")
      .insert({
        entity_id: input.entityId,
        entity_type: input.entityType,
        event_type: input.eventType,
        metadata: sanitizeUserEventMetadata(input.metadata),
        user_id: userId,
      })
      .select()
      .single();

    if (error) mapSupabaseError(error);
    return userEventRowToRecord(data);
  }

  async listByEntity(entityType: string, entityId: string): Promise<UserEventRecord[]> {
    await requireCurrentUserId(this.authRepository);
    const { data, error } = await this.client
      .from("user_events")
      .select()
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (error) mapSupabaseError(error);
    return (data ?? []).map(userEventRowToRecord);
  }
}
