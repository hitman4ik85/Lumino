import { authStorage } from "./authStorage.js";
import { lessonsService } from "./lessonsService.js";
import { lessonService } from "./lessonService.js";
import { readPersistentUserCache, removePersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";

const LESSON_PACK_MISTAKES_CACHE_TTL_MS = 10 * 60 * 1000;
const LESSON_PACK_PERSISTENT_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const pendingLessonPackRequests = new Map();

function normalizeLessonPackMode(mode) {
  return String(mode || "default").trim().toLowerCase() === "mistakes" ? "mistakes" : "default";
}

function getLessonPackCacheKey(lessonId, mode = "default") {
  const userKey = authStorage.getUserCacheKey();
  const normalizedLessonId = Number(lessonId || 0);
  const normalizedMode = normalizeLessonPackMode(mode);

  if (!userKey || !normalizedLessonId) {
    return "";
  }

  return `lumino-lesson-pack:${userKey}:${normalizedMode}:${normalizedLessonId}`;
}

function isMistakesLessonPackMode(mode) {
  return normalizeLessonPackMode(mode) === "mistakes";
}

function getLessonPackCacheTtlMs(mode) {
  return isMistakesLessonPackMode(mode)
    ? LESSON_PACK_MISTAKES_CACHE_TTL_MS
    : LESSON_PACK_PERSISTENT_CACHE_TTL_MS;
}

function normalizeLessonPack(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const lesson = value.lesson && typeof value.lesson === "object" ? value.lesson : null;
  const exercises = Array.isArray(value.exercises) ? value.exercises : [];

  if (!lesson || exercises.length === 0) {
    return null;
  }

  return {
    lesson,
    exercises,
  };
}

export function getCachedLessonPack(lessonId, options = {}) {
  const normalizedMode = normalizeLessonPackMode(options.mode);
  const key = getLessonPackCacheKey(lessonId, normalizedMode);

  if (!key || typeof window === "undefined") {
    return null;
  }

  return normalizeLessonPack(readPersistentUserCache(key, { ttlMs: getLessonPackCacheTtlMs(normalizedMode) }));
}

export function setCachedLessonPack(lessonId, options = {}, value) {
  const normalizedMode = normalizeLessonPackMode(options.mode);
  const key = getLessonPackCacheKey(lessonId, normalizedMode);
  const normalized = normalizeLessonPack(value);

  if (!key || typeof window === "undefined") {
    return;
  }

  if (!normalized) {
    removePersistentUserCache(key);
    return;
  }

  writePersistentUserCache(key, normalized);
}

export function clearCachedLessonPack(lessonId, options = {}) {
  const key = getLessonPackCacheKey(lessonId, options.mode);

  if (!key || typeof window === "undefined") {
    return;
  }

  removePersistentUserCache(key);
}

export async function preloadLessonPack(lessonId, options = {}) {
  const normalizedLessonId = Number(lessonId || 0);
  const normalizedMode = normalizeLessonPackMode(options.mode);
  const cached = options.force ? null : getCachedLessonPack(normalizedLessonId, { mode: normalizedMode });

  if (cached) {
    return {
      ok: true,
      data: cached,
      source: "cache",
    };
  }

  const requestKey = getLessonPackCacheKey(normalizedLessonId, normalizedMode) || `${normalizedMode}:${normalizedLessonId}`;
  const existingRequest = pendingLessonPackRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    if (!normalizedLessonId) {
      return {
        ok: false,
        error: "Не вдалося завантажити урок",
      };
    }

    const lessonRequest = lessonsService.getById(normalizedLessonId);
    const exercisesRequest = normalizedMode === "mistakes"
      ? lessonService.getMistakes(normalizedLessonId)
      : lessonsService.getExercises(normalizedLessonId);

    const [lessonRes, exercisesRes] = await Promise.all([lessonRequest, exercisesRequest]);

    if (!lessonRes?.ok) {
      return {
        ok: false,
        status: lessonRes?.status,
        error: lessonRes?.error || "Не вдалося завантажити урок",
      };
    }

    if (!exercisesRes?.ok) {
      return {
        ok: false,
        status: exercisesRes?.status,
        error: exercisesRes?.error || "Не вдалося завантажити урок",
      };
    }

    const exercises = normalizedMode === "mistakes"
      ? (Array.isArray(exercisesRes.data?.exercises) ? exercisesRes.data.exercises : [])
      : (Array.isArray(exercisesRes.data) ? exercisesRes.data : []);

    const data = {
      lesson: lessonRes.data || null,
      exercises,
    };

    if (data.lesson && data.exercises.length > 0) {
      setCachedLessonPack(normalizedLessonId, { mode: normalizedMode }, data);
    }

    return {
      ok: true,
      data,
      source: "network",
    };
  })().finally(() => {
    pendingLessonPackRequests.delete(requestKey);
  });

  pendingLessonPackRequests.set(requestKey, request);
  return request;
}
