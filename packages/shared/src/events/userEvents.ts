export const USER_EVENT_TYPES = [
  "SHOPPING_LIST_CREATED",
  "SHOPPING_LIST_COMPLETED",
  "PRODUCT_CREATED",
  "ITEM_ADDED",
  "ITEM_UPDATED",
  "ITEM_REMOVED",
  "ITEM_CHECKED",
  "PRICE_RECORDED",
] as const;

export type UserEventType = (typeof USER_EVENT_TYPES)[number];

export const USER_EVENT_ENTITY_TYPES = [
  "shopping_list",
  "product",
  "shopping_list_item",
  "price_history",
] as const;

export type UserEventEntityType = (typeof USER_EVENT_ENTITY_TYPES)[number];

export type UserEventMetadataValue =
  | string
  | number
  | boolean
  | null
  | UserEventMetadataValue[]
  | { [key: string]: UserEventMetadataValue };

export type UserEventMetadata = Record<string, UserEventMetadataValue>;
