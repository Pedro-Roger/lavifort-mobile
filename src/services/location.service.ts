import * as Location from 'expo-location';
import { ConfirmActivityInput } from '../types';

export const CHECKIN_LOCATION_TIMEOUT_MS = 15000;

export type CheckinLocationErrorCode =
  | 'SERVICES_OFF'
  | 'PERMISSION_DENIED'
  | 'PERMISSION_BLOCKED'
  | 'UNAVAILABLE';

export class CheckinLocationError extends Error {
  code: CheckinLocationErrorCode;
  constructor(code: CheckinLocationErrorCode, message: string) {
    super(message);
    this.name = 'CheckinLocationError';
    this.code = code;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new CheckinLocationError(
          'UNAVAILABLE',
          'Não foi possível obter a localização a tempo. Ative o GPS e tente em local aberto.'
        )
      );
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function toInput(pos: Location.LocationObject): ConfirmActivityInput {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracyMeters: pos.coords.accuracy ?? 0,
  };
}

/**
 * Obtém coordenadas para o check-in de atividade.
 *
 * Fluxo robusto: GPS ligado? → permissão (com saída para Ajustes se bloqueada)
 * → posição atual com timeout → fallback última posição conhecida.
 */
export async function getCheckinCoords(
  timeoutMs: number = CHECKIN_LOCATION_TIMEOUT_MS
): Promise<ConfirmActivityInput> {
  const servicesOn = await Location.hasServicesEnabledAsync();
  if (!servicesOn) {
    throw new CheckinLocationError(
      'SERVICES_OFF',
      'O GPS está desligado. Ative a localização do aparelho para concluir a atividade.'
    );
  }

  const perm = await Location.requestForegroundPermissionsAsync();
  if (perm.status !== 'granted') {
    if (!perm.canAskAgain) {
      throw new CheckinLocationError(
        'PERMISSION_BLOCKED',
        'A permissão de localização foi bloqueada. Abra os Ajustes do aparelho para permitir.'
      );
    }
    throw new CheckinLocationError(
      'PERMISSION_DENIED',
      'Permita o acesso à localização para concluir a atividade (check-in com coordenadas).'
    );
  }

  try {
    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      timeoutMs
    );
    return toInput(position);
  } catch {
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      return toInput(lastKnown);
    }
    throw new CheckinLocationError(
      'UNAVAILABLE',
      'Não foi possível obter a localização. Ative o GPS e tente em local aberto.'
    );
  }
}
