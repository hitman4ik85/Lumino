import { apiClient } from "./apiClient.js";
import { getUserScopedRequestCacheOptions, readUserScopedRequestCache, removeUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const MY_LANGUAGES_CACHE_NAMESPACE = "onboarding-my-languages";

function clearMyLanguagesCache() {
  removeUserScopedRequestCache(MY_LANGUAGES_CACHE_NAMESPACE);
}

const normalizeLanguagesPayload = (data, fallbackCode = "") => {
  const activeTargetLanguageCode = data?.activeTargetLanguageCode || data?.targetLanguageCode || fallbackCode;
  const learningLanguages = Array.isArray(data?.learningLanguages) ? data.learningLanguages : [];

  return {
    ok: true,
    activeTargetLanguageCode,
    learningLanguages,
    data,
  };
};

export const onboardingService = {
  async getSupportedLanguages() {
    const res = await apiClient.get("/onboarding/languages");

    return {
      ok: res.ok,
      status: res.status,
      items: res.ok ? (Array.isArray(res.data) ? res.data : []) : [],
      error: res.error || "",
    };
  },

  async getLanguageAvailability(languageCode) {
    if (!languageCode) return { ok: false };

    const code = String(languageCode).trim().toLowerCase();
    const res = await apiClient.get(`/onboarding/languages/${code}/availability`);

    if (!res.ok) {
      return { ok: false };
    }

    return {
      ok: true,
      languageCode: res.data?.languageCode || code,
      hasPublishedCourses: Boolean(res.data?.hasPublishedCourses),
    };
  },

  async getMyLanguages(options = {}) {
    const cacheOptions = getUserScopedRequestCacheOptions();
    const cached = options.force ? null : readUserScopedRequestCache(MY_LANGUAGES_CACHE_NAMESPACE, "", cacheOptions);

    if (cached && typeof cached === "object") {
      return {
        ...normalizeLanguagesPayload(cached, ""),
        source: "cache",
      };
    }

    const res = await apiClient.get("/onboarding/languages/me");

    if (!res.ok) {
      return { ok: false, data: null, error: res.error || "" };
    }

    writeUserScopedRequestCache(MY_LANGUAGES_CACHE_NAMESPACE, "", res.data, cacheOptions);

    return normalizeLanguagesPayload(res.data, "");
  },

  async updateMyLanguages(dto) {
    const res = await apiClient.put("/onboarding/languages/me", dto);

    if (res.ok) {
      clearMyLanguagesCache();
    }

    return {
      ok: res.ok,
      status: res.status,
      error: res.error || "",
    };
  },

  async updateMyTargetLanguage(targetLanguageCode) {
    if (!targetLanguageCode) {
      return { ok: false, error: "TargetLanguageCode is required" };
    }

    const code = String(targetLanguageCode).trim().toLowerCase();
    const res = await apiClient.put("/onboarding/target-language/me", { targetLanguageCode: code });

    if (res.ok) {
      clearMyLanguagesCache();
    }

    return {
      ok: res.ok,
      status: res.status,
      error: res.error || "",
    };
  },
  async removeMyLanguage(languageCode) {
    if (!languageCode) {
      return { ok: false, error: "LanguageCode is required" };
    }

    const code = String(languageCode).trim().toLowerCase();
    const res = await apiClient.del(`/onboarding/languages/me/${code}`);

    if (res.ok) {
      clearMyLanguagesCache();
    }

    return {
      ok: res.ok,
      status: res.status,
      error: res.error || "",
    };
  },

  async getDemoExercises(languageCode, level) {
    const params = new URLSearchParams();

    if (languageCode) {
      params.set("languageCode", String(languageCode).trim().toLowerCase());
    }

    if (level) {
      params.set("level", String(level).trim().toLowerCase());
    }

    const query = params.toString();
    const res = await apiClient.get(`/demo/next-pack${query ? `?${query}` : ""}`);

    return {
      ok: res.ok,
      status: res.status,
      items: res.ok ? (Array.isArray(res.data?.exercises) ? res.data.exercises : []) : [],
      lesson: res.ok ? (res.data?.lesson || null) : null,
      data: res.ok ? (res.data || null) : null,
      error: res.error || "",
    };
  },
};
