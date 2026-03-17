import { apiClient } from "./apiClient.js";

export const profileService = {
  async getWeeklyProgress() {
    const res = await apiClient.get("/profile/weekly-progress");

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? (res.data || null) : null,
      error: res.error || "",
    };
  },
};
