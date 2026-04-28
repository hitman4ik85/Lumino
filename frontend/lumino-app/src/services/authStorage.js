const ACCESS_TOKEN_KEY = "lumino_access_token";
const REFRESH_TOKEN_KEY = "lumino_refresh_token";
const GUEST_PREVIEW_KEY = "lumino_guest_preview";
const USER_CACHE_NAMESPACE_MAP_KEY = "lumino_user_cache_namespaces";
let authSessionVersion = 0;
const USER_CACHE_KEY_PREFIXES = [
  "lumino-home-cache:",
  "lumino-profile-cache:",
  "lumino-vocabulary-cache:",
  "lumino-achievements-cache:",
  "lumino-request-cache:",
  "lumino-course-path:",
  "lumino-scenes-overview:",
  "lumino-supported-languages:",
  "lumino-calendar-month:",
  "lumino-lesson-pack:",
  "lumino-scene-pack:",
  "lumino-admin-boot-cache:",
  "lumino-admin-service-cache:",
];

function getTokenStore() {
  return window.sessionStorage;
}

function bumpAuthSessionVersion() {
  authSessionVersion += 1;
}

function clearLegacyPersistentTokens() {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

function clearStoreByPrefixes(store, prefixes) {
  if (!store || !Array.isArray(prefixes) || prefixes.length === 0) {
    return;
  }

  try {
    const keysToRemove = [];

    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);

      if (!key) {
        continue;
      }

      if (prefixes.some((prefix) => key.startsWith(prefix))) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      store.removeItem(key);
    });
  } catch {
    // ignore storage errors
  }
}

function buildUserCacheKeyCandidates(userCacheKey, userId) {
  const candidates = [];
  const pushCandidate = (value) => {
    const normalized = String(value || "").trim();

    if (!normalized || candidates.includes(normalized)) {
      return;
    }

    candidates.push(normalized);
  };

  pushCandidate(userCacheKey);

  const normalizedUserId = String(userId || "").trim();

  if (normalizedUserId) {
    pushCandidate(`user:${normalizedUserId}`);
  }

  const userCacheKeyMatch = String(userCacheKey || "").trim().match(/^user:([^:]+)/);

  if (userCacheKeyMatch?.[1]) {
    pushCandidate(`user:${userCacheKeyMatch[1]}`);
  }

  return candidates;
}

function clearStoreByUserCacheKeys(store, userCacheKeys) {
  if (!store || !Array.isArray(userCacheKeys) || userCacheKeys.length === 0) {
    return;
  }

  try {
    const keysToRemove = [];

    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);

      if (!key) {
        continue;
      }

      const prefix = USER_CACHE_KEY_PREFIXES.find((item) => key.startsWith(item));

      if (!prefix) {
        continue;
      }

      const remainder = key.slice(prefix.length);
      const shouldRemove = userCacheKeys.some((userCacheKey) => remainder === userCacheKey || remainder.startsWith(`${userCacheKey}:`));

      if (shouldRemove) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => {
      store.removeItem(key);
    });
  } catch {
    // ignore storage errors
  }
}

function readNamespaceMapFromStore(store) {
  if (!store) {
    return {};
  }

  try {
    const raw = store.getItem(USER_CACHE_NAMESPACE_MAP_KEY);

    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed;
  } catch {
    return {};
  }
}

function readUserCacheNamespaceMap() {
  if (typeof window === "undefined") {
    return {};
  }

  return {
    ...readNamespaceMapFromStore(window.localStorage),
    ...readNamespaceMapFromStore(window.sessionStorage),
  };
}

function writeUserCacheNamespaceMap(value) {
  if (typeof window === "undefined") {
    return;
  }

  const nextValue = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const serialized = JSON.stringify(nextValue);

  try {
    window.localStorage.setItem(USER_CACHE_NAMESPACE_MAP_KEY, serialized);
  } catch {
    // ignore storage errors
  }

  try {
    window.sessionStorage.setItem(USER_CACHE_NAMESPACE_MAP_KEY, serialized);
  } catch {
    // ignore storage errors
  }
}

function readCachePayloadSavedAt(store, key) {
  if (!store || !key) {
    return 0;
  }

  try {
    const parsed = JSON.parse(store.getItem(key) || "");
    return Number(parsed?.savedAt || 0);
  } catch {
    return 0;
  }
}

function collectUserCacheNamespacesFromStore(store, userId, result) {
  if (!store || !userId || !result) {
    return;
  }

  const userKeyStart = `user:${userId}:`;

  try {
    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);

      if (!key) {
        continue;
      }

      const prefix = USER_CACHE_KEY_PREFIXES.find((item) => key.startsWith(item));

      if (!prefix) {
        continue;
      }

      const remainder = key.slice(prefix.length);

      if (!remainder.startsWith(userKeyStart)) {
        continue;
      }

      const namespace = remainder.slice(userKeyStart.length).split(":")[0];

      if (!namespace) {
        continue;
      }

      const savedAt = readCachePayloadSavedAt(store, key);
      const current = result.get(namespace) || 0;
      result.set(namespace, Math.max(current, savedAt));
    }
  } catch {
    // ignore storage errors
  }
}

