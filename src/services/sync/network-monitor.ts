import NetInfo, { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';

export type NetworkStatusListener = (isConnected: boolean, isInternetReachable: boolean | null) => void;

export class NetworkMonitor {
  private subscription: NetInfoSubscription | null = null;
  private listeners: Set<NetworkStatusListener> = new Set();
  private _isConnected: boolean = true;
  private _isInternetReachable: boolean | null = true;
  private isInitialized = false;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const state = await NetInfo.fetch();
      this.updateState(state);
    } catch {
      this._isConnected = true;
      this._isInternetReachable = true;
    }

    this.subscription = NetInfo.addEventListener((state: NetInfoState) => {
      this.updateState(state);
    });
  }

  private updateState(state: NetInfoState): void {
    const isConnected = Boolean(state.isConnected && state.isInternetReachable !== false);
    const reachable = state.isInternetReachable ?? null;

    const changed = this._isConnected !== isConnected || this._isInternetReachable !== reachable;
    this._isConnected = isConnected;
    this._isInternetReachable = reachable;

    if (changed) {
      this.notifyListeners();
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this._isConnected, this._isInternetReachable);
      } catch {
        // Ignore listener error
      }
    });
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isInternetReachable(): boolean | null {
    return this._isInternetReachable;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.updateState(state);
      return this._isConnected;
    } catch {
      return this._isConnected;
    }
  }

  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    listener(this._isConnected, this._isInternetReachable);
    return () => {
      this.listeners.delete(listener);
    };
  }

  removeListener(listener: NetworkStatusListener): void {
    this.listeners.delete(listener);
  }

  destroy(): void {
    if (this.subscription) {
      this.subscription();
      this.subscription = null;
    }
    this.listeners.clear();
    this.isInitialized = false;
  }
}

export const networkMonitor = new NetworkMonitor();
