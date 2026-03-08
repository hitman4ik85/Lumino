import { apiClient } from "./apiClient.js";

export const authService = {
  login(dto) {
    return apiClient.post("/auth/login", dto);
  },

  register(dto) {
    return apiClient.post("/auth/register", dto);
  },

  refresh(dto) {
    return apiClient.post("/auth/refresh", dto);
  },

  logout(dto) {
    return apiClient.post("/auth/logout", dto);
  },

  forgotPassword(dto) {
    return apiClient.post("/auth/forgot-password", dto);
  },

  resetPassword(dto) {
    return apiClient.post("/auth/reset-password", dto);
  },

  verifyEmail(dto) {
    return apiClient.post("/auth/verify-email", dto);
  },

  resendVerification(dto) {
    return apiClient.post("/auth/resend-verification", dto);
  },

  oauthGoogle(dto) {
    return apiClient.post("/auth/oauth/google", dto);
  },
};
