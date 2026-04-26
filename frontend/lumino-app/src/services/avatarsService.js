import { apiClient } from "./apiClient.js";
import { getUserScopedRequestCacheOptions, readUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const AVATARS_CACHE_NAMESPACE = "avatars-all";

export const avatarsService = {
  async getAll(options = {}) {
    const cacheOptions = getUserScopedRequestCacheOptions();
    const cached = options.force ? null : readUserScopedRequestCache(AVATARS_CACHE_NAMESPACE, "", cacheOptions);

    if (Array.isArray(cached)) {
      return {
        ok: true,
        status: 200,
        items: cached,
        source: "cache",
        error: "",
      };
    }

    const res = await apiClient.get("/avatars");
    const items = res.ok ? (Array.isArray(res.data) ? res.data : []) : [];

    if (res.ok) {
      writeUserScopedRequestCache(AVATARS_CACHE_NAMESPACE, "", items, cacheOptions);
    }

    return {
      ok: res.ok,
      status: res.status,
      items,
      error: res.error || "",
    };
  },
};
