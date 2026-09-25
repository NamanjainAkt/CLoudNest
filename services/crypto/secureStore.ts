// services/crypto/secureStore.ts
import * as SecureStore from 'expo-secure-store';

const MASTER_KEY_STORAGE = 'cloudnest_master_key';
const TELEGRAM_SESSION_STORAGE = 'cloudnest_telegram_session';
const GRAMJS_SESSION_STORAGE = 'cloudnest_gramjs_session';
const APP_PIN_STORAGE = 'cloudnest_app_pin';
const BIOMETRICS_ENABLED_STORAGE = 'cloudnest_biometrics_enabled';

export const SecureStorageService = {
  async saveMasterKey(keyHex: string): Promise<void> {
    await SecureStore.setItemAsync(MASTER_KEY_STORAGE, keyHex);
  },

  async getMasterKey(): Promise<string | null> {
    return await SecureStore.getItemAsync(MASTER_KEY_STORAGE);
  },

  async clearMasterKey(): Promise<void> {
    await SecureStore.deleteItemAsync(MASTER_KEY_STORAGE);
  },

  async saveTelegramSession(sessionJson: string): Promise<void> {
    await SecureStore.setItemAsync(TELEGRAM_SESSION_STORAGE, sessionJson);
  },

  async getTelegramSession(): Promise<string | null> {
    return await SecureStore.getItemAsync(TELEGRAM_SESSION_STORAGE);
  },

  async clearTelegramSession(): Promise<void> {
    await SecureStore.deleteItemAsync(TELEGRAM_SESSION_STORAGE);
  },

  async saveGramjsSession(sessionStr: string): Promise<void> {
    await SecureStore.setItemAsync(GRAMJS_SESSION_STORAGE, sessionStr);
  },

  async getGramjsSession(): Promise<string | null> {
    return await SecureStore.getItemAsync(GRAMJS_SESSION_STORAGE);
  },

  async clearGramjsSession(): Promise<void> {
    await SecureStore.deleteItemAsync(GRAMJS_SESSION_STORAGE);
  },

  async setAppPin(pin: string): Promise<void> {
    await SecureStore.setItemAsync(APP_PIN_STORAGE, pin);
  },

  async getAppPin(): Promise<string | null> {
    return await SecureStore.getItemAsync(APP_PIN_STORAGE);
  },

  async setBiometricsEnabled(enabled: boolean): Promise<void> {
    await SecureStore.setItemAsync(BIOMETRICS_ENABLED_STORAGE, enabled ? 'true' : 'false');
  },

  async isBiometricsEnabled(): Promise<boolean> {
    const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_STORAGE);
    return val === 'true';
  },

  async saveItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  async getItem(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  async deleteItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  async getRecentSearches(): Promise<string[]> {
    try {
      const raw = await SecureStore.getItemAsync('cloudnest_recent_searches');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveRecentSearches(searches: string[]): Promise<void> {
    try {
      await SecureStore.setItemAsync('cloudnest_recent_searches', JSON.stringify(searches.slice(0, 10)));
    } catch {}
  },
};
