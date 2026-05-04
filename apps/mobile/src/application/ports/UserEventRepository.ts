import type {
  UserEventEntityType,
  UserEventMetadata,
  UserEventType,
} from "@shop-pilot/shared/events/userEvents";

export type UserEventRecord = {
  id: string;
  userId: string;
  eventType: UserEventType;
  entityType: UserEventEntityType | string;
  entityId: string;
  metadata: UserEventMetadata;
  createdAt: string;
};

export type AppendUserEventInput = {
  eventType: UserEventType;
  entityType: UserEventEntityType | string;
  entityId: string;
  metadata?: UserEventMetadata;
};

export type UserEventRepository = {
  append(input: AppendUserEventInput): Promise<UserEventRecord>;
  listByEntity(entityType: string, entityId: string): Promise<UserEventRecord[]>;
};
