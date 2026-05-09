import {
  type UserEventEntityType,
  type UserEventMetadata,
  type UserEventMetadataValue,
} from "@shop-pilot/shared/events/userEvents";

import { assertUserEventType, type UserEventType } from "../events/UserEventType";

const sensitiveMetadataKeyPattern =
  /token|secret|password|authorization|cookie|session|refresh|access|apikey|api_key|service_role/i;

export type UserEventProps = {
  id: string;
  userId: string;
  eventType: UserEventType;
  entityType: UserEventEntityType | string;
  entityId: string;
  metadata?: UserEventMetadata;
  createdAt: string;
};

export type CreateUserEventInput = Omit<UserEventProps, "createdAt" | "metadata"> & {
  metadata?: UserEventMetadata;
  createdAt?: string;
};

function sanitizeMetadataValue(value: UserEventMetadataValue, depth = 0): UserEventMetadataValue {
  if (value === null || typeof value !== "object") return value;
  if (depth >= 4) return "[redacted-depth]";

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item, depth + 1));
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sensitiveMetadataKeyPattern.test(key))
      .map(([key, nestedValue]) => [key, sanitizeMetadataValue(nestedValue, depth + 1)]),
  );
}

export function sanitizeUserEventMetadata(metadata: UserEventMetadata = {}): UserEventMetadata {
  return sanitizeMetadataValue(metadata) as UserEventMetadata;
}

export class UserEvent {
  readonly id: string;
  readonly userId: string;
  readonly eventType: UserEventType;
  readonly entityType: UserEventEntityType | string;
  readonly entityId: string;
  readonly metadata: UserEventMetadata;
  readonly createdAt: string;

  constructor(props: UserEventProps) {
    const entityType = props.entityType.trim();
    const entityId = props.entityId.trim();

    if (!entityType) throw new RangeError("User event entity type is required.");
    if (!entityId) throw new RangeError("User event entity id is required.");

    this.id = props.id;
    this.userId = props.userId;
    this.eventType = assertUserEventType(props.eventType);
    this.entityType = entityType;
    this.entityId = entityId;
    this.metadata = sanitizeUserEventMetadata(props.metadata);
    this.createdAt = props.createdAt;
  }

  static create(input: CreateUserEventInput): UserEvent {
    return new UserEvent({
      ...input,
      createdAt: input.createdAt ?? new Date().toISOString(),
    });
  }

  toRecord() {
    return {
      createdAt: this.createdAt,
      entityId: this.entityId,
      entityType: this.entityType,
      eventType: this.eventType,
      id: this.id,
      metadata: this.metadata,
      userId: this.userId,
    };
  }
}
