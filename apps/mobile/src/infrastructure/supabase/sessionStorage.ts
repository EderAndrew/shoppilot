import * as SecureStore from "expo-secure-store";

export type SupabaseSessionStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const supabaseSessionStorage: SupabaseSessionStorage = {
  async getItem(key) {
    return SecureStore.getItemAsync(key, secureStoreOptions);
  },
  async setItem(key, value) {
    await SecureStore.setItemAsync(key, value, secureStoreOptions);
  },
  async removeItem(key) {
    await SecureStore.deleteItemAsync(key, secureStoreOptions);
  },
};
