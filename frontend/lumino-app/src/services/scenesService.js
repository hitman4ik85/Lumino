import { apiClient } from "./apiClient.js";

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

  submit(id, dto) {
    return apiClient.post(`/scenes/${id}/submit`, dto);
  },

  submitMistakes(id, dto) {
    return apiClient.post(`/scenes/${id}/mistakes/submit`, dto);
  },
};
