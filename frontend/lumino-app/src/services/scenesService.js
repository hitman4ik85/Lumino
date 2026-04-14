import { apiClient } from "./apiClient.js";
import { clearAchievementsCache } from "./achievementsService.js";
import { clearWeeklyProgressCache } from "./profileService.js";
import { clearUserSummaryCache } from "./userService.js";

function clearLearningResultCaches() {
  clearUserSummaryCache();
  clearAchievementsCache();
  clearWeeklyProgressCache();
}

export const scenesService = {
  getForMe(courseId) {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    return apiClient.get(`/scenes/me${qs}`);
  },

  getById(id) {
    return apiClient.get(`/scenes/${id}`);
  },

  getContent(id) {
    return apiClient.get(`/scenes/${id}/content`);
  },

  getMistakes(id) {
    return apiClient.get(`/scenes/${id}/mistakes`);
  },

  async submit(id, dto) {
    const res = await apiClient.post(`/scenes/${id}/submit`, dto);

    if (res.ok) {
      clearLearningResultCaches();
    }

    return res;
  },

  async submitMistakes(id, dto) {
    const res = await apiClient.post(`/scenes/${id}/mistakes/submit`, dto);

    if (res.ok) {
      clearLearningResultCaches();
    }

    return res;
  },
};
