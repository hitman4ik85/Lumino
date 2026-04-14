import { authStorage } from "./authStorage.js";
import { userService } from "./userService.js";
import { onboardingService } from "./onboardingService.js";
import { profileService } from "./profileService.js";
import { avatarsService } from "./avatarsService.js";
import { readPersistentUserCache, removePersistentUserCache, writePersistentUserCache } from "./userPersistentCache.js";
import { warmMediaUrls } from "./mediaWarmup.js";

const PROFILE_CACHE_TTL_MS = Number.POSITIVE_INFINITY;

function getProfileCacheKey() {
  const userKey = authStorage.getUserCacheKey();

  if (!userKey) {
    return "";
  }

  return `lumino-profile-cache:${userKey}`;
}

function normalizeProfileSnapshot(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const profile = value.profile && typeof value.profile === "object" ? value.profile : null;
  const normalized = {
    profile,
    languages: Array.isArray(value.languages) ? value.languages : [],
    activeTargetLanguageCode: String(value.activeTargetLanguageCode || profile?.targetLanguageCode || ""),
    weeklyProgress: value.weeklyProgress && typeof value.weeklyProgress === "object"
      ? value.weeklyProgress
      : { currentWeek: [], previousWeek: [], totalPoints: 0 },
    externalLogins: Array.isArray(value.externalLogins) ? value.externalLogins : [],
    avatars: Array.isArray(value.avatars) ? value.avatars : [],
    myDataForm: {
      username: String(value.myDataForm?.username || profile?.username || ""),
      email: String(value.myDataForm?.email || profile?.email || ""),
    },
  };

  warmMediaUrls([
    normalized.profile?.avatarUrl,
    ...normalized.avatars.map((item) => item?.url || item?.avatarUrl || item?.imageUrl || ""),
  ]);

  return normalized;
}

export function getCachedProfileSnapshot() {
  const key = getProfileCacheKey();
  const value = readPersistentUserCache(key, { ttlMs: PROFILE_CACHE_TTL_MS });

  return normalizeProfileSnapshot(value);
}

export function setCachedProfileSnapshot(value) {
  const key = getProfileCacheKey();
  const normalized = normalizeProfileSnapshot(value);

  if (!key) {
    return;
  }

  if (!normalized) {
    removePersistentUserCache(key);
    return;
  }

  writePersistentUserCache(key, normalized);
}

export function mergeCachedProfileSnapshot(patch = {}) {
  const current = getCachedProfileSnapshot();
  const hasProfile = Object.prototype.hasOwnProperty.call(patch, "profile");
  const hasLanguages = Object.prototype.hasOwnProperty.call(patch, "languages");
  const hasActiveTargetLanguageCode = Object.prototype.hasOwnProperty.call(patch, "activeTargetLanguageCode");
  const hasWeeklyProgress = Object.prototype.hasOwnProperty.call(patch, "weeklyProgress");
  const hasExternalLogins = Object.prototype.hasOwnProperty.call(patch, "externalLogins");
  const hasAvatars = Object.prototype.hasOwnProperty.call(patch, "avatars");
  const hasMyDataForm = Object.prototype.hasOwnProperty.call(patch, "myDataForm");
  const nextProfile = hasProfile ? (patch.profile || null) : (current?.profile || null);
  const nextSnapshot = {
    profile: nextProfile,
    languages: hasLanguages ? (Array.isArray(patch.languages) ? patch.languages : []) : (current?.languages || []),
    activeTargetLanguageCode: hasActiveTargetLanguageCode
      ? String(patch.activeTargetLanguageCode || nextProfile?.targetLanguageCode || "")
      : String(current?.activeTargetLanguageCode || nextProfile?.targetLanguageCode || ""),
    weeklyProgress: hasWeeklyProgress
      ? ((patch.weeklyProgress && typeof patch.weeklyProgress === "object") ? patch.weeklyProgress : { currentWeek: [], previousWeek: [], totalPoints: 0 })
      : (current?.weeklyProgress || { currentWeek: [], previousWeek: [], totalPoints: 0 }),
    externalLogins: hasExternalLogins ? (Array.isArray(patch.externalLogins) ? patch.externalLogins : []) : (current?.externalLogins || []),
    avatars: hasAvatars ? (Array.isArray(patch.avatars) ? patch.avatars : []) : (current?.avatars || []),
    myDataForm: hasMyDataForm
      ? {
        username: String(patch.myDataForm?.username || nextProfile?.username || ""),
        email: String(patch.myDataForm?.email || nextProfile?.email || ""),
      }
      : {
        username: String(current?.myDataForm?.username || nextProfile?.username || ""),
        email: String(current?.myDataForm?.email || nextProfile?.email || ""),
      },
  };

  setCachedProfileSnapshot(nextSnapshot);
  return nextSnapshot;
}

export async function preloadProfileSnapshot(seed = {}) {
  const profileSeed = seed.profile && typeof seed.profile === "object" ? seed.profile : null;
  const languagesSeed = Array.isArray(seed.languages) ? seed.languages : [];
  const activeTargetLanguageCodeSeed = String(seed.activeTargetLanguageCode || profileSeed?.targetLanguageCode || "");

  const [meRes, languagesRes, weeklyRes, externalLoginsRes, avatarsRes] = await Promise.all([
    profileSeed ? Promise.resolve({ ok: true, data: profileSeed }) : userService.getMe({ force: true }),
    languagesSeed.length > 0 || activeTargetLanguageCodeSeed
      ? Promise.resolve({ ok: true, learningLanguages: languagesSeed, activeTargetLanguageCode: activeTargetLanguageCodeSeed })
      : onboardingService.getMyLanguages(),
    profileService.getWeeklyProgress(),
    userService.getExternalLogins(),
    avatarsService.getAll(),
  ]);

  if (!meRes.ok) {
    return {
      ok: false,
      status: meRes.status,
      error: meRes.error || "Не вдалося завантажити профіль.",
    };
  }

  const snapshot = normalizeProfileSnapshot({
    profile: meRes.data || null,
    languages: languagesRes.ok && Array.isArray(languagesRes.learningLanguages) ? languagesRes.learningLanguages : languagesSeed,
    activeTargetLanguageCode: languagesRes.ok
      ? (languagesRes.activeTargetLanguageCode || meRes.data?.targetLanguageCode || activeTargetLanguageCodeSeed)
      : (meRes.data?.targetLanguageCode || activeTargetLanguageCodeSeed),
    weeklyProgress: weeklyRes?.ok ? (weeklyRes.data || { currentWeek: [], previousWeek: [], totalPoints: 0 }) : { currentWeek: [], previousWeek: [], totalPoints: 0 },
    externalLogins: externalLoginsRes?.ok ? (Array.isArray(externalLoginsRes.data) ? externalLoginsRes.data : []) : [],
    avatars: avatarsRes?.ok ? (Array.isArray(avatarsRes.items) ? avatarsRes.items : []) : [],
    myDataForm: {
      username: String(meRes.data?.username || ""),
      email: String(meRes.data?.email || ""),
    },
  });

  setCachedProfileSnapshot(snapshot);

  return {
    ok: true,
    status: meRes.status,
    data: snapshot,
  };
}
