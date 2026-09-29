import { checkinService, haversineKm, verifyRegion } from '../checkin.service';
import { localStorage } from '../../core/storage/local-storage';
import { STORAGE_KEYS } from '../../core/config';
import { apiClient } from '../api';
import { Region } from '../../types';

jest.mock('../api', () => ({
  apiClient: {
    patch: jest.fn(),
  },
}));

jest.mock('../../../src/core/storage/local-storage', () => ({
  localStorage: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('../../utils/uuid', () => ({
  generateUUID: jest.fn(() => 'uuid-123'),
}));

const region: Region = {
  id: 'reg-litoral',
  nome: 'Litoral Leste',
  ufs: ['CE'],
  cidades: ['Aracati'],
  centerLat: -4.3,
  centerLng: -37.9,
  radiusKm: 140,
};

beforeEach(() => {
  jest.clearAllMocks();
  (apiClient.patch as jest.Mock).mockResolvedValue({});
});

describe('checkinService — geofence de região', () => {
  it('computes haversine distance between two points', () => {
    // Aprox. 1 grau de latitude ~ 111 km.
    const d = haversineKm(-3.0, -39.2, -4.0, -39.2);
    expect(d).toBeGreaterThan(100);
    expect(d).toBeLessThan(120);
  });

  it('returns inside=true when within the region radius', () => {
    const coords = { latitude: -4.3, longitude: -37.9 };
    expect(checkinService.verifyRegion(region, coords).inside).toBe(true);
  });

  it('returns inside=false for a point far from the center', () => {
    const coords = { latitude: -20, longitude: -47 }; // distante
    const result = checkinService.verifyRegion(region, coords);
    expect(result.inside).toBe(false);
    expect(result.distanceKm).toBeGreaterThan(140);
  });

  it('treats regions without configured coordinates (null) as valid (fallback)', () => {
    const noGeofence: Region = { ...region, centerLat: null, centerLng: null, radiusKm: null };
    expect(checkinService.verifyRegion(noGeofence, { latitude: 10, longitude: 10 }).inside).toBe(
      true
    );
  });

  it('honors a custom maxDistanceKm override', () => {
    const coords = { latitude: -3.3, longitude: -37.9 };
    expect(verifyRegion(region, coords, 1).inside).toBe(false);
    expect(verifyRegion(region, coords, 200).inside).toBe(true);
  });
});

describe('checkinService — persistência offline-first', () => {
  it('records a check-in locally as LOCAL when no appointment is linked', async () => {
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const record = await checkinService.recordCheckin({
      clientId: 'c-1',
      clientName: 'Ana',
      regionId: 'reg-litoral',
      regionName: 'Litoral Leste',
      latitude: -4.3,
      longitude: -37.9,
      accuracyMeters: 15,
    });

    expect(record).toMatchObject({
      id: 'uuid-123',
      clientId: 'c-1',
      syncStatus: 'LOCAL',
    });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.CHECKINS,
      expect.arrayContaining([record])
    );
  });

  it('records a check-in as PENDING when linked to an appointment', async () => {
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

    const record = await checkinService.recordCheckin({
      clientId: 'c-1',
      clientName: 'Ana',
      regionId: 'reg-litoral',
      regionName: 'Litoral Leste',
      latitude: -4.3,
      longitude: -37.9,
      accuracyMeters: 15,
      appointmentId: 'appt-9',
    });

    expect(record.syncStatus).toBe('PENDING');
  });

  it('returns history sorted newest first', async () => {
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce([
      { id: 'a', checkedInAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', checkedInAt: '2026-01-02T00:00:00.000Z' },
    ]);

    const history = await checkinService.getHistory();
    expect(history.map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('clears the history', async () => {
    await checkinService.clearHistory();
    expect(localStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.CHECKINS, []);
  });
});

describe('checkinService — sync de pendências', () => {
  it('syncs appointment-linked records via PATCH /appointments/:id/checkin', async () => {
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce([
      {
        id: 'r1',
        clientId: 'c-1',
        clientName: 'Ana',
        regionId: 'reg-litoral',
        regionName: 'Litoral Leste',
        latitude: -4.3,
        longitude: -37.9,
        accuracyMeters: 15,
        appointmentId: 'appt-9',
        checkedInAt: '2026-01-01T00:00:00.000Z',
        syncStatus: 'PENDING',
      },
      {
        id: 'r2',
        clientId: 'c-2',
        clientName: 'Bruno',
        regionId: 'reg-litoral',
        regionName: 'Litoral Leste',
        latitude: -4.3,
        longitude: -37.9,
        accuracyMeters: 15,
        checkedInAt: '2026-01-01T00:00:00.000Z',
        syncStatus: 'PENDING',
        appointmentId: null,
      },
    ]);

    const result = await checkinService.syncPendingCheckins();

    expect(apiClient.patch).toHaveBeenCalledWith('/appointments/appt-9/checkin', {
      latitude: -4.3,
      longitude: -37.9,
      accuracy: 15,
    });
    expect(result).toEqual({ synced: 1, local: 1, failed: 0 });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.CHECKINS,
      expect.arrayContaining([
        expect.objectContaining({ id: 'r1', syncStatus: 'SYNCED' }),
        expect.objectContaining({ id: 'r2', syncStatus: 'LOCAL' }),
      ])
    );
  });

  it('keeps a record as PENDING (failed) when the API call fails', async () => {
    (apiClient.patch as jest.Mock).mockRejectedValueOnce(new Error('network'));
    (localStorage.getItem as jest.Mock).mockResolvedValueOnce([
      {
        id: 'r1',
        clientId: 'c-1',
        clientName: 'Ana',
        regionId: 'reg-litoral',
        regionName: 'Litoral Leste',
        latitude: -4.3,
        longitude: -37.9,
        accuracyMeters: 15,
        appointmentId: 'appt-9',
        checkedInAt: '2026-01-01T00:00:00.000Z',
        syncStatus: 'PENDING',
      },
    ]);

    const result = await checkinService.syncPendingCheckins();
    expect(result).toEqual({ synced: 0, local: 0, failed: 1 });
    expect(localStorage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.CHECKINS,
      expect.arrayContaining([
        expect.objectContaining({ id: 'r1', syncStatus: 'PENDING' }),
      ])
    );
  });
});