import { apiClient } from "./apiClient.js";

function buildQuery(languageCode, level) {
  const params = new URLSearchParams();

  if (languageCode) {
    params.set("languageCode", String(languageCode).trim().toLowerCase());
  }

  if (level) {
    params.set("level", String(level).trim().toLowerCase());
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

export const demoLessonService = {
  async getNextPack(step = 0, languageCode = "", level = "") {
    const query = buildQuery(languageCode, level);
    const res = await apiClient.get(`/demo/next-pack${query ? `${query}&step=${step}` : `?step=${step}`}`);

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? (res.data || null) : null,
      error: res.error || "",
    };
  },

  async getLessonById(lessonId, languageCode = "", level = "") {
    const query = buildQuery(languageCode, level);
    const res = await apiClient.get(`/demo/lessons/${lessonId}${query}`);

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? (res.data || null) : null,
      error: res.error || "",
    };
  },

  async getExercises(lessonId, languageCode = "", level = "") {
    const query = buildQuery(languageCode, level);
    const res = await apiClient.get(`/demo/lessons/${lessonId}/exercises${query}`);

    return {
      ok: res.ok,
      status: res.status,
      items: res.ok ? (Array.isArray(res.data) ? res.data : []) : [],
      error: res.error || "",
    };
  },

  async submit(lessonId, dto, languageCode = "", level = "") {
    const query = buildQuery(languageCode, level);
    const res = await apiClient.post(`/demo/lesson-submit${query}`, {
      ...(dto || {}),
      lessonId: Number(lessonId),
    });

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? (res.data || null) : null,
      error: res.error || "",
    };
  },
};
