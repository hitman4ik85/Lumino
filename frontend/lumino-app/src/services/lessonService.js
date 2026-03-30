import { apiClient } from "./apiClient.js";

export const lessonService = {
  getById(id) {
    return apiClient.get(`/lessons/${id}`);
  },

  getExercises(id) {
    return apiClient.get(`/lessons/${id}/exercises`);
  },

  submit(id, body) {
    return apiClient.post(`/lessons/${id}/submit`, body);
  },

  getMistakes(id) {
    return apiClient.get(`/lessons/${id}/mistakes`);
  },

  submitMistakes(id, body) {
    return apiClient.post(`/lessons/${id}/mistakes/submit`, body);
  },
};
