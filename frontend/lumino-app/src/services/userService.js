import { apiClient } from "./apiClient.js";
import { readUserScopedRequestCache, removeUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const USER_ME_CACHE_NAMESPACE = "user-me";
const USER_EXTERNAL_LOGINS_CACHE_NAMESPACE = "user-external-logins";

export function clearUserSummaryCache() {
  removeUserScopedRequestCache(USER_ME_CACHE_NAMESPACE);
}

export function clearUserExternalLoginsCache() {
  removeUserScopedRequestCache(USER_EXTERNAL_LOGINS_CACHE_NAMESPACE);
}

export const userService = {
  async getMe(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(USER_ME_CACHE_NAMESPACE);

    if (cached) {
      return { ok: true, status: 200, data: cached, source: "cache" };
    }

    const res = await apiClient.get("/user/me");

    if (res.ok && res.data) {
      writeUserScopedRequestCache(USER_ME_CACHE_NAMESPACE, "", res.data);
    }

    return res;
  },

  async updateProfile(dto) {
    const res = await apiClient.put("/user/profile", dto);

    if (res.ok && res.data) {
      writeUserScopedRequestCache(USER_ME_CACHE_NAMESPACE, "", res.data);
    } else {
      clearUserSummaryCache();
    }

    return res;
  },

  changePassword(dto) {
    return apiClient.post("/user/change-password", dto);
  },

  async deleteAccount(dto) {
    const res = await apiClient.post("/user/delete-account", dto);

    if (res.ok) {
      clearUserSummaryCache();
      clearUserExternalLoginsCache();
    }

    return res;
  },

  async getExternalLogins(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(USER_EXTERNAL_LOGINS_CACHE_NAMESPACE);

    if (cached) {
      return { ok: true, status: 200, data: cached, source: "cache" };
    }

    const res = await apiClient.get("/user/external-logins");

    if (res.ok && Array.isArray(res.data)) {
      writeUserScopedRequestCache(USER_EXTERNAL_LOGINS_CACHE_NAMESPACE, "", res.data);
    }

    return res;
  },

  async restoreHearts(heartsToRestore = 5) {
    const res = await apiClient.post("/user/restore-hearts", { heartsToRestore });

    if (res.ok) {
      clearUserSummaryCache();
    }

    return res;
  },

  async consumeMistakesHearts(mistakesCount = 0) {
    const res = await apiClient.post("/user/consume-mistakes-hearts", { mistakesCount });

    if (res.ok) {
      clearUserSummaryCache();
    }

    return res;
  },
};
