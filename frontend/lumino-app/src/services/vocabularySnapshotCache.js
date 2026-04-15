import { authStorage } from "./authStorage.js";
import { vocabularyService } from "./vocabularyService.js";
import { readPersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";

const VOCABULARY_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const VOCABULARY_DUE_SYNC_BUFFER_MS = 1000;

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

  return normalizeVocabularyCacheSnapshot(value?.items, value?.dueItems);
}

export function writeVocabularyCache(items, dueItems) {
  const key = getVocabularyCacheKey();

  if (!key) {
    return;
  }

  writePersistentUserCache(key, normalizeVocabularyCacheSnapshot(items, dueItems));
}

export function clearVocabularySnapshotCache() {
  const key = getVocabularyCacheKey();

  if (!key) {
    return;
  }

  writePersistentUserCache(key, null);
}

function getVocabularyReviewAt(item) {
  return item?.nextReviewAt || item?.NextReviewAt || "";
}

function getVocabularyReviewTimestamp(item) {
  const reviewAt = getVocabularyReviewAt(item);

  if (!reviewAt) {
    return Number.NaN;
  }

  return new Date(reviewAt).getTime();
}

function getVocabularyDueItemKey(item) {
  const id = item?.id || item?.Id || item?.userVocabularyId || item?.UserVocabularyId || item?.vocabularyItemId || item?.VocabularyItemId;

  if (id != null && id !== "") {
    return String(id);
  }

  const word = String(item?.word || item?.Word || "").trim().toLowerCase();
  const reviewAt = getVocabularyReviewAt(item);

  if (word || reviewAt) {
    return `${word}:${reviewAt}`;
  }

  return "";
}

function isVocabularyItemDue(item, now = Date.now()) {
  const reviewTime = getVocabularyReviewTimestamp(item);

  if (Number.isNaN(reviewTime)) {
    return false;
  }

  return reviewTime <= now;
}

export function getDueItemsFromVocabulary(items, now = Date.now()) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.filter((item) => isVocabularyItemDue(item, now));
}

function mergeDueItems(items, dueItems) {
  const normalizedDueItems = [];
  const seen = new Set();

  [...(Array.isArray(dueItems) ? dueItems : []), ...getDueItemsFromVocabulary(items)].forEach((item) => {
    if (!item || !isVocabularyItemDue(item)) {
      return;
    }

    const itemKey = getVocabularyDueItemKey(item);

    if (!itemKey || seen.has(itemKey)) {
      return;
    }

    seen.add(itemKey);
    normalizedDueItems.push(item);
  });

  return normalizedDueItems;
}

export function getNextVocabularyDueAt(items, now = Date.now()) {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  let nextDueAt = null;

  items.forEach((item) => {
    const reviewTime = getVocabularyReviewTimestamp(item);

    if (Number.isNaN(reviewTime) || reviewTime <= now) {
      return;
    }

    if (nextDueAt == null || reviewTime < nextDueAt) {
      nextDueAt = reviewTime;
    }
  });

  return nextDueAt;
}

export function getVocabularyDueSyncDelay(items, now = Date.now()) {
  const nextDueAt = getNextVocabularyDueAt(items, now);

  if (nextDueAt == null) {
    return null;
  }

  return Math.max(nextDueAt - now + VOCABULARY_DUE_SYNC_BUFFER_MS, 0);
}

export function normalizeVocabularyCacheSnapshot(items, dueItems) {
  const normalizedItems = Array.isArray(items) ? items : [];

  return {
    items: normalizedItems,
    dueItems: mergeDueItems(normalizedItems, dueItems),
  };
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

  const normalizedSnapshot = normalizeVocabularyCacheSnapshot(
    Array.isArray(itemsRes.data) ? itemsRes.data : [],
    dueItemsRes.ok
      ? (Array.isArray(dueItemsRes.data) ? dueItemsRes.data : [])
      : []
  );

  writeVocabularyCache(normalizedSnapshot.items, normalizedSnapshot.dueItems);

  return {
    ok: true,
    status: itemsRes.status,
    data: normalizedSnapshot,
  };
}
