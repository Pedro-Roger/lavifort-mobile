import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS } from '../config';

export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
      throw error;
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        return;
      }
      throw error;
    }
  },

  async getAuthToken(): Promise<string | null> {
    return this.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  async setAuthToken(token: string): Promise<void> {
    return this.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  async removeAuthToken(): Promise<void> {
    return this.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },
};
