export const SyncStatus = {
  synced: 'synced',
  pending_create: 'pending_create',
  pending_update: 'pending_update',
  pending_delete: 'pending_delete',
  error: 'error',
} as const

export type SyncStatus = typeof SyncStatus[keyof typeof SyncStatus]
