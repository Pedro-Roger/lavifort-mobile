import { getCheckinCoords, CHECKIN_LOCATION_TIMEOUT_MS } from '../location.service';
import * as Location from 'expo-location';

jest.mock('expo-location', () => ({
  hasServicesEnabledAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  Accuracy: { Balanced: 3 },
}));

const mockHasServices = Location.hasServicesEnabledAsync as jest.Mock;
const mockRequestPerm = Location.requestForegroundPermissionsAsync as jest.Mock;
const mockCurrent = Location.getCurrentPositionAsync as jest.Mock;
const mockLastKnown = Location.getLastKnownPositionAsync as jest.Mock;

describe('getCheckinCoords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasServices.mockResolvedValue(true);
    mockRequestPerm.mockResolvedValue({ status: 'granted', canAskAgain: true });
  });

  it('returns coords from current position when everything is granted', async () => {
    mockCurrent.mockResolvedValue({
      coords: { latitude: -3.73, longitude: -38.52, accuracy: 12 },
    });

    const result = await getCheckinCoords(1000);

    expect(result).toEqual({ latitude: -3.73, longitude: -38.52, accuracyMeters: 12 });
  });

  it('throws SERVICES_OFF when device location is disabled', async () => {
    mockHasServices.mockResolvedValue(false);

    await expect(getCheckinCoords(50)).rejects.toMatchObject({ code: 'SERVICES_OFF' });
    expect(mockCurrent).not.toHaveBeenCalled();
  });

  it('throws PERMISSION_BLOCKED when denied without ask-again', async () => {
    mockRequestPerm.mockResolvedValue({ status: 'denied', canAskAgain: false });

    await expect(getCheckinCoords(50)).rejects.toMatchObject({ code: 'PERMISSION_BLOCKED' });
  });

  it('throws PERMISSION_DENIED when denied but can ask again', async () => {
    mockRequestPerm.mockResolvedValue({ status: 'denied', canAskAgain: true });

    await expect(getCheckinCoords(50)).rejects.toMatchObject({ code: 'PERMISSION_DENIED' });
  });

  it('falls back to last known position on timeout', async () => {
    mockCurrent.mockReturnValue(new Promise(() => {}));
    mockLastKnown.mockResolvedValue({
      coords: { latitude: 1, longitude: 2, accuracy: null },
    });

    const result = await getCheckinCoords(50);

    expect(result).toEqual({ latitude: 1, longitude: 2, accuracyMeters: 0 });
  });

  it('throws UNAVAILABLE when current and last known both fail', async () => {
    mockCurrent.mockRejectedValue(new Error('no fix'));
    mockLastKnown.mockResolvedValue(null);

    await expect(getCheckinCoords(50)).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });

  it('exposes a sane default timeout', () => {
    expect(CHECKIN_LOCATION_TIMEOUT_MS).toBeGreaterThanOrEqual(5000);
  });
});
