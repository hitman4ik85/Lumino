const ACCESS_TOKEN_KEY = "lumino_access_token";
const REFRESH_TOKEN_KEY = "lumino_refresh_token";
const GUEST_PREVIEW_KEY = "lumino_guest_preview";

function getTokenStore() {
  return window.sessionStorage;
}

function clearLegacyPersistentTokens() {
  try {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
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

  setTokens(token, refreshToken) {
    const store = getTokenStore();

    if (token) {
      store.setItem(ACCESS_TOKEN_KEY, token);
    }

    if (refreshToken) {
      store.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    localStorage.removeItem(GUEST_PREVIEW_KEY);
    clearLegacyPersistentTokens();
  },

  clearTokens() {
    const store = getTokenStore();

    store.removeItem(ACCESS_TOKEN_KEY);
    store.removeItem(REFRESH_TOKEN_KEY);
    clearLegacyPersistentTokens();
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
    const payload = this.getTokenPayload();
    const userId = String(payload?.nameid || payload?.sub || payload?.userId || payload?.id || "").trim();

    if (userId) {
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
