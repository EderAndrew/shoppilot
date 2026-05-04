import {
  USER_EVENT_TYPES,
  type UserEventType,
} from "@shop-pilot/shared/events/userEvents";

export { USER_EVENT_TYPES, type UserEventType };

export function isUserEventType(value: unknown): value is UserEventType {
  return typeof value === "string" && USER_EVENT_TYPES.includes(value as UserEventType);
}

export function assertUserEventType(value: unknown): UserEventType {
  if (!isUserEventType(value)) {
    throw new RangeError("Unsupported user event type.");
  }

  return value;
}
