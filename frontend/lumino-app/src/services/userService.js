import { apiClient } from "./apiClient.js";

export const userService = {
  getMe() {
    return apiClient.get("/user/me");
  },

  updateProfile(dto) {
    return apiClient.put("/user/profile", dto);
  },

  changePassword(dto) {
    return apiClient.post("/user/change-password", dto);
  },

  deleteAccount(dto) {
    return apiClient.post("/user/delete-account", dto);
  },

  getExternalLogins() {
    return apiClient.get("/user/external-logins");
  },

  restoreHearts(heartsToRestore = 5) {
    return apiClient.post("/user/restore-hearts", { heartsToRestore });
  },

  consumeMistakesHearts(mistakesCount = 0) {
    return apiClient.post("/user/consume-mistakes-hearts", { mistakesCount });
  },
};
