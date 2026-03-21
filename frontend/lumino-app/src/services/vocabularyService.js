import { apiClient } from "./apiClient.js";

export const vocabularyService = {
  getMyVocabulary() {
    return apiClient.get("/vocabulary/me");
  },

  getDueVocabulary() {
    return apiClient.get("/vocabulary/due");
  },

  getNextReview() {
    return apiClient.get("/vocabulary/review/next");
  },

  getItemDetails(id) {
    return apiClient.get(`/vocabulary/items/${id}`);
  },

  lookupWord(word) {
    return apiClient.get(`/vocabulary/lookup?word=${encodeURIComponent(word || "")}`);
  },

  addWord(payload) {
    return apiClient.post("/vocabulary", payload);
  },

  updateWord(id, payload) {
    return apiClient.put(`/vocabulary/${id}`, payload);
  },

  reviewWord(id, payload) {
    return apiClient.post(`/vocabulary/${id}/review`, payload);
  },

  scheduleWord(id, payload) {
    return apiClient.post(`/vocabulary/${id}/schedule`, payload);
  },

  deleteWord(id) {
    return apiClient.del(`/vocabulary/${id}`);
  },
};