function findExistingUserCacheNamespace(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId || typeof window === "undefined") {
    return "";
  }

  const namespaces = new Map();

  collectUserCacheNamespacesFromStore(window.sessionStorage, normalizedUserId, namespaces);
  collectUserCacheNamespacesFromStore(window.localStorage, normalizedUserId, namespaces);

  let bestNamespace = "";
  let bestSavedAt = -1;

  namespaces.forEach((savedAt, namespace) => {
    if (!bestNamespace || savedAt > bestSavedAt) {
      bestNamespace = namespace;
      bestSavedAt = savedAt;
    }
  });

  return bestNamespace;
}

function createUserCacheNamespace() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch {
    // ignore crypto errors
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
}

function migrateLegacyUserScopedCacheKeys(store, userId, namespace) {
  if (!store || !userId || !namespace) {
    return;
  }

  const legacyUserKey = `user:${userId}`;
  const nextUserKey = `user:${userId}:${namespace}`;

  try {
    const updates = [];

    for (let index = 0; index < store.length; index += 1) {
      const key = store.key(index);

      if (!key) {
        continue;
      }

      const prefix = USER_CACHE_KEY_PREFIXES.find((item) => key.startsWith(item));

      if (!prefix) {
        continue;
      }

      const remainder = key.slice(prefix.length);

      if (!remainder.startsWith(legacyUserKey) || remainder.startsWith(`${nextUserKey}`)) {
        continue;
      }

      const nextKey = `${prefix}${nextUserKey}${remainder.slice(legacyUserKey.length)}`;
      updates.push({ key, nextKey, value: store.getItem(key) });
    }

    updates.forEach(({ key, nextKey, value }) => {
      if (value == null || key === nextKey) {
        return;
      }

      store.setItem(nextKey, value);
      store.removeItem(key);
    });
  } catch {
    // ignore storage errors
  }
}

function ensureUserCacheNamespace(userId, options = {}) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId || typeof window === "undefined") {
    return "";
  }

  const shouldRotate = Boolean(options?.rotate);
  const namespaceMap = readUserCacheNamespaceMap();
  let namespace = String(namespaceMap[normalizedUserId] || "").trim();

  if (!shouldRotate) {
    const existingNamespace = findExistingUserCacheNamespace(normalizedUserId);

    if (existingNamespace && existingNamespace !== namespace) {
      namespace = existingNamespace;
    }
  }

  if (!namespace || shouldRotate) {
    namespace = createUserCacheNamespace();
  }

  if (namespaceMap[normalizedUserId] !== namespace) {
    namespaceMap[normalizedUserId] = namespace;
    writeUserCacheNamespaceMap(namespaceMap);
  }

  migrateLegacyUserScopedCacheKeys(window.sessionStorage, normalizedUserId, namespace);
  migrateLegacyUserScopedCacheKeys(window.localStorage, normalizedUserId, namespace);

  return namespace;
}

function clearUserCacheNamespace(userId) {
  const normalizedUserId = String(userId || "").trim();

  if (!normalizedUserId || typeof window === "undefined") {
    return;
  }

  const namespaceMap = readUserCacheNamespaceMap();

  if (!Object.prototype.hasOwnProperty.call(namespaceMap, normalizedUserId)) {
    return;
  }

  delete namespaceMap[normalizedUserId];
  writeUserCacheNamespaceMap(namespaceMap);
}

function clearUserScopedCaches(userCacheKey = "", userId = "") {
  if (typeof window === "undefined") {
    return;
  }

  const userCacheKeys = buildUserCacheKeyCandidates(userCacheKey, userId);

  if (userCacheKeys.length > 0) {
    clearStoreByUserCacheKeys(window.sessionStorage, userCacheKeys);
    clearStoreByUserCacheKeys(window.localStorage, userCacheKeys);
    return;
  }

  clearStoreByPrefixes(window.sessionStorage, USER_CACHE_KEY_PREFIXES);
  clearStoreByPrefixes(window.localStorage, USER_CACHE_KEY_PREFIXES);
}

function parseJwtPayload(token) {
  try {
    const parts = String(token || "").split(".");

    if (parts.length < 2) {
      return null;
    }

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const json = atob(normalized);

    return JSON.parse(json);
  } catch {
    return null;
  }
}

function toClaimArray(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  const normalized = String(value || "").trim();

  return normalized ? [normalized] : [];
}

function getRolesFromPayload(payload) {
  if (!payload) {
    return [];
  }

  return [
    ...toClaimArray(payload.role),
    ...toClaimArray(payload.roles),
    ...toClaimArray(payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]),
    ...toClaimArray(payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role"]),
  ];
}

function getRoleFromPayload(payload) {
  return getRolesFromPayload(payload)[0] || "";
}

function getRoleIdFromPayload(payload) {
  if (!payload) {
    return "";
  }

  const roleId =
    payload.roleId ||
    payload.RoleId ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/roleid"] ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/roleid"] ||
    "";

  return String(roleId || "").trim();
}

