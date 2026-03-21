import { authStorage } from "./authStorage.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const AUTH_REFRESH_PATH = "/auth/refresh";

let refreshPromise = null;

const buildUrl = (path) => {
  if (!path) return BASE_URL;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/") && BASE_URL === "/api") return path;
  if (path.startsWith("/")) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch {
    return null;
  }
};

const shouldClearTokens = (res, data, error) => {
  if (res.status === 401) {
    return true;
  }

  if (res.status !== 404) {
    return false;
  }

  const type = String(data?.type || "").trim().toLowerCase();
  const detail = String(data?.detail || error || "").trim().toLowerCase();

  return type === "not_found" && detail === "user not found";
};

const parseJwtPayload = (token) => {
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
};

const isTokenExpired = (token, bufferSeconds = 20) => {
  if (!token) {
    return true;
  }

  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp || 0);

  if (!exp) {
    return false;
  }

  return exp * 1000 <= Date.now() + bufferSeconds * 1000;
};

const isRefreshRequest = (path) => path === AUTH_REFRESH_PATH || path.endsWith(AUTH_REFRESH_PATH);

const shouldTryRefresh = (path) => {
  if (!path) {
    return false;
  }

  if (isRefreshRequest(path)) {
    return false;
  }

  return !path.startsWith("/auth/");
};

const refreshTokens = async () => {
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    authStorage.clearTokens();
    return false;
  }

  const res = await fetch(buildUrl(AUTH_REFRESH_PATH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await safeJson(res);

  if (!res.ok) {
    authStorage.clearTokens();
    return false;
  }

  const nextAccessToken = data?.token || "";
  const nextRefreshToken = data?.refreshToken || "";

  if (!nextAccessToken || !nextRefreshToken) {
    authStorage.clearTokens();
    return false;
  }

  authStorage.setTokens(nextAccessToken, nextRefreshToken);
  return true;
};

const ensureFreshAccessToken = async (path) => {
  if (!shouldTryRefresh(path)) {
    return authStorage.getAccessToken();
  }

  const accessToken = authStorage.getAccessToken();
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken || !isTokenExpired(accessToken)) {
    return accessToken;
  }

  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }

  const refreshed = await refreshPromise;

  if (!refreshed) {
    return "";
  }

  return authStorage.getAccessToken();
};

export const apiClient = {
  async request(path, options = {}) {
    const url = buildUrl(path);
    const accessToken = await ensureFreshAccessToken(path);

    const headers = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    };

    let res = await fetch(url, {
      ...options,
      headers,
    });

    let data = await safeJson(res);

    if (res.status === 401 && shouldTryRefresh(path)) {
      if (!refreshPromise) {
        refreshPromise = refreshTokens().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;

      if (refreshed) {
        const retryAccessToken = authStorage.getAccessToken();
        const retryHeaders = {
          ...headers,
          ...(retryAccessToken ? { Authorization: `Bearer ${retryAccessToken}` } : {}),
        };

        res = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

        data = await safeJson(res);
      }
    }

    if (res.ok) {
      return { ok: true, status: res.status, data };
    }

    const error =
      (data && (data.detail || data.message || data.error || data.title)) ||
      `HTTP ${res.status}`;

    return { ok: false, status: res.status, data, error, shouldClearTokens: shouldClearTokens(res, data, error) };
  },

  get(path, options = {}) {
    return this.request(path, { ...options, method: "GET" });
  },

  post(path, body, options = {}) {
    return this.request(path, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put(path, body, options = {}) {
    return this.request(path, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  del(path, options = {}) {
    return this.request(path, { ...options, method: "DELETE" });
  },
};
