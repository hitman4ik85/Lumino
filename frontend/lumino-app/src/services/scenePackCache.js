import { authStorage } from "./authStorage.js";
import { scenesService } from "./scenesService.js";
import { readPersistentUserCache, removePersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";
import { warmMediaUrls } from "./mediaWarmup.js";

const SCENE_PACK_MISTAKES_CACHE_TTL_MS = 10 * 60 * 1000;
const SCENE_PACK_PERSISTENT_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const pendingScenePackRequests = new Map();

function normalizeScenePackMode(mode) {
  return String(mode || "default").trim().toLowerCase() === "mistakes" ? "mistakes" : "default";
}

function isMistakesScenePackMode(mode) {
  return normalizeScenePackMode(mode) === "mistakes";
}

function getScenePackCacheTtlMs(mode) {
  return isMistakesScenePackMode(mode)
    ? SCENE_PACK_MISTAKES_CACHE_TTL_MS
    : SCENE_PACK_PERSISTENT_CACHE_TTL_MS;
}

function getScenePackCacheKey(sceneId, mode = "default") {
  const userKey = authStorage.getUserCacheKey();
  const normalizedSceneId = Number(sceneId || 0);
  const normalizedMode = normalizeScenePackMode(mode);

  if (!userKey || !normalizedSceneId) {
    return "";
  }

  return `lumino-scene-pack:${userKey}:${normalizedMode}:${normalizedSceneId}`;
}

function normalizeScene(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const nextScene = { ...value };

  if ("steps" in nextScene) {
    delete nextScene.steps;
  }

  return nextScene;
}

function getScenePackMediaUrls(value) {
  if (!value || typeof value !== "object") {
    return [];
  }

  const items = [];

  const pushValue = (candidate) => {
    const src = String(candidate || "").trim();

    if (!src || items.includes(src)) {
      return;
    }

    items.push(src);
  };

  pushValue(value.scene?.backgroundUrl || value.scene?.BackgroundUrl || "");
  pushValue(value.scene?.previewUrl || value.scene?.PreviewUrl || "");
  pushValue(value.scene?.imageUrl || value.scene?.ImageUrl || "");

  (Array.isArray(value.steps) ? value.steps : []).forEach((step) => {
    pushValue(step?.imageUrl || step?.ImageUrl || "");
    pushValue(step?.backgroundUrl || step?.BackgroundUrl || "");
  });

  return items;
}

function normalizeScenePack(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const scene = normalizeScene(value.scene);
  const steps = Array.isArray(value.steps) ? value.steps : [];

  if (!scene || steps.length === 0) {
    return null;
  }

  return {
    scene,
    steps,
  };
}

export function getCachedScenePack(sceneId, options = {}) {
  const normalizedMode = normalizeScenePackMode(options.mode);
  const key = getScenePackCacheKey(sceneId, normalizedMode);

  if (!key || typeof window === "undefined") {
    return null;
  }

  const cached = normalizeScenePack(readPersistentUserCache(key, { ttlMs: getScenePackCacheTtlMs(normalizedMode) }));

  if (cached) {
    warmMediaUrls(getScenePackMediaUrls(cached));
  }

  return cached;
}

export function setCachedScenePack(sceneId, options = {}, value) {
  const normalizedMode = normalizeScenePackMode(options.mode);
  const key = getScenePackCacheKey(sceneId, normalizedMode);
  const normalized = normalizeScenePack(value);

  if (!key || typeof window === "undefined") {
    return;
  }

  if (!normalized) {
    removePersistentUserCache(key);
    return;
  }

  writePersistentUserCache(key, normalized);
  warmMediaUrls(getScenePackMediaUrls(normalized));
}

export function clearCachedScenePack(sceneId, options = {}) {
  const key = getScenePackCacheKey(sceneId, options.mode);

  if (!key || typeof window === "undefined") {
    return;
  }

  removePersistentUserCache(key);
}

export async function preloadScenePack(sceneId, options = {}) {
  const normalizedSceneId = Number(sceneId || 0);
  const normalizedMode = normalizeScenePackMode(options.mode);
  const cached = options.force ? null : getCachedScenePack(normalizedSceneId, { mode: normalizedMode });

  if (cached) {
    return {
      ok: true,
      data: cached,
      source: "cache",
    };
  }

  const requestKey = getScenePackCacheKey(normalizedSceneId, normalizedMode) || `${normalizedMode}:${normalizedSceneId}`;
  const existingRequest = pendingScenePackRequests.get(requestKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = (async () => {
    if (!normalizedSceneId) {
      return {
        ok: false,
        error: "Не вдалося завантажити сцену",
      };
    }

    const detailsRequest = scenesService.getById(normalizedSceneId);
    const payloadRequest = normalizedMode === "mistakes"
      ? scenesService.getMistakes(normalizedSceneId)
      : scenesService.getContent(normalizedSceneId);

    const [detailsRes, payloadRes] = await Promise.all([detailsRequest, payloadRequest]);

    if (!detailsRes?.ok) {
      return {
        ok: false,
        status: detailsRes?.status,
        error: detailsRes?.error || "Не вдалося завантажити сцену",
      };
    }

    if (!payloadRes?.ok) {
      return {
        ok: false,
        status: payloadRes?.status,
        error: payloadRes?.error || "Не вдалося завантажити сцену",
      };
    }

    const payloadData = payloadRes.data || null;
    const data = {
      scene: normalizeScene(
        (!isMistakesScenePackMode(normalizedMode) ? payloadData : null)
        || options.scene
        || detailsRes.data
        || null
      ),
      steps: Array.isArray(payloadData?.steps) ? payloadData.steps : [],
    };

    if (data.scene && data.steps.length > 0) {
      setCachedScenePack(normalizedSceneId, { mode: normalizedMode }, data);
    }

    return {
      ok: true,
      data,
      source: "network",
    };
  })().finally(() => {
    pendingScenePackRequests.delete(requestKey);
  });

  pendingScenePackRequests.set(requestKey, request);
  return request;
}
