import { apiClient } from "./apiClient.js";
import { readUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const AVATARS_CACHE_NAMESPACE = "avatars-all";

export const avatarsService = {
  async getAll(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(AVATARS_CACHE_NAMESPACE);

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
      writeUserScopedRequestCache(AVATARS_CACHE_NAMESPACE, "", items);
    }

    return {
      ok: res.ok,
      status: res.status,
      items,
      error: res.error || "",
    };
  },
};
