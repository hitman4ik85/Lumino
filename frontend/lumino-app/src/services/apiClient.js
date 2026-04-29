import { authStorage } from "./authStorage.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_API_TIMEOUT_MS = 30000;
const API_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || DEFAULT_API_TIMEOUT_MS);
const AUTH_REFRESH_PATH = "/auth/refresh";

let refreshPromise = null;
let refreshPromiseSessionVersion = null;

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

const getRequestTimeoutMs = (options = {}) => {
  const value = Number(options.timeoutMs || API_TIMEOUT_MS);

  if (!Number.isFinite(value) || value <= 0) {
    return DEFAULT_API_TIMEOUT_MS;
  }

  return value;
};

const createTimeoutSignal = (options = {}) => {
  const controller = new AbortController();
  const timeoutMs = getRequestTimeoutMs(options);
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let abortHandler = null;

  if (options.signal) {
    abortHandler = () => {
      controller.abort();
    };

    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener("abort", abortHandler, { once: true });
    }
  }

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timeoutId);

      if (options.signal && abortHandler) {
        options.signal.removeEventListener("abort", abortHandler);
      }
    },
  };
};

const fetchWithTimeout = async (url, options = {}) => {
  const { timeoutMs, signal, ...fetchOptions } = options;
  const timeoutSignal = createTimeoutSignal({ timeoutMs, signal });

  try {
    return await fetch(url, {
      ...fetchOptions,
      signal: timeoutSignal.signal,
    });
  } finally {
    timeoutSignal.clear();
  }
};

const getConnectionErrorResponse = (error) => {
  const isTimeout = error?.name === "AbortError";
  const type = isTimeout ? "request_timeout" : "network_error";
  const message = isTimeout
    ? "Сервер не відповідає занадто довго. Спробуйте ще раз через кілька секунд."
    : "Не вдалося з'єднатися із сервером. Перевірте інтернет або спробуйте ще раз.";

  return {
    ok: false,
    status: 0,
    data: {
      type,
      detail: message,
    },
    error: message,
    shouldClearTokens: false,
    shouldClearUserScopedCaches: false,
  };
};

const isUserNotFoundResponse = (res, data, error) => {
  const type = String(data?.type || "").trim().toLowerCase();
  const detail = String(data?.detail || error || "").trim().toLowerCase();

  if (detail !== "user not found") {
    return false;
  }

  return res.status === 404 || res.status === 401 || type === "not_found";
};

const shouldClearTokens = (res, data, error) => {
  if (res.status === 401) {
    return true;
  }

  return isUserNotFoundResponse(res, data, error);
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

const isSameAuthSession = (authSessionVersion) => authStorage.isSameAuthSessionVersion(authSessionVersion);

const refreshTokens = async () => {
  const requestAuthSessionVersion = authStorage.getAuthSessionVersion();
  const refreshToken = authStorage.getRefreshToken();

  if (!refreshToken) {
    if (isSameAuthSession(requestAuthSessionVersion)) {
      authStorage.clearTokens();
    }

    return false;
  }

  const res = await fetchWithTimeout(buildUrl(AUTH_REFRESH_PATH), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const data = await safeJson(res);

  if (!isSameAuthSession(requestAuthSessionVersion) || authStorage.getRefreshToken() !== refreshToken) {
    return false;
  }

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

  const currentAuthSessionVersion = authStorage.getAuthSessionVersion();

  if (!refreshPromise || refreshPromiseSessionVersion !== currentAuthSessionVersion) {
    refreshPromiseSessionVersion = currentAuthSessionVersion;
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
      refreshPromiseSessionVersion = null;
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
    const requestAuthSessionVersion = authStorage.getAuthSessionVersion();
    let accessToken = "";

    try {
      accessToken = await ensureFreshAccessToken(path);
    } catch (error) {
      return getConnectionErrorResponse(error);
    }

    const headers = {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    };

    let res = null;

    try {
      res = await fetchWithTimeout(url, {
        ...options,
        headers,
      });
    } catch (error) {
      return getConnectionErrorResponse(error);
    }

    let data = await safeJson(res);

    if (res.status === 401 && shouldTryRefresh(path) && isSameAuthSession(requestAuthSessionVersion)) {
      const currentAuthSessionVersion = authStorage.getAuthSessionVersion();

      if (!refreshPromise || refreshPromiseSessionVersion !== currentAuthSessionVersion) {
        refreshPromiseSessionVersion = currentAuthSessionVersion;
        refreshPromise = refreshTokens().finally(() => {
          refreshPromise = null;
          refreshPromiseSessionVersion = null;
        });
      }

      const refreshed = await refreshPromise;

      if (refreshed && isSameAuthSession(requestAuthSessionVersion)) {
        const retryAccessToken = authStorage.getAccessToken();
        const retryHeaders = {
          ...headers,
          ...(retryAccessToken ? { Authorization: `Bearer ${retryAccessToken}` } : {}),
        };

        try {
          res = await fetchWithTimeout(url, {
            ...options,
            headers: retryHeaders,
          });
        } catch (error) {
          return getConnectionErrorResponse(error);
        }

        data = await safeJson(res);
      }
    }

    if (res.ok) {
      return { ok: true, status: res.status, data };
    }

    const error =
      (data && (data.detail || data.message || data.error || data.title)) ||
      `HTTP ${res.status}`;
    const mustClearTokens = shouldClearTokens(res, data, error);
    const shouldClearUserScopedCaches = isUserNotFoundResponse(res, data, error);
    const canClearTokens = mustClearTokens && isSameAuthSession(requestAuthSessionVersion);
    const canClearUserScopedCaches = canClearTokens && shouldClearUserScopedCaches;

    if (canClearTokens) {
      authStorage.clearTokens({ clearUserScopedCaches: canClearUserScopedCaches });
    }

    return {
      ok: false,
      status: res.status,
      data,
      error,
      shouldClearTokens: canClearTokens,
      shouldClearUserScopedCaches: canClearUserScopedCaches,
    };
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
