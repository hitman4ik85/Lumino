const ACCESS_TOKEN_KEY = "lumino_access_token";
const REFRESH_TOKEN_KEY = "lumino_refresh_token";
const GUEST_PREVIEW_KEY = "lumino_guest_preview";

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

export const authStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  },

  setTokens(token, refreshToken) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    localStorage.removeItem(GUEST_PREVIEW_KEY);
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthed() {
    return this.getAccessToken().trim().length > 0;
  },

  getUserCacheKey() {
    const payload = parseJwtPayload(this.getAccessToken());
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
