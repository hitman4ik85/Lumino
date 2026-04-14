import { authStorage } from "./authStorage.js";
import { vocabularyService } from "./vocabularyService.js";
import { readPersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";

const VOCABULARY_CACHE_TTL_MS = Number.POSITIVE_INFINITY;

function getVocabularyCacheKey() {
  const userKey = authStorage.getUserCacheKey();

  if (!userKey) {
    return "";
  }

  return `lumino-vocabulary-cache:${userKey}`;
}

export function readVocabularyCache() {
  const key = getVocabularyCacheKey();
  const value = readPersistentUserCache(key, { ttlMs: VOCABULARY_CACHE_TTL_MS });

  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    items: Array.isArray(value?.items) ? value.items : [],
    dueItems: Array.isArray(value?.dueItems) ? value.dueItems : [],
  };
}

export function writeVocabularyCache(items, dueItems) {
  const key = getVocabularyCacheKey();

  if (!key) {
    return;
  }

  writePersistentUserCache(key, {
    items: Array.isArray(items) ? items : [],
    dueItems: Array.isArray(dueItems) ? dueItems : [],
  });
}

export function clearVocabularySnapshotCache() {
  const key = getVocabularyCacheKey();

  if (!key) {
    return;
  }

  writePersistentUserCache(key, null);
}

function getDueItemsFromVocabulary(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const now = Date.now();

  return items.filter((item) => {
    const nextReviewAt = item?.nextReviewAt || item?.NextReviewAt;

    if (!nextReviewAt) {
      return false;
    }

    const dateValue = new Date(nextReviewAt).getTime();

    if (Number.isNaN(dateValue)) {
      return false;
    }

    return dateValue <= now;
  });
}

export async function preloadVocabularyCache() {
  const [itemsRes, dueItemsRes] = await Promise.all([
    vocabularyService.getMyVocabulary(),
    typeof vocabularyService.getDueVocabulary === "function"
      ? vocabularyService.getDueVocabulary()
      : Promise.resolve({ ok: false, data: [] }),
  ]);

  if (!itemsRes.ok) {
    return {
      ok: false,
      status: itemsRes.status,
      error: itemsRes.error || "Не вдалося завантажити словник",
    };
  }

  const items = Array.isArray(itemsRes.data) ? itemsRes.data : [];
  const dueItems = dueItemsRes.ok
    ? (Array.isArray(dueItemsRes.data) ? dueItemsRes.data : [])
    : getDueItemsFromVocabulary(items);

  writeVocabularyCache(items, dueItems);

  return {
    ok: true,
    status: itemsRes.status,
    data: {
      items,
      dueItems,
    },
  };
}
