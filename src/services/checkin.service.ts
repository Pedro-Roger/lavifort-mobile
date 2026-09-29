import { localStorage } from '../core/storage/local-storage';
import { STORAGE_KEYS } from '../core/config';
import { generateUUID } from '../utils/uuid';
import {
  CheckinInput,
  CheckinRecord,
  Region,
  RegionVerification,
} from '../types';
import { apiClient } from './api';

/**
 * Check-in georreferenciado nas fazendas (CRM diário da vendedora).
 *
 * Fluxo offline-first:
 * 1. Captura de coordenadas (expo-location) → verificação da região (geofence).
 * 2. `recordCheckin` persiste localmente (AsyncStorage) e marca `PENDING`.
 * 3. `syncPendingCheckins` envia para `PATCH /appointments/:id/checkin`
 *    (contrato real do backend/web) quando a visita está vinculada a um
 *    compromisso; visitas de fazenda sem vínculo ficam como `LOCAL`
 *    ("modo simplificado" de CRM diário).
 */

/** Raio da Terra em km (fórmula de haversine). */
const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Verifica se uma coordenada pertence à região através de geofence (centro + raio),
 * usando os valores reais da API (centerLat/centerLng/radiusKm).
 *
 * Quando a região NÃO traz coordenadas (null), assume-se válida — o que autoriza
 * o fallback por uf/cidade na carteira (geofence indisponível não bloqueia o check-in).
 */
export function verifyRegion(
  region: Region,
  coords: Pick<CheckinInput, 'latitude' | 'longitude'>,
  maxDistanceKm?: number
): RegionVerification {
  const { centerLat, centerLng } = region;
  if (centerLat == null || centerLng == null) {
    return { inside: true, distanceKm: 0 };
  }
  const distanceKm = haversineKm(
    centerLat,
    centerLng,
    coords.latitude,
    coords.longitude
  );
  const threshold = maxDistanceKm ?? region.radiusKm ?? 100;
  return { inside: distanceKm <= threshold, distanceKm };
}

async function readRecords(): Promise<CheckinRecord[]> {
  return (await localStorage.getItem<CheckinRecord[]>(STORAGE_KEYS.CHECKINS)) || [];
}

async function writeRecords(records: CheckinRecord[]): Promise<void> {
  await localStorage.setItem(STORAGE_KEYS.CHECKINS, records);
}

export const checkinService = {
  verifyRegion,

  /**
   * Registra um check-in de forma local e imediata (offline-first).
   */
  async recordCheckin(input: CheckinInput): Promise<CheckinRecord> {
    const record: CheckinRecord = {
      ...input,
      id: generateUUID(),
      checkedInAt: new Date().toISOString(),
      syncStatus: input.appointmentId ? 'PENDING' : 'LOCAL',
    };
    const records = await readRecords();
    records.push(record);
    await writeRecords(records);
    return record;
  },

  /**
   * Histórico de check-ins do dia (mais recentes primeiro).
   */
  async getHistory(): Promise<CheckinRecord[]> {
    const records = await readRecords();
    return records.sort(
      (a, b) =>
        new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
    );
  },

  /**
   * Envia check-ins pendentes vinculados a compromissos para o contrato real
   * `PATCH /appointments/:id/checkin`. Registros de fazenda sem vínculo são
   * marcados como `LOCAL` (visita registrada de CRM diário).
   */
  async syncPendingCheckins(): Promise<{
    synced: number;
    local: number;
    failed: number;
  }> {
    const records = await readRecords();
    let synced = 0;
    let local = 0;
    let failed = 0;

    const updated: CheckinRecord[] = [];
    for (const record of records) {
      if (record.syncStatus !== 'PENDING') {
        updated.push(record);
        continue;
      }

      if (!record.appointmentId) {
        updated.push({ ...record, syncStatus: 'LOCAL' });
        local += 1;
        continue;
      }

      try {
        await apiClient.patch(`/appointments/${record.appointmentId}/checkin`, {
          latitude: record.latitude,
          longitude: record.longitude,
          accuracy: record.accuracyMeters,
        });
        updated.push({ ...record, syncStatus: 'SYNCED' });
        synced += 1;
      } catch {
        updated.push(record);
        failed += 1;
      }
    }

    await writeRecords(updated);
    return { synced, local, failed };
  },

  async clearHistory(): Promise<void> {
    await writeRecords([]);
  },
};