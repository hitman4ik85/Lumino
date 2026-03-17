import { apiClient } from "./apiClient.js";

export const avatarsService = {
  async getAll() {
    const res = await apiClient.get("/avatars");

    return {
      ok: res.ok,
      status: res.status,
      items: res.ok ? (Array.isArray(res.data) ? res.data : []) : [],
      error: res.error || "",
    };
  },
};
