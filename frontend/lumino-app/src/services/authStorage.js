const ACCESS_TOKEN_KEY = "lumino_access_token";
const REFRESH_TOKEN_KEY = "lumino_refresh_token";
const GUEST_PREVIEW_KEY = "lumino_guest_preview";

export const authStorage = {
  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || "";
  },

  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY) || "";
  },

  setTokens(token, refreshToken) {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }

    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }

    localStorage.removeItem(GUEST_PREVIEW_KEY);
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthed() {
    return this.getAccessToken().trim().length > 0;
  },
};
