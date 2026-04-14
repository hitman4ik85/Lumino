import { apiClient } from "./apiClient.js";
import { clearAchievementsCache } from "./achievementsService.js";
import { clearWeeklyProgressCache } from "./profileService.js";
import { authStorage } from "./authStorage.js";
import { removePersistentUserCache } from "./userPersistentCache.js";
import { clearUserSummaryCache } from "./userService.js";
import { clearVocabularyItemsCache } from "./vocabularyService.js";

function clearLessonMistakesPackCache(lessonId) {
  const userKey = authStorage.getUserCacheKey();
  const normalizedLessonId = Number(lessonId || 0);

  if (!userKey || !normalizedLessonId) {
    return;
  }

  removePersistentUserCache(`lumino-lesson-pack:${userKey}:mistakes:${normalizedLessonId}`);
}

function clearLearningResultCaches(lessonId) {
  clearUserSummaryCache();
  clearAchievementsCache();
  clearWeeklyProgressCache();
  clearVocabularyItemsCache();
  clearLessonMistakesPackCache(lessonId);
}

export const lessonsService = {
  getById(id) {
    return apiClient.get(`/lessons/${id}`);
  },

  getExercises(id) {
    return apiClient.get(`/lessons/${id}/exercises`);
  },

  async submit(id, dto) {
    const res = await apiClient.post(`/lessons/${id}/submit`, dto);

    if (res.ok) {
      clearLearningResultCaches(id);
    }

    return res;
  },
};
