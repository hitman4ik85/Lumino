import { apiClient } from "./apiClient.js";

export const achievementsService = {
  getMine() {
    return apiClient.get("/achievements/me");
  },
};
