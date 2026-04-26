import { authStorage } from "./authStorage.js";
import { achievementsService } from "./achievementsService.js";
import { readPersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";
import { warmMediaUrls } from "./mediaWarmup.js";

const ACHIEVEMENTS_CACHE_TTL_MS = Number.POSITIVE_INFINITY;

const DESCRIPTION_BY_CODE = {
  "sys.first_day_learning": "За перший завершений день навчання",
  "sys.first_lesson": "За проходження першого уроку",
  "sys.five_lessons": "За проходження 5 уроків",
  "sys.perfect_lesson": "За урок без жодної помилки",
  "sys.perfect_three_in_row": "За кілька уроків підряд без помилок",
  "sys.hundred_xp": "За отримання 500 XP",
  "sys.first_scene": "За проходження першої сцени",
  "sys.first_topic_completed": "За завершення першої теми",
  "sys.five_scenes": "За проходження 5 сцен",
  "sys.streak_starter": "За серію навчання 3 дні поспіль",
  "sys.streak_7": "За серію навчання 7 днів поспіль",
  "sys.streak_30": "За серію навчання 30 днів поспіль",
  "sys.daily_goal": "За виконання денної цілі",
  "sys.return_after_break": "За повернення до навчання після перерви",
};

function getAchievementsCacheKey() {
  const userKey = authStorage.getUserCacheKey();

  if (!userKey) {
    return "";
  }

  return `lumino-achievements-cache:${userKey}`;
}

function getAchievementMediaRoot() {
  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "/api").trim();

  if (/^https?:\/\//i.test(apiBaseUrl)) {
    try {
      return apiBaseUrl.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    } catch {
      return typeof window !== "undefined" ? window.location.origin : "";
    }
  }

  return typeof window !== "undefined" ? window.location.origin : "";
}

function resolveAchievementImageUrl(url) {
  const src = String(url || "").trim();

  if (!src) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  const mediaRoot = getAchievementMediaRoot();

  if (src.startsWith("/")) {
    return `${mediaRoot}${src}`;
  }

  return `${mediaRoot}/${src.replace(/^\/+/, "")}`;
}

function normalizeAchievement(item) {
  const code = String(item?.code || "").trim();
  const earnedAtRaw = String(item?.earnedAt || "").trim();
  const earnedAtTime = earnedAtRaw ? Date.parse(earnedAtRaw) : NaN;

  return {
    id: item?.id || code || 0,
    code,
    title: String(item?.title || "").trim(),
    description: String(DESCRIPTION_BY_CODE[code] || item?.description || "").trim(),
    isEarned: Boolean(item?.isEarned),
    earnedAt: earnedAtRaw,
    earnedAtTime: Number.isNaN(earnedAtTime) ? 0 : earnedAtTime,
    imageUrl: resolveAchievementImageUrl(String(item?.imageUrl || "").trim()),
  };
}

function sortAchievements(items) {
  return [...items].sort((a, b) => {
    if (a.isEarned !== b.isEarned) {
      return a.isEarned ? -1 : 1;
    }

    if (a.isEarned && b.isEarned && a.earnedAtTime !== b.earnedAtTime) {
      return b.earnedAtTime - a.earnedAtTime;
    }

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

function normalizeAchievements(items) {
  const list = Array.isArray(items)
    ? sortAchievements(items.map(normalizeAchievement).filter((item) => item.title))
    : [];

  warmMediaUrls(list.filter((item) => item?.isEarned).map((item) => item?.imageUrl));
  return list;
}

export function readAchievementsCache() {
  const key = getAchievementsCacheKey();
  const value = readPersistentUserCache(key, { ttlMs: ACHIEVEMENTS_CACHE_TTL_MS });
  const list = Array.isArray(value) ? value.map(normalizeAchievement).filter((item) => item.title) : null;

  if (Array.isArray(list)) {
    warmMediaUrls(list.filter((item) => item?.isEarned).map((item) => item?.imageUrl));
  }

  return list;
}

export function writeAchievementsCache(items) {
  const key = getAchievementsCacheKey();

  if (!key) {
    return;
  }

  const normalized = normalizeAchievements(items);
  writePersistentUserCache(key, normalized);
}

export async function preloadAchievementsCache() {
  const requestAuthSessionVersion = authStorage.getAuthSessionVersion();
  const res = await achievementsService.getMine();

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      error: res.error || "",
      shouldClearTokens: res.shouldClearTokens,
    };
  }

  const list = normalizeAchievements(res.data);

  if (authStorage.isSameAuthSessionVersion(requestAuthSessionVersion)) {
    writeAchievementsCache(list);
  }

  return {
    ok: true,
    status: res.status,
    data: list,
    shouldClearTokens: false,
  };
}
