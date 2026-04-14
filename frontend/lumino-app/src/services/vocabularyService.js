import { apiClient } from "./apiClient.js";
import { readUserScopedRequestCache, removeUserScopedRequestCache, writeUserScopedRequestCache } from "./userScopedRequestCache.js";

const VOCABULARY_ITEMS_CACHE_NAMESPACE = "vocabulary-items";
const VOCABULARY_DUE_CACHE_NAMESPACE = "vocabulary-due";
const VOCABULARY_ITEM_DETAILS_CACHE_NAMESPACE = "vocabulary-item-details";

export function clearVocabularyItemsCache() {
  removeUserScopedRequestCache(VOCABULARY_ITEMS_CACHE_NAMESPACE);
  removeUserScopedRequestCache(VOCABULARY_DUE_CACHE_NAMESPACE);
}

export function clearVocabularyItemDetailsCache(id) {
  if (!id) {
    return;
  }

  removeUserScopedRequestCache(VOCABULARY_ITEM_DETAILS_CACHE_NAMESPACE, String(id));
}

function cacheVocabularyItems(items) {
  writeUserScopedRequestCache(VOCABULARY_ITEMS_CACHE_NAMESPACE, "", Array.isArray(items) ? items : []);
}

function cacheDueVocabulary(items) {
  writeUserScopedRequestCache(VOCABULARY_DUE_CACHE_NAMESPACE, "", Array.isArray(items) ? items : []);
}

export const vocabularyService = {
  async getMyVocabulary(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(VOCABULARY_ITEMS_CACHE_NAMESPACE);

    if (Array.isArray(cached)) {
      return { ok: true, status: 200, data: cached, source: "cache" };
    }

    const res = await apiClient.get("/vocabulary/me");

    if (res.ok) {
      cacheVocabularyItems(Array.isArray(res.data) ? res.data : []);
    }

    return res;
  },

  async getDueVocabulary(options = {}) {
    const cached = options.force ? null : readUserScopedRequestCache(VOCABULARY_DUE_CACHE_NAMESPACE);

    if (Array.isArray(cached)) {
      return { ok: true, status: 200, data: cached, source: "cache" };
    }

    const res = await apiClient.get("/vocabulary/due");

    if (res.ok) {
      cacheDueVocabulary(Array.isArray(res.data) ? res.data : []);
    }

    return res;
  },

  getNextReview() {
    return apiClient.get("/vocabulary/review/next");
  },

  async getItemDetails(id, options = {}) {
    const cacheKey = String(id || "").trim();
    const cached = options.force || !cacheKey ? null : readUserScopedRequestCache(VOCABULARY_ITEM_DETAILS_CACHE_NAMESPACE, cacheKey);

    if (cached && typeof cached === "object") {
      return { ok: true, status: 200, data: cached, source: "cache" };
    }

    const res = await apiClient.get(`/vocabulary/items/${id}`);

    if (res.ok && res.data && cacheKey) {
      writeUserScopedRequestCache(VOCABULARY_ITEM_DETAILS_CACHE_NAMESPACE, cacheKey, res.data);
    }

    return res;
  },

  lookupWord(word) {
    return apiClient.get(`/vocabulary/lookup?word=${encodeURIComponent(word || "")}`);
  },

  async addWord(payload) {
    const res = await apiClient.post("/vocabulary", payload);

    if (res.ok) {
      clearVocabularyItemsCache();
    }

    return res;
  },

  async updateWord(id, payload) {
    const res = await apiClient.put(`/vocabulary/${id}`, payload);

    if (res.ok) {
      clearVocabularyItemsCache();
      clearVocabularyItemDetailsCache(id);
    }

    return res;
  },

  async reviewWord(id, payload) {
    const res = await apiClient.post(`/vocabulary/${id}/review`, payload);

    if (res.ok) {
      clearVocabularyItemsCache();
      clearVocabularyItemDetailsCache(id);
    }

    return res;
  },

  async scheduleWord(id, payload) {
    const res = await apiClient.post(`/vocabulary/${id}/schedule`, payload);

    if (res.ok) {
      clearVocabularyItemsCache();
      clearVocabularyItemDetailsCache(id);
    }

    return res;
  },

  async deleteWord(id) {
    const res = await apiClient.del(`/vocabulary/${id}`);

    if (res.ok) {
      clearVocabularyItemsCache();
      clearVocabularyItemDetailsCache(id);
    }

    return res;
  },
};
