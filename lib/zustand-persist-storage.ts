import { createJSONStorage } from "zustand/middleware";

function createMemoryStorage(): Storage {
  const map: Record<string, string> = {};
  return {
    getItem: (k) => (k in map ? map[k] : null),
    setItem: (k, v) => {
      map[k] = v;
    },
    removeItem: (k) => {
      delete map[k];
    },
    clear: () => {
      for (const k of Object.keys(map)) delete map[k];
    },
    get length() {
      return Object.keys(map).length;
    },
    key: (i) => Object.keys(map)[i] ?? null,
  } as Storage;
}

let devMemorySingleton: Storage | null = null;

function getDevMemoryStorage(): Storage {
  if (!devMemorySingleton) devMemorySingleton = createMemoryStorage();
  return devMemorySingleton;
}

/**
 * In development, persist only in memory (per tab load) so localStorage is not
 * filled and state matches a fresh session after a full reload. Production
 * uses localStorage. Pairs with dev JWT invalidation when restarting `next dev`.
 */
export function getClientPersistStorage() {
  if (process.env.NODE_ENV === "development") {
    return createJSONStorage(getDevMemoryStorage);
  }
  return createJSONStorage(() => localStorage);
}
