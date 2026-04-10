import { apiClient } from "../apiClient.js";
import { authStorage } from "../authStorage.js";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

function buildUrl(path) {
  if (!path) return BASE_URL;
  if (path.startsWith("http")) return path;
  if (path.startsWith("/api/") && BASE_URL === "/api") return path;
  if (path.startsWith("/")) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function uploadFile(file, folder = "") {
  const token = authStorage.getAccessToken();
  const formData = new FormData();

  formData.append("file", file);

  if (folder) {
    formData.append("folder", folder);
  }

  const response = await fetch(buildUrl("/media/upload"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const data = await safeJson(response);

  return {
    ok: response.ok,
    status: response.status,
    data: response.ok ? (data || null) : null,
    error: response.ok ? "" : data?.detail || data?.message || data?.error || `HTTP ${response.status}`,
  };
}

export const adminService = {
  getCourses() {
    return apiClient.get("/admin/courses");
  },

  getCourseById(id) {
    return apiClient.get(`/admin/courses/${id}`);
  },

  createCourse(dto) {
    return apiClient.post("/admin/courses", dto);
  },

  updateCourse(id, dto) {
    return apiClient.put(`/admin/courses/${id}`, dto);
  },

  deleteCourse(id) {
    return apiClient.del(`/admin/courses/${id}`);
  },

  getTopicById(id) {
    return apiClient.get(`/admin/topics/${id}`);
  },

  createTopic(dto) {
    return apiClient.post("/admin/topics", dto);
  },

  updateTopic(id, dto) {
    return apiClient.put(`/admin/topics/${id}`, dto);
  },

  deleteTopic(id) {
    return apiClient.del(`/admin/topics/${id}`);
  },

  getLessonsByTopic(topicId) {
    return apiClient.get(`/admin/lessons/topic/${topicId}`);
  },

  getLessonById(id) {
    return apiClient.get(`/admin/lessons/${id}`);
  },

  createLesson(dto) {
    return apiClient.post("/admin/lessons", dto);
  },

  updateLesson(id, dto) {
    return apiClient.put(`/admin/lessons/${id}`, dto);
  },

  deleteLesson(id) {
    return apiClient.del(`/admin/lessons/${id}`);
  },

  copyLesson(id, dto = {}) {
    return apiClient.post(`/admin/lessons/${id}/copy`, dto);
  },

  exportLessonExercises(id) {
    return apiClient.get(`/admin/lessons/${id}/exercises/export`);
  },

  importLessonExercises(id, dto) {
    return apiClient.post(`/admin/lessons/${id}/exercises/import`, dto);
  },

  getExercisesByLesson(lessonId) {
    return apiClient.get(`/admin/exercises/lesson/${lessonId}`);
  },

  getExerciseById(id) {
    return apiClient.get(`/admin/exercises/${id}`);
  },

  createExercise(dto) {
    return apiClient.post("/admin/exercises", dto);
  },

  updateExercise(id, dto) {
    return apiClient.put(`/admin/exercises/${id}`, dto);
  },

  deleteExercise(id) {
    return apiClient.del(`/admin/exercises/${id}`);
  },

  copyExercise(id, dto = {}) {
    return apiClient.post(`/admin/exercises/${id}/copy`, dto);
  },

  getVocabulary() {
    return apiClient.get("/admin/vocabulary");
  },

  getVocabularyById(id) {
    return apiClient.get(`/admin/vocabulary/${id}`);
  },

  getVocabularyByLesson(lessonId) {
    return apiClient.get(`/admin/vocabulary/lesson/${lessonId}`);
  },

  getVocabularyByCourseLanguage(courseId) {
    return apiClient.get(`/admin/vocabulary/course/${courseId}/language`);
  },

  createVocabulary(dto) {
    return apiClient.post("/admin/vocabulary", dto);
  },

  updateVocabulary(id, dto) {
    return apiClient.put(`/admin/vocabulary/${id}`, dto);
  },

  deleteVocabulary(id) {
    return apiClient.del(`/admin/vocabulary/${id}`);
  },

  linkVocabularyToLesson(lessonId, vocabularyItemId) {
    return apiClient.post(`/admin/vocabulary/lesson/${lessonId}/${vocabularyItemId}`);
  },

  unlinkVocabularyFromLesson(lessonId, vocabularyItemId) {
    return apiClient.del(`/admin/vocabulary/lesson/${lessonId}/${vocabularyItemId}`);
  },

  exportVocabulary(dto) {
    return apiClient.post("/admin/vocabulary/export", dto);
  },

  importVocabulary(dto) {
    return apiClient.post("/admin/vocabulary/import", dto);
  },

  getScenes() {
    return apiClient.get("/admin/scenes");
  },

  getSceneById(id) {
    return apiClient.get(`/admin/scenes/${id}`);
  },

  createScene(dto) {
    return apiClient.post("/admin/scenes", dto);
  },

  updateScene(id, dto) {
    return apiClient.put(`/admin/scenes/${id}`, dto);
  },

  assignSceneToTopic(id, dto) {
    return apiClient.put(`/admin/scenes/${id}/assign-topic`, dto);
  },

  deleteScene(id) {
    return apiClient.del(`/admin/scenes/${id}`);
  },

  copyScene(id, dto = {}) {
    return apiClient.post(`/admin/scenes/${id}/copy`, dto);
  },

  exportScene(id) {
    return apiClient.get(`/admin/scenes/${id}/export`);
  },

  importScene(dto) {
    return apiClient.post("/admin/scenes/import", dto);
  },

  addSceneStep(sceneId, dto) {
    return apiClient.post(`/admin/scenes/${sceneId}/steps`, dto);
  },

  updateSceneStep(sceneId, stepId, dto) {
    return apiClient.put(`/admin/scenes/${sceneId}/steps/${stepId}`, dto);
  },

  deleteSceneStep(sceneId, stepId) {
    return apiClient.del(`/admin/scenes/${sceneId}/steps/${stepId}`);
  },

  getAchievements() {
    return apiClient.get("/admin/achievements");
  },

  getAchievementById(id) {
    return apiClient.get(`/admin/achievements/${id}`);
  },

  createAchievement(dto) {
    return apiClient.post("/admin/achievements", dto);
  },

  updateAchievement(id, dto) {
    return apiClient.put(`/admin/achievements/${id}`, dto);
  },

  deleteAchievement(id) {
    return apiClient.del(`/admin/achievements/${id}`);
  },

  getUsers() {
    return apiClient.get("/admin/users");
  },

  createUser(dto) {
    return apiClient.post("/admin/users", dto);
  },

  updateUser(id, dto) {
    return apiClient.put(`/admin/users/${id}`, dto);
  },

  deleteUser(id) {
    return apiClient.del(`/admin/users/${id}`);
  },

  getTokens() {
    return apiClient.get("/admin/tokens");
  },

  cleanupTokens() {
    return apiClient.post("/admin/tokens/cleanup");
  },

  getMediaFiles(query = "", skip = 0, take = 500) {
    const params = new URLSearchParams();

    if (query) {
      params.set("query", query);
    }

    params.set("skip", String(skip));
    params.set("take", String(take));

    return apiClient.get(`/media/list?${params.toString()}`);
  },

  deleteMediaFile(path) {
    const params = new URLSearchParams();

    if (path) {
      params.set("path", path);
    }

    return apiClient.del(`/media?${params.toString()}`);
  },

  renameMediaFile(path, newFileName) {
    return apiClient.put("/media/rename", { path, newFileName });
  },

  uploadFile,
};
