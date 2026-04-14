import { apiClient } from "./apiClient.js";
import { readUserScopedRequestCache, removeUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const WEEKLY_PROGRESS_CACHE_NAMESPACE = "profile-weekly-progress";

export function clearWeeklyProgressCache() {
  removeUserScopedRequestCache(WEEKLY_PROGRESS_CACHE_NAMESPACE);
}

export const profileService = {
  async getWeeklyProgress(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(WEEKLY_PROGRESS_CACHE_NAMESPACE);

    if (cached && typeof cached === "object") {
      return {
        ok: true,
        status: 200,
        data: cached,
        source: "cache",
      };
    }

    const res = await apiClient.get("/profile/weekly-progress");
    const normalized = res.ok ? (res.data || null) : null;

    if (res.ok && normalized) {
      writeUserScopedRequestCache(WEEKLY_PROGRESS_CACHE_NAMESPACE, "", normalized);
    }

    return {
      ok: res.ok,
      status: res.status,
      data: normalized,
      error: res.error || "",
    };
  },
};
