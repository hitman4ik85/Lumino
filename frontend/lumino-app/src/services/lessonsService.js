import { apiClient } from "./apiClient.js";

export const lessonsService = {
  getById(id) {
    return apiClient.get(`/lessons/${id}`);
  },

  getExercises(id) {
    return apiClient.get(`/lessons/${id}/exercises`);
  },

  submit(id, dto) {
    return apiClient.post(`/lessons/${id}/submit`, dto);
  },
};
