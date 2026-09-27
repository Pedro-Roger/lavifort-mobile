import AsyncStorage from '@react-native-async-storage/async-storage';

export const localStorage = {
  async setItem<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItem(key, serialized);
  },

  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },
};