function getUserIdFromPayload(payload) {
  if (!payload) {
    return "";
  }

  const userId =
    payload.nameid ||
    payload.sub ||
    payload.userId ||
    payload.UserId ||
    payload.id ||
    payload.Id ||
    payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ||
    payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/primarysid"] ||
    "";

  return String(userId || "").trim();
}

clearLegacyPersistentTokens();

export const authStorage = {
  getAccessToken() {
    return getTokenStore().getItem(ACCESS_TOKEN_KEY) || "";
  },

  getRefreshToken() {
    return getTokenStore().getItem(REFRESH_TOKEN_KEY) || "";
  },

  setTokens(token, refreshToken, options = {}) {
    const store = getTokenStore();
    const shouldClearUserScopedCaches = Boolean(options?.clearUserScopedCaches);
    const shouldRotateUserCacheNamespace = Boolean(options?.rotateUserCacheNamespace);
    const previousUserId = getUserIdFromPayload(parseJwtPayload(store.getItem(ACCESS_TOKEN_KEY) || ""));
    const previousUserCacheKey = this.getUserCacheKey();

    if (shouldClearUserScopedCaches) {
      clearUserScopedCaches(previousUserCacheKey, previousUserId);
    }

    if (token) {
      store.setItem(ACCESS_TOKEN_KEY, token);
    }

    if (refreshToken) {
      store.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    const nextUserId = getUserIdFromPayload(parseJwtPayload(token));

    if (nextUserId) {
      ensureUserCacheNamespace(nextUserId, { rotate: shouldRotateUserCacheNamespace });
    }

    if (previousUserId !== nextUserId || shouldClearUserScopedCaches || shouldRotateUserCacheNamespace) {
      bumpAuthSessionVersion();
    }

    localStorage.removeItem(GUEST_PREVIEW_KEY);
    clearLegacyPersistentTokens();
  },

  clearTokens(options = {}) {
    const store = getTokenStore();
    const shouldClearUserScopedCaches = Boolean(options?.clearUserScopedCaches);
    const currentUserId = this.getUserId();
    const currentUserCacheKey = this.getUserCacheKey();
    const hadTokens = Boolean(store.getItem(ACCESS_TOKEN_KEY) || store.getItem(REFRESH_TOKEN_KEY));

    store.removeItem(ACCESS_TOKEN_KEY);
    store.removeItem(REFRESH_TOKEN_KEY);

    if (hadTokens || shouldClearUserScopedCaches) {
      bumpAuthSessionVersion();
    }

    if (shouldClearUserScopedCaches) {
      clearUserCacheNamespace(currentUserId);
      clearUserScopedCaches(currentUserCacheKey, currentUserId);
    }

    clearLegacyPersistentTokens();
  },

  clearUserScopedCaches() {
    clearUserScopedCaches(this.getUserCacheKey(), this.getUserId());
  },

  getAuthSessionVersion() {
    return authSessionVersion;
  },

  isSameAuthSessionVersion(version) {
    return Number(version) === authSessionVersion;
  },

  isSameUserCacheKey(userKey) {
    return String(userKey || "").trim() === this.getUserCacheKey();
  },

  enableGuestPreview() {
    this.clearTokens();
    localStorage.setItem(GUEST_PREVIEW_KEY, "true");
  },

  clearGuestPreview() {
    localStorage.removeItem(GUEST_PREVIEW_KEY);
  },

  isGuestPreview() {
    return localStorage.getItem(GUEST_PREVIEW_KEY) === "true";
  },

  isAuthed() {
    return this.getAccessToken().trim().length > 0;
  },

  getTokenPayload() {
    return parseJwtPayload(this.getAccessToken());
  },

  getUserRole() {
    return getRoleFromPayload(this.getTokenPayload());
  },

  getUserRoleId() {
    return getRoleIdFromPayload(this.getTokenPayload());
  },

  getUserId() {
    return getUserIdFromPayload(this.getTokenPayload());
  },

  isAdmin() {
    const roles = getRolesFromPayload(this.getTokenPayload()).map((item) => item.toLowerCase());
    const roleId = this.getUserRoleId();
    const role = this.getUserRole().toLowerCase();

    return roleId === "2" || role === "admin" || roles.includes("admin") || roles.includes("2");
  },

  isUser() {
    const roles = getRolesFromPayload(this.getTokenPayload()).map((item) => item.toLowerCase());
    const roleId = this.getUserRoleId();
    const role = this.getUserRole().toLowerCase();

    return roleId === "1" || role === "user" || roles.includes("user") || roles.includes("1");
  },

  getUserCacheKey() {
    const userId = this.getUserId();

    if (userId) {
      const namespace = ensureUserCacheNamespace(userId);

      if (namespace) {
        return `user:${userId}:${namespace}`;
      }

      return `user:${userId}`;
    }

    const refreshToken = this.getRefreshToken();

    if (refreshToken) {
      return `refresh:${refreshToken.slice(-24)}`;
    }

    const accessToken = this.getAccessToken();

    if (accessToken) {
      return `access:${accessToken.slice(-24)}`;
    }

    return "";
  },
};
