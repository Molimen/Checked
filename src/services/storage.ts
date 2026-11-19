import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV();

// let's keep track the thing stored
// on storage:
// - tenant_name
// - tenant_code
// - dark_mode
// - force_old_login

const ONE_DAY = 24 * 60 * 60 * 1000;

export function setCache(key: string, data: unknown): void {
  const cache = {
    data,
    expiresAt: Date.now() + ONE_DAY,
  };

  storage.set(key, JSON.stringify(cache));
}

export function getCache<T>(key: string): T | null {
  const stored = storage.getString(key);

  if (!stored) return null;

  try {
    const cache = JSON.parse(stored);

    if (Date.now() >= cache.expiresAt) {
      storage.remove(key);
      return null;
    }

    return cache.data as T;
  } catch {
    storage.remove(key);
    return null;
  }
}

export function getExpiredCache(key: string): number | null {
  const stored = storage.getString(key);

  if (!stored) return null;

  try {
    const cache = JSON.parse(stored);

    if (Date.now() >= cache.expiresAt) {
      storage.remove(key);
      return null;
    }

    return cache.expiresAt;
  } catch {
    storage.remove(key);
    return null;
  }
}

export function removeCache(key: string): void {
  storage.remove(key);
}