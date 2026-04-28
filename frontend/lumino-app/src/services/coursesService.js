import { apiClient } from "./apiClient.js";
import { getUserScopedRequestCacheOptions, readUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const MY_COURSES_CACHE_NAMESPACE = "courses-me";

function normalizeItems(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
}

function normalizeLanguageCode(languageCode) {
  return String(languageCode || "").trim().toLowerCase();
}

export const coursesService = {
  async getPublishedCourses(languageCode) {
    const query = languageCode ? `?languageCode=${encodeURIComponent(languageCode)}` : "";
    const res = await apiClient.get(`/courses${query}`);

    return {
      ok: res.ok,
      status: res.status,
      items: res.ok ? normalizeItems(res.data) : [],
      error: res.error || "",
    };
  },

  async getMyCourses(languageCode, options = {}) {
    const cacheOptions = getUserScopedRequestCacheOptions();
    const suffix = normalizeLanguageCode(languageCode);
    const cached = options.force ? null : readUserScopedRequestCache(MY_COURSES_CACHE_NAMESPACE, suffix, cacheOptions);

    if (Array.isArray(cached)) {
      return {
        ok: true,
        status: 200,
        items: cached,
        error: "",
        source: "cache",
      };
    }

    const query = languageCode ? `?languageCode=${encodeURIComponent(languageCode)}` : "";
    const res = await apiClient.get(`/courses/me${query}`);
    const items = res.ok ? normalizeItems(res.data) : [];

    if (res.ok) {
      writeUserScopedRequestCache(MY_COURSES_CACHE_NAMESPACE, suffix, items, cacheOptions);
    }

    return {
      ok: res.ok,
      status: res.status,
      items,
      error: res.error || "",
    };
  },
};
