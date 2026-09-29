import Constants from 'expo-constants';

export const ENV = {
  API_BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    'http://localhost:3000',
  API_TIMEOUT_MS: 15000,
  MAX_RETRIES: 3,
};

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'larvifort_auth_token',
  AUTH_USER: 'larvifort_auth_user',
  OUTBOX_QUEUE: 'larvifort_outbox_queue',
  LOCAL_TASKS: 'larvifort_local_tasks',
  LOCAL_PROJECTS: 'larvifort_local_projects',
  LAST_SYNC: 'larvifort_last_sync',
  CHECKINS: 'larvifort_checkins',
} as const;
