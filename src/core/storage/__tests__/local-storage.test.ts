import AsyncStorage from '@react-native-async-storage/async-storage';
import { localStorage } from '../local-storage';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('localStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('serializes and stores data', async () => {
    const data = { id: 'task-1', title: 'Task 1' };
    await localStorage.setItem('tasks', data);

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      'tasks',
      JSON.stringify(data)
    );
  });

  it('deserializes and returns data', async () => {
    const data = { id: 'task-1', title: 'Task 1' };
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(JSON.stringify(data));

    const result = await localStorage.getItem<typeof data>('tasks');
    expect(AsyncStorage.getItem).toHaveBeenCalledWith('tasks');
    expect(result).toEqual(data);
  });

  it('returns null if item not found or invalid JSON', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);
    const result1 = await localStorage.getItem('missing');
    expect(result1).toBeNull();

    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid json {');
    const result2 = await localStorage.getItem('corrupt');
    expect(result2).toBeNull();
  });

  it('removes item and clears storage', async () => {
    await localStorage.removeItem('key1');
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('key1');

    await localStorage.clear();
    expect(AsyncStorage.clear).toHaveBeenCalled();
  });
});
