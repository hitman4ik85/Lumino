import { authStorage } from "./authStorage.js";
import { readPersistentUserCache, removePersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";

const REQUEST_CACHE_TTL_MS = 5 * 60 * 1000;

function normalizeScope(options = {}) {
  const scope = String(options.scope || "user").trim().toLowerCase();

  if (scope === "public") {
    return "public";
  }

  const userCacheKey = String(options.userCacheKey || "").trim();

  if (userCacheKey) {
    return userCacheKey;
  }

  return authStorage.getUserCacheKey() || "";
}

function buildRequestCacheKey(namespace, suffix = "", options = {}) {
  const scope = normalizeScope(options);
  const normalizedNamespace = String(namespace || "").trim();
  const normalizedSuffix = String(suffix || "").trim();

  if (!scope || !normalizedNamespace) {
    return "";
  }

  return normalizedSuffix
    ? `lumino-request-cache:${scope}:${normalizedNamespace}:${normalizedSuffix}`
    : `lumino-request-cache:${scope}:${normalizedNamespace}`;
}

export function readUserScopedRequestCache(namespace, suffix = "", options = {}) {
  const key = buildRequestCacheKey(namespace, suffix, options);

  if (!key) {
    return null;
  }

  return readPersistentUserCache(key, { ttlMs: Number(options.ttlMs || REQUEST_CACHE_TTL_MS) });
}

export function writeUserScopedRequestCache(namespace, suffix = "", value, options = {}) {
  if (options.authSessionVersion != null && !authStorage.isSameAuthSessionVersion(options.authSessionVersion)) {
    return;
  }

  const key = buildRequestCacheKey(namespace, suffix, options);

  if (!key) {
    return;
  }

  writePersistentUserCache(key, value);
}

export function getUserScopedRequestCacheOptions() {
  return {
    userCacheKey: authStorage.getUserCacheKey(),
    authSessionVersion: authStorage.getAuthSessionVersion(),
  };
}

export function removeUserScopedRequestCache(namespace, suffix = "", options = {}) {
  const key = buildRequestCacheKey(namespace, suffix, options);

  if (!key) {
    return;
  }

  removePersistentUserCache(key);
}
