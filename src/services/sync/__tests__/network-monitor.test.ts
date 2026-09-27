import { NetworkMonitor } from '../network-monitor';
import NetInfo from '@react-native-community/netinfo';

jest.mock('@react-native-community/netinfo', () => {
  let listener: ((state: any) => void) | null = null;
  return {
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
    addEventListener: jest.fn().mockImplementation((cb) => {
      listener = cb;
      return () => {
        listener = null;
      };
    }),
    __fireEvent: (state: any) => {
      if (listener) listener(state);
    },
  };
});

describe('NetworkMonitor', () => {
  let monitor: NetworkMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new NetworkMonitor();
  });

  afterEach(() => {
    monitor.destroy();
  });

  it('initializes and reads network status', async () => {
    await monitor.init();
    expect(NetInfo.fetch).toHaveBeenCalled();
    expect(NetInfo.addEventListener).toHaveBeenCalled();
    expect(monitor.isConnected).toBe(true);
    expect(monitor.isInternetReachable).toBe(true);
  });

  it('notifies listeners when network changes', async () => {
    await monitor.init();
    const listener = jest.fn();
    monitor.addListener(listener);

    // Initial value is emitted immediately
    expect(listener).toHaveBeenCalledWith(true, true);
    listener.mockClear();

    // Fire simulated offline event
    (NetInfo as any).__fireEvent({ isConnected: false, isInternetReachable: false });

    expect(monitor.isConnected).toBe(false);
    expect(listener).toHaveBeenCalledWith(false, false);
  });

  it('handles checkConnection explicitly', async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValueOnce({ isConnected: false, isInternetReachable: false });
    const isConn = await monitor.checkConnection();
    expect(isConn).toBe(false);
  });
});
