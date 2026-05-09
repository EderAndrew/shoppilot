import { UserEvent } from "@/domain/entities/UserEvent";

import type {
  AppendUserEventInput,
  UserEventRecord,
  UserEventRepository,
} from "../ports/UserEventRepository";

function validateUserEventInput(input: AppendUserEventInput): AppendUserEventInput {
  const event = UserEvent.create({
    ...input,
    id: "validation-only",
    userId: "validation-only",
  });

  return {
    entityId: event.entityId,
    entityType: event.entityType,
    eventType: event.eventType,
    metadata: event.metadata,
  };
}

export class RecordUserEvent {
  constructor(private readonly userEvents: UserEventRepository) {}

  execute(input: AppendUserEventInput): Promise<UserEventRecord> {
    return this.userEvents.append(validateUserEventInput(input));
  }
}
