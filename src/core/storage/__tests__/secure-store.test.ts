import * as SecureStore from 'expo-secure-store';
import { secureStorage } from '../secure-store';
import { STORAGE_KEYS } from '../../config';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('secureStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stores and retrieves item securely', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('test-token');

    await secureStorage.setItem('key1', 'test-token');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('key1', 'test-token');

    const result = await secureStorage.getItem('key1');
    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('key1');
    expect(result).toBe('test-token');
  });

  it('removes item securely', async () => {
    await secureStorage.removeItem('key1');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('key1');
  });

  it('manages auth token via helper methods', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('jwt-12345');

    await secureStorage.setAuthToken('jwt-12345');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      STORAGE_KEYS.AUTH_TOKEN,
      'jwt-12345'
    );

    const token = await secureStorage.getAuthToken();
    expect(token).toBe('jwt-12345');

    await secureStorage.removeAuthToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(STORAGE_KEYS.AUTH_TOKEN);
  });
});
