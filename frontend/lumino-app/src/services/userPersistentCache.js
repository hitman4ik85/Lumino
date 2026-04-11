const DEFAULT_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function parseCachePayload(raw) {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt || 0);

    if (!savedAt) {
      return null;
    }

    return {
      savedAt,
      data: parsed?.data ?? null,
    };
  } catch {
    return null;
  }
}

function getCachePayload(store, key, ttlMs) {
  if (!store || !key) {
    return null;
  }

  try {
    const parsed = parseCachePayload(store.getItem(key));

    if (!parsed) {
      store.removeItem(key);
      return null;
    }

    if (Date.now() - parsed.savedAt > ttlMs) {
      store.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeCachePayload(store, key, payload) {
  if (!store || !key || !payload) {
    return;
  }

  try {
    store.setItem(key, JSON.stringify(payload));
  } catch {
  }
}

export function readPersistentUserCache(key, options = {}) {
  if (!key || typeof window === "undefined") {
    return null;
  }

  const ttlMs = Number(options.ttlMs || DEFAULT_CACHE_TTL_MS);
  const sessionPayload = getCachePayload(window.sessionStorage, key, ttlMs);
  const localPayload = getCachePayload(window.localStorage, key, ttlMs);
  const payload = sessionPayload || localPayload;

  if (!payload) {
    return null;
  }

  if (!sessionPayload) {
    writeCachePayload(window.sessionStorage, key, payload);
  }

  if (!localPayload) {
    writeCachePayload(window.localStorage, key, payload);
  }

  return payload.data;
}

export function writePersistentUserCache(key, value) {
  if (!key || typeof window === "undefined") {
    return;
  }

  try {
    if (value == null) {
      window.sessionStorage.removeItem(key);
      window.localStorage.removeItem(key);
      return;
    }

    const payload = {
      savedAt: Date.now(),
      data: value,
    };

    writeCachePayload(window.sessionStorage, key, payload);
    writeCachePayload(window.localStorage, key, payload);
  } catch {
  }
}

export function removePersistentUserCache(key) {
  if (!key || typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.removeItem(key);
    window.localStorage.removeItem(key);
  } catch {
  }
}
