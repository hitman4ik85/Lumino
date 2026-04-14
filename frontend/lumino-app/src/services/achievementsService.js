import { apiClient } from "./apiClient.js";
import { readUserScopedRequestCache, removeUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const ACHIEVEMENTS_CACHE_NAMESPACE = "achievements-mine";

export function clearAchievementsCache() {
  removeUserScopedRequestCache(ACHIEVEMENTS_CACHE_NAMESPACE);
}

export const achievementsService = {
  async getMine(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(ACHIEVEMENTS_CACHE_NAMESPACE);

    if (Array.isArray(cached)) {
      return { ok: true, status: 200, data: cached, source: "cache" };
    }

    const res = await apiClient.get("/achievements/me");

    if (res.ok && Array.isArray(res.data)) {
      writeUserScopedRequestCache(ACHIEVEMENTS_CACHE_NAMESPACE, "", res.data);
    }

    return res;
  },
};
