import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStageScale } from "../../hooks/useStageScale.js";
import { adminService } from "../../services/admin/adminService.js";
import { authStorage } from "../../services/authStorage.js";
import { authService } from "../../services/authService.js";
import { readPersistentUserCache, writePersistentUserCache } from "../../services/userPersistentCache.js";
import styles from "./AdminPage.module.css";
import { PATHS } from "../../routes/paths.js";
import { validateAdminUserForm } from "../../utils/validation.js";

import CourseIcon from "../../assets/admin/nav/Course.svg";
import VocabularyIcon from "../../assets/admin/nav/Vocabulare.svg";
import SceneIcon from "../../assets/admin/nav/Scene.svg";
import AchievementIcon from "../../assets/admin/nav/Achivment.svg";
import ServiceIcon from "../../assets/admin/nav/Service.svg";

import AddIcon from "../../assets/admin/edit/Add.svg";
import CopyIcon from "../../assets/admin/edit/Copy.svg";
import DeleteIcon from "../../assets/admin/edit/Delete.svg";
import EditIcon from "../../assets/admin/edit/Edit.svg";
import ImportExportIcon from "../../assets/admin/edit/Import-Export.svg";
import PreviewIcon from "../../assets/admin/edit/Previev.svg";
import ReloadIcon from "../../assets/admin/edit/Reload.svg";

import FlagEn from "../../assets/flags/flag-en.svg";
import FlagDe from "../../assets/flags/flag-de.svg";
import FlagIt from "../../assets/flags/flag-it.svg";
import FlagEs from "../../assets/flags/flag-es.svg";
import FlagFr from "../../assets/flags/flag-fr.svg";
import FlagPl from "../../assets/flags/flag-pl.svg";
import FlagJa from "../../assets/flags/flag-ja.svg";
import FlagKo from "../../assets/flags/flag-ko.svg";
import FlagZh from "../../assets/flags/flag-zn.svg";
import PointsIcon from "../../assets/home/shared/points.svg";
import CrystalIcon from "../../assets/home/header/crystal.svg";
import LessonEnergyIcon from "../../assets/home/header/energy.svg";

const BackArrowIcon = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none"><path d="M14 8L6 16L14 24" stroke="#26415E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 16H18C22.4183 16 26 12.4183 26 8" stroke="#26415E" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`)}`;

const NAV_ITEMS = [
  { key: "courses", label: "КУРСИ", icon: CourseIcon },
  { key: "vocabulary", label: "СЛОВНИК", icon: VocabularyIcon },
  { key: "scenes", label: "СЦЕНИ", icon: SceneIcon },
  { key: "achievements", label: "ДОСЯГНЕННЯ", icon: AchievementIcon },
  { key: "users", label: "КОРИСТУВАЧІ", icon: SceneIcon },
  { key: "service", label: "СЕРВІСНІ ДІЇ", icon: ServiceIcon },
];

const FLAG_MAP = {
  en: FlagEn,
  de: FlagDe,
  it: FlagIt,
  es: FlagEs,
  fr: FlagFr,
  pl: FlagPl,
  ja: FlagJa,
  ko: FlagKo,
  zh: FlagZh,
};

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English", tooltipLabel: "Англійська" },
  { value: "de", label: "Deutsch", tooltipLabel: "Німецька" },
  { value: "it", label: "Italiano", tooltipLabel: "Італійська" },
  { value: "es", label: "Español", tooltipLabel: "Іспанська" },
  { value: "fr", label: "Français", tooltipLabel: "Французька" },
  { value: "pl", label: "Polski", tooltipLabel: "Польська" },
  { value: "ja", label: "日本語", tooltipLabel: "Японська" },
  { value: "ko", label: "한국어", tooltipLabel: "Корейська" },
  { value: "zh", label: "中文", tooltipLabel: "Китайська" },
];

const LANGUAGE_GENITIVE_MAP = {
  en: "англійської",
  de: "німецької",
  it: "італійської",
  es: "іспанської",
  fr: "французької",
  pl: "польської",
  ja: "японської",
  ko: "корейської",
  zh: "китайської",
};

const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const EXERCISE_TYPE_OPTIONS = ["MultipleChoice", "Input", "Match"];
const SCENE_TYPE_OPTIONS = ["Dialog", "Sun"];
const SCENE_STEP_TYPE_OPTIONS = ["Line", "Choice", "Input"];
const ACHIEVEMENT_CONDITION_OPTIONS = [
  { value: "", label: "Без автовидачі" },
  { value: "LessonPassCount", label: "За кількість успішних проходжень уроків" },
  { value: "UniqueLessonPassCount", label: "За кількість унікально пройдених уроків" },
  { value: "SceneCompletionCount", label: "За кількість завершених проходжень сцен" },
  { value: "UniqueSceneCompletionCount", label: "За кількість унікально завершених сцен" },
  { value: "TopicCompletionCount", label: "За кількість завершених тем" },
  { value: "PerfectLessonCount", label: "За кількість ідеально пройдених уроків" },
  { value: "StudyDayStreak", label: "За серію днів навчання поспіль" },
  { value: "TotalXp", label: "За загальну кількість XP" },
];

const ADMIN_BOOT_CACHE_TTL_MS = 30 * 60 * 1000;
const ADMIN_SERVICE_CACHE_TTL_MS = 5 * 60 * 1000;

function getAdminBootCacheKey() {
  const userKey = authStorage.getUserCacheKey() || "admin";

  return `lumino-admin-boot-cache:${userKey}`;
}

function getAdminServiceCacheKey(type, suffix = "") {
  const userKey = authStorage.getUserCacheKey() || "admin";

  return `lumino-admin-service-cache:${userKey}:${type}:${suffix}`;
}

function readAdminBootCache() {
  return readPersistentUserCache(getAdminBootCacheKey(), { ttlMs: ADMIN_BOOT_CACHE_TTL_MS });
}

function writeAdminBootCache(value) {
  writePersistentUserCache(getAdminBootCacheKey(), value);
}

function readAdminServiceCache(type, suffix = "") {
  return readPersistentUserCache(getAdminServiceCacheKey(type, suffix), { ttlMs: ADMIN_SERVICE_CACHE_TTL_MS });
}

function writeAdminServiceCache(type, suffix = "", value) {
  writePersistentUserCache(getAdminServiceCacheKey(type, suffix), value);
}

const MAX_TOPICS_PER_COURSE = 10;
const MAX_LESSONS_PER_TOPIC = 8;
const MAX_EXERCISES_PER_LESSON = 9;

const FIELD_HINTS = {
  courseTitle: "Введи повну назву курсу так, як вона має відображатися на сайті.",
  courseDescription: "Коротко опиши курс для бекенду і майбутнього наповнення.",
  courseLanguageCode: "Оберіть код мови курсу. Він має збігатися з мовою контенту.",
  courseLevel: "Оберіть рівень курсу, який зберігається в бекенді.",
  courseOrder: "Вкажи порядок показу курсу у списку. Використовуй ціле число: 1, 2, 3...",
  coursePrerequisiteCourseId: "Оберіть курс-передумову або залиш поле порожнім.",
  topicOrder: "Вкажи номер теми всередині вибраного курсу.",
  topicTitle: "Введи назву теми так, як вона має показуватись на картці.",
  lessonOrder: "Вкажи номер уроку всередині вибраної теми.",
  lessonTitle: "Введи назву уроку для відображення на сайті та в бекенді.",
  lessonTheory: "Додай теорію уроку. Це поле зберігається в бекенді повністю.",
  lessonExercisesImport: "Завантаж JSON з вправами уроку. Формат має відповідати export/import вправ бекенду.",
  exerciseOrder: "Вкажи порядок вправи в межах уроку.",
  exerciseType: "Оберіть тип вправи, який підтримується бекендом.",
  exerciseQuestion: "Введи запитання або текст вправи.",
  exerciseData: "Встав JSON або рядок у поле data саме в тому форматі, який очікує ця вправа.",
  exerciseCorrectAnswer: "Вкажи правильну відповідь у форматі, який використовується у data.",
  exerciseImageUrl: "URL картинки для вправи. Можна вставити шлях або завантажити файл.",
  sceneTitle: "Назва сцени для адмінки та фронтенду.",
  sceneDescription: "Короткий опис сцени, який зберігається у бекенді.",
  sceneOrder: "Вкажи порядок сцени в межах курсу або теми.",
  sceneType: "Sun — фінальна сцена теми. Dialog — окрема діалогова сцена, яка не прив'язується до теми.",
  sceneBackgroundUrl: "URL або шлях до фонового зображення сцени.",
  sceneAudioUrl: "URL або шлях до аудіо сцени.",
  sceneStepSpeaker: "Хто говорить у кроці сцени.",
  sceneStepText: "Основний текст кроку сцени.",
  sceneStepType: "Оберіть тип кроку сцени.",
  sceneStepOrder: "Вкажи порядок кроку в межах цієї сцени.",
  sceneStepMediaUrl: "URL або шлях до зображення, аудіо чи іншого медіафайлу для цього кроку.",
  sceneStepChoicesJson: "JSON з варіантами вибору для кроку типу Choice.",
  topicSceneSelect: "Оберіть фінальну сцену Sun для цієї теми. Тему без сцени залишати не можна.",
  achievementCode: "Код досягнення має бути унікальним. Якщо залишити поле порожнім, бекенд створить custom-код автоматично.",
  achievementTitle: "Назва досягнення для відображення в адмінці та користувачу.",
  achievementDescription: "Коротко опиши, за що користувач отримує це досягнення.",
  achievementImageUrl: "URL або шлях до картинки досягнення.",
  achievementConditionType: "Оберіть, за яку саме метрику досягнення має видаватися автоматично.",
  achievementConditionThreshold: "Поріг для автовидачі. Наприклад, 10 успішних проходжень або 500 XP.",
};

const USER_FORM_FIELD_HINTS = {
  username: "Введи ім'я користувача від 3 до 32 символів. Дозволені літери, цифри, пробіли, крапки, підкреслення та дефіси.",
  email: "Вкажи дійсну email-адресу користувача у форматі name@example.com.",
  passwordCreate: "Задай пароль щонайменше з 8 символів, з хоча б однією літерою та однією цифрою.",
  passwordEdit: "Залиш поле порожнім, якщо пароль не потрібно змінювати. Новий пароль має містити щонайменше 8 символів, літеру та цифру.",
  avatarUrl: "Вкажи шлях або повний URL до аватара користувача.",
  points: "Введи кількість балів користувача цілим числом.",
  crystals: "Введи кількість кристалів користувача цілим числом.",
  hearts: "Введи кількість енергії користувача цілим числом від 0 до 5.",
  blockedUntilLocal: "Оберіть точну дату та час, до яких користувач буде заблокований.",
};

const INITIAL_MODAL = { type: "", mode: "", payload: null };
const EMPTY_RELATION = { word: "", translation: "" };

function normalizeCode(value) {
  return String(value || "").trim().toLowerCase();
}

function getFlagByCode(code) {
  return FLAG_MAP[normalizeCode(code)] || FlagEn;
}

function formatAdminDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatFileSize(value) {
  const size = Number(value || 0);

  if (!Number.isFinite(size) || size <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  let currentValue = size;
  let unitIndex = 0;

  while (currentValue >= 1024 && unitIndex < units.length - 1) {
    currentValue /= 1024;
    unitIndex += 1;
  }

  const fractionDigits = unitIndex === 0 ? 0 : currentValue >= 10 ? 1 : 2;

  return `${currentValue.toFixed(fractionDigits)} ${units[unitIndex]}`;
}

function getMediaRelativePath(item) {
  return String(item?.fileName || "").trim();
}

function getMediaFolderName(item) {
  const relativePath = getMediaRelativePath(item);
  const lastSlashIndex = relativePath.lastIndexOf("/");

  if (lastSlashIndex < 0) {
    return "uploads";
  }

  return relativePath.slice(0, lastSlashIndex) || "uploads";
}

function getMediaFileShortName(item) {
  const relativePath = getMediaRelativePath(item);
  const lastSlashIndex = relativePath.lastIndexOf("/");

  if (lastSlashIndex < 0) {
    return relativePath || "—";
  }

  return relativePath.slice(lastSlashIndex + 1) || "—";
}

function buildMediaRenameForm(item) {
  return {
    path: getMediaRelativePath(item),
    newFileName: getMediaFileShortName(item) === "—" ? "" : getMediaFileShortName(item),
  };
}

function isImageMediaFile(item) {
  const extension = String(item?.extension || "").trim().toLowerCase();

  return [".png", ".jpg", ".jpeg", ".gif", ".webp"].includes(extension);
}

function toDateTimeLocalValue(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (item) => String(item).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isBlockedUserValue(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return date.getTime() > Date.now();
}

function buildBlockedUntilUtc(form) {
  if (!form?.isBlocked) {
    return null;
  }

  const preset = String(form.blockPreset || "1d");

  if (preset === "custom") {
    const customValue = String(form.blockedUntilLocal || "").trim();

    if (!customValue) {
      throw new Error("Оберіть дату і час блокування");
    }

    const customDate = new Date(customValue);

    if (Number.isNaN(customDate.getTime()) || customDate.getTime() <= Date.now()) {
      throw new Error("Дата блокування має бути пізніше поточного часу");
    }

    return customDate.toISOString();
  }

  const presetMap = {
    "1h": 1 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "3d": 3 * 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };

  const duration = presetMap[preset] || presetMap["1d"];

  return new Date(Date.now() + duration).toISOString();
}

function getUserTitle(user) {
  const username = String(user?.username || "").trim();

  if (username) {
    return username;
  }

  const email = String(user?.email || "").trim();

  if (email.includes("@")) {
    return email.split("@")[0];
  }

  return `User ${user?.id || ""}`.trim();
}

function sortByOrder(list) {
  return [...(list || [])].sort((a, b) => {
    const aOrder = Number(a?.order || 0);
    const bOrder = Number(b?.order || 0);

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return Number(a?.id || 0) - Number(b?.id || 0);
  });
}

function sortScenesAlphabetically(list) {
  return [...(list || [])].sort((a, b) => {
    const titleCompare = String(a?.title || "").trim().localeCompare(String(b?.title || "").trim(), undefined, { sensitivity: "base" });

    if (titleCompare !== 0) {
      return titleCompare;
    }

    return Number(a?.id || 0) - Number(b?.id || 0);
  });
}

function removeMapEntry(map, key) {
  const normalizedKey = Number(key || 0);

  if (!normalizedKey || !map || typeof map !== "object" || !(normalizedKey in map)) {
    return map;
  }

  const nextMap = { ...map };
  delete nextMap[normalizedKey];
  return nextMap;
}

function isNotFoundApiResponse(response) {
  return Number(response?.status || 0) === 404 || String(response?.data?.type || "").trim().toLowerCase() === "not_found";
}

function toLines(list) {
  return (list || []).map((item) => String(item || "").trim()).filter(Boolean).join("\n");
}

function parseLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function relationsToLines(list) {
  return (list || [])
    .map((item) => {
      const word = String(item?.word || "").trim();
      const translation = String(item?.translation || "").trim();

      if (!word && !translation) {
        return "";
      }

      if (word && translation) {
        return `${word} - ${translation}`;
      }

      return word || translation;
    })
    .filter(Boolean)
    .join("\n");
}

function parseRelations(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const normalizedLine = line.replace(/\|/g, " - ").replace(/\s+\u2013\s+/g, " - ");
      const separatorMatch = normalizedLine.match(/\s-\s/);

      if (!separatorMatch) {
        return {
          word: normalizedLine,
          translation: "",
        };
      }

      const separatorIndex = separatorMatch.index;
      const word = normalizedLine.slice(0, separatorIndex).trim();
      const translation = normalizedLine.slice(separatorIndex + separatorMatch[0].length).trim();

      return {
        word,
        translation,
      };
    })
    .filter((item) => item.word || item.translation);
}


function safeParseJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeJsonFieldValue(field, payload) {
  if (payload == null) {
    return "";
  }

  if (typeof payload === "string") {
    return payload;
  }

  if (Array.isArray(payload)) {
    return JSON.stringify(payload, null, 2);
  }

  if (typeof payload === "object") {
    const directValue = payload[field];

    if (typeof directValue === "string") {
      return directValue;
    }

    if (directValue != null) {
      return JSON.stringify(directValue, null, 2);
    }

    return JSON.stringify(payload, null, 2);
  }

  return String(payload);
}

function resolveCourseLabel(course) {
  const level = String(course?.level || "").trim();

  if (level) {
    return level.toUpperCase();
  }

  const title = String(course?.title || "").trim();

  if (!title) {
    return "КУРС";
  }

  return title;
}

function resolveMediaUrl(value) {
  const url = String(value || "").trim();

  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return url;
}

function buildCourseForm(course) {
  return {
    title: String(course?.title || ""),
    description: String(course?.description || ""),
    languageCode: String(course?.languageCode || "en"),
    level: String(course?.level || ""),
    order: String(course?.order || 1),
    prerequisiteCourseId: course?.prerequisiteCourseId ? String(course.prerequisiteCourseId) : "",
    isPublished: Boolean(course?.isPublished),
  };
}

function buildUserForm(user) {
  const blockedUntilUtc = String(user?.blockedUntilUtc || "");
  const isBlocked = isBlockedUserValue(blockedUntilUtc);
  const normalizedRole = String(user?.role || "User");
  const isAdminRole = normalizedRole.trim().toLowerCase() === "admin";

  return {
    username: String(user?.username || ""),
    email: String(user?.email || ""),
    password: "",
    avatarUrl: String(user?.avatarUrl || ""),
    nativeLanguageCode: isAdminRole ? "" : String(user?.nativeLanguageCode || "uk"),
    targetLanguageCode: isAdminRole ? "" : String(user?.targetLanguageCode || "en"),
    role: normalizedRole,
    isEmailVerified: typeof user?.isEmailVerified === "boolean" ? user.isEmailVerified : true,
    theme: String(user?.theme || "light"),
    points: isAdminRole ? "0" : String(Number(user?.points || 0)),
    crystals: isAdminRole ? "0" : String(Number(user?.crystals || 0)),
    hearts: isAdminRole ? "0" : String(Number(user?.hearts || 0)),
    courseIds: isAdminRole ? [] : (Array.isArray(user?.courseIds) ? user.courseIds.map((item) => String(item)) : []),
    activeCourseId: isAdminRole ? "" : (user?.activeCourseId ? String(user.activeCourseId) : ""),
    isBlocked,
    blockPreset: isBlocked ? "custom" : "1d",
    blockedUntilLocal: isBlocked ? toDateTimeLocalValue(blockedUntilUtc) : "",
  };
}

function buildUserRequestDtoFromForm(form) {
  const normalizedRole = String(form.role || "User").trim() || "User";
  const isAdminRole = normalizedRole.toLowerCase() === "admin";
  const courseIds = Array.isArray(form.courseIds)
    ? form.courseIds.map((item) => Number(item)).filter(Boolean).sort((a, b) => a - b)
    : [];
  const activeCourseId = form.activeCourseId ? Number(form.activeCourseId) : null;

  return {
    username: String(form.username || "").trim() || null,
    email: String(form.email || "").trim(),
    password: String(form.password || "").trim() || null,
    avatarUrl: String(form.avatarUrl || "").trim() || null,
    nativeLanguageCode: isAdminRole ? null : (String(form.nativeLanguageCode || "").trim() || null),
    targetLanguageCode: isAdminRole ? null : (String(form.targetLanguageCode || "").trim() || null),
    role: normalizedRole,
    isEmailVerified: Boolean(form.isEmailVerified),
    theme: String(form.theme || "light").trim() || "light",
    points: isAdminRole ? 0 : Math.max(0, Number(form.points || 0)),
    crystals: isAdminRole ? 0 : Math.max(0, Number(form.crystals || 0)),
    hearts: isAdminRole ? 0 : Math.min(5, Math.max(0, Number(form.hearts || 0))),
    blockedUntilUtc: buildBlockedUntilUtc(form),
    courseIds: isAdminRole ? [] : courseIds,
    activeCourseId: isAdminRole ? null : activeCourseId,
  };
}

function areAdminUserDtoValuesEqual(left, right) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return JSON.stringify(Array.isArray(left) ? left : []) === JSON.stringify(Array.isArray(right) ? right : []);
  }

  return left === right;
}

function buildUserRequestPayload(form, mode, user) {
  const dto = buildUserRequestDtoFromForm(form);

  if (mode !== "edit" || !user) {
    return dto;
  }

  const originalDto = buildUserRequestDtoFromForm(buildUserForm(user));

  return Object.keys(dto).reduce((acc, key) => {
    if (!areAdminUserDtoValuesEqual(dto[key], originalDto[key])) {
      acc[key] = dto[key];
    }

    return acc;
  }, {});
}

function getCoursePublishMeta(course) {
  const isPublished = Boolean(course?.isPublished);
  const canPublish = Boolean(course?.canPublish);
  const publishHint = String(course?.publishHint || "").trim();
  const publishIssues = Array.isArray(course?.publishIssues)
    ? course.publishIssues.map((item) => String(item || "").trim()).filter(Boolean)
    : [];
  const isToggleDisabled = Boolean(course?.__placeholder) || (!isPublished && !canPublish);

  let toggleTitle = publishHint;

  if (!toggleTitle) {
    if (isPublished) {
      toggleTitle = "Курс опублікований. Натисни, щоб зняти публікацію.";
    } else if (canPublish) {
      toggleTitle = "Курс заповнений повністю. Натисни, щоб опублікувати.";
    } else {
      toggleTitle = "Курс ще не заповнений повністю, тому його не можна опублікувати.";
    }
  }

  return {
    isPublished,
    canPublish,
    isToggleDisabled,
    toggleTitle,
    publishIssues,
  };
}

function buildTopicForm(topic) {
  const lessons = Array.isArray(topic?.lessons) && topic.lessons.length
    ? JSON.stringify(topic.lessons, null, 2)
    : "";
  const exercises = Array.isArray(topic?.exercises) && topic.exercises.length
    ? JSON.stringify(topic.exercises, null, 2)
    : "";
  const scenes = Array.isArray(topic?.scenes) && topic.scenes.length
    ? JSON.stringify(topic.scenes, null, 2)
    : "";

  return {
    title: String(topic?.title || ""),
    order: topic ? String(topic?.order || "") : "",
    lessons,
    exercises,
    scenes,
  };
}

function buildLessonForm(lesson, nextOrder = 1) {
  return {
    title: String(lesson?.title || ""),
    theory: String(lesson?.theory || ""),
    order: String(lesson?.order || nextOrder),
  };
}

function resolveLanguageDisplayLabel(code) {
  const option = LANGUAGE_OPTIONS.find((item) => normalizeCode(item.value) === normalizeCode(code));

  if (option?.tooltipLabel) {
    return option.tooltipLabel;
  }

  if (option?.label) {
    return option.label;
  }

  return String(code || "").trim() || "Не вказано";
}

function resolveLanguageGenitiveLabel(code) {
  const normalizedCode = normalizeCode(code);

  if (LANGUAGE_GENITIVE_MAP[normalizedCode]) {
    return LANGUAGE_GENITIVE_MAP[normalizedCode];
  }

  const label = resolveLanguageDisplayLabel(code);

  if (!label || label === "Не вказано") {
    return "вивчаємої";
  }

  return label.toLowerCase();
}

function getCourseTooltipText(course) {
  const title = String(course?.title || "").trim() || resolveCourseLabel(course);
  const language = resolveLanguageDisplayLabel(course?.languageCode);

  return `Курс: ${title}
Мова вивчення: ${language}`;
}

function getPrimaryVocabularyTranslation(item) {
  const translation = Array.isArray(item?.translations)
    ? item.translations.map((value) => String(value || "").trim()).find(Boolean)
    : "";

  if (translation) {
    return translation;
  }

  return String(item?.translation || "").trim();
}

function sortVocabularyAlphabetically(list) {
  return [...(list || [])].sort((a, b) => {
    const wordCompare = String(a?.word || "").trim().localeCompare(String(b?.word || "").trim(), undefined, { sensitivity: "base" });

    if (wordCompare !== 0) {
      return wordCompare;
    }

    const translationCompare = getPrimaryVocabularyTranslation(a).localeCompare(getPrimaryVocabularyTranslation(b), undefined, { sensitivity: "base" });

    if (translationCompare !== 0) {
      return translationCompare;
    }

    return Number(a?.id || 0) - Number(b?.id || 0);
  });
}

function buildVocabularyChipTitle(item) {
  const word = String(item?.word || "").trim();
  const translation = getPrimaryVocabularyTranslation(item);

  if (word && translation) {
    return `${word} (${translation})`;
  }

  return word || translation;
}

function mergeVocabularyCollections(list, extraList) {
  const result = [];
  const keys = new Set();

  [...(list || []), ...(extraList || [])].forEach((item) => {
    const itemId = Number(item?.id || 0);
    const itemWord = String(item?.word || "").trim().toLowerCase();
    const itemTranslation = getPrimaryVocabularyTranslation(item).trim().toLowerCase();
    const key = itemId ? `id:${itemId}` : `word:${itemWord}::${itemTranslation}`;

    if (!itemWord && !itemTranslation && !itemId) {
      return;
    }

    if (keys.has(key)) {
      return;
    }

    keys.add(key);
    result.push(item);
  });

  return sortVocabularyAlphabetically(result);
}

function normalizeVocabularyImportItems(payload) {
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : payload && typeof payload === "object"
        ? [payload]
        : [];

  return rawItems
    .map((item) => {
      const translations = Array.isArray(item?.translations)
        ? item.translations
        : item?.translation
          ? [item.translation]
          : [];
      const examples = Array.isArray(item?.examples)
        ? item.examples
        : String(item?.example || "").trim()
          ? [String(item.example).trim()]
          : [];
      const normalizeRelations = (values) => (Array.isArray(values) ? values : [])
        .map((entry) => ({
          word: String(entry?.word || "").trim(),
          translation: String(entry?.translation || "").trim(),
        }))
        .filter((entry) => entry.word || entry.translation);

      return {
        word: String(item?.word || "").trim(),
        translations: translations.map((value) => String(value || "").trim()).filter(Boolean),
        example: String(item?.example || "").trim() || null,
        partOfSpeech: String(item?.partOfSpeech || "").trim() || null,
        definition: String(item?.definition || "").trim() || null,
        transcription: String(item?.transcription || "").trim() || null,
        gender: String(item?.gender || "").trim() || null,
        examples: examples.map((value) => String(value || "").trim()).filter(Boolean),
        synonyms: normalizeRelations(item?.synonyms),
        idioms: normalizeRelations(item?.idioms),
      };
    })
    .filter((item) => item.word || item.translations.length);
}

function buildCourseTitleForm(course) {
  return {
    courseId: String(course?.id || ""),
    title: String(course?.title || ""),
  };
}

function buildLessonTitleForm(lesson) {
  return {
    lessonId: String(lesson?.id || ""),
    title: String(lesson?.title || ""),
  };
}

function buildLessonTheoryForm(lesson) {
  return {
    lessonId: String(lesson?.id || ""),
    theory: String(lesson?.theory || ""),
  };
}

function buildLessonDesignerForm(lesson, nextOrder = 1) {
  return {
    lessonId: String(lesson?.id || ""),
    title: String(lesson?.title || ""),
    theory: String(lesson?.theory || ""),
    order: String(lesson?.order || nextOrder),
    sourceName: "",
    importedJson: "",
  };
}

function splitExerciseOptionLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractMultipleChoiceOptions(value) {
  const parsed = safeParseJson(value);
  const options = [];

  const pushOption = (item) => {
    const nextValue = String(item || "").trim();

    if (!nextValue || options.includes(nextValue)) {
      return;
    }

    options.push(nextValue);
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      if (typeof item === "string") {
        pushOption(item);
        return;
      }

      if (item && typeof item === "object") {
        pushOption(item.text ?? item.label ?? item.option ?? item.answer ?? item.value);
      }
    });
  }

  if (!options.length && parsed && typeof parsed === "object") {
    (parsed.options || parsed.answers || parsed.choices || []).forEach((item) => {
      if (typeof item === "string") {
        pushOption(item);
        return;
      }

      if (item && typeof item === "object") {
        pushOption(item.text ?? item.label ?? item.option ?? item.answer ?? item.value);
      }
    });
  }

  if (!options.length) {
    splitExerciseOptionLines(value).forEach((line) => {
      pushOption(line.replace(/^[•\-]\s*/, ""));
    });
  }

  return options;
}

function formatExerciseDataForEditor(type, value) {
  const rawValue = String(value || "");

  if (type === "MultipleChoice") {
    const options = extractMultipleChoiceOptions(rawValue);
    return options.length ? options.join("\n") : rawValue;
  }

  if (type === "Match") {
    const parsed = safeParseJson(rawValue);

    if (Array.isArray(parsed)) {
      const pairs = parsed
        .map((item) => {
          const left = String(item?.left || "").trim();
          const right = String(item?.right || "").trim();

          if (!left || !right) {
            return "";
          }

          return `${left} = ${right}`;
        })
        .filter(Boolean);

      if (pairs.length) {
        return pairs.join("\n");
      }
    }
  }

  return rawValue;
}

function formatExerciseCorrectAnswerForEditor(type, value) {
  const rawValue = String(value || "");

  if (type === "Match" && rawValue.trim() === "{}") {
    return "";
  }

  if (type === "Input") {
    const parsed = safeParseJson(rawValue);

    if (Array.isArray(parsed)) {
      return String(parsed[0] || "").trim();
    }
  }

  return rawValue;
}

function resolveMatchPairFromLine(line) {
  const delimiters = ["=>", "->", "→", "|", "="];

  for (const delimiter of delimiters) {
    const index = line.indexOf(delimiter);

    if (index <= 0) {
      continue;
    }

    const left = line.slice(0, index).trim();
    const right = line.slice(index + delimiter.length).trim();

    if (left && right) {
      return { left, right };
    }
  }

  return null;
}

function buildMultipleChoiceExercisePayload(dataValue, correctAnswerValue) {
  const rawValue = String(dataValue || "").trim();
  const options = extractMultipleChoiceOptions(rawValue);
  let correctAnswer = String(correctAnswerValue || "").trim();

  const markedOptions = splitExerciseOptionLines(rawValue)
    .filter((line) => /^\*/.test(line))
    .map((line) => line.replace(/^\*\s*/, "").trim())
    .filter(Boolean);

  if (!correctAnswer && markedOptions.length === 1) {
    correctAnswer = markedOptions[0];
  }

  if (!correctAnswer) {
    throw new Error("Для MultipleChoice вкажи правильну відповідь окремо або познач її зірочкою у списку варіантів.");
  }

  if (!options.length) {
    throw new Error("Для MultipleChoice додай від 2 до 3 варіантів відповідей — кожний з нового рядка.");
  }

  if (options.length < 2 || options.length > 3) {
    throw new Error("Для MultipleChoice потрібно вказати від 2 до 3 варіантів відповідей.");
  }

  if (!options.some((item) => item.toLowerCase() === correctAnswer.toLowerCase())) {
    throw new Error("Правильна відповідь для MultipleChoice має точно збігатися з одним із варіантів.");
  }

  return {
    data: JSON.stringify(options),
    correctAnswer,
  };
}

function buildMatchExercisePayload(dataValue) {
  const rawValue = String(dataValue || "").trim();
  const parsed = safeParseJson(rawValue);

  if (Array.isArray(parsed)) {
    return {
      data: JSON.stringify(parsed),
      correctAnswer: "{}",
    };
  }

  const pairs = splitExerciseOptionLines(rawValue)
    .map(resolveMatchPairFromLine)
    .filter(Boolean);

  if (!pairs.length) {
    throw new Error("Для Match введи від 2 до 4 пар з нового рядка у форматі left = right.");
  }

  if (pairs.length < 2 || pairs.length > 4) {
    throw new Error("Для Match потрібно вказати від 2 до 4 пар слів.");
  }

  return {
    data: JSON.stringify(pairs),
    correctAnswer: "{}",
  };
}

function buildInputExercisePayload(dataValue, correctAnswerValue) {
  const data = String(dataValue || "").trim() || "{}";
  const answers = splitExerciseOptionLines(correctAnswerValue);

  if (!answers.length) {
    return {
      data,
      correctAnswer: "",
    };
  }

  if (answers.length !== 1) {
    throw new Error("Для Input потрібно вказати одну правильну відповідь в одному рядку.");
  }

  const correctAnswer = String(answers[0] || "").trim();

  return {
    data,
    correctAnswer,
  };
}

function buildExercisePayloadFromForm(form) {
  const type = String(form.type || "MultipleChoice").trim();

  if (type === "Match") {
    return buildMatchExercisePayload(form.data);
  }

  if (type === "Input") {
    return buildInputExercisePayload(form.data, form.correctAnswer);
  }

  return buildMultipleChoiceExercisePayload(form.data, form.correctAnswer);
}

function getExerciseFormUiConfig(type) {
  if (type === "Match") {
    return {
      dataTitle: "Для Match введи від 2 до 4 пар: кожну з нового рядка у форматі dog = собака. Правильні відповіді фронтенд бере з цих пар, а праву колонку у вправі перемішує автоматично.",
      dataPlaceholder: "dog = собака\ncat = кіт\nbird = птах\nfish = риба",
      correctAnswerTitle: "Для Match це поле не потрібно заповнювати — правильні відповіді вже задані у полі Data.",
      correctAnswerPlaceholder: "Для Match не потрібно",
    };
  }

  if (type === "Input") {
    return {
      dataTitle: "Для Input у полі data можна залишити {} або вставити JSON-об’єкт, якщо він потрібен цій вправі.",
      dataPlaceholder: "{}",
      correctAnswerTitle: "Для Input вкажи одну правильну відповідь в одному рядку. Можна вводити і кілька слів, наприклад: good night або is your. Кількість рисок і пробілів у вправі береться саме з цього тексту.",
      correctAnswerPlaceholder: "good night",
    };
  }

  return {
    dataTitle: "Для MultipleChoice введи від 2 до 3 варіантів: кожний з нового рядка. Варіанти на кнопках покажуться у тому самому порядку. Можна позначити правильний варіант зірочкою, наприклад: *cat.",
    dataPlaceholder: "dog\ncat\nbird",
    correctAnswerTitle: "Вкажи правильний варіант точно так само, як він написаний у списку, або познач його зірочкою у полі Data.",
    correctAnswerPlaceholder: "cat",
  };
}

function buildExerciseForm(exercise, nextOrder = 1) {
  const type = String(exercise?.type || "MultipleChoice");

  return {
    type,
    question: String(exercise?.question || ""),
    data: formatExerciseDataForEditor(type, exercise?.data || ""),
    correctAnswer: formatExerciseCorrectAnswerForEditor(type, exercise?.correctAnswer || ""),
    order: String(exercise?.order || nextOrder),
    imageUrl: String(exercise?.imageUrl || ""),
  };
}

function buildExerciseDesignerForm(exercise, nextOrder = 1) {
  return {
    order: exercise ? String(exercise?.order || "") : String(nextOrder || ""),
    sourceName: "",
    importedJson: "",
    type: String(exercise?.type || "MultipleChoice"),
    question: String(exercise?.question || ""),
    data: String(exercise?.data || ""),
    correctAnswer: String(exercise?.correctAnswer || ""),
    imageUrl: String(exercise?.imageUrl || ""),
  };
}

function normalizeImportedExercisePayload(payload) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return null;
  }

  if (payload.exercise && typeof payload.exercise === "object" && !Array.isArray(payload.exercise)) {
    return payload.exercise;
  }

  return payload;
}

function normalizeLessonExercisesImportPayload(payload) {
  if (Array.isArray(payload)) {
    return {
      replaceExisting: true,
      exercises: payload,
    };
  }

  if (!payload || typeof payload !== "object") {
    return null;
  }

  if (Array.isArray(payload.exercises)) {
    return {
      replaceExisting: Boolean(payload.replaceExisting),
      exercises: payload.exercises,
    };
  }

  const singleExercise = normalizeImportedExercisePayload(payload);

  if (!singleExercise) {
    return null;
  }

  return {
    replaceExisting: true,
    exercises: [singleExercise],
  };
}

function normalizeLessonImportPayload(payload, fallbackLesson = null) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const sourceLesson = payload.lesson && typeof payload.lesson === "object"
    ? payload.lesson
    : payload;
  const sourceExercises = Array.isArray(payload.exercises)
    ? payload.exercises
    : Array.isArray(sourceLesson.exercises)
      ? sourceLesson.exercises
      : [];

  const exercises = normalizeLessonExercisesImportPayload(sourceExercises);
  const lesson = {
    title: String(sourceLesson?.title ?? fallbackLesson?.title ?? "").trim(),
    theory: String(sourceLesson?.theory ?? fallbackLesson?.theory ?? "").trim(),
    order: Number(sourceLesson?.order ?? fallbackLesson?.order ?? 1),
    exercises: exercises || { replaceExisting: true, exercises: [] },
  };

  if (!lesson.title) {
    return null;
  }

  return {
    lesson,
  };
}

function getImportedExercisesCount(payload) {
  if (Array.isArray(payload?.exercises)) {
    return payload.exercises.length;
  }

  if (Array.isArray(payload)) {
    return payload.length;
  }

  return 0;
}

function getImportedExercisesList(payload) {
  if (Array.isArray(payload?.exercises)) {
    return payload.exercises;
  }

  if (Array.isArray(payload?.lesson?.exercises?.exercises)) {
    return payload.lesson.exercises.exercises;
  }

  if (Array.isArray(payload?.lesson?.exercises)) {
    return payload.lesson.exercises;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
}

function getDuplicatePositiveOrders(list, getOrder) {
  const seen = new Set();
  const duplicates = new Set();

  (list || []).forEach((item) => {
    const order = Number(getOrder(item) || 0);

    if (!Number.isFinite(order) || order <= 0) {
      return;
    }

    if (seen.has(order)) {
      duplicates.add(order);
      return;
    }

    seen.add(order);
  });

  return [...duplicates].sort((a, b) => a - b);
}

function validateDuplicateOrders(list, getOrder, errorMessageBuilder) {
  const duplicates = getDuplicatePositiveOrders(list, getOrder);

  if (duplicates.length) {
    throw new Error(errorMessageBuilder(duplicates));
  }
}

function findOrderConflict(list, order, ignoreId = 0) {
  const normalizedOrder = Number(order || 0);

  if (!Number.isFinite(normalizedOrder) || normalizedOrder <= 0) {
    return null;
  }

  return (list || []).find((item) =>
    Number(item?.order || 0) === normalizedOrder &&
    Number(item?.id || 0) !== Number(ignoreId || 0)
  ) || null;
}

function validateLessonImportPayload(payload) {
  const exercisesList = getImportedExercisesList(payload?.lesson?.exercises || payload?.exercises || payload);
  const exercisesCount = exercisesList.length;

  if (exercisesCount > MAX_EXERCISES_PER_LESSON) {
    throw new Error(`В уроці може бути максимум ${MAX_EXERCISES_PER_LESSON} вправ`);
  }

  validateDuplicateOrders(
    exercisesList,
    (exercise) => exercise?.order,
    (duplicates) => `У вправ уроку повторюються порядкові номери: ${duplicates.join(", ")}`,
  );
}

function validateTopicImportPayload(payload) {
  const lessons = Array.isArray(payload?.lessons) ? payload.lessons : [];

  if (lessons.length > MAX_LESSONS_PER_TOPIC) {
    throw new Error(`У темі може бути максимум ${MAX_LESSONS_PER_TOPIC} уроків`);
  }

  validateDuplicateOrders(
    lessons,
    (lesson) => lesson?.order,
    (duplicates) => `У темі повторюються порядкові номери уроків: ${duplicates.join(", ")}`,
  );

  lessons.forEach((lesson) => {
    const exercisesCount = getImportedExercisesCount(lesson?.exercises || []);

    if (exercisesCount > MAX_EXERCISES_PER_LESSON) {
      throw new Error(`В уроці «${lesson?.title || "Без назви"}» може бути максимум ${MAX_EXERCISES_PER_LESSON} вправ`);
    }

    validateLessonImportPayload({ lesson });
  });
}

function validateCourseImportPayload(payload) {
  const topics = Array.isArray(payload?.topics) ? payload.topics : [];

  if (topics.length > MAX_TOPICS_PER_COURSE) {
    throw new Error(`У курсі може бути максимум ${MAX_TOPICS_PER_COURSE} тем`);
  }

  validateDuplicateOrders(
    topics,
    (topic) => topic?.topic?.order ?? topic?.order,
    (duplicates) => `У курсі повторюються порядкові номери тем: ${duplicates.join(", ")}`,
  );

  topics.forEach((topic) => {
    validateTopicImportPayload(topic);
  });
}

function stringifyExerciseData(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value == null) {
    return "";
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function buildExerciseDtoFromSource(source, fallbackExercise, lessonId, orderValue) {
  const payload = normalizeImportedExercisePayload(source) || {};
  const fallback = fallbackExercise || {};

  return {
    lessonId: Number(lessonId || 0),
    type: String(payload.type ?? fallback.type ?? "MultipleChoice").trim(),
    question: String(payload.question ?? fallback.question ?? "").trim(),
    data: stringifyExerciseData(payload.data ?? fallback.data ?? ""),
    correctAnswer: String(payload.correctAnswer ?? fallback.correctAnswer ?? "").trim(),
    order: Number(orderValue || payload.order || fallback.order || 1),
    imageUrl: String(payload.imageUrl ?? fallback.imageUrl ?? "").trim() || null,
  };
}

function isPreviewSentenceMultipleChoice(exercise) {
  return /_{3,}/.test(String(exercise?.question || "").trim());
}

function getExercisePreviewTitle(exercise) {
  if (!exercise) {
    return "Перегляд вправи";
  }

  if (exercise.type === "MultipleChoice") {
    return isPreviewSentenceMultipleChoice(exercise) ? "Виберіть правильне пропущене слово" : "Виберіть правильний переклад";
  }

  if (exercise.type === "Input") {
    return "Введіть правильну відповідь";
  }

  if (exercise.type === "Match") {
    return "Поєднайте правильні варіанти";
  }

  return "Перегляд вправи";
}

function getExercisePreviewSubtitle(exercise) {
  if (!exercise) {
    return "";
  }

  if (exercise.type === "MultipleChoice") {
    return "1 правильна відповідь";
  }

  if (exercise.type === "Match") {
    return "Оберіть відповідні пари";
  }

  return "";
}

function buildExercisePreviewInputSlots(answer) {
  return Array.from(String(answer || "").trim());
}

function buildExercisePreviewOptions(exercise) {
  const parsed = safeParseJson(exercise?.data);
  const options = [];

  const pushOption = (value) => {
    const nextValue = String(value || "").trim();

    if (!nextValue || options.includes(nextValue)) {
      return;
    }

    options.push(nextValue);
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((item) => {
      if (typeof item === "string") {
        pushOption(item);
        return;
      }

      if (item && typeof item === "object") {
        pushOption(item.text ?? item.label ?? item.option ?? item.answer ?? item.value);
      }
    });
  }

  if (!options.length && parsed && typeof parsed === "object") {
    (parsed.options || parsed.answers || parsed.choices || []).forEach((item) => {
      if (typeof item === "string") {
        pushOption(item);
        return;
      }

      if (item && typeof item === "object") {
        pushOption(item.text ?? item.label ?? item.option ?? item.answer ?? item.value);
      }
    });
  }

  if (!options.length) {
    String(exercise?.data || "")
      .split(/\r?\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach(pushOption);
  }

  pushOption(exercise?.correctAnswer || "");

  return options;
}

function isSceneQuestionStep(step) {
  const stepType = String(step?.stepType || "").trim();
  return stepType === "Choice" || stepType === "Input";
}

function isScenePreviewUserDialogue(step, index = 0) {
  const speaker = String(step?.speaker || "").trim().toLowerCase();

  if (speaker) {
    return speaker === "you" || speaker === "user" || speaker === "learner";
  }

  return index % 2 === 1;
}

function getScenePreviewChoiceOptions(step) {
  const parsed = safeParseJson(step?.choicesJson);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        return String(item.text ?? item.label ?? item.value ?? "").trim();
      }

      return "";
    })
    .filter(Boolean);
}

function getScenePreviewCorrectAnswer(step) {
  const stepType = String(step?.stepType || "").trim();
  const parsed = safeParseJson(step?.choicesJson);

  if (stepType === "Choice") {
    if (!Array.isArray(parsed)) {
      return "";
    }

    const correctItem = parsed.find((item) => item && typeof item === "object" && item.isCorrect);

    if (!correctItem) {
      return "";
    }

    return String(correctItem.text ?? correctItem.label ?? correctItem.value ?? "").trim();
  }

  if (stepType === "Input") {
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return String(parsed.correctAnswer || parsed.answer || "").trim();
    }

    if (typeof parsed === "string") {
      return parsed.trim();
    }
  }

  return "";
}

function normalizeCourseImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const sourceCourse = payload.course && typeof payload.course === "object"
    ? payload.course
    : payload;
  const sourceTopics = Array.isArray(payload.topics)
    ? payload.topics
    : Array.isArray(sourceCourse.topics)
      ? sourceCourse.topics
      : [];

  const course = {
    title: String(sourceCourse?.title || "").trim(),
    description: String(sourceCourse?.description || "").trim(),
    languageCode: String(sourceCourse?.languageCode || "en").trim() || "en",
    level: String(sourceCourse?.level || "").trim(),
    order: Number(sourceCourse?.order || 1),
    prerequisiteCourseId: null,
    isPublished: Boolean(sourceCourse?.isPublished),
  };

  if (!course.title) {
    return null;
  }

  const topics = sourceTopics
    .map((topic, topicIndex) => normalizeTopicImportPayload({
      topic: {
        title: String(topic?.title || topic?.topic?.title || "").trim(),
        order: Number(topic?.order || topic?.topic?.order || topicIndex + 1),
        scene: topic?.scene && typeof topic.scene === "object"
          ? topic.scene
          : topic?.topic?.scene && typeof topic.topic.scene === "object"
            ? topic.topic.scene
            : null,
      },
      lessons: Array.isArray(topic?.lessons)
        ? topic.lessons
        : Array.isArray(topic?.topic?.lessons)
          ? topic.topic.lessons
          : [],
    }))
    .filter(Boolean);

  return {
    course,
    topics,
  };
}

function normalizeTopicImportPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const sourceTopic = payload.topic && typeof payload.topic === "object"
    ? payload.topic
    : payload;
  const sourceLessons = Array.isArray(payload.lessons)
    ? payload.lessons
    : Array.isArray(sourceTopic.lessons)
      ? sourceTopic.lessons
      : [];
  const topicScene = sourceTopic?.scene && typeof sourceTopic.scene === "object"
    ? sourceTopic.scene
    : payload?.scene && typeof payload.scene === "object"
      ? payload.scene
      : null;

  const topic = {
    title: String(sourceTopic?.title || "").trim(),
    order: Number(sourceTopic?.order || 1),
    scene: topicScene
      ? {
        ...topicScene,
        order: Number(topicScene?.order || sourceTopic?.order || 1),
      }
      : null,
  };

  if (!topic.title) {
    return null;
  }

  const lessons = sourceLessons
    .map((lesson, lessonIndex) => ({
      title: String(lesson?.title || "").trim(),
      theory: String(lesson?.theory || "").trim(),
      order: Number(lesson?.order || lessonIndex + 1),
      exercises: normalizeLessonExercisesImportPayload(lesson?.exercises || []),
    }))
    .filter((lesson) => lesson.title);

  return {
    topic,
    lessons,
  };
}

function buildVocabularyForm(item) {
  const normalizedExampleLines = parseVocabularyDisplayLines(Array.isArray(item?.examples) && item.examples.length ? item.examples.join("\n") : item?.example);
  const normalizedTranslations = Array.isArray(item?.translations)
    ? item.translations.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  if (!normalizedTranslations.length && String(item?.translation || "").trim()) {
    normalizedTranslations.push(String(item.translation || "").trim());
  }

  return {
    word: String(item?.word || ""),
    translations: normalizedTranslations.join(", "),
    example: normalizedExampleLines.join("\n"),
    partOfSpeech: String(item?.partOfSpeech || ""),
    definition: String(item?.definition || ""),
    transcription: String(item?.transcription || ""),
    gender: String(item?.gender || ""),
    examples: normalizedExampleLines.join("\n"),
    synonyms: relationsToLines(item?.synonyms),
    idioms: relationsToLines(item?.idioms),
  };
}

function parseVocabularyDisplayLines(value) {
  return String(value || "")
    .replace(/\s*\|\s*/g, "\n")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildVocabularyRelationLines(list) {
  return (list || [])
    .map((item) => {
      const word = String(item?.word || "").trim();
      const translation = String(item?.translation || "").trim();

      if (word && translation) {
        return `${word} - ${translation}`;
      }

      return word || translation;
    })
    .filter(Boolean);
}

function buildVocabularyModalPayload(item) {
  if (!item) {
    return null;
  }

  const normalizedExamples = parseVocabularyDisplayLines(Array.isArray(item?.examples) && item.examples.length ? item.examples.join("\n") : item?.example);
  const normalizedTranslations = Array.isArray(item?.translations)
    ? item.translations.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  if (!normalizedTranslations.length && String(item?.translation || "").trim()) {
    normalizedTranslations.push(String(item.translation || "").trim());
  }

  return {
    ...item,
    examples: normalizedExamples,
    example: normalizedExamples.join("\n"),
    translations: normalizedTranslations,
    synonyms: Array.isArray(item?.synonyms) ? item.synonyms : [],
    idioms: Array.isArray(item?.idioms) ? item.idioms : [],
  };
}

function buildAchievementForm(item) {
  return {
    code: String(item?.code || ""),
    title: String(item?.title || ""),
    description: String(item?.description || ""),
    imageUrl: String(item?.imageUrl || ""),
    conditionType: String(item?.conditionType || ""),
    conditionThreshold: item?.conditionThreshold != null && String(item.conditionThreshold).trim() !== "" ? String(item.conditionThreshold) : "",
  };
}

function buildSceneForm(item) {
  const hasTopic = Boolean(Number(item?.topicId || 0));
  const hasCourse = Boolean(Number(item?.courseId || 0));

  return {
    title: String(item?.title || ""),
    description: String(item?.description || ""),
    sceneType: String(item?.sceneType || (hasTopic ? "Sun" : "Dialog")),
    order: item?.order != null && String(item.order).trim() !== "" ? String(item.order) : (hasCourse ? "1" : ""),
    courseId: item?.courseId ? String(item.courseId) : "",
    topicId: item?.topicId ? String(item.topicId) : "",
    backgroundUrl: String(item?.backgroundUrl || ""),
    audioUrl: String(item?.audioUrl || ""),
  };
}

function buildSceneChoiceItems(value) {
  const parsed = safeParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed.map((item, index) => {
      if (typeof item === "string") {
        return {
          id: index + 1,
          text: item.trim(),
          isCorrect: index === 0,
        };
      }

      if (item && typeof item === "object") {
        return {
          id: index + 1,
          text: String(item.text ?? item.label ?? item.value ?? "").trim(),
          isCorrect: Boolean(item.isCorrect),
        };
      }

      return {
        id: index + 1,
        text: "",
        isCorrect: false,
      };
    }).filter((item) => item.text);
  }

  return String(value || "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item, index) => ({
      id: index + 1,
      text: item,
      isCorrect: index === 0,
    }));
}

function buildSceneInputCorrectAnswer(value) {
  const parsed = safeParseJson(value);

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return String(parsed.correctAnswer || parsed.answer || "").trim();
  }

  if (typeof parsed === "string") {
    return parsed.trim();
  }

  return "";
}

function buildSceneChoicesJsonForSave(stepType, source) {
  const normalizedType = String(stepType || "Line").trim();

  if (normalizedType === "Choice") {
    const items = (source?.choiceItems || [])
      .map((item) => ({
        text: String(item?.text || "").trim(),
        isCorrect: Boolean(item?.isCorrect),
      }))
      .filter((item) => item.text);

    if (!items.length) {
      return null;
    }

    if (!items.some((item) => item.isCorrect)) {
      items[0].isCorrect = true;
    }

    return JSON.stringify(items);
  }

  if (normalizedType === "Input") {
    const correctAnswer = String(source?.inputCorrectAnswer || "").trim();

    if (!correctAnswer) {
      return null;
    }

    return JSON.stringify({ correctAnswer });
  }

  return null;
}

function buildSceneStepForm(item) {
  return {
    order: String(item?.order || 1),
    speaker: String(item?.speaker || "Narrator"),
    text: String(item?.text || ""),
    stepType: String(item?.stepType || "Line"),
    mediaUrl: String(item?.mediaUrl || ""),
    choicesJson: String(item?.choicesJson || ""),
    choiceItems: buildSceneChoiceItems(item?.choicesJson),
    inputCorrectAnswer: buildSceneInputCorrectAnswer(item?.choicesJson),
  };
}

function isSunSceneType(value) {
  return String(value || "").trim().toLowerCase() === "sun";
}

function getSceneTopicConflict(scenes, topicId, ignoreSceneId = 0) {
  const normalizedTopicId = Number(topicId || 0);
  const normalizedIgnoreSceneId = Number(ignoreSceneId || 0);

  if (!normalizedTopicId) {
    return null;
  }

  return (scenes || []).find((item) =>
    Number(item?.topicId || 0) === normalizedTopicId &&
    Number(item?.id || 0) !== normalizedIgnoreSceneId
  ) || null;
}

function validateSceneBeforeSave(dto, scenes, ignoreSceneId = 0) {
  const normalizedCourseId = Number(dto?.courseId || 0);
  const normalizedTopicId = Number(dto?.topicId || 0);
  const normalizedOrder = Number(dto?.order || 0);
  const normalizedSceneType = String(dto?.sceneType || "Dialog").trim();
  const normalizedTitle = String(dto?.title || "").trim();

  if (!normalizedTitle) {
    throw new Error("Вкажи назву сцени");
  }

  if (!SCENE_TYPE_OPTIONS.includes(normalizedSceneType)) {
    throw new Error("Оберіть коректний тип сцени");
  }

  if (normalizedCourseId > 0 && normalizedTopicId <= 0) {
    throw new Error("Для сцени в курсі потрібно обрати тему");
  }

  if (normalizedTopicId > 0 && normalizedCourseId <= 0) {
    throw new Error("Для сцени з темою потрібно обрати курс");
  }

  if (normalizedOrder < 0) {
    throw new Error("Порядок сцени не може бути від'ємним");
  }

  if (normalizedCourseId > 0 && normalizedOrder > MAX_TOPICS_PER_COURSE) {
    throw new Error(`Порядок сцени має бути в межах від 1 до ${MAX_TOPICS_PER_COURSE}`);
  }

  if (normalizedTopicId > 0 && !isSunSceneType(normalizedSceneType)) {
    throw new Error("Для сцени, яка прив'язується до теми, потрібно обрати тип Sun");
  }

  if (normalizedCourseId > 0 && normalizedOrder > 0) {
    const orderConflict = findOrderConflict(
      (scenes || []).filter((item) => Number(item?.courseId || 0) === normalizedCourseId),
      normalizedOrder,
      ignoreSceneId,
    );

    if (orderConflict) {
      throw new Error("Сцена з таким порядком уже існує в цьому курсі");
    }
  }

  const topicConflict = getSceneTopicConflict(scenes, normalizedTopicId, ignoreSceneId);

  if (topicConflict) {
    throw new Error("Для цієї теми вже є сцена");
  }
}

function validateSceneStepBeforeSave(dto, existingSteps = [], ignoreStepId = 0) {
  const normalizedOrder = Number(dto?.order || 0);
  const normalizedStepType = String(dto?.stepType || "Line").trim();
  const normalizedText = String(dto?.text || "").trim();
  const normalizedSpeaker = String(dto?.speaker || "").trim();

  if (!SCENE_STEP_TYPE_OPTIONS.includes(normalizedStepType)) {
    throw new Error("Оберіть коректний тип кроку сцени");
  }

  if (normalizedOrder < 0) {
    throw new Error("Порядок кроку не може бути від'ємним");
  }

  if (!normalizedSpeaker) {
    throw new Error("Вкажи Speaker для цього кроку");
  }

  if (!normalizedText) {
    throw new Error("Вкажи текст кроку");
  }

  if (normalizedOrder > 0) {
    const orderConflict = findOrderConflict(existingSteps, normalizedOrder, ignoreStepId);

    if (orderConflict) {
      throw new Error("Крок з таким порядком уже існує в цій сцені");
    }
  }

  if (normalizedStepType === "Choice") {
    const choiceItems = buildSceneChoiceItems(dto?.choicesJson)
      .map((item) => ({
        text: String(item?.text || "").trim(),
        isCorrect: Boolean(item?.isCorrect),
      }))
      .filter((item) => item.text);

    if (choiceItems.length < 2) {
      throw new Error("Для кроку типу Choice потрібно щонайменше 2 варіанти відповіді");
    }

    if (!choiceItems.some((item) => item.isCorrect)) {
      throw new Error("Для кроку типу Choice потрібно позначити правильний варіант");
    }
  }

  if (normalizedStepType === "Input") {
    const correctAnswer = buildSceneInputCorrectAnswer(dto?.choicesJson);

    if (!correctAnswer) {
      throw new Error("Для кроку типу Input потрібно вказати правильну відповідь");
    }
  }
}

function validateCourseBeforeSave(dto, courses = [], ignoreCourseId = 0) {
  const title = String(dto?.title || "").trim();
  const languageCode = normalizeCode(dto?.languageCode || "en");
  const level = String(dto?.level || "").trim().toUpperCase();
  const order = Number(dto?.order || 0);
  const prerequisiteCourseId = Number(dto?.prerequisiteCourseId || 0);

  if (!title) {
    throw new Error("Вкажи назву курсу");
  }

  if (!LANGUAGE_OPTIONS.some((item) => item.value === languageCode)) {
    throw new Error("Оберіть коректну мову курсу");
  }

  if (level && !LEVEL_OPTIONS.includes(level)) {
    throw new Error("Оберіть коректний рівень курсу");
  }

  if (order < 0) {
    throw new Error("Порядок курсу не може бути від'ємним");
  }

  if (order > 0) {
    const duplicateCourse = (courses || []).find((item) =>
      Number(item?.id || 0) !== Number(ignoreCourseId || 0) &&
      normalizeCode(item?.languageCode || "") === languageCode &&
      Number(item?.order || 0) === order
    );

    if (duplicateCourse) {
      throw new Error("Курс з таким порядком уже існує для цієї мови");
    }
  }

  if (prerequisiteCourseId > 0 && prerequisiteCourseId === Number(ignoreCourseId || 0)) {
    throw new Error("Курс не може бути передумовою сам для себе");
  }
}

function validateTopicBeforeSave(dto) {
  const courseId = Number(dto?.courseId || 0);
  const title = String(dto?.title || "").trim();
  const order = Number(dto?.order || 0);

  if (courseId <= 0) {
    throw new Error("Спочатку оберіть курс");
  }

  if (!title) {
    throw new Error("Вкажи назву теми");
  }

  if (order < 0) {
    throw new Error("Порядок теми не може бути від'ємним");
  }

  if (order > MAX_TOPICS_PER_COURSE) {
    throw new Error(`Порядок теми має бути в межах від 1 до ${MAX_TOPICS_PER_COURSE}`);
  }
}

function validateLessonBeforeSave(dto) {
  const topicId = Number(dto?.topicId || 0);
  const title = String(dto?.title || "").trim();
  const order = Number(dto?.order || 0);

  if (topicId <= 0) {
    throw new Error("Спочатку оберіть тему");
  }

  if (!title) {
    throw new Error("Вкажи назву уроку");
  }

  if (order < 0) {
    throw new Error("Порядок уроку не може бути від'ємним");
  }

  if (order > MAX_LESSONS_PER_TOPIC) {
    throw new Error(`Порядок уроку має бути в межах від 1 до ${MAX_LESSONS_PER_TOPIC}`);
  }
}

function validateExerciseBeforeSave(dto) {
  const lessonId = Number(dto?.lessonId || 0);
  const type = String(dto?.type || "").trim();
  const question = String(dto?.question || "").trim();
  const order = Number(dto?.order || 0);

  if (lessonId <= 0) {
    throw new Error("Спочатку оберіть урок");
  }

  if (!EXERCISE_TYPE_OPTIONS.includes(type)) {
    throw new Error("Оберіть коректний тип вправи");
  }

  if (!question) {
    throw new Error("Вкажи запитання для вправи");
  }

  if (order < 0) {
    throw new Error("Порядок вправи не може бути від'ємним");
  }

  if (order > MAX_EXERCISES_PER_LESSON) {
    throw new Error(`Порядок вправи має бути в межах від 1 до ${MAX_EXERCISES_PER_LESSON}`);
  }
}

function validateVocabularyBeforeSave(dto) {
  const word = String(dto?.word || "").trim();
  const translations = Array.isArray(dto?.translations) ? dto.translations.filter(Boolean) : [];

  if (!word) {
    throw new Error("Вкажи слово");
  }

  if (!translations.length) {
    throw new Error("Вкажи хоча б один переклад");
  }
}

function isSystemAchievementCode(code) {
  return String(code || "").trim().toLowerCase().startsWith("sys.");
}

function normalizeAchievementConditionType(value) {
  const normalized = String(value || "").trim();

  if (!normalized) {
    return "";
  }

  const found = ACHIEVEMENT_CONDITION_OPTIONS.find((item) => item.value === normalized);
  return found ? found.value : "";
}

function formatAchievementConditionSummary(item) {
  const conditionType = normalizeAchievementConditionType(item?.conditionType);
  const threshold = Number(item?.conditionThreshold || 0);

  if (!conditionType || threshold <= 0) {
    return "";
  }

  const option = ACHIEVEMENT_CONDITION_OPTIONS.find((entry) => entry.value === conditionType);
  const label = option?.label || conditionType;

  return `${label}: ${threshold}`;
}

function validateAchievementBeforeSave(dto, achievements = [], ignoreAchievementId = 0) {
  const code = String(dto?.code || "").trim();
  const title = String(dto?.title || "").trim();
  const description = String(dto?.description || "").trim();
  const conditionType = normalizeAchievementConditionType(dto?.conditionType);
  const thresholdRaw = String(dto?.conditionThreshold ?? "").trim();
  const threshold = thresholdRaw ? Number(thresholdRaw) : 0;
  const sourceAchievement = (achievements || []).find((item) => Number(item?.id || 0) === Number(ignoreAchievementId || 0));
  const isSystemAchievement = isSystemAchievementCode(code || sourceAchievement?.code);

  if (!title) {
    throw new Error("Вкажи назву досягнення");
  }

  if (!isSystemAchievement && !description) {
    throw new Error("Вкажи опис досягнення");
  }

  if (code) {
    const duplicateAchievement = (achievements || []).find((item) =>
      Number(item?.id || 0) !== Number(ignoreAchievementId || 0) &&
      String(item?.code || "").trim().toLowerCase() === code.toLowerCase()
    );

    if (duplicateAchievement) {
      throw new Error("Досягнення з таким кодом уже існує");
    }
  }

  if (!isSystemAchievement) {
    if (conditionType && (!Number.isFinite(threshold) || threshold < 1 || !Number.isInteger(threshold))) {
      throw new Error("Поріг автовидачі має бути цілим числом більше нуля");
    }

    if (!conditionType && thresholdRaw) {
      throw new Error("Оберіть умову автовидачі для цього досягнення");
    }
  }
}

function validateSceneImportPayload(payload, scenes) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("JSON сцени має бути об'єктом");
  }

  const dto = {
    courseId: payload.courseId ? Number(payload.courseId) : null,
    topicId: payload.topicId ? Number(payload.topicId) : null,
    order: Number(payload.order || 0),
    title: String(payload.title || "").trim(),
    description: String(payload.description || "").trim(),
    sceneType: String(payload.sceneType || "Dialog").trim(),
    backgroundUrl: String(payload.backgroundUrl || "").trim() || null,
    audioUrl: String(payload.audioUrl || "").trim() || null,
  };

  validateSceneBeforeSave(dto, scenes, 0);

  const steps = Array.isArray(payload.steps) ? payload.steps : [];

  validateDuplicateOrders(
    steps.map((item) => ({ order: Number(item?.order || 0) })).filter((item) => item.order > 0),
    (item) => item.order,
    (duplicates) => `У кроках сцени повторюються порядкові номери: ${duplicates.join(", ")}`,
  );

  steps.forEach((step) => {
    validateSceneStepBeforeSave({
      order: Number(step?.order || 0),
      speaker: String(step?.speaker || "Narrator").trim(),
      text: String(step?.text || "").trim(),
      stepType: String(step?.stepType || "Line").trim(),
      mediaUrl: String(step?.mediaUrl || "").trim() || null,
      choicesJson: String(step?.choicesJson || ""),
    }, steps, 0);
  });
}

function buildSceneCopyForm(scene, targetCourseId = "", targetTopicId = "") {
  return {
    targetCourseId: targetCourseId ? String(targetCourseId) : "",
    targetTopicId: targetTopicId ? String(targetTopicId) : "",
    titleSuffix: String(scene?.titleSuffix || " (копія)"),
  };
}

function buildTopicSceneBindingForm(topic, scene) {
  return {
    topicId: topic?.id ? String(topic.id) : "",
    sceneId: scene?.id ? String(scene.id) : "",
  };
}

function buildTopicDataForm(topic, scene, lesson) {
  return {
    topicId: topic?.id ? String(topic.id) : "",
    title: String(topic?.title || ""),
    order: topic ? String(topic?.order || "") : "",
    sceneId: scene?.id ? String(scene.id) : "",
    lessonId: lesson?.id ? String(lesson.id) : "",
    theory: String(lesson?.theory || ""),
  };
}

function ModalShell({ title, subtitle, children, onClose, compact = false, cardClassName = "", hideTitle = false, topRightContent = null }) {
  return (
    <div className={styles.modalBackdrop} role="presentation">
      <div className={`${styles.modalCard} ${compact ? styles.modalCardCompact : ""} ${cardClassName}`.trim()} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Закрити">
          <span className={styles.addCourseCloseIcon}></span>
        </button>
        {topRightContent ? <div className={styles.modalTopRightContent}>{topRightContent}</div> : null}
        {!hideTitle ? <div className={styles.modalTitle}>{title}</div> : null}
        {subtitle ? <div className={styles.modalSubtitle}>{subtitle}</div> : null}
        {children}
      </div>
    </div>
  );
}

function ToolbarButton({ icon, label, onClick, disabled = false, className = "", imageClassName = "" }) {
  return (
    <button
      type="button"
      className={`${styles.toolbarButton} ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <img src={icon} alt="" className={imageClassName} />
    </button>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const lessonImportInputRef = useRef(null);
  const exerciseImportInputRef = useRef(null);
  const courseImportInputRef = useRef(null);
  const vocabularyImportInputRef = useRef(null);
  const isCourseImportInProgressRef = useRef(false);
  const topicImportInputRef = useRef(null);
  const sceneImportInputRef = useRef(null);
  const lessonDesignerImportInputRef = useRef(null);
  const exerciseDesignerImportInputRef = useRef(null);

  useStageScale(stageRef, { width: 1920, height: 1080, mode: "absolute" });

  const currentAdminUserId = Number(authStorage.getUserId() || 0);
  const initialAdminBootCacheRef = useRef(readAdminBootCache());
  const initialAdminBootCache = initialAdminBootCacheRef.current;
  const hasInitialAdminBootCache = Boolean(initialAdminBootCache);

  const [section, setSection] = useState("courses");
  const [isBootLoading, setIsBootLoading] = useState(!hasInitialAdminBootCache);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });
  const [modal, setModal] = useState(INITIAL_MODAL);
  const addCourseImportRefs = useRef({
    topics: null,
    lessons: null,
    exercises: null,
    scenes: null,
  });
  const [form, setForm] = useState({});
  const [uploadingField, setUploadingField] = useState("");
  const [activeVocabularyEditField, setActiveVocabularyEditField] = useState("");
  const vocabularyEditFieldRefs = useRef({});

  const [courses, setCourses] = useState(() => sortByOrder(initialAdminBootCache?.courses || []));
  const [scenes, setScenes] = useState(() => sortByOrder(initialAdminBootCache?.scenes || []));
  const [achievements, setAchievements] = useState(() => initialAdminBootCache?.achievements || []);
  const [users, setUsers] = useState(() => initialAdminBootCache?.users || []);
  const [tokens, setTokens] = useState(() => readAdminServiceCache("tokens", "all") || []);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [allVocabulary, setAllVocabulary] = useState(() => initialAdminBootCache?.allVocabulary || []);

  const [selectedCourseId, setSelectedCourseId] = useState(0);
  const [selectedTopicId, setSelectedTopicId] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState(0);
  const [selectedExerciseId, setSelectedExerciseId] = useState(0);
  const [selectedVocabularyId, setSelectedVocabularyId] = useState(0);
  const [selectedSceneId, setSelectedSceneId] = useState(() => Number(initialAdminBootCache?.selectedSceneId || initialAdminBootCache?.scenes?.[0]?.id || 0));
  const [selectedSceneStepId, setSelectedSceneStepId] = useState(0);
  const [selectedAchievementId, setSelectedAchievementId] = useState(() => Number(initialAdminBootCache?.selectedAchievementId || initialAdminBootCache?.achievements?.[0]?.id || 0));
  const [selectedAdminUserId, setSelectedAdminUserId] = useState(0);
  const [isAchievementPreviewOpen, setIsAchievementPreviewOpen] = useState(false);
  const [coursesViewMode] = useState("landing");
  const [showCourseLandingDetails, setShowCourseLandingDetails] = useState(false);
  const [showTopicLandingDetails, setShowTopicLandingDetails] = useState(false);
  const [showLessonLandingDetails, setShowLessonLandingDetails] = useState(false);
  const [courseLandingMode, setCourseLandingMode] = useState("");
  const [sceneManagementMode, setSceneManagementMode] = useState("");
  const [inlineSceneForm, setInlineSceneForm] = useState(buildSceneForm(null));
  const [inlineSceneStepForms, setInlineSceneStepForms] = useState({});
  const [isRepeatSelected, setIsRepeatSelected] = useState(false);

  const [courseDetailsMap, setCourseDetailsMap] = useState({});
  const [topicDetailsMap, setTopicDetailsMap] = useState({});
  const [lessonDetailsMap, setLessonDetailsMap] = useState({});
  const [sceneDetailsMap, setSceneDetailsMap] = useState({});
  const [vocabularyLessonMap, setVocabularyLessonMap] = useState({});
  const [vocabularyLanguageMap, setVocabularyLanguageMap] = useState({});
  const [vocabularySearchValue, setVocabularySearchValue] = useState("");
  const [isGeneralVocabularyDeleteMode, setIsGeneralVocabularyDeleteMode] = useState(false);
  const [selectedGeneralVocabularyIds, setSelectedGeneralVocabularyIds] = useState([]);
  const [isGeneralVocabularyExportMode, setIsGeneralVocabularyExportMode] = useState(false);
  const [selectedGeneralVocabularyExportIds, setSelectedGeneralVocabularyExportIds] = useState([]);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(false);
  const [serviceView, setServiceView] = useState("tokens");
  const [mediaSearchValue, setMediaSearchValue] = useState("");
  const [selectedMediaFolder, setSelectedMediaFolder] = useState("all");

  const clearCourseDetailsCache = useCallback((courseId) => {
    setCourseDetailsMap((prev) => removeMapEntry(prev, courseId));
  }, []);

  const clearTopicDetailsCache = useCallback((topicId) => {
    setTopicDetailsMap((prev) => removeMapEntry(prev, topicId));
  }, []);

  const clearLessonBranchCache = useCallback((lessonId) => {
    setLessonDetailsMap((prev) => removeMapEntry(prev, lessonId));
    setVocabularyLessonMap((prev) => removeMapEntry(prev, lessonId));
  }, []);

  const clearSceneDetailsCache = useCallback((sceneId) => {
    setSceneDetailsMap((prev) => removeMapEntry(prev, sceneId));
  }, []);

  const clearTopicBranchCache = useCallback((topicId, lessonIds = []) => {
    clearTopicDetailsCache(topicId);

    for (const lessonId of lessonIds || []) {
      clearLessonBranchCache(lessonId);
    }
  }, [clearLessonBranchCache, clearTopicDetailsCache]);

  const pushToast = useCallback((type, text) => {
    setToast({ type, text });
  }, []);

  const resetGeneralVocabularyDeleteState = useCallback(() => {
    setIsGeneralVocabularyDeleteMode(false);
    setSelectedGeneralVocabularyIds([]);
  }, []);

  const resetGeneralVocabularyExportState = useCallback(() => {
    setIsGeneralVocabularyExportMode(false);
    setSelectedGeneralVocabularyExportIds([]);
  }, []);

  const throwIfOrderConflict = useCallback((list, order, ignoreId, message) => {
    const conflict = findOrderConflict(list, order, ignoreId);

    if (conflict) {
      throw new Error(message);
    }
  }, []);

  const loadTokens = useCallback(async () => {
    const cacheKey = "all";
    const cached = readAdminServiceCache("tokens", cacheKey);

    if (Array.isArray(cached) && cached.length > 0) {
      setTokens(cached);
      setIsTokensLoading(false);
    } else {
      setIsTokensLoading(true);
    }

    try {
      const response = await adminService.getTokens();

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося завантажити токени");
      }

      const nextTokens = response.data || [];
      setTokens(nextTokens);
      writeAdminServiceCache("tokens", cacheKey, nextTokens);
    } catch (error) {
      pushToast("error", error.message || "Помилка завантаження токенів");
    } finally {
      setIsTokensLoading(false);
    }
  }, [pushToast]);

  const loadMediaFiles = useCallback(async (query = mediaSearchValue) => {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    const cacheKey = normalizedQuery || "all";
    const cached = readAdminServiceCache("media", cacheKey);

    if (Array.isArray(cached) && cached.length > 0) {
      setMediaFiles(cached);
      setIsMediaLoading(false);
    } else {
      setIsMediaLoading(true);
    }

    try {
      const response = await adminService.getMediaFiles(query, 0, 500);

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося завантажити медіафайли");
      }

      const nextMediaFiles = response.data || [];
      setMediaFiles(nextMediaFiles);
      writeAdminServiceCache("media", cacheKey, nextMediaFiles);
    } catch (error) {
      pushToast("error", error.message || "Помилка завантаження медіафайлів");
    } finally {
      setIsMediaLoading(false);
    }
  }, [mediaSearchValue, pushToast]);

  useEffect(() => {
    if (!toast.text) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast({ type: "", text: "" });
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadBootData = useCallback(async (showBlocking = true) => {
    if (showBlocking) {
      setIsBootLoading(true);
    }

    try {
      const [coursesRes, scenesRes, achievementsRes, usersRes, vocabularyRes] = await Promise.all([
        adminService.getCourses(),
        adminService.getScenes(),
        adminService.getAchievements(),
        adminService.getUsers(),
        adminService.getVocabulary(),
      ]);

      if (!coursesRes.ok) {
        throw new Error(coursesRes.error || "Не вдалося завантажити курси");
      }

      const nextCourses = sortByOrder(coursesRes.data || []);
      const nextScenes = sortByOrder(scenesRes.ok ? scenesRes.data || [] : []);
      const nextAchievements = achievementsRes.ok ? achievementsRes.data || [] : [];
      const nextUsers = usersRes.ok ? usersRes.data || [] : [];
      const nextVocabulary = vocabularyRes.ok ? vocabularyRes.data || [] : [];

      setCourses(nextCourses);
      setScenes(nextScenes);
      setAchievements(nextAchievements);
      setUsers(nextUsers);
      setAllVocabulary(nextVocabulary);

      if (nextScenes.length > 0) {
        setSelectedSceneId((prev) => prev || Number(nextScenes[0].id));
      }

      if (nextAchievements.length > 0) {
        setSelectedAchievementId((prev) => prev || Number(nextAchievements[0].id));
      }
    } catch (error) {
      pushToast("error", error.message || "Помилка завантаження адмінки");
    } finally {
      setIsBootLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    loadBootData(!hasInitialAdminBootCache);
  }, [hasInitialAdminBootCache, loadBootData]);

  useEffect(() => {
    if (isBootLoading) {
      return;
    }

    writeAdminBootCache({
      courses,
      scenes,
      achievements,
      users,
      allVocabulary,
      selectedSceneId,
      selectedAchievementId,
    });
  }, [achievements, allVocabulary, courses, isBootLoading, scenes, selectedAchievementId, selectedSceneId, users]);

  useEffect(() => {
    if (section !== "service") {
      return undefined;
    }

    if (serviceView === "media") {
      const timer = window.setTimeout(() => {
        loadMediaFiles(mediaSearchValue);
      }, 220);

      return () => window.clearTimeout(timer);
    }

    loadTokens();
    return undefined;
  }, [loadMediaFiles, loadTokens, mediaSearchValue, section, serviceView]);

  const loadCourseDetails = useCallback(async (courseId, force = false) => {
    if (!courseId) {
      return null;
    }

    if (!force && courseDetailsMap[courseId]) {
      return courseDetailsMap[courseId];
    }

    const response = await adminService.getCourseById(courseId);

    if (!response.ok) {
      if (isNotFoundApiResponse(response)) {
        clearCourseDetailsCache(courseId);

        if (Number(selectedCourseId) === Number(courseId)) {
          setSelectedCourseId(0);
          setSelectedTopicId(0);
          setSelectedLessonId(0);
          setSelectedExerciseId(0);
          setSelectedVocabularyId(0);
          setSelectedSceneId(0);
          setSelectedSceneStepId(0);
          setShowCourseLandingDetails(false);
          setShowTopicLandingDetails(false);
          setShowLessonLandingDetails(false);
          setCourseLandingMode("");
          setIsRepeatSelected(false);
        }

        return null;
      }

      throw new Error(response.error || "Не вдалося завантажити курс");
    }

    const data = response.data || null;

    setCourseDetailsMap((prev) => ({
      ...prev,
      [courseId]: data,
    }));

    return data;
  }, [clearCourseDetailsCache, courseDetailsMap, selectedCourseId]);

  const loadTopicDetails = useCallback(async (topicId, force = false) => {
    if (!topicId) {
      return null;
    }

    if (!force && topicDetailsMap[topicId]) {
      return topicDetailsMap[topicId];
    }

    const response = await adminService.getTopicById(topicId);

    if (!response.ok) {
      if (isNotFoundApiResponse(response)) {
        clearTopicDetailsCache(topicId);

        if (Number(selectedTopicId) === Number(topicId)) {
          setSelectedTopicId(0);
          setSelectedLessonId(0);
          setSelectedExerciseId(0);
          setSelectedVocabularyId(0);
          setSelectedSceneId(0);
          setSelectedSceneStepId(0);
          setShowTopicLandingDetails(false);
          setShowLessonLandingDetails(false);
        }

        return null;
      }

      throw new Error(response.error || "Не вдалося завантажити тему");
    }

    const data = response.data || null;

    setTopicDetailsMap((prev) => ({
      ...prev,
      [topicId]: data,
    }));

    return data;
  }, [clearTopicDetailsCache, selectedTopicId, topicDetailsMap]);

  const loadLessonDetails = useCallback(async (lessonId, force = false) => {
    if (!lessonId) {
      return null;
    }

    if (!force && lessonDetailsMap[lessonId]) {
      return lessonDetailsMap[lessonId];
    }

    const response = await adminService.getLessonById(lessonId);

    if (!response.ok) {
      if (isNotFoundApiResponse(response)) {
        clearLessonBranchCache(lessonId);

        if (Number(selectedLessonId) === Number(lessonId)) {
          setSelectedLessonId(0);
          setSelectedExerciseId(0);
          setSelectedVocabularyId(0);
          setShowLessonLandingDetails(false);
        }

        return null;
      }

      throw new Error(response.error || "Не вдалося завантажити урок");
    }

    const data = response.data || null;

    setLessonDetailsMap((prev) => ({
      ...prev,
      [lessonId]: data,
    }));

    return data;
  }, [clearLessonBranchCache, lessonDetailsMap, selectedLessonId]);

  const loadSceneDetails = useCallback(async (sceneId, force = false) => {
    if (!sceneId) {
      return null;
    }

    if (!force && sceneDetailsMap[sceneId]) {
      return sceneDetailsMap[sceneId];
    }

    const response = await adminService.getSceneById(sceneId);

    if (!response.ok) {
      if (isNotFoundApiResponse(response)) {
        clearSceneDetailsCache(sceneId);

        if (Number(selectedSceneId) === Number(sceneId)) {
          setSelectedSceneId(0);
          setSelectedSceneStepId(0);
        }

        return null;
      }

      throw new Error(response.error || "Не вдалося завантажити сцену");
    }

    const data = response.data || null;

    setSceneDetailsMap((prev) => ({
      ...prev,
      [sceneId]: data,
    }));

    return data;
  }, [clearSceneDetailsCache, sceneDetailsMap, selectedSceneId]);

  const loadVocabularyForLesson = useCallback(async (lessonId, force = false) => {
    if (!lessonId) {
      return [];
    }

    if (!force && vocabularyLessonMap[lessonId]) {
      return vocabularyLessonMap[lessonId];
    }

    const response = await adminService.getVocabularyByLesson(lessonId);

    if (!response.ok) {
      if (isNotFoundApiResponse(response)) {
        setVocabularyLessonMap((prev) => removeMapEntry(prev, lessonId));
        return [];
      }

      throw new Error(response.error || "Не вдалося завантажити словник уроку");
    }

    const data = response.data || [];

    setVocabularyLessonMap((prev) => ({
      ...prev,
      [lessonId]: data,
    }));

    return data;
  }, [vocabularyLessonMap]);

  const loadVocabularyByCourseLanguage = useCallback(async (courseId, force = false) => {
    if (!courseId) {
      return [];
    }

    if (!force && vocabularyLanguageMap[courseId]) {
      return vocabularyLanguageMap[courseId];
    }

    const response = await adminService.getVocabularyByCourseLanguage(courseId);

    if (!response.ok) {
      if (isNotFoundApiResponse(response)) {
        setVocabularyLanguageMap((prev) => removeMapEntry(prev, courseId));
        return [];
      }

      throw new Error(response.error || "Не вдалося завантажити загальний словник мови");
    }

    const data = sortVocabularyAlphabetically(response.data || []);

    setVocabularyLanguageMap((prev) => ({
      ...prev,
      [courseId]: data,
    }));

    return data;
  }, [vocabularyLanguageMap]);

  useEffect(() => {
    if (!selectedCourseId) {
      return;
    }

    loadCourseDetails(selectedCourseId).catch((error) => {
      pushToast("error", error.message || "Не вдалося завантажити курс");
    });
  }, [selectedCourseId, loadCourseDetails, pushToast]);

  useEffect(() => {
    if (section !== "vocabulary" || !selectedCourseId) {
      return;
    }

    loadVocabularyByCourseLanguage(selectedCourseId).catch((error) => {
      pushToast("error", error.message || "Не вдалося завантажити загальний словник мови");
    });
  }, [loadVocabularyByCourseLanguage, pushToast, section, selectedCourseId]);

  useEffect(() => {
    setVocabularySearchValue("");
  }, [courseLandingMode, section, selectedCourseId, showCourseLandingDetails]);

  useEffect(() => {
    if (section === "vocabulary" && selectedCourseId && !(showCourseLandingDetails && courseLandingMode === "edit") && !selectedLessonId) {
      return;
    }

    resetGeneralVocabularyDeleteState();
    resetGeneralVocabularyExportState();
  }, [courseLandingMode, resetGeneralVocabularyDeleteState, resetGeneralVocabularyExportState, section, selectedCourseId, selectedLessonId, showCourseLandingDetails]);

  useEffect(() => {
    if (!selectedTopicId) {
      return;
    }

    loadTopicDetails(selectedTopicId).catch((error) => {
      pushToast("error", error.message || "Не вдалося завантажити тему");
    });
  }, [selectedTopicId, loadTopicDetails, pushToast]);

  useEffect(() => {
    if (!selectedLessonId) {
      return;
    }

    loadLessonDetails(selectedLessonId).catch((error) => {
      pushToast("error", error.message || "Не вдалося завантажити урок");
    });

    loadVocabularyForLesson(selectedLessonId).catch((error) => {
      pushToast("error", error.message || "Не вдалося завантажити словник уроку");
    });
  }, [selectedLessonId, loadLessonDetails, loadVocabularyForLesson, pushToast]);

  useEffect(() => {
    if (!selectedSceneId) {
      return;
    }

    loadSceneDetails(selectedSceneId).catch((error) => {
      pushToast("error", error.message || "Не вдалося завантажити сцену");
    });
  }, [selectedSceneId, loadSceneDetails, pushToast]);

  useEffect(() => {
    if (!selectedAdminUserId) {
      return;
    }

    const exists = users.some((item) => Number(item.id) === Number(selectedAdminUserId));

    if (!exists) {
      setSelectedAdminUserId(0);
    }
  }, [selectedAdminUserId, users]);

  const selectedCourse = useMemo(
    () => courses.find((item) => Number(item.id) === Number(selectedCourseId)) || null,
    [courses, selectedCourseId],
  );

  const coursesLandingSlots = useMemo(() => sortByOrder(courses || []), [courses]);

  const selectedCourseDetails = useMemo(
    () => courseDetailsMap[selectedCourseId] || null,
    [courseDetailsMap, selectedCourseId],
  );

  const selectedTopic = useMemo(
    () => (selectedCourseDetails?.topics || []).find((item) => Number(item.id) === Number(selectedTopicId)) || null,
    [selectedCourseDetails, selectedTopicId],
  );

  const selectedTopicDetails = useMemo(
    () => topicDetailsMap[selectedTopicId] || null,
    [topicDetailsMap, selectedTopicId],
  );

  const selectedLesson = useMemo(
    () => (selectedTopicDetails?.lessons || []).find((item) => Number(item.id) === Number(selectedLessonId)) || null,
    [selectedTopicDetails, selectedLessonId],
  );

  const selectedLessonDetails = useMemo(
    () => lessonDetailsMap[selectedLessonId] || null,
    [lessonDetailsMap, selectedLessonId],
  );

  const selectedExercise = useMemo(
    () => (selectedLessonDetails?.exercises || []).find((item) => Number(item.id) === Number(selectedExerciseId)) || null,
    [selectedLessonDetails, selectedExerciseId],
  );

  const selectedVocabulary = useMemo(() => {
    const lessonWords = vocabularyLessonMap[selectedLessonId] || [];
    return lessonWords.find((item) => Number(item.id) === Number(selectedVocabularyId)) || null;
  }, [selectedLessonId, selectedVocabularyId, vocabularyLessonMap]);

  const currentAdminUser = useMemo(
    () => users.find((item) => Number(item.id) === Number(currentAdminUserId)) || null,
    [currentAdminUserId, users],
  );

  const isCurrentPrimaryAdmin = useMemo(
    () => Boolean(currentAdminUser?.isPrimaryAdmin),
    [currentAdminUser],
  );

  const filteredUsers = useMemo(() => {
    const selectedUsers = Number(selectedCourseId)
      ? (users || []).filter((item) => Array.isArray(item?.courseIds) && item.courseIds.some((courseId) => Number(courseId) === Number(selectedCourseId)))
      : [...(users || [])];

    return selectedUsers.sort((a, b) => {
      const compare = getUserTitle(a).localeCompare(getUserTitle(b), "uk", { sensitivity: "base" });

      if (compare !== 0) {
        return compare;
      }

      return Number(a?.id || 0) - Number(b?.id || 0);
    });
  }, [selectedCourseId, users]);

  useEffect(() => {
    if (!selectedAdminUserId) {
      return;
    }

    const existsInVisibleList = filteredUsers.some((item) => Number(item.id) === Number(selectedAdminUserId));

    if (!existsInVisibleList) {
      setSelectedAdminUserId(0);
    }
  }, [filteredUsers, selectedAdminUserId]);

  const selectedAdminUser = useMemo(
    () => filteredUsers.find((item) => Number(item.id) === Number(selectedAdminUserId)) || null,
    [filteredUsers, selectedAdminUserId],
  );

  const filteredScenes = useMemo(() => {
    if (!selectedCourseId) {
      return scenes;
    }

    return scenes.filter((item) => Number(item.courseId || 0) === Number(selectedCourseId));
  }, [scenes, selectedCourseId]);

  const displayedScenes = useMemo(
    () => (selectedCourseId ? sortByOrder(filteredScenes) : sortScenesAlphabetically(filteredScenes)),
    [filteredScenes, selectedCourseId],
  );

  const selectedScene = useMemo(
    () => filteredScenes.find((item) => Number(item.id) === Number(selectedSceneId)) || null,
    [filteredScenes, selectedSceneId],
  );

  const selectedSceneDetails = useMemo(
    () => sceneDetailsMap[selectedSceneId] || null,
    [sceneDetailsMap, selectedSceneId],
  );

  const selectedSceneStep = useMemo(
    () => (selectedSceneDetails?.steps || []).find((item) => Number(item.id) === Number(selectedSceneStepId)) || null,
    [selectedSceneDetails, selectedSceneStepId],
  );

  const selectedAchievement = useMemo(
    () => achievements.find((item) => Number(item.id) === Number(selectedAchievementId)) || null,
    [achievements, selectedAchievementId],
  );

  const achievementPreviewTitle = useMemo(
    () => String(selectedAchievement?.title || "Нова нагорода!").trim() || "Нова нагорода!",
    [selectedAchievement],
  );

  const achievementPreviewMessage = useMemo(() => {
    const description = String(selectedAchievement?.description || "").trim();

    if (description) {
      return description;
    }

    return "Ти отримав нову нагороду за проходження сцени.";
  }, [selectedAchievement]);

  const achievementPreviewImageUrl = useMemo(
    () => resolveMediaUrl(selectedAchievement?.imageUrl),
    [selectedAchievement],
  );

  useEffect(() => {
    if (section !== "achievements" || !selectedAchievement) {
      setIsAchievementPreviewOpen(false);
    }
  }, [section, selectedAchievement]);

  const currentLessonVocabulary = useMemo(
    () => vocabularyLessonMap[selectedLessonId] || [],
    [selectedLessonId, vocabularyLessonMap],
  );

  const currentCourseLanguageVocabulary = useMemo(
    () => sortVocabularyAlphabetically(vocabularyLanguageMap[selectedCourseId] || []),
    [selectedCourseId, vocabularyLanguageMap],
  );

  const normalizedVocabularySearchValue = useMemo(
    () => String(vocabularySearchValue || "").trim().toLowerCase(),
    [vocabularySearchValue],
  );

  const vocabularyLookupPool = useMemo(() => {
    if (selectedCourseId && currentCourseLanguageVocabulary.length) {
      return currentCourseLanguageVocabulary;
    }

    return sortVocabularyAlphabetically(allVocabulary || []);
  }, [allVocabulary, currentCourseLanguageVocabulary, selectedCourseId]);

  const vocabularyExistingMatches = useMemo(() => {
    if (modal.type !== "vocabularyForm" || modal.mode !== "create") {
      return [];
    }

    const normalizedWordValue = String(form.word || "").trim().toLowerCase();

    if (!normalizedWordValue) {
      return [];
    }

    const startsWithMatches = [];
    const includesMatches = [];

    (vocabularyLookupPool || []).forEach((item) => {
      const word = String(item?.word || "").trim().toLowerCase();
      const translation = getPrimaryVocabularyTranslation(item).trim().toLowerCase();

      if (!word && !translation) {
        return;
      }

      if (!word.includes(normalizedWordValue) && !translation.includes(normalizedWordValue)) {
        return;
      }

      if (word.startsWith(normalizedWordValue)) {
        startsWithMatches.push(item);
        return;
      }

      includesMatches.push(item);
    });

    return [...startsWithMatches, ...includesMatches].slice(0, 8);
  }, [form.word, modal.mode, modal.type, vocabularyLookupPool]);

  const filteredCourseLanguageVocabulary = useMemo(() => {
    if (!normalizedVocabularySearchValue) {
      return currentCourseLanguageVocabulary;
    }

    const startsWithMatches = [];
    const includesMatches = [];

    (currentCourseLanguageVocabulary || []).forEach((item) => {
      const word = String(item?.word || "").trim().toLowerCase();

      if (!word.includes(normalizedVocabularySearchValue)) {
        return;
      }

      if (word.startsWith(normalizedVocabularySearchValue)) {
        startsWithMatches.push(item);
        return;
      }

      includesMatches.push(item);
    });

    return [...startsWithMatches, ...includesMatches];
  }, [currentCourseLanguageVocabulary, normalizedVocabularySearchValue]);

  const nextLessonOrder = useMemo(() => {
    const orders = (selectedTopicDetails?.lessons || [])
      .map((item) => Number(item?.order || 0))
      .filter((item) => Number.isFinite(item));

    return (orders.length ? Math.max(...orders) : 0) + 1;
  }, [selectedTopicDetails]);

  const nextExerciseOrder = useMemo(() => {
    const orders = (selectedLessonDetails?.exercises || [])
      .map((item) => Number(item?.order || 0))
      .filter((item) => Number.isFinite(item));

    return (orders.length ? Math.max(...orders) : 0) + 1;
  }, [selectedLessonDetails]);

  const topicsCount = useMemo(
    () => (selectedCourseDetails?.topics || []).length,
    [selectedCourseDetails],
  );

  const lessonsCount = useMemo(
    () => (selectedTopicDetails?.lessons || []).length,
    [selectedTopicDetails],
  );

  const exercisesCount = useMemo(
    () => (selectedLessonDetails?.exercises || []).length,
    [selectedLessonDetails],
  );

  const scenesCount = useMemo(
    () => filteredScenes.filter((item) => Number(item.topicId || 0) === Number(selectedTopicId || 0)).length,
    [filteredScenes, selectedTopicId],
  );

  const currentTopicScene = useMemo(
    () => filteredScenes.find((item) => Number(item.topicId || 0) === Number(selectedTopicId || 0)) || null,
    [filteredScenes, selectedTopicId],
  );

  const topicSceneBindingOptions = useMemo(
    () => filteredScenes.filter((item) => String(item.sceneType || "").trim().toLowerCase() === "sun"),
    [filteredScenes],
  );

  const canCreateTopic = Boolean(selectedCourseId) && topicsCount < 10;
  const canCreateLesson = Boolean(selectedTopicId) && lessonsCount < 8;
  const canCopyLesson = Boolean(selectedLessonId) && lessonsCount < 8;
  const canCreateExercise = Boolean(selectedLessonId) && exercisesCount < 9;
  const canCopyExercise = Boolean(selectedExerciseId) && exercisesCount < 9;
  const canCreateScene = section === "scenes";
  const canCopyScene = Boolean(selectedSceneId);

  useEffect(() => {
    if (!selectedTopicId) {
      setShowTopicLandingDetails(false);
      setShowLessonLandingDetails(false);
      return;
    }

    const hasSelectedTopic = (selectedCourseDetails?.topics || []).some((item) => Number(item.id) === Number(selectedTopicId));

    if (!hasSelectedTopic) {
      setSelectedTopicId(0);
      setSelectedLessonId(0);
      setSelectedExerciseId(0);
      setShowTopicLandingDetails(false);
      setShowLessonLandingDetails(false);
    }
  }, [selectedCourseDetails, selectedTopicId]);

  useEffect(() => {
    if (!selectedLessonId) {
      setShowLessonLandingDetails(false);
      return;
    }

    const hasSelectedLesson = (selectedTopicDetails?.lessons || []).some((item) => Number(item.id) === Number(selectedLessonId));

    if (!hasSelectedLesson) {
      setSelectedLessonId(0);
      setSelectedExerciseId(0);
      setShowLessonLandingDetails(false);
    }
  }, [selectedLessonId, selectedTopicDetails]);

  useEffect(() => {
    if (!selectedExerciseId) {
      return;
    }

    const hasSelectedExercise = (selectedLessonDetails?.exercises || []).some((item) => Number(item.id) === Number(selectedExerciseId));

    if (!hasSelectedExercise) {
      setSelectedExerciseId(0);
    }
  }, [selectedExerciseId, selectedLessonDetails]);

  useEffect(() => {
    if (!selectedVocabularyId) {
      return;
    }

    const hasSelectedVocabulary = currentLessonVocabulary.some((item) => Number(item.id) === Number(selectedVocabularyId));

    if (!hasSelectedVocabulary) {
      setSelectedVocabularyId(0);
    }
  }, [currentLessonVocabulary, selectedVocabularyId]);

  useEffect(() => {
    if (!selectedSceneId) {
      return;
    }

    const hasSelectedScene = filteredScenes.some((item) => Number(item.id) === Number(selectedSceneId));

    if (hasSelectedScene) {
      return;
    }

    setSelectedSceneId(0);
    setSelectedSceneStepId(0);
    setSceneManagementMode("");
  }, [filteredScenes, selectedSceneId]);

  useEffect(() => {
    if (selectedSceneDetails?.steps?.length && !selectedSceneStepId && section === "scenes") {
      setSelectedSceneStepId(Number(selectedSceneDetails.steps[0].id));
    }
  }, [selectedSceneDetails, selectedSceneStepId, section]);

  useEffect(() => {
    if (!selectedSceneDetails) {
      setInlineSceneForm(buildSceneForm(null));
      setInlineSceneStepForms({});
      return;
    }

    setInlineSceneForm(buildSceneForm(selectedSceneDetails));

    const nextStepForms = {};

    for (const item of sortByOrder(selectedSceneDetails.steps || [])) {
      nextStepForms[item.id] = buildSceneStepForm(item);
    }

    setInlineSceneStepForms(nextStepForms);
  }, [selectedSceneDetails]);

  useEffect(() => {
    const courseId = Number(inlineSceneForm.courseId || 0);

    if (!courseId || sceneManagementMode !== "edit" || section !== "scenes") {
      return;
    }

    loadCourseDetails(courseId).catch(() => null);
  }, [inlineSceneForm.courseId, loadCourseDetails, sceneManagementMode, section]);

  useEffect(() => {
    if (section !== "scenes" || selectedSceneId) {
      return;
    }

    setSceneManagementMode("");
  }, [section, selectedSceneId]);

  useEffect(() => {
    if (modal.type !== "sceneCopyForm") {
      return;
    }

    const courseId = Number(form.targetCourseId || 0);

    if (!courseId) {
      return;
    }

    loadCourseDetails(courseId).catch(() => null);
  }, [form.targetCourseId, loadCourseDetails, modal.type]);

  useEffect(() => {
    if (modal.type !== "sceneForm") {
      return;
    }

    const courseId = Number(form.courseId || 0);

    if (!courseId) {
      return;
    }

    loadCourseDetails(courseId).catch(() => null);
  }, [form.courseId, loadCourseDetails, modal.type]);

  useEffect(() => {
    if (modal.type !== "sceneCopyForm") {
      return;
    }

    const courseId = Number(form.targetCourseId || 0);
    const currentTopicId = Number(form.targetTopicId || 0);

    if (!courseId) {
      if (currentTopicId) {
        setForm((prev) => ({
          ...prev,
          targetTopicId: "",
        }));
      }

      return;
    }

    const sourceCourseDetails = courseDetailsMap[courseId] || (Number(selectedCourseId) === Number(courseId) ? selectedCourseDetails : null);

    if (!sourceCourseDetails) {
      return;
    }

    const availableTopics = sortByOrder(sourceCourseDetails?.topics || []).filter((topic) => !scenes.some((scene) => Number(scene.topicId || 0) === Number(topic.id || 0)));

    if (!availableTopics.length) {
      if (currentTopicId) {
        setForm((prev) => ({
          ...prev,
          targetTopicId: "",
        }));
      }

      return;
    }

    const hasCurrentTopic = availableTopics.some((topic) => Number(topic.id || 0) === currentTopicId);

    if (!hasCurrentTopic) {
      setForm((prev) => ({
        ...prev,
        targetTopicId: String(availableTopics[0].id || ""),
      }));
    }
  }, [courseDetailsMap, form.targetCourseId, form.targetTopicId, modal.type, scenes, selectedCourseDetails, selectedCourseId]);

  const resetDeepSelection = useCallback((nextCourseId = 0) => {
    setSelectedCourseId(nextCourseId);
    setSelectedTopicId(0);
    setSelectedLessonId(0);
    setSelectedExerciseId(0);
    setSelectedVocabularyId(0);
    setSelectedSceneId(0);
    setSelectedSceneStepId(0);
    setSceneManagementMode("");
    setShowTopicLandingDetails(false);
    setShowLessonLandingDetails(false);
    setIsRepeatSelected(false);
  }, []);

  const refreshBootCollections = useCallback(async () => {
    const [scenesRes, achievementsRes, usersRes, vocabularyRes, coursesRes] = await Promise.all([
      adminService.getScenes(),
      adminService.getAchievements(),
      adminService.getUsers(),
      adminService.getVocabulary(),
      adminService.getCourses(),
    ]);

    if (coursesRes.ok) {
      setCourses(sortByOrder(coursesRes.data || []));
    }

    if (scenesRes.ok) {
      setScenes(sortByOrder(scenesRes.data || []));
    }

    if (achievementsRes.ok) {
      setAchievements(achievementsRes.data || []);
    }

    if (usersRes.ok) {
      setUsers(usersRes.data || []);
    }

    if (vocabularyRes.ok) {
      setAllVocabulary(vocabularyRes.data || []);
    }
  }, []);

  const reloadCurrentTree = useCallback(async (options = {}) => {
    await refreshBootCollections();

    const skipLessonReload = Boolean(options.skipLessonReload);

    if (selectedCourseId) {
      await loadCourseDetails(selectedCourseId, true);
      await loadVocabularyByCourseLanguage(selectedCourseId, true);
    }

    if (selectedTopicId) {
      await loadTopicDetails(selectedTopicId, true);
    }

    if (selectedLessonId && !skipLessonReload) {
      await loadLessonDetails(selectedLessonId, true);
      await loadVocabularyForLesson(selectedLessonId, true);
    }

    if (selectedSceneId) {
      await loadSceneDetails(selectedSceneId, true);
    }
  }, [
    loadCourseDetails,
    loadMediaFiles,
    loadLessonDetails,
    loadSceneDetails,
    loadTopicDetails,
    loadVocabularyByCourseLanguage,
    loadVocabularyForLesson,
    refreshBootCollections,
    selectedCourseId,
    selectedLessonId,
    selectedSceneId,
    selectedTopicId,
  ]);

  const handleSectionChange = useCallback((nextSection) => {
    setSection(nextSection);
    setModal(INITIAL_MODAL);
    setIsRepeatSelected(false);
    setShowCourseLandingDetails(false);
    setShowTopicLandingDetails(false);
    setShowLessonLandingDetails(false);
    setCourseLandingMode("");
    setSceneManagementMode("");

    if (nextSection !== "courses") {
      setSelectedExerciseId(0);
      setSelectedLessonId(0);
      setSelectedTopicId(0);
    }

    if (nextSection !== "vocabulary") {
      setSelectedVocabularyId(0);
      setShowCourseLandingDetails(false);
      setCourseLandingMode("");
    }

    if (nextSection !== "scenes") {
      setSelectedSceneId(0);
      setSelectedSceneStepId(0);
    }

    if (nextSection !== "users") {
      setSelectedAdminUserId(0);
    }
  }, []);

  const openModal = useCallback((type, mode = "", payload = null, nextForm = null) => {
    setModal({ type, mode, payload });
    setForm(nextForm || {});
    setUploadingField("");
    setActiveVocabularyEditField("");
  }, []);

  const closeModal = useCallback(() => {
    setModal(INITIAL_MODAL);
    setForm({});
    setUploadingField("");
    setActiveVocabularyEditField("");
  }, []);

  const toggleSelectedAdminUser = useCallback((userId) => {
    const normalizedUserId = Number(userId || 0);

    if (!normalizedUserId) {
      return;
    }

    setSelectedAdminUserId((prev) => Number(prev) === normalizedUserId ? 0 : normalizedUserId);
  }, []);

  useEffect(() => {
    if (!modal.type && !isAchievementPreviewOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      event.preventDefault();

      if (isAchievementPreviewOpen) {
        setIsAchievementPreviewOpen(false);
        return;
      }

      closeModal();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, isAchievementPreviewOpen, modal.type]);

  const updateFormField = useCallback((name, value) => {
    setForm((prev) => {
      if (name === "role") {
        const nextRole = String(value || "User");

        if (nextRole === "Admin") {
          return {
            ...prev,
            role: nextRole,
            nativeLanguageCode: "",
            targetLanguageCode: "",
            courseIds: [],
            activeCourseId: "",
          };
        }
      }

      return {
        ...prev,
        [name]: value,
      };
    });
  }, []);

  const toggleUserCourseSelection = useCallback((courseId) => {
    const normalizedCourseId = String(courseId || "").trim();

    if (!normalizedCourseId) {
      return;
    }

    setForm((prev) => {
      const currentIds = Array.isArray(prev.courseIds) ? prev.courseIds.map((item) => String(item)) : [];
      const hasCourse = currentIds.includes(normalizedCourseId);
      const nextCourseIds = hasCourse
        ? currentIds.filter((item) => item !== normalizedCourseId)
        : [...currentIds, normalizedCourseId];
      const nextActiveCourseId = prev.activeCourseId && nextCourseIds.includes(String(prev.activeCourseId))
        ? String(prev.activeCourseId)
        : (nextCourseIds[0] || "");

      const targetCourse = (courses || []).find((item) => Number(item.id) === Number(nextActiveCourseId));

      return {
        ...prev,
        courseIds: nextCourseIds,
        activeCourseId: nextActiveCourseId,
        targetLanguageCode: targetCourse?.languageCode ? String(targetCourse.languageCode) : prev.targetLanguageCode,
      };
    });
  }, [courses]);

  const activateVocabularyEditField = useCallback((fieldName) => {
    setActiveVocabularyEditField(fieldName);

    window.requestAnimationFrame(() => {
      vocabularyEditFieldRefs.current[fieldName]?.focus?.();
    });
  }, []);

  const startUpload = useCallback((fieldName) => {
    setUploadingField(fieldName);
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file || !uploadingField) {
      event.target.value = "";
      return;
    }

    const folderByField = {
      imageUrl: section === "achievements" ? "achievements" : "lessons",
      backgroundUrl: "scenes/backgrounds",
      audioUrl: "scenes/audio",
      mediaUrl: "scenes/steps",
    };

    setIsActionLoading(true);

    try {
      const result = await adminService.uploadFile(file, folderByField[uploadingField] || "uploads");

      if (!result.ok) {
        throw new Error(result.error || "Не вдалося завантажити файл");
      }

      updateFormField(uploadingField, result.data?.url || "");
      pushToast("success", "Файл успішно завантажено");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося завантажити файл");
    } finally {
      setIsActionLoading(false);
      setUploadingField("");
      event.target.value = "";
    }
  }, [pushToast, section, updateFormField, uploadingField]);

  const downloadJsonFile = useCallback((fileName, payload) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const buildCourseExportPayload = useCallback(async (courseId) => {
    const targetCourseId = Number(courseId || 0);

    if (!targetCourseId) {
      throw new Error("Спочатку оберіть курс для експортування");
    }

    const baseCourse = courses.find((item) => Number(item.id) === targetCourseId) || selectedCourse || null;
    const courseDetails = Number(selectedCourseDetails?.id || selectedCourseId || 0) === targetCourseId
      ? selectedCourseDetails
      : await loadCourseDetails(targetCourseId, true);

    if (!baseCourse || !courseDetails) {
      throw new Error("Не вдалося підготувати курс до експорту");
    }

    const courseScenes = scenes.filter((item) => Number(item.courseId || 0) === targetCourseId);
    const topics = sortByOrder(courseDetails?.topics || []);
    const topicPayloads = [];

    for (const topic of topics) {
      const topicDetails = Number(selectedTopicDetails?.id || 0) === Number(topic.id)
        ? selectedTopicDetails
        : topicDetailsMap[topic.id] || await loadTopicDetails(topic.id, true);
      const lessons = sortByOrder(topicDetails?.lessons || []);
      const lessonPayloads = [];

      for (const lesson of lessons) {
        const lessonDetails = Number(selectedLessonDetails?.id || 0) === Number(lesson.id)
          ? selectedLessonDetails
          : lessonDetailsMap[lesson.id] || await loadLessonDetails(lesson.id, true);
        const exercises = sortByOrder(lessonDetails?.exercises || []).map((exercise) => ({
          type: String(exercise?.type || "MultipleChoice"),
          question: String(exercise?.question || ""),
          data: exercise?.data ?? "",
          correctAnswer: String(exercise?.correctAnswer || ""),
          order: Number(exercise?.order || 1),
          imageUrl: String(exercise?.imageUrl || ""),
        }));

        lessonPayloads.push({
          title: String(lessonDetails?.title || lesson?.title || ""),
          theory: String(lessonDetails?.theory || lesson?.theory || ""),
          order: Number(lessonDetails?.order || lesson?.order || 1),
          exercises,
        });
      }

      const topicScene = courseScenes.find((item) => Number(item.topicId || 0) === Number(topic.id));
      let scenePayload = null;

      if (topicScene?.id) {
        const sceneResponse = await adminService.exportScene(topicScene.id);

        if (!sceneResponse.ok) {
          throw new Error(sceneResponse.error || "Не вдалося експортувати сцену теми");
        }

        scenePayload = sceneResponse.data || null;
      }

      topicPayloads.push({
        title: String(topic?.title || ""),
        order: Number(topic?.order || 1),
        lessons: lessonPayloads,
        scene: scenePayload,
      });
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      course: {
        title: String(baseCourse?.title || ""),
        description: String(baseCourse?.description || ""),
        languageCode: String(baseCourse?.languageCode || "en"),
        level: String(baseCourse?.level || ""),
        order: Number(baseCourse?.order || 1),
        prerequisiteCourseId: null,
        isPublished: Boolean(baseCourse?.isPublished),
      },
      topics: topicPayloads,
    };
  }, [
    courses,
    lessonDetailsMap,
    loadCourseDetails,
    loadLessonDetails,
    loadTopicDetails,
    scenes,
    selectedCourse,
    selectedCourseDetails,
    selectedCourseId,
    selectedLessonDetails,
    selectedTopicDetails,
    topicDetailsMap,
  ]);

  const buildTopicExportPayload = useCallback(async (topicId) => {
    const targetTopicId = Number(topicId || 0);

    if (!targetTopicId) {
      throw new Error("Спочатку оберіть тему для експортування");
    }

    if (!selectedCourseId) {
      throw new Error("Спочатку оберіть курс");
    }

    const courseDetails = selectedCourseDetails || await loadCourseDetails(selectedCourseId, true);
    const baseTopic = (courseDetails?.topics || []).find((item) => Number(item.id) === targetTopicId) || selectedTopic || null;
    const topicDetails = Number(selectedTopicDetails?.id || 0) === targetTopicId
      ? selectedTopicDetails
      : topicDetailsMap[targetTopicId] || await loadTopicDetails(targetTopicId, true);

    if (!baseTopic || !topicDetails) {
      throw new Error("Не вдалося підготувати тему до експорту");
    }

    const lessons = sortByOrder(topicDetails?.lessons || []);
    const lessonPayloads = [];

    for (const lesson of lessons) {
      const lessonDetails = Number(selectedLessonDetails?.id || 0) === Number(lesson.id)
        ? selectedLessonDetails
        : lessonDetailsMap[lesson.id] || await loadLessonDetails(lesson.id, true);
      const exercises = sortByOrder(lessonDetails?.exercises || []).map((exercise) => ({
        type: String(exercise?.type || "MultipleChoice"),
        question: String(exercise?.question || ""),
        data: exercise?.data ?? "",
        correctAnswer: String(exercise?.correctAnswer || ""),
        order: Number(exercise?.order || 1),
        imageUrl: String(exercise?.imageUrl || ""),
      }));

      lessonPayloads.push({
        title: String(lessonDetails?.title || lesson?.title || ""),
        theory: String(lessonDetails?.theory || lesson?.theory || ""),
        order: Number(lessonDetails?.order || lesson?.order || 1),
        exercises,
      });
    }

    const topicScene = filteredScenes.find((item) => Number(item.topicId || 0) === targetTopicId) || null;
    let scenePayload = null;

    if (topicScene?.id) {
      const sceneResponse = await adminService.exportScene(topicScene.id);

      if (!sceneResponse.ok) {
        throw new Error(sceneResponse.error || "Не вдалося експортувати сцену теми");
      }

      scenePayload = sceneResponse.data || null;
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      topic: {
        title: String(baseTopic?.title || ""),
        order: Number(baseTopic?.order || 1),
        scene: scenePayload,
      },
      lessons: lessonPayloads,
    };
  }, [
    filteredScenes,
    lessonDetailsMap,
    loadCourseDetails,
    loadLessonDetails,
    loadTopicDetails,
    selectedCourseDetails,
    selectedCourseId,
    selectedLessonDetails,
    selectedTopic,
    selectedTopicDetails,
    topicDetailsMap,
  ]);


  const buildLessonExportPayload = useCallback(async (lessonId) => {
    const targetLessonId = Number(lessonId || 0);

    if (!targetLessonId) {
      throw new Error("Спочатку оберіть урок для експортування");
    }

    const lessonDetails = Number(selectedLessonDetails?.id || 0) === targetLessonId
      ? selectedLessonDetails
      : lessonDetailsMap[targetLessonId] || await loadLessonDetails(targetLessonId, true);

    if (!lessonDetails) {
      throw new Error("Не вдалося підготувати урок до експорту");
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      lesson: {
        title: String(lessonDetails?.title || ""),
        theory: String(lessonDetails?.theory || ""),
        order: Number(lessonDetails?.order || 1),
        exercises: sortByOrder(lessonDetails?.exercises || []).map((exercise) => ({
          type: String(exercise?.type || "MultipleChoice"),
          question: String(exercise?.question || ""),
          data: exercise?.data ?? "",
          correctAnswer: String(exercise?.correctAnswer || ""),
          order: Number(exercise?.order || 1),
          imageUrl: String(exercise?.imageUrl || ""),
        })),
      },
    };
  }, [lessonDetailsMap, loadLessonDetails, selectedLessonDetails]);

  const buildExerciseExportPayload = useCallback(async (exerciseId) => {
    const targetExerciseId = Number(exerciseId || 0);

    if (!targetExerciseId) {
      throw new Error("Спочатку оберіть вправу для експортування");
    }

    let sourceExercise = Number(selectedExerciseId || 0) === targetExerciseId ? selectedExercise : null;

    if (!sourceExercise && Number(selectedLessonId || 0)) {
      const lessonDetails = Number(selectedLessonDetails?.id || 0) === Number(selectedLessonId)
        ? selectedLessonDetails
        : lessonDetailsMap[selectedLessonId] || await loadLessonDetails(selectedLessonId, true);

      sourceExercise = (lessonDetails?.exercises || []).find((item) => Number(item.id) === targetExerciseId) || null;
    }

    if (!sourceExercise) {
      const lessonWithExercise = Object.values(lessonDetailsMap || {}).find((item) => (item?.exercises || []).some((exercise) => Number(exercise.id) === targetExerciseId));
      sourceExercise = (lessonWithExercise?.exercises || []).find((item) => Number(item.id) === targetExerciseId) || null;
    }

    if (!sourceExercise) {
      throw new Error("Не вдалося підготувати вправу до експорту");
    }

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      exercise: {
        type: String(sourceExercise?.type || "MultipleChoice"),
        question: String(sourceExercise?.question || ""),
        data: sourceExercise?.data ?? "",
        correctAnswer: String(sourceExercise?.correctAnswer || ""),
        order: Number(sourceExercise?.order || 1),
        imageUrl: String(sourceExercise?.imageUrl || ""),
      },
    };
  }, [lessonDetailsMap, loadLessonDetails, selectedExercise, selectedExerciseId, selectedLessonDetails, selectedLessonId]);

  const resolveImportedTopicOrder = useCallback(async (courseId, desiredOrder, ignoreTopicId = 0, fallbackOrder = 0) => {
    const normalizedCourseId = Number(courseId || 0);

    if (!normalizedCourseId) {
      return Number(desiredOrder || fallbackOrder || 1);
    }

    const currentCourseDetails = Number(selectedCourseDetails?.id || selectedCourseId || 0) === normalizedCourseId
      ? selectedCourseDetails
      : courseDetailsMap[normalizedCourseId] || await loadCourseDetails(normalizedCourseId, true);
    const usedOrders = new Set(
      sortByOrder(currentCourseDetails?.topics || [])
        .filter((item) => Number(item.id || 0) !== Number(ignoreTopicId || 0))
        .map((item) => Number(item.order || 0))
        .filter((order) => order > 0)
    );
    const normalizedDesiredOrder = Number(desiredOrder || 0);

    if (normalizedDesiredOrder > 0 && !usedOrders.has(normalizedDesiredOrder)) {
      return normalizedDesiredOrder;
    }

    const normalizedFallbackOrder = Number(fallbackOrder || 0);

    if (normalizedFallbackOrder > 0 && !usedOrders.has(normalizedFallbackOrder)) {
      return normalizedFallbackOrder;
    }

    for (let nextOrder = 1; nextOrder <= MAX_TOPICS_PER_COURSE; nextOrder += 1) {
      if (!usedOrders.has(nextOrder)) {
        return nextOrder;
      }
    }

    return normalizedDesiredOrder > 0
      ? normalizedDesiredOrder
      : normalizedFallbackOrder > 0
        ? normalizedFallbackOrder
        : 1;
  }, [courseDetailsMap, loadCourseDetails, selectedCourseDetails, selectedCourseId]);

  const replaceTopicSceneFromImport = useCallback(async (topicId, courseId, topicOrder, scenePayload) => {
    const normalizedTopicId = Number(topicId || 0);
    const normalizedCourseId = Number(courseId || 0);
    const normalizedTopicOrder = Number(topicOrder || 0);

    if (!normalizedTopicId || !normalizedCourseId) {
      return 0;
    }

    const scenesResponse = await adminService.getScenes();
    const latestScenes = scenesResponse.ok ? sortByOrder(scenesResponse.data || []) : scenes;

    const currentScenes = latestScenes.filter((item) => Number(item.topicId || 0) === normalizedTopicId);

    for (const scene of currentScenes) {
      const deleteResponse = await adminService.deleteScene(scene.id);

      if (!deleteResponse.ok && !isNotFoundApiResponse(deleteResponse)) {
        throw new Error(deleteResponse.error || "Не вдалося очистити попередню сцену теми");
      }

      clearSceneDetailsCache(scene.id);
    }

    if (normalizedTopicOrder > 0) {
      const conflictingScenes = latestScenes.filter((item) =>
        Number(item.courseId || 0) === normalizedCourseId &&
        Number(item.order || 0) === normalizedTopicOrder &&
        Number(item.topicId || 0) !== normalizedTopicId
      );

      for (const scene of conflictingScenes) {
        const deleteResponse = await adminService.deleteScene(scene.id);

        if (!deleteResponse.ok && !isNotFoundApiResponse(deleteResponse)) {
          throw new Error(deleteResponse.error || "Не вдалося очистити конфліктну сцену теми");
        }

        clearSceneDetailsCache(scene.id);
      }
    }

    if (!scenePayload || typeof scenePayload !== "object") {
      return 0;
    }

    const importResponse = await adminService.importScene({
      ...scenePayload,
      courseId: normalizedCourseId,
      topicId: normalizedTopicId,
      order: normalizedTopicOrder > 0 ? normalizedTopicOrder : Number(scenePayload?.order || 0),
    });

    if (!importResponse.ok) {
      throw new Error(importResponse.error || "Не вдалося імпортувати сцену");
    }

    const sceneId = Number(importResponse.data?.id || importResponse.data?.sceneId || 0);

    if (!sceneId) {
      return 0;
    }

    const bindResponse = await adminService.assignSceneToTopic(sceneId, { topicId: normalizedTopicId });

    if (!bindResponse.ok) {
      throw new Error(bindResponse.error || "Не вдалося прив'язати сцену до теми");
    }

    return sceneId;
  }, [clearSceneDetailsCache, scenes]);

  const createTopicFromImportedPayload = useCallback(async (courseId, normalizedTopic) => {
    const topicOrder = await resolveImportedTopicOrder(courseId, normalizedTopic.topic.order);
    const response = await adminService.createTopic({
      courseId: Number(courseId),
      title: normalizedTopic.topic.title,
      order: topicOrder,
    });

    if (!response.ok) {
      throw new Error(response.error || `Не вдалося імпортувати тему «${normalizedTopic.topic.title || "Без назви"}»`);
    }

    const createdTopicId = Number(response.data?.id || 0);

    if (!createdTopicId) {
      throw new Error("Не вдалося визначити нову тему після імпорту");
    }

    let firstLessonId = 0;

    for (const lesson of normalizedTopic.lessons || []) {
      const lessonResponse = await adminService.createLesson({
        topicId: createdTopicId,
        title: lesson.title,
        theory: lesson.theory,
        order: Number(lesson.order || 1),
      });

      if (!lessonResponse.ok) {
        throw new Error(lessonResponse.error || `Не вдалося імпортувати урок «${lesson.title || "Без назви"}»`);
      }

      const createdLessonId = Number(lessonResponse.data?.id || 0);

      if (!firstLessonId && createdLessonId) {
        firstLessonId = createdLessonId;
      }

      const exercisesPayload = normalizeLessonExercisesImportPayload(lesson.exercises || []);

      if (createdLessonId && exercisesPayload?.exercises?.length) {
        const importExercisesResponse = await adminService.importLessonExercises(createdLessonId, exercisesPayload);

        if (!importExercisesResponse.ok) {
          throw new Error(importExercisesResponse.error || `Не вдалося імпортувати вправи уроку «${lesson.title || "Без назви"}»`);
        }
      }
    }

    const sceneId = await replaceTopicSceneFromImport(createdTopicId, courseId, topicOrder, normalizedTopic.topic.scene);

    clearTopicDetailsCache(createdTopicId);

    if (firstLessonId) {
      clearLessonBranchCache(firstLessonId);
    }

    return {
      topicId: createdTopicId,
      firstLessonId,
      sceneId,
    };
  }, [clearLessonBranchCache, clearTopicDetailsCache, replaceTopicSceneFromImport, resolveImportedTopicOrder]);

  const replaceTopicFromImportedPayload = useCallback(async (topicId, courseId, normalizedTopic) => {
    const normalizedTopicId = Number(topicId || 0);
    const normalizedCourseId = Number(courseId || 0);

    if (!normalizedTopicId || !normalizedCourseId) {
      throw new Error("Не вдалося визначити тему для імпорту");
    }

    const currentTopic = (selectedCourseDetails?.topics || []).find((item) => Number(item.id || 0) === normalizedTopicId)
      || (courseDetailsMap[normalizedCourseId]?.topics || []).find((item) => Number(item.id || 0) === normalizedTopicId)
      || null;
    const topicOrder = await resolveImportedTopicOrder(
      normalizedCourseId,
      normalizedTopic.topic.order,
      normalizedTopicId,
      Number(currentTopic?.order || 0)
    );
    const topicResponse = await adminService.updateTopic(normalizedTopicId, {
      title: normalizedTopic.topic.title,
      order: topicOrder,
    });

    if (!topicResponse.ok) {
      throw new Error(topicResponse.error || "Не вдалося оновити тему під час імпорту");
    }

    const currentTopicDetails = Number(selectedTopicDetails?.id || 0) === normalizedTopicId
      ? selectedTopicDetails
      : topicDetailsMap[normalizedTopicId] || await loadTopicDetails(normalizedTopicId, true);

    const previousLessonIds = sortByOrder(currentTopicDetails?.lessons || []).map((lesson) => Number(lesson.id || 0)).filter((id) => id > 0);

    clearTopicBranchCache(normalizedTopicId, previousLessonIds);

    if (Number(selectedTopicId) === normalizedTopicId) {
      setSelectedLessonId(0);
      setSelectedExerciseId(0);
      setSelectedVocabularyId(0);
      setShowLessonLandingDetails(false);
    }

    for (const lesson of sortByOrder(currentTopicDetails?.lessons || [])) {
      const deleteResponse = await adminService.deleteLesson(lesson.id);

      if (!deleteResponse.ok && !isNotFoundApiResponse(deleteResponse)) {
        throw new Error(deleteResponse.error || `Не вдалося видалити урок «${lesson.title || "Без назви"}» перед імпортом`);
      }

      clearLessonBranchCache(lesson.id);
    }

    let firstLessonId = 0;

    for (const lesson of normalizedTopic.lessons || []) {
      const lessonResponse = await adminService.createLesson({
        topicId: normalizedTopicId,
        title: lesson.title,
        theory: lesson.theory,
        order: Number(lesson.order || 1),
      });

      if (!lessonResponse.ok) {
        throw new Error(lessonResponse.error || `Не вдалося імпортувати урок «${lesson.title || "Без назви"}»`);
      }

      const createdLessonId = Number(lessonResponse.data?.id || 0);

      if (!firstLessonId && createdLessonId) {
        firstLessonId = createdLessonId;
      }

      const exercisesPayload = normalizeLessonExercisesImportPayload(lesson.exercises || []);

      if (createdLessonId && exercisesPayload?.exercises?.length) {
        const importExercisesResponse = await adminService.importLessonExercises(createdLessonId, exercisesPayload);

        if (!importExercisesResponse.ok) {
          throw new Error(importExercisesResponse.error || `Не вдалося імпортувати вправи уроку «${lesson.title || "Без назви"}»`);
        }
      }
    }

    const sceneId = await replaceTopicSceneFromImport(normalizedTopicId, normalizedCourseId, topicOrder, normalizedTopic.topic.scene);

    clearTopicDetailsCache(normalizedTopicId);

    if (firstLessonId) {
      clearLessonBranchCache(firstLessonId);
    }

    return {
      topicId: normalizedTopicId,
      firstLessonId,
      sceneId,
    };
  }, [clearLessonBranchCache, clearTopicBranchCache, clearTopicDetailsCache, courseDetailsMap, loadTopicDetails, replaceTopicSceneFromImport, resolveImportedTopicOrder, selectedCourseDetails, selectedTopicDetails, selectedTopicId, topicDetailsMap]);

  const replaceCourseFromImportedPayload = useCallback(async (courseId, normalizedCourse) => {
    const normalizedCourseId = Number(courseId || 0);

    if (!normalizedCourseId) {
      throw new Error("Не вдалося визначити курс для імпорту");
    }

    const courseResponse = await adminService.updateCourse(normalizedCourseId, {
      title: normalizedCourse.course.title,
      description: normalizedCourse.course.description,
      languageCode: normalizedCourse.course.languageCode,
      level: normalizedCourse.course.level,
      order: normalizedCourse.course.order,
      prerequisiteCourseId: null,
      isPublished: normalizedCourse.course.isPublished,
    });

    if (!courseResponse.ok) {
      throw new Error(courseResponse.error || "Не вдалося оновити курс під час імпорту");
    }

    const currentCourseDetails = Number(selectedCourseDetails?.id || 0) === normalizedCourseId
      ? selectedCourseDetails
      : courseDetailsMap[normalizedCourseId] || await loadCourseDetails(normalizedCourseId, true);
    const courseScenes = scenes.filter((item) => Number(item.courseId || 0) === normalizedCourseId);
    const previousTopicIds = sortByOrder(currentCourseDetails?.topics || []).map((topic) => Number(topic.id || 0)).filter((id) => id > 0);

    clearCourseDetailsCache(normalizedCourseId);

    for (const topicId of previousTopicIds) {
      const topicDetails = Number(selectedTopicDetails?.id || 0) === topicId
        ? selectedTopicDetails
        : topicDetailsMap[topicId] || null;
      const lessonIds = sortByOrder(topicDetails?.lessons || []).map((lesson) => Number(lesson.id || 0)).filter((id) => id > 0);
      clearTopicBranchCache(topicId, lessonIds);
    }

    for (const scene of courseScenes) {
      const deleteResponse = await adminService.deleteScene(scene.id);

      if (!deleteResponse.ok && !isNotFoundApiResponse(deleteResponse)) {
        throw new Error(deleteResponse.error || `Не вдалося видалити сцену «${scene.title || "Без назви"}» перед імпортом`);
      }

      clearSceneDetailsCache(scene.id);
    }

    for (const topic of sortByOrder(currentCourseDetails?.topics || [])) {
      const deleteResponse = await adminService.deleteTopic(topic.id);

      if (!deleteResponse.ok && !isNotFoundApiResponse(deleteResponse)) {
        throw new Error(deleteResponse.error || `Не вдалося видалити тему «${topic.title || "Без назви"}» перед імпортом`);
      }

      clearTopicDetailsCache(topic.id);
    }

    let firstTopicId = 0;
    let firstLessonId = 0;
    let firstSceneId = 0;

    for (const topic of normalizedCourse.topics || []) {
      const created = await createTopicFromImportedPayload(normalizedCourseId, topic);

      if (!firstTopicId && created.topicId) {
        firstTopicId = created.topicId;
      }

      if (!firstLessonId && created.firstLessonId) {
        firstLessonId = created.firstLessonId;
      }

      if (!firstSceneId && created.sceneId) {
        firstSceneId = created.sceneId;
      }
    }

    return {
      courseId: normalizedCourseId,
      firstTopicId,
      firstLessonId,
      firstSceneId,
    };
  }, [clearCourseDetailsCache, clearSceneDetailsCache, clearTopicBranchCache, clearTopicDetailsCache, courseDetailsMap, createTopicFromImportedPayload, loadCourseDetails, scenes, selectedCourseDetails, selectedTopicDetails, topicDetailsMap]);

  const handleExerciseDesignerFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    try {
      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      const importedExercise = normalizeImportedExercisePayload(parsed);

      if (!importedExercise) {
        throw new Error("Файл вправи має некоректний формат");
      }

      setForm((prev) => ({
        ...prev,
        sourceName: file.name,
        importedJson: textValue,
        type: String(importedExercise.type ?? prev.type ?? "MultipleChoice"),
        question: String(importedExercise.question ?? prev.question ?? ""),
        data: stringifyExerciseData(importedExercise.data ?? prev.data ?? ""),
        correctAnswer: String(importedExercise.correctAnswer ?? prev.correctAnswer ?? ""),
        imageUrl: String(importedExercise.imageUrl ?? prev.imageUrl ?? ""),
      }));

      pushToast("success", "Файл вправи завантажено");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося зчитати файл вправи");
    } finally {
      event.target.value = "";
    }
  }, [pushToast]);


  const handleLessonDesignerFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    try {
      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      const normalized = normalizeLessonExercisesImportPayload(parsed);

      if (!normalized) {
        throw new Error("Файл уроку має некоректний формат");
      }

      setForm((prev) => ({
        ...prev,
        sourceName: file.name,
        importedJson: JSON.stringify(normalized, null, 2),
      }));

      pushToast("success", "Файл вправ уроку завантажено");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося зчитати файл уроку");
    } finally {
      event.target.value = "";
    }
  }, [pushToast]);

  const handleLessonImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    setIsActionLoading(true);

    try {
      if (!selectedTopicId) {
        throw new Error("Спочатку оберіть тему для імпорту уроку");
      }

      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      const fallbackLesson = selectedLessonDetails || selectedLesson || null;
      const normalized = normalizeLessonImportPayload(parsed, fallbackLesson);

      if (!normalized) {
        throw new Error("Файл уроку має некоректний формат");
      }

      validateLessonImportPayload(normalized);

      let targetLessonId = Number(selectedLessonId || 0);

      if (!targetLessonId) {
        if (lessonsCount >= MAX_LESSONS_PER_TOPIC) {
          throw new Error(`У темі вже є ${MAX_LESSONS_PER_TOPIC} уроків. Імпорт більше недоступний`);
        }

        const createResponse = await adminService.createLesson({
          topicId: Number(selectedTopicId),
          title: normalized.lesson.title,
          theory: normalized.lesson.theory,
          order: Number(normalized.lesson.order || nextLessonOrder || 1),
        });

        if (!createResponse.ok) {
          throw new Error(createResponse.error || "Не вдалося імпортувати урок");
        }

        targetLessonId = Number(createResponse.data?.id || 0);
      } else {
        const updateResponse = await adminService.updateLesson(targetLessonId, {
          title: normalized.lesson.title,
          theory: normalized.lesson.theory,
          order: Number(normalized.lesson.order || fallbackLesson?.order || 1),
        });

        if (!updateResponse.ok) {
          throw new Error(updateResponse.error || "Не вдалося оновити урок під час імпорту");
        }
      }

      if (!targetLessonId) {
        throw new Error("Не вдалося визначити урок після імпорту");
      }

      const importResponse = await adminService.importLessonExercises(targetLessonId, normalized.lesson.exercises);

      if (!importResponse.ok) {
        throw new Error(importResponse.error || "Не вдалося імпортувати вправи уроку");
      }

      await loadTopicDetails(selectedTopicId, true);
      setSelectedLessonId(targetLessonId);
      setSelectedExerciseId(0);
      setShowLessonLandingDetails(false);
      await loadLessonDetails(targetLessonId, true);
      pushToast("success", selectedLessonId ? "Урок імпортовано із заміною" : "Урок імпортовано");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Не вдалося імпортувати урок");
    } finally {
      setIsActionLoading(false);
      event.target.value = "";
    }
  }, [closeModal, lessonsCount, loadLessonDetails, loadTopicDetails, nextLessonOrder, pushToast, selectedLesson, selectedLessonDetails, selectedLessonId, selectedTopicId]);

  const handleExerciseImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    setIsActionLoading(true);

    try {
      if (!selectedLessonId) {
        throw new Error("Спочатку оберіть урок для імпорту вправи");
      }

      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      const dto = buildExerciseDtoFromSource(parsed, selectedExercise, selectedLessonId, selectedExercise?.order || nextExerciseOrder || 1);

      let targetExerciseId = Number(selectedExerciseId || 0);
      let response = null;

      if (!targetExerciseId) {
        if (exercisesCount >= MAX_EXERCISES_PER_LESSON) {
          throw new Error(`В уроці вже є ${MAX_EXERCISES_PER_LESSON} вправ. Імпорт більше недоступний`);
        }

        response = await adminService.createExercise(dto);
        targetExerciseId = Number(response.data?.id || 0);
      } else {
        response = await adminService.updateExercise(targetExerciseId, {
          type: dto.type,
          question: dto.question,
          data: dto.data,
          correctAnswer: dto.correctAnswer,
          order: dto.order,
          imageUrl: dto.imageUrl,
        });
      }

      if (!response?.ok) {
        throw new Error(response?.error || "Не вдалося імпортувати вправу");
      }

      await loadLessonDetails(selectedLessonId, true);
      setSelectedExerciseId(targetExerciseId || 0);
      pushToast("success", selectedExerciseId ? "Вправу імпортовано із заміною" : "Вправу імпортовано");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Не вдалося імпортувати вправу");
    } finally {
      setIsActionLoading(false);
      event.target.value = "";
    }
  }, [closeModal, exercisesCount, loadLessonDetails, nextExerciseOrder, pushToast, selectedExercise, selectedExerciseId, selectedLessonId]);

  const handleSceneImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    setIsActionLoading(true);

    try {
      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      validateSceneImportPayload(parsed, scenes);
      const response = await adminService.importScene(parsed);

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося імпортувати сцену");
      }

      await refreshBootCollections();

      const importedSceneId = Number(response.data?.id || response.data?.sceneId || 0);

      if (importedSceneId) {
        setSelectedSceneId(importedSceneId);
        setSelectedSceneStepId(0);
        setSceneManagementMode("");
        await loadSceneDetails(importedSceneId, true).catch(() => null);
      }

      pushToast("success", "Сцену імпортовано");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Не вдалося імпортувати сцену");
    } finally {
      setIsActionLoading(false);
      event.target.value = "";
    }
  }, [closeModal, loadSceneDetails, pushToast, refreshBootCollections]);

  const handleTopicImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    setIsActionLoading(true);

    try {
      if (!selectedCourseId) {
        throw new Error("Спочатку оберіть курс для імпорту теми");
      }

      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      const normalized = normalizeTopicImportPayload(parsed);

      if (!normalized) {
        throw new Error("Файл теми має некоректний формат");
      }

      validateTopicImportPayload(normalized);

      let result = null;

      if (selectedTopicId) {
        result = await replaceTopicFromImportedPayload(selectedTopicId, selectedCourseId, normalized);
      } else {
        if (topicsCount >= MAX_TOPICS_PER_COURSE) {
          throw new Error(`У курсі вже є ${MAX_TOPICS_PER_COURSE} тем. Імпорт більше недоступний`);
        }

        result = await createTopicFromImportedPayload(selectedCourseId, normalized);
      }

      await refreshBootCollections();
      await loadCourseDetails(selectedCourseId, true).catch(() => null);
      resetDeepSelection(selectedCourseId);
      setSelectedTopicId(Number(result?.topicId || 0));
      setSelectedLessonId(Number(result?.firstLessonId || 0));
      setSelectedSceneId(Number(result?.sceneId || 0));

      if (result?.topicId) {
        await loadTopicDetails(Number(result.topicId), true).catch(() => null);
      }

      if (result?.firstLessonId) {
        await loadLessonDetails(Number(result.firstLessonId), true).catch(() => null);
      }

      if (result?.sceneId) {
        await loadSceneDetails(Number(result.sceneId), true).catch(() => null);
      }

      pushToast("success", selectedTopicId ? "Тему імпортовано із заміною" : "Тему імпортовано");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Не вдалося імпортувати тему");
    } finally {
      setIsActionLoading(false);
      event.target.value = "";
    }
  }, [closeModal, createTopicFromImportedPayload, loadCourseDetails, loadLessonDetails, loadSceneDetails, loadTopicDetails, pushToast, refreshBootCollections, replaceTopicFromImportedPayload, resetDeepSelection, selectedCourseId, selectedTopicId, topicsCount]);

  const handleCourseImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      event.target.value = "";
      return;
    }

    if (isCourseImportInProgressRef.current) {
      event.target.value = "";
      return;
    }

    isCourseImportInProgressRef.current = true;
    setIsActionLoading(true);

    let createdCourseId = 0;

    try {
      const textValue = await file.text();
      const parsed = JSON.parse(textValue);
      const normalized = normalizeCourseImportPayload(parsed);

      if (!normalized) {
        throw new Error("Файл курсу має некоректний формат");
      }

      validateCourseImportPayload(normalized);

      const importedTitle = String(normalized.course.title || "").trim();
      const hasCourseWithSameTitle = (title) => {
        const normalizedTitle = String(title || "").trim().toLowerCase();

        if (!normalizedTitle) {
          return false;
        }

        return courses.some((course) => String(course?.title || "").trim().toLowerCase() === normalizedTitle);
      };

      let createdCourseTitle = importedTitle;

      if (hasCourseWithSameTitle(createdCourseTitle)) {
        let copyIndex = 1;
        let nextTitle = `${importedTitle} (копія)`;

        while (hasCourseWithSameTitle(nextTitle)) {
          copyIndex += 1;
          nextTitle = `${importedTitle} (копія ${copyIndex})`;
        }

        createdCourseTitle = nextTitle;
      }

      const nextCourseOrder = courses.reduce((maxValue, course) => {
        const currentOrder = Number(course?.order || 0);

        return currentOrder > maxValue ? currentOrder : maxValue;
      }, 0) + 1;

      const courseResponse = await adminService.createCourse({
        title: createdCourseTitle,
        description: normalized.course.description,
        languageCode: normalized.course.languageCode,
        level: normalized.course.level,
        order: nextCourseOrder,
        prerequisiteCourseId: null,
        isPublished: false,
      });

      if (!courseResponse.ok) {
        throw new Error(courseResponse.error || "Не вдалося імпортувати курс");
      }

      createdCourseId = Number(courseResponse.data?.id || 0);

      if (!createdCourseId) {
        throw new Error("Не вдалося визначити новий курс після імпорту");
      }

      let firstTopicId = 0;
      let firstLessonId = 0;
      let firstSceneId = 0;

      for (const topic of normalized.topics || []) {
        const created = await createTopicFromImportedPayload(createdCourseId, topic);

        if (!firstTopicId && created.topicId) {
          firstTopicId = created.topicId;
        }

        if (!firstLessonId && created.firstLessonId) {
          firstLessonId = created.firstLessonId;
        }

        if (!firstSceneId && created.sceneId) {
          firstSceneId = created.sceneId;
        }
      }

      const result = {
        courseId: createdCourseId,
        firstTopicId,
        firstLessonId,
        firstSceneId,
      };

      await refreshBootCollections();
      resetDeepSelection(createdCourseId);
      setShowCourseLandingDetails(false);
      setCourseLandingMode("");
      await loadCourseDetails(createdCourseId, true).catch(() => null);
      setSelectedTopicId(Number(result.firstTopicId || 0));
      setSelectedLessonId(Number(result.firstLessonId || 0));
      setSelectedSceneId(Number(result.firstSceneId || 0));

      if (result.firstTopicId) {
        await loadTopicDetails(Number(result.firstTopicId), true).catch(() => null);
      }

      if (result.firstLessonId) {
        await loadLessonDetails(Number(result.firstLessonId), true).catch(() => null);
      }

      if (result.firstSceneId) {
        await loadSceneDetails(Number(result.firstSceneId), true).catch(() => null);
      }

      pushToast("success", "Курс імпортовано як новий неопублікований курс");
      closeModal();
    } catch (error) {
      if (createdCourseId) {
        try {
          await adminService.deleteCourse(createdCourseId);
        } catch {
          // nothing
        }
      }

      pushToast("error", error.message || "Не вдалося імпортувати курс");
    } finally {
      isCourseImportInProgressRef.current = false;
      setIsActionLoading(false);
      event.target.value = "";
    }
  }, [closeModal, courses, createTopicFromImportedPayload, loadCourseDetails, loadLessonDetails, loadSceneDetails, loadTopicDetails, pushToast, refreshBootCollections, resetDeepSelection]);

  const loadVocabularyItemDetails = useCallback(async (item) => {
    const vocabularyId = Number(item?.id || 0);

    if (!vocabularyId) {
      return null;
    }

    const response = await adminService.getVocabularyById(vocabularyId);

    if (!response.ok) {
      throw new Error(response.error || "Не вдалося завантажити дані слова");
    }

    return buildVocabularyModalPayload(response.data || item);
  }, []);

  const openVocabularyEditorModal = useCallback(async (item) => {
    if (!item?.id) {
      return;
    }

    setIsActionLoading(true);

    try {
      const vocabularyItem = await loadVocabularyItemDetails(item);

      if (!vocabularyItem) {
        return;
      }

      openModal("vocabularyForm", "edit", vocabularyItem, buildVocabularyForm(vocabularyItem));
    } catch (error) {
      pushToast("error", error.message || "Не вдалося завантажити дані слова");
    } finally {
      setIsActionLoading(false);
    }
  }, [loadVocabularyItemDetails, openModal, pushToast]);

  const toggleGeneralVocabularySelection = useCallback((vocabularyId) => {
    const normalizedId = Number(vocabularyId || 0);

    if (!normalizedId) {
      return;
    }

    setSelectedGeneralVocabularyIds((prev) => (prev.includes(normalizedId)
      ? prev.filter((item) => Number(item) !== normalizedId)
      : [...prev, normalizedId]));
  }, []);

  const toggleGeneralVocabularyExportSelection = useCallback((vocabularyId) => {
    const normalizedId = Number(vocabularyId || 0);

    if (!normalizedId) {
      return;
    }

    setSelectedGeneralVocabularyExportIds((prev) => (prev.includes(normalizedId)
      ? prev.filter((item) => Number(item) !== normalizedId)
      : [...prev, normalizedId]));
  }, []);

  const exportSelectedGeneralVocabulary = useCallback(async () => {
    const ids = [...new Set(selectedGeneralVocabularyExportIds.map((item) => Number(item || 0)).filter(Boolean))];

    if (!ids.length) {
      resetGeneralVocabularyExportState();
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await adminService.exportVocabulary({ ids });

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося експортувати слова");
      }

      const payload = response.data || { items: [] };
      const languageCode = String(selectedCourse?.languageCode || "vocabulary").trim().toLowerCase() || "vocabulary";
      const dateLabel = new Date().toISOString().slice(0, 10);

      downloadJsonFile(`vocabulary-${languageCode}-${dateLabel}.json`, payload);
      resetGeneralVocabularyExportState();
      pushToast("success", ids.length === 1 ? "Слово експортовано" : "Слова експортовано");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося експортувати слова");
    } finally {
      setIsActionLoading(false);
    }
  }, [pushToast, resetGeneralVocabularyExportState, selectedCourse, selectedGeneralVocabularyExportIds]);

  const handleVocabularyImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!selectedCourseId) {
      pushToast("error", "Спочатку оберіть курс");
      event.target.value = "";
      return;
    }

    setIsActionLoading(true);

    try {
      const textValue = await file.text();
      const parsed = safeParseJson(textValue);
      const items = normalizeVocabularyImportItems(parsed);

      if (!items.length) {
        throw new Error("У файлі немає слів для імпорту");
      }

      const response = await adminService.importVocabulary({
        courseId: Number(selectedCourseId),
        items,
      });

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося імпортувати слова");
      }

      await refreshBootCollections();

      if (selectedCourseId) {
        const freshResponse = await adminService.getVocabularyByCourseLanguage(selectedCourseId);
        const freshList = freshResponse.ok ? freshResponse.data || [] : [];
        const importedList = response.data?.items || [];

        setVocabularyLanguageMap((prev) => ({
          ...prev,
          [selectedCourseId]: mergeVocabularyCollections(freshList, importedList),
        }));
      }

      if (selectedLessonId) {
        await loadVocabularyForLesson(selectedLessonId, true).catch(() => null);
      }

      resetGeneralVocabularyExportState();
      resetGeneralVocabularyDeleteState();

      const createdCount = Number(response.data?.createdCount || 0);
      const updatedCount = Number(response.data?.updatedCount || 0);
      const skippedCount = Number(response.data?.skippedCount || 0);
      const summary = [
        createdCount ? `нових: ${createdCount}` : "",
        updatedCount ? `доповнено: ${updatedCount}` : "",
        skippedCount ? `без змін: ${skippedCount}` : "",
      ].filter(Boolean).join(", ");

      pushToast("success", summary ? `Імпорт завершено (${summary})` : "Імпорт завершено");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося імпортувати слова");
    } finally {
      setIsActionLoading(false);
      event.target.value = "";
    }
  }, [loadVocabularyForLesson, pushToast, refreshBootCollections, resetGeneralVocabularyDeleteState, resetGeneralVocabularyExportState, selectedCourseId, selectedLessonId]);

  const handleGeneralVocabularyDeleteAction = useCallback(() => {
    if (!selectedCourseId) {
      return;
    }

    if (!isGeneralVocabularyDeleteMode) {
      resetGeneralVocabularyExportState();
      setIsGeneralVocabularyDeleteMode(true);
      setSelectedGeneralVocabularyIds([]);
      return;
    }

    if (!selectedGeneralVocabularyIds.length) {
      resetGeneralVocabularyDeleteState();
      return;
    }

    openModal("confirmDeleteVocabularyBulk", "", null, { ids: selectedGeneralVocabularyIds });
  }, [isGeneralVocabularyDeleteMode, openModal, resetGeneralVocabularyDeleteState, resetGeneralVocabularyExportState, selectedCourseId, selectedGeneralVocabularyIds]);

  const handleGeneralVocabularyImportExportAction = useCallback(async () => {
    if (!selectedCourseId) {
      return;
    }

    if (isGeneralVocabularyExportMode) {
      await exportSelectedGeneralVocabulary();
      return;
    }

    resetGeneralVocabularyDeleteState();
    openModal("designerImportExport", "vocabulary", { courseId: selectedCourseId || 0 });
  }, [exportSelectedGeneralVocabulary, isGeneralVocabularyExportMode, openModal, resetGeneralVocabularyDeleteState, selectedCourseId]);

  const handleSceneSelection = useCallback((sceneId) => {
    const normalizedSceneId = Number(sceneId || 0);

    if (!normalizedSceneId) {
      setSelectedSceneId(0);
      setSelectedSceneStepId(0);
      setSceneManagementMode("");
      return;
    }

    if (Number(selectedSceneId) === normalizedSceneId) {
      setSelectedSceneId(0);
      setSelectedSceneStepId(0);
      setSceneManagementMode("");
      return;
    }

    setSelectedSceneId(normalizedSceneId);
    setSelectedSceneStepId(0);
    setSceneManagementMode("");
  }, [selectedSceneId]);

  const handleSceneEnterEditMode = useCallback(async () => {
    if (!selectedSceneId) {
      return;
    }

    let sceneDetails = selectedSceneDetails;

    if (!sceneDetails) {
      sceneDetails = await loadSceneDetails(selectedSceneId, true).catch(() => null);
    }

    if (!sceneDetails) {
      pushToast("error", "Не вдалося завантажити сцену для редагування");
      return;
    }

    setSceneManagementMode((prev) => (prev === "edit" ? "" : "edit"));
  }, [loadSceneDetails, pushToast, selectedSceneDetails, selectedSceneId]);

  const handleSceneBackToList = useCallback(() => {
    setSceneManagementMode("");
    setSelectedSceneStepId(0);
  }, []);

  const handleSceneCopyAction = useCallback(async () => {
    if (!selectedSceneId || !selectedScene) {
      return;
    }

    setIsActionLoading(true);

    try {
      const sourceScene = selectedSceneDetails || selectedScene;
      const sourceCourseId = Number(sourceScene?.courseId || 0);
      let sourceCourseDetails = sourceCourseId
        ? courseDetailsMap[sourceCourseId] || (Number(selectedCourseId) === Number(sourceCourseId) ? selectedCourseDetails : null)
        : null;

      if (sourceCourseId && !sourceCourseDetails) {
        sourceCourseDetails = await loadCourseDetails(sourceCourseId, true).catch(() => null);
      }

      const firstAvailableTopic = sortByOrder(sourceCourseDetails?.topics || []).find((topic) => !scenes.some((scene) => Number(scene.topicId || 0) === Number(topic.id || 0))) || null;

      openModal(
        "sceneCopyForm",
        "create",
        sourceScene,
        buildSceneCopyForm(sourceScene, sourceCourseId || "", firstAvailableTopic?.id || ""),
      );
    } catch (error) {
      pushToast("error", error.message || "Не вдалося підготувати копіювання сцени");
    } finally {
      setIsActionLoading(false);
    }
  }, [courseDetailsMap, loadCourseDetails, openModal, pushToast, scenes, selectedCourseDetails, selectedCourseId, selectedScene, selectedSceneDetails, selectedSceneId]);


  const updateInlineSceneField = useCallback((field, value) => {
    setInlineSceneForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const updateInlineSceneStepField = useCallback((stepId, field, value) => {
    const normalizedStepId = Number(stepId || 0);

    if (!normalizedStepId) {
      return;
    }

    setInlineSceneStepForms((prev) => ({
      ...prev,
      [normalizedStepId]: {
        ...(prev[normalizedStepId] || {}),
        [field]: value,
      },
    }));
  }, []);

  const updateInlineSceneChoiceItem = useCallback((stepId, choiceIndex, field, value) => {
    const normalizedStepId = Number(stepId || 0);

    if (!normalizedStepId) {
      return;
    }

    setInlineSceneStepForms((prev) => {
      const currentForm = prev[normalizedStepId] || buildSceneStepForm(null);
      const currentItems = Array.isArray(currentForm.choiceItems) ? [...currentForm.choiceItems] : [];

      if (!currentItems[choiceIndex]) {
        return prev;
      }

      currentItems[choiceIndex] = {
        ...currentItems[choiceIndex],
        [field]: value,
      };

      return {
        ...prev,
        [normalizedStepId]: {
          ...currentForm,
          choiceItems: currentItems,
        },
      };
    });
  }, []);

  const setInlineSceneChoiceCorrect = useCallback((stepId, choiceIndex) => {
    const normalizedStepId = Number(stepId || 0);

    if (!normalizedStepId) {
      return;
    }

    setInlineSceneStepForms((prev) => {
      const currentForm = prev[normalizedStepId] || buildSceneStepForm(null);
      const currentItems = Array.isArray(currentForm.choiceItems)
        ? currentForm.choiceItems.map((item, index) => ({
          ...item,
          isCorrect: index === choiceIndex,
        }))
        : [];

      return {
        ...prev,
        [normalizedStepId]: {
          ...currentForm,
          choiceItems: currentItems,
        },
      };
    });
  }, []);

  const addInlineSceneChoiceItem = useCallback((stepId) => {
    const normalizedStepId = Number(stepId || 0);

    if (!normalizedStepId) {
      return;
    }

    setInlineSceneStepForms((prev) => {
      const currentForm = prev[normalizedStepId] || buildSceneStepForm(null);
      const currentItems = Array.isArray(currentForm.choiceItems) ? [...currentForm.choiceItems] : [];

      currentItems.push({
        id: Date.now() + currentItems.length,
        text: "",
        isCorrect: currentItems.length === 0,
      });

      return {
        ...prev,
        [normalizedStepId]: {
          ...currentForm,
          choiceItems: currentItems,
        },
      };
    });
  }, []);

  const removeInlineSceneChoiceItem = useCallback((stepId, choiceIndex) => {
    const normalizedStepId = Number(stepId || 0);

    if (!normalizedStepId) {
      return;
    }

    setInlineSceneStepForms((prev) => {
      const currentForm = prev[normalizedStepId] || buildSceneStepForm(null);
      const currentItems = Array.isArray(currentForm.choiceItems) ? [...currentForm.choiceItems] : [];

      if (!currentItems[choiceIndex]) {
        return prev;
      }

      currentItems.splice(choiceIndex, 1);

      if (currentItems.length && !currentItems.some((item) => item.isCorrect)) {
        currentItems[0] = {
          ...currentItems[0],
          isCorrect: true,
        };
      }

      return {
        ...prev,
        [normalizedStepId]: {
          ...currentForm,
          choiceItems: currentItems,
        },
      };
    });
  }, []);

  const handleInlineSceneSave = useCallback(async () => {
    if (!selectedSceneId || !selectedSceneDetails) {
      return;
    }

    setIsActionLoading(true);

    try {
      const dto = {
        courseId: inlineSceneForm.courseId ? Number(inlineSceneForm.courseId) : null,
        topicId: inlineSceneForm.topicId ? Number(inlineSceneForm.topicId) : null,
        order: Number(inlineSceneForm.order || (inlineSceneForm.courseId ? 1 : 0)),
        title: String(inlineSceneForm.title || "").trim(),
        description: String(inlineSceneForm.description || "").trim(),
        sceneType: String(inlineSceneForm.sceneType || "Dialog").trim(),
        backgroundUrl: String(inlineSceneForm.backgroundUrl || "").trim() || null,
        audioUrl: String(inlineSceneForm.audioUrl || "").trim() || null,
      };

      validateSceneBeforeSave(dto, scenes, selectedSceneDetails.id);

      const response = await adminService.updateScene(selectedSceneDetails.id, dto);

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося оновити сцену");
      }

      if (dto.courseId) {
        setSelectedCourseId(dto.courseId);
      }

      setSelectedTopicId(dto.topicId || 0);
      await refreshBootCollections();
      await loadSceneDetails(selectedSceneDetails.id, true).catch(() => null);
      pushToast("success", "Сцену оновлено");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося оновити сцену");
    } finally {
      setIsActionLoading(false);
    }
  }, [inlineSceneForm, loadSceneDetails, pushToast, refreshBootCollections, scenes, selectedSceneDetails, selectedSceneId, throwIfOrderConflict]);

  const handleInlineSceneStepSave = useCallback(async (stepId) => {
    const normalizedStepId = Number(stepId || 0);
    const currentStep = (selectedSceneDetails?.steps || []).find((item) => Number(item.id) === normalizedStepId) || null;
    const stepForm = inlineSceneStepForms[normalizedStepId] || buildSceneStepForm(currentStep);

    if (!selectedSceneId || !currentStep) {
      return;
    }

    setIsActionLoading(true);

    try {
      const dto = {
        order: Number(stepForm.order || 1),
        speaker: String(stepForm.speaker || "Narrator").trim(),
        text: String(stepForm.text || "").trim(),
        stepType: String(stepForm.stepType || "Line").trim(),
        mediaUrl: String(stepForm.mediaUrl || "").trim() || null,
        choicesJson: buildSceneChoicesJsonForSave(stepForm.stepType, stepForm),
      };

      validateSceneStepBeforeSave(dto, selectedSceneDetails?.steps || [], normalizedStepId);

      const response = await adminService.updateSceneStep(selectedSceneId, normalizedStepId, dto);

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося оновити крок");
      }

      setSelectedSceneStepId(normalizedStepId);
      await loadSceneDetails(selectedSceneId, true);
      pushToast("success", "Крок оновлено");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося оновити крок");
    } finally {
      setIsActionLoading(false);
    }
  }, [inlineSceneStepForms, loadSceneDetails, pushToast, selectedSceneDetails, selectedSceneId, throwIfOrderConflict]);

  const openCreateByContext = useCallback(() => {
    if (section === "courses") {
      if (selectedLessonId) {
        openModal("exerciseForm", "create", null, buildExerciseForm(null));
        return;
      }

      if (selectedTopicId) {
        openModal("lessonForm", "create", null, buildLessonForm(null));
        return;
      }

      if (selectedCourseId) {
        openModal("topicForm", "create", null, buildTopicForm(null));
        return;
      }

      openModal("courseForm", "create", null, buildCourseForm(null));
      return;
    }

    if (section === "vocabulary") {
      openModal("vocabularyForm", "create", null, buildVocabularyForm(null));
      return;
    }

    if (section === "scenes") {
      openModal("sceneForm", "create", null, buildSceneForm({
        courseId: selectedCourseId || "",
        topicId: selectedTopicId || "",
        order: selectedTopic?.order || "",
        sceneType: selectedTopicId ? "Sun" : "Dialog",
      }));
      return;
    }

    if (section === "achievements") {
      openModal("achievementForm", "create", null, buildAchievementForm(null));
    }
  }, [openModal, section, selectedCourseId, selectedLessonId, selectedTopic, selectedTopicId]);

  const openEditByContext = useCallback(async () => {
    if (section === "courses") {
      if (selectedExerciseId && selectedExercise) {
        openModal("exerciseForm", "edit", selectedExercise, buildExerciseForm(selectedExercise));
        return;
      }

      if (selectedLessonId && selectedLessonDetails) {
        openModal("lessonForm", "edit", selectedLessonDetails, buildLessonForm(selectedLessonDetails));
        return;
      }

      if (selectedTopicId && selectedTopic) {
        openModal("topicForm", "edit", selectedTopic, buildTopicForm(selectedTopic));
        return;
      }

      if (selectedCourseId && selectedCourse) {
        openModal("courseForm", "edit", selectedCourse, buildCourseForm(selectedCourse));
      }

      return;
    }

    if (section === "achievements") {
      if (!selectedAchievement) {
        return;
      }

      openModal("achievementForm", "edit", selectedAchievement, buildAchievementForm(selectedAchievement));
      return;
    }

    if (section === "vocabulary" && selectedVocabulary) {
      try {
        const vocabularyItem = await loadVocabularyItemDetails(selectedVocabulary);

        if (!vocabularyItem) {
          return;
        }

        openModal("vocabularyForm", "edit", vocabularyItem, buildVocabularyForm(vocabularyItem));
      } catch (error) {
        pushToast("error", error.message || "Не вдалося завантажити дані слова");
      }

      return;
    }

    if (section === "scenes") {
      handleSceneEnterEditMode();
      return;
    }
  }, [
    loadVocabularyItemDetails,
    openModal,
    handleSceneEnterEditMode,
    pushToast,
    section,
    selectedAchievement,
    selectedCourse,
    selectedCourseId,
    selectedExercise,
    selectedExerciseId,
    selectedLessonDetails,
    selectedLessonId,
    selectedTopic,
    selectedTopicId,
    selectedVocabulary,
  ]);

  const openDeleteByContext = useCallback(() => {
    if (section === "courses") {
      if (selectedExerciseId && selectedExercise) {
        openModal("confirmDelete", "exercise", selectedExercise);
        return;
      }

      if (selectedLessonId && selectedLessonDetails) {
        openModal("confirmDelete", "lesson", selectedLessonDetails);
        return;
      }

      if (selectedTopicId && selectedTopic) {
        openModal("confirmDelete", "topic", selectedTopic);
        return;
      }

      if (selectedCourseId && selectedCourse) {
        openModal("confirmDelete", "course", selectedCourse);
      }

      return;
    }

    if (section === "achievements") {
      if (!selectedAchievement) {
        return;
      }

      openModal("confirmDelete", "achievement", selectedAchievement);
      return;
    }

    if (section === "vocabulary" && selectedVocabulary) {
      openModal("confirmDelete", "vocabulary", selectedVocabulary);
      return;
    }

    if (section === "scenes" && selectedScene) {
      openModal("confirmDelete", "scene", selectedScene);
      return;
    }
  }, [
    openModal,
    section,
    selectedAchievement,
    selectedCourse,
    selectedCourseId,
    selectedExercise,
    selectedExerciseId,
    selectedLessonDetails,
    selectedLessonId,
    selectedScene,
    selectedTopic,
    selectedTopicId,
    selectedVocabulary,
  ]);

  const handlePreviewAction = useCallback(async () => {
    if (section === "courses" && coursesViewMode === "landing") {
      if (!selectedCourseId) {
        return;
      }

      if (showCourseLandingDetails && courseLandingMode === "preview") {
        setShowCourseLandingDetails(false);
        setCourseLandingMode("");
        return;
      }

      try {
        await loadCourseDetails(selectedCourseId, true);
      } catch (error) {
        pushToast("error", error.message || "Не вдалося завантажити курс");
        return;
      }

      setCourseLandingMode("preview");
      setShowCourseLandingDetails(true);
      return;
    }

    if (section === "courses") {
      if (selectedExerciseId && selectedExercise) {
        const exerciseDetails = await loadLessonDetails(selectedLessonId);
        const item = (exerciseDetails?.exercises || []).find((entry) => Number(entry.id) === Number(selectedExerciseId)) || selectedExercise;
        openModal("exercisePreview", "", item, item);
        return;
      }

      if (selectedLessonId && selectedLessonDetails) {
        openModal("lessonPreview", "", selectedLessonDetails, selectedLessonDetails);
      }

      return;
    }

    if (section === "achievements") {
      if (!selectedAchievement) {
        return;
      }

      setIsAchievementPreviewOpen(true);
      return;
    }

    if (section === "vocabulary" && selectedVocabulary) {
      try {
        const vocabularyItem = await loadVocabularyItemDetails(selectedVocabulary);

        if (!vocabularyItem) {
          return;
        }

        openModal("vocabularyPreview", "", vocabularyItem, vocabularyItem);
      } catch (error) {
        pushToast("error", error.message || "Не вдалося завантажити дані слова");
      }

      return;
    }

    if (section === "scenes") {
      let sceneDetails = selectedSceneDetails;

      if (!sceneDetails && selectedSceneId) {
        sceneDetails = await loadSceneDetails(selectedSceneId, true).catch(() => null);
      }

      if (!sceneDetails) {
        pushToast("error", "Спочатку оберіть сцену для перегляду");
        return;
      }

      openModal("scenePreview", "", sceneDetails, sceneDetails);
    }
  }, [
    courseLandingMode,
    coursesViewMode,
    loadCourseDetails,
    loadLessonDetails,
    loadSceneDetails,
    loadVocabularyItemDetails,
    openModal,
    pushToast,
    section,
    selectedAchievement,
    selectedCourseId,
    selectedExercise,
    selectedExerciseId,
    selectedLessonDetails,
    selectedLessonId,
    selectedSceneDetails,
    selectedSceneId,
    selectedVocabulary,
    showCourseLandingDetails,
  ]);

  const handleImportExportAction = useCallback(async () => {
    if (section === "courses") {
      openModal("designerImportExport", "course", { courseId: selectedCourseId || 0 });
      return;
    }

    if (section === "scenes") {
      openModal("designerImportExport", "scene", { sceneId: selectedSceneId || 0 });
    }
  }, [openModal, section, selectedCourseId, selectedSceneId]);

  const handleCopyAction = useCallback(async () => {
    setIsActionLoading(true);

    try {
      if (section === "courses") {
        if (selectedExerciseId) {
          const response = await adminService.copyExercise(selectedExerciseId, {});

          if (!response.ok) {
            throw new Error(response.error || "Не вдалося скопіювати вправу");
          }

          await loadLessonDetails(selectedLessonId, true);
          pushToast("success", "Вправу скопійовано");
          return;
        }

        if (selectedLessonId) {
          const response = await adminService.copyLesson(selectedLessonId, {});

          if (!response.ok) {
            throw new Error(response.error || "Не вдалося скопіювати урок");
          }

          await loadTopicDetails(selectedTopicId, true);
          pushToast("success", "Урок скопійовано");
        }

        return;
      }

      if (section === "scenes" && selectedSceneId) {
        const response = await adminService.copyScene(selectedSceneId, {});

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося скопіювати сцену");
        }

        await refreshBootCollections();
        pushToast("success", "Сцену скопійовано");
      }
    } catch (error) {
      pushToast("error", error.message || "Помилка копіювання");
    } finally {
      setIsActionLoading(false);
    }
  }, [
    loadLessonDetails,
    loadTopicDetails,
    pushToast,
    refreshBootCollections,
    section,
    selectedExerciseId,
    selectedLessonId,
    selectedSceneId,
    selectedTopicId,
  ]);

  const saveForm = useCallback(async () => {
    setIsActionLoading(true);

    try {
      if (modal.type === "courseForm" || modal.type === "courseManualForm") {
        const dto = {
          title: String(form.title || "").trim(),
          description: String(form.description || "").trim(),
          languageCode: String(form.languageCode || "en").trim(),
          level: String(form.level || "").trim(),
          order: Number(form.order || (form.courseId ? 1 : 0)),
          prerequisiteCourseId: form.prerequisiteCourseId ? Number(form.prerequisiteCourseId) : null,
          isPublished: Boolean(form.isPublished),
        };

        validateCourseBeforeSave(dto, courses, modal.mode === "edit" ? modal.payload?.id : 0);

        const response = modal.mode === "edit"
          ? await adminService.updateCourse(modal.payload.id, dto)
          : await adminService.createCourse(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти курс");
        }

        await refreshBootCollections();
        await loadCourseDetails(selectedCourseId || response.data?.id || 0, true).catch(() => null);
        pushToast("success", modal.mode === "edit" ? "Курс оновлено" : "Курс додано");
        closeModal();
        return;
      }

      if (modal.type === "topicForm" || modal.type === "topicManualForm") {
        const dto = {
          courseId: Number(selectedCourseId),
          title: String(form.title || "").trim(),
          order: Number(form.order || 1),
        };

        validateTopicBeforeSave(dto);

        throwIfOrderConflict(
          selectedCourseDetails?.topics || [],
          dto.order,
          modal.mode === "edit" ? modal.payload?.id : 0,
          "Тема з таким порядком уже існує в цьому курсі",
        );

        const response = modal.mode === "edit"
          ? await adminService.updateTopic(modal.payload.id, { title: dto.title, order: dto.order })
          : await adminService.createTopic(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти тему");
        }

        await loadCourseDetails(selectedCourseId, true);
        pushToast("success", modal.mode === "edit" ? "Тему оновлено" : "Тему додано");
        closeModal();
        return;
      }

      if (modal.type === "topicSceneBindingForm") {
        const sceneId = Number(form.sceneId || 0);
        const topicId = Number(form.topicId || selectedTopicId || modal.payload?.topicId || 0);

        if (!sceneId) {
          throw new Error("Оберіть сцену для теми");
        }

        if (!topicId) {
          throw new Error("Не вдалося визначити тему для сцени");
        }

        const response = await adminService.assignSceneToTopic(sceneId, { topicId });

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося прив'язати сцену до теми");
        }

        await refreshBootCollections();
        await loadCourseDetails(selectedCourseId, true).catch(() => null);
        setSelectedSceneId(sceneId);
        await loadSceneDetails(sceneId, true).catch(() => null);
        pushToast("success", "Сцену теми оновлено");
        closeModal();
        return;
      }

      if (modal.type === "topicDataForm") {
        const topicId = Number(form.topicId || modal.payload?.id || selectedTopicId || 0);

        if (!topicId) {
          throw new Error("Не вдалося визначити тему для збереження");
        }

        validateTopicBeforeSave({
          title: String(form.title || "").trim(),
          order: Number(form.order || 1),
        });

        throwIfOrderConflict(
          selectedCourseDetails?.topics || [],
          Number(form.order || 1),
          topicId,
          "Тема з таким порядком уже існує в цьому курсі",
        );

        const topicResponse = await adminService.updateTopic(topicId, {
          title: String(form.title || "").trim(),
          order: Number(form.order || 1),
        });

        if (!topicResponse.ok) {
          throw new Error(topicResponse.error || "Не вдалося зберегти тему");
        }

        const sceneId = Number(form.sceneId || 0);

        if (sceneId) {
          const sceneResponse = await adminService.assignSceneToTopic(sceneId, { topicId });

          if (!sceneResponse.ok) {
            throw new Error(sceneResponse.error || "Не вдалося прив'язати сцену до теми");
          }
        }

        const lessonId = Number(form.lessonId || modal.payload?.lesson?.id || 0);

        if (lessonId) {
          let sourceLesson = Number(selectedLessonDetails?.id || 0) === Number(lessonId) ? selectedLessonDetails : null;

          if (!sourceLesson && Number(modal.payload?.lesson?.id || 0) === Number(lessonId)) {
            sourceLesson = modal.payload.lesson;
          }

          if (!sourceLesson) {
            sourceLesson = await loadLessonDetails(lessonId, true).catch(() => null);
          }

          if (!sourceLesson) {
            throw new Error("Не вдалося завантажити урок для збереження теорії");
          }

          const lessonResponse = await adminService.updateLesson(lessonId, {
            title: String(sourceLesson.title || "").trim(),
            theory: String(form.theory || "").trim(),
            order: Number(sourceLesson.order || 1),
          });

          if (!lessonResponse.ok) {
            throw new Error(lessonResponse.error || "Не вдалося зберегти теорію теми");
          }
        }

        await refreshBootCollections();
        await loadCourseDetails(selectedCourseId, true).catch(() => null);

        if (sceneId) {
          setSelectedSceneId(sceneId);
          await loadSceneDetails(sceneId, true).catch(() => null);
        }

        if (lessonId) {
          await loadLessonDetails(lessonId, true).catch(() => null);
        }

        pushToast("success", "Дані теми оновлено");
        closeModal();
        return;
      }

      if (modal.type === "courseTitleForm") {
        const courseId = Number(form.courseId || modal.payload?.id || 0);
        const sourceCourse = modal.payload || {};
        validateCourseBeforeSave({
          title: String(form.title || "").trim(),
          description: String(sourceCourse.description || "").trim(),
          languageCode: String(sourceCourse.languageCode || "en").trim(),
          level: String(sourceCourse.level || "").trim(),
          order: Number(sourceCourse.order || 1),
          prerequisiteCourseId: sourceCourse.prerequisiteCourseId ? Number(sourceCourse.prerequisiteCourseId) : null,
        }, courses, courseId);

        const response = await adminService.updateCourse(courseId, {
          title: String(form.title || "").trim(),
          description: String(sourceCourse.description || "").trim(),
          languageCode: String(sourceCourse.languageCode || "en").trim(),
          level: String(sourceCourse.level || "").trim(),
          order: Number(sourceCourse.order || 1),
          prerequisiteCourseId: sourceCourse.prerequisiteCourseId ? Number(sourceCourse.prerequisiteCourseId) : null,
          isPublished: Boolean(sourceCourse.isPublished),
        });

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти курс");
        }

        await refreshBootCollections();
        await loadCourseDetails(courseId, true).catch(() => null);
        setSelectedCourseId(courseId);
        pushToast("success", "Назву курсу оновлено");
        closeModal();
        return;
      }

      if (modal.type === "lessonTitleForm" || modal.type === "lessonTheoryForm") {
        const lessonId = Number(form.lessonId || modal.payload?.id || 0);
        const sourceLesson = modal.payload || {};
        const dto = {
          title: modal.type === "lessonTitleForm"
            ? String(form.title || "").trim()
            : String(sourceLesson.title || "").trim(),
          theory: modal.type === "lessonTheoryForm"
            ? String(form.theory || "").trim()
            : String(sourceLesson.theory || "").trim(),
          order: Number(sourceLesson.order || 1),
        };

        validateLessonBeforeSave({
          topicId: selectedTopicId,
          title: dto.title,
          order: dto.order,
        });

        const response = await adminService.updateLesson(lessonId, dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти урок");
        }

        await loadTopicDetails(selectedTopicId, true);

        if (lessonId) {
          setSelectedLessonId(lessonId);
          await loadLessonDetails(lessonId, true).catch(() => null);
        }

        pushToast("success", modal.type === "lessonTitleForm" ? "Назву уроку оновлено" : "Теорію уроку оновлено");
        closeModal();
        return;
      }

      if (modal.type === "lessonForm" || modal.type === "lessonDesignerForm") {
        const lessonId = Number(form.lessonId || modal.payload?.id || 0);
        const dto = {
          topicId: Number(selectedTopicId),
          title: String(form.title || "").trim(),
          theory: String(form.theory || "").trim(),
          order: Number(form.order || 1),
        };

        validateLessonBeforeSave(dto);

        throwIfOrderConflict(
          selectedTopicDetails?.lessons || [],
          dto.order,
          modal.mode === "edit" ? lessonId : 0,
          "Урок з таким порядком уже існує в цій темі",
        );

        const response = modal.mode === "edit"
          ? await adminService.updateLesson(lessonId, { title: dto.title, theory: dto.theory, order: dto.order })
          : await adminService.createLesson(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти урок");
        }

        const savedLessonId = Number(response.data?.id || lessonId || modal.payload?.id || 0);

        if (modal.type === "lessonDesignerForm" && String(form.importedJson || "").trim() && savedLessonId) {
          const importPayload = normalizeLessonExercisesImportPayload(safeParseJson(form.importedJson || ""));

          if (!importPayload) {
            throw new Error("Файл вправ уроку має некоректний формат");
          }

          const importResponse = await adminService.importLessonExercises(savedLessonId, importPayload);

          if (!importResponse.ok) {
            throw new Error(importResponse.error || "Не вдалося імпортувати вправи уроку");
          }
        }

        await loadTopicDetails(selectedTopicId, true);

        if (savedLessonId) {
          setSelectedLessonId(savedLessonId);
          await loadLessonDetails(savedLessonId, true).catch(() => null);
        }

        pushToast("success", modal.mode === "edit" ? "Урок оновлено" : "Урок додано");
        closeModal();
        return;
      }

      if (modal.type === "exerciseForm" || modal.type === "exerciseManualForm") {
        const normalizedExercisePayload = buildExercisePayloadFromForm(form);
        const dto = {
          lessonId: Number(selectedLessonId),
          type: String(form.type || "MultipleChoice").trim(),
          question: String(form.question || "").trim(),
          data: normalizedExercisePayload.data,
          correctAnswer: normalizedExercisePayload.correctAnswer,
          order: Number(form.order || 1),
          imageUrl: String(form.imageUrl || "").trim() || null,
        };

        validateExerciseBeforeSave(dto);

        throwIfOrderConflict(
          selectedLessonDetails?.exercises || [],
          dto.order,
          modal.mode === "edit" ? modal.payload?.id : 0,
          "Вправа з таким порядком уже існує в цьому уроці",
        );

        const response = modal.mode === "edit"
          ? await adminService.updateExercise(modal.payload.id, {
            type: dto.type,
            question: dto.question,
            data: dto.data,
            correctAnswer: dto.correctAnswer,
            order: dto.order,
            imageUrl: dto.imageUrl,
          })
          : await adminService.createExercise(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти вправу");
        }

        await loadLessonDetails(selectedLessonId, true);
        pushToast("success", modal.mode === "edit" ? "Вправу оновлено" : "Вправу додано");
        closeModal();
        return;
      }

      if (modal.type === "exerciseDesignerForm") {
        const dto = buildExerciseDtoFromSource(
          safeParseJson(form.importedJson || "") || {
            type: form.type,
            question: form.question,
            data: form.data,
            correctAnswer: form.correctAnswer,
            imageUrl: form.imageUrl,
          },
          modal.payload,
          selectedLessonId,
          form.order,
        );

        validateExerciseBeforeSave(dto);

        throwIfOrderConflict(
          selectedLessonDetails?.exercises || [],
          dto.order,
          modal.mode === "edit" ? modal.payload?.id : 0,
          "Вправа з таким порядком уже існує в цьому уроці",
        );

        const response = modal.mode === "edit"
          ? await adminService.updateExercise(modal.payload.id, {
            type: dto.type,
            question: dto.question,
            data: dto.data,
            correctAnswer: dto.correctAnswer,
            order: dto.order,
            imageUrl: dto.imageUrl,
          })
          : await adminService.createExercise(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти вправу");
        }

        await loadLessonDetails(selectedLessonId, true);
        pushToast("success", modal.mode === "edit" ? "Вправу оновлено" : "Вправу додано");
        closeModal();
        return;
      }

      if (modal.type === "vocabularyForm") {
        const normalizedExamples = parseVocabularyDisplayLines(form.example || form.examples || "");
        const dto = {
          word: String(form.word || "").trim(),
          translations: String(form.translations || "").split(",").map((item) => item.trim()).filter(Boolean),
          example: normalizedExamples[0] || null,
          partOfSpeech: String(form.partOfSpeech || "").trim() || null,
          definition: String(form.definition || "").trim() || null,
          transcription: String(form.transcription || "").trim() || null,
          gender: String(form.gender || "").trim() || null,
          examples: normalizedExamples,
          synonyms: parseRelations(form.synonyms),
          idioms: parseRelations(form.idioms),
        };

        validateVocabularyBeforeSave(dto);

        const response = modal.mode === "edit"
          ? await adminService.updateVocabulary(modal.payload.id, dto)
          : await adminService.createVocabulary(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти слово");
        }

        await refreshBootCollections();

        if (selectedCourseId) {
          await loadVocabularyByCourseLanguage(selectedCourseId, true);
        }

        if (selectedLessonId) {
          await loadVocabularyForLesson(selectedLessonId, true);
        }

        pushToast("success", modal.mode === "edit" ? "Слово оновлено" : "Слово додано");
        closeModal();
        return;
      }

      if (modal.type === "mediaRename") {
      const currentFileName = getMediaFileShortName(modal.payload);

      return (
        <ModalShell title="Перейменування файлу" subtitle={currentFileName} onClose={closeModal} compact>
          <label className={styles.formLabel}>Нова назва файлу</label>
          <input
            className={styles.formInput}
            value={form.newFileName || ""}
            onChange={(e) => updateFormField("newFileName", e.target.value)}
            placeholder="Введіть нову назву файлу"
          />
          <div className={styles.fieldHelperText}>Можна вказати назву з розширенням або без нього. Папка і формат файлу залишаться без змін.</div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={saveForm} disabled={isActionLoading || !String(form.newFileName || "").trim()}>
              Зберегти
            </button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "userForm") {
        const validationError = validateAdminUserForm(form, {
          isEditMode: modal.mode === "edit",
          currentUsername: modal.payload?.username || "",
          ignoreUserId: modal.mode === "edit" ? modal.payload?.id : 0,
          users,
        });

        if (validationError) {
          throw new Error(validationError);
        }

        const email = String(form.email || "").trim();
        const password = String(form.password || "");

        if (!email) {
          throw new Error("Вкажіть email користувача");
        }

        if (modal.mode !== "edit" && !password.trim()) {
          throw new Error("Вкажіть пароль для нового користувача");
        }

        const dto = buildUserRequestPayload(form, modal.mode, modal.payload);

        const response = modal.mode === "edit"
          ? await adminService.updateUser(modal.payload.id, dto)
          : await adminService.createUser(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти користувача");
        }

        await refreshBootCollections();
        setSelectedAdminUserId(Number(response.data?.id || modal.payload?.id || 0));
        pushToast("success", modal.mode === "edit" ? "Користувача оновлено" : "Користувача додано");
        closeModal();
        return;
      }

      if (modal.type === "mediaRename") {
        const path = String(form.path || getMediaRelativePath(modal.payload)).trim();
        const newFileName = String(form.newFileName || "").trim();

        if (!path) {
          throw new Error("Не вдалося визначити файл для перейменування");
        }

        if (!newFileName) {
          throw new Error("Вкажіть нову назву файлу");
        }

        const response = await adminService.renameMediaFile(path, newFileName);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося перейменувати файл");
        }

        await loadMediaFiles(mediaSearchValue);
        pushToast("success", "Файл перейменовано");
        closeModal();
        return;
      }

      if (modal.type === "achievementForm") {
        const normalizedConditionType = normalizeAchievementConditionType(form.conditionType);
        const normalizedConditionThreshold = String(form.conditionThreshold ?? "").trim()
          ? Number(form.conditionThreshold)
          : null;
        const dto = {
          code: String(form.code || "").trim() || null,
          title: String(form.title || "").trim(),
          description: String(form.description || "").trim(),
          imageUrl: String(form.imageUrl || "").trim() || null,
          conditionType: normalizedConditionType || null,
          conditionThreshold: normalizedConditionType ? normalizedConditionThreshold : null,
        };

        validateAchievementBeforeSave(dto, achievements, modal.mode === "edit" ? modal.payload?.id : 0);

        const response = modal.mode === "edit"
          ? await adminService.updateAchievement(modal.payload.id, {
            title: dto.title,
            description: dto.description,
            imageUrl: dto.imageUrl,
            conditionType: dto.conditionType,
            conditionThreshold: dto.conditionThreshold,
          })
          : await adminService.createAchievement(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти досягнення");
        }

        await refreshBootCollections();
        pushToast("success", modal.mode === "edit" ? "Досягнення оновлено" : "Досягнення додано");
        closeModal();
        return;
      }

      if (modal.type === "sceneCopyForm") {
        const sourceSceneId = Number(modal.payload?.id || selectedSceneId || 0);
        const targetCourseId = Number(form.targetCourseId || 0);
        const targetTopicId = Number(form.targetTopicId || 0);
        const sourceTopicId = Number(modal.payload?.topicId || 0);
        const titleSuffix = String(form.titleSuffix || "").trim() || " (копія)";

        if (!sourceSceneId) {
          throw new Error("Спочатку оберіть сцену для копіювання");
        }

        if (!targetCourseId) {
          throw new Error("Оберіть курс для копії сцени");
        }

        if (!targetTopicId) {
          throw new Error("Оберіть тему для копії сцени");
        }

        if (sourceTopicId && Number(sourceTopicId) === Number(targetTopicId)) {
          throw new Error("Оберіть іншу тему для копії сцени");
        }

        const topicSceneConflict = getSceneTopicConflict(scenes, targetTopicId, 0);

        if (topicSceneConflict) {
          throw new Error("Для цієї теми вже є сцена");
        }

        const response = await adminService.copyScene(sourceSceneId, {
          targetCourseId,
          targetTopicId,
          titleSuffix,
        });

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося скопіювати сцену");
        }

        await refreshBootCollections();
        await loadCourseDetails(targetCourseId, true).catch(() => null);

        const copiedSceneId = Number(response.data?.id || response.data?.sceneId || 0);

        setSelectedCourseId(targetCourseId);
        setSelectedTopicId(targetTopicId);
        setSelectedSceneStepId(0);
        setSceneManagementMode("");

        if (copiedSceneId) {
          setSelectedSceneId(copiedSceneId);
          await loadSceneDetails(copiedSceneId, true).catch(() => null);
        }

        openModal("copiedInfo", "scene", response.data || null);
        return;
      }

      if (modal.type === "sceneForm") {
        const dto = {
          courseId: form.courseId ? Number(form.courseId) : null,
          topicId: form.topicId ? Number(form.topicId) : null,
          order: Number(form.order || (form.courseId ? 1 : 0)),
          title: String(form.title || "").trim(),
          description: String(form.description || "").trim(),
          sceneType: String(form.sceneType || "Dialog").trim(),
          backgroundUrl: String(form.backgroundUrl || "").trim() || null,
          audioUrl: String(form.audioUrl || "").trim() || null,
          steps: [],
        };

        validateSceneBeforeSave(dto, scenes, modal.mode === "edit" ? modal.payload?.id : 0);

        const response = modal.mode === "edit"
          ? await adminService.updateScene(modal.payload.id, {
            courseId: dto.courseId,
            topicId: dto.topicId,
            order: dto.order,
            title: dto.title,
            description: dto.description,
            sceneType: dto.sceneType,
            backgroundUrl: dto.backgroundUrl,
            audioUrl: dto.audioUrl,
          })
          : await adminService.createScene(dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти сцену");
        }

        await refreshBootCollections();
        const savedSceneId = Number(response.data?.id || modal.payload?.id || selectedSceneId || 0);

        if (savedSceneId) {
          setSelectedSceneId(savedSceneId);
          await loadSceneDetails(savedSceneId, true).catch(() => null);
        }
        pushToast("success", modal.mode === "edit" ? "Сцену оновлено" : "Сцену додано");
        closeModal();
        return;
      }

      if (modal.type === "sceneStepForm") {
        const dto = {
          order: Number(form.order || 1),
          speaker: String(form.speaker || "Narrator").trim(),
          text: String(form.text || "").trim(),
          stepType: String(form.stepType || "Line").trim(),
          mediaUrl: String(form.mediaUrl || "").trim() || null,
          choicesJson: buildSceneChoicesJsonForSave(form.stepType, form),
        };

        throwIfOrderConflict(
          selectedSceneDetails?.steps || [],
          dto.order,
          modal.mode === "edit" ? modal.payload?.id : 0,
          "Крок з таким порядком уже існує в цій сцені",
        );

        validateSceneStepBeforeSave(dto, selectedSceneDetails?.steps || [], modal.mode === "edit" ? modal.payload?.id : 0);

        const response = modal.mode === "edit"
          ? await adminService.updateSceneStep(selectedSceneId, modal.payload.id, dto)
          : await adminService.addSceneStep(selectedSceneId, dto);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося зберегти крок");
        }

        await loadSceneDetails(selectedSceneId, true);
        pushToast("success", modal.mode === "edit" ? "Крок оновлено" : "Крок додано");
        closeModal();
        return;
      }

      if (modal.type === "lessonImportExport") {
        const parsed = JSON.parse(String(form.json || "{}"));
        const response = await adminService.importLessonExercises(selectedLessonId, parsed);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося імпортувати вправи");
        }

        await loadLessonDetails(selectedLessonId, true);
        pushToast("success", "Вправи імпортовано");
        closeModal();
        return;
      }

      if (modal.type === "sceneJson") {
        const parsed = JSON.parse(String(form.json || "{}"));
        validateSceneImportPayload(parsed, scenes);
        const response = await adminService.importScene(parsed);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося імпортувати сцену");
        }

        await refreshBootCollections();
        pushToast("success", "Сцену імпортовано");
        closeModal();
        return;
      }

      if (modal.type === "reorderExercises") {
        const items = (form.items || []).map((item) => ({
          id: Number(item.id),
          order: Number(item.order || 1),
        }));

        validateDuplicateOrders(
          items,
          (item) => item.order,
          (duplicates) => `У вправах повторюються порядкові номери: ${duplicates.join(", ")}`,
        );

        for (const item of items) {
          const current = (selectedLessonDetails?.exercises || []).find((entry) => Number(entry.id) === Number(item.id));

          if (!current) {
            continue;
          }

          const tempResponse = await adminService.updateExercise(item.id, {
            type: current.type,
            question: current.question,
            data: current.data,
            correctAnswer: current.correctAnswer,
            order: 0,
            imageUrl: current.imageUrl,
          });

          if (!tempResponse.ok) {
            throw new Error(tempResponse.error || "Не вдалося підготувати зміну порядку вправ");
          }
        }

        for (const item of items) {
          const current = (selectedLessonDetails?.exercises || []).find((entry) => Number(entry.id) === Number(item.id));

          if (!current) {
            continue;
          }

          const response = await adminService.updateExercise(item.id, {
            type: current.type,
            question: current.question,
            data: current.data,
            correctAnswer: current.correctAnswer,
            order: item.order,
            imageUrl: current.imageUrl,
          });

          if (!response.ok) {
            throw new Error(response.error || "Не вдалося змінити порядок вправ");
          }
        }

        await loadLessonDetails(selectedLessonId, true);
        pushToast("success", "Порядок вправ оновлено");
        closeModal();
        return;
      }

      if (modal.type === "reorderSceneSteps") {
        const items = (form.items || []).map((item) => ({
          id: Number(item.id),
          order: Number(item.order || 1),
        }));

        validateDuplicateOrders(
          items,
          (item) => item.order,
          (duplicates) => `У кроках сцени повторюються порядкові номери: ${duplicates.join(", ")}`,
        );

        for (const item of items) {
          const current = (selectedSceneDetails?.steps || []).find((entry) => Number(entry.id) === Number(item.id));

          if (!current) {
            continue;
          }

          const tempResponse = await adminService.updateSceneStep(selectedSceneId, item.id, {
            order: 0,
            speaker: current.speaker,
            text: current.text,
            stepType: current.stepType,
            mediaUrl: current.mediaUrl,
            choicesJson: current.choicesJson,
          });

          if (!tempResponse.ok) {
            throw new Error(tempResponse.error || "Не вдалося підготувати зміну порядку кроків");
          }
        }

        for (const item of items) {
          const current = (selectedSceneDetails?.steps || []).find((entry) => Number(entry.id) === Number(item.id));

          if (!current) {
            continue;
          }

          const response = await adminService.updateSceneStep(selectedSceneId, item.id, {
            order: item.order,
            speaker: current.speaker,
            text: current.text,
            stepType: current.stepType,
            mediaUrl: current.mediaUrl,
            choicesJson: current.choicesJson,
          });

          if (!response.ok) {
            throw new Error(response.error || "Не вдалося змінити порядок кроків");
          }
        }

        await loadSceneDetails(selectedSceneId, true);
        pushToast("success", "Порядок кроків оновлено");
        closeModal();
        return;
      }

      if (modal.type === "linkVocabulary") {
        const vocabularyItemId = Number(form.vocabularyItemId || 0);
        const response = await adminService.linkVocabularyToLesson(selectedLessonId, vocabularyItemId);

        if (!response.ok) {
          throw new Error(response.error || "Не вдалося прив'язати слово до уроку");
        }

        await loadVocabularyForLesson(selectedLessonId, true);

        if (selectedCourseId) {
          await loadVocabularyByCourseLanguage(selectedCourseId, true);
        }

        pushToast("success", "Слово прив'язано до уроку");
        closeModal();
      }
    } catch (error) {
      pushToast("error", error.message || "Помилка збереження");
    } finally {
      setIsActionLoading(false);
    }
  }, [
    closeModal,
    form,
    loadCourseDetails,
    loadLessonDetails,
    loadMediaFiles,
    loadSceneDetails,
    loadTopicDetails,
    loadVocabularyByCourseLanguage,
    loadVocabularyForLesson,
    mediaSearchValue,
    modal,
    pushToast,
    refreshBootCollections,
    scenes,
    selectedCourseDetails,
    selectedCourseId,
    selectedLessonDetails,
    selectedLessonId,
    selectedSceneDetails,
    selectedSceneId,
    selectedTopicDetails,
    selectedTopicId,
    throwIfOrderConflict,
    users,
  ]);

  const confirmDelete = useCallback(async () => {
    setIsActionLoading(true);

    try {
      let response = null;
      const deletedItemId = Number(modal.payload?.id || 0);
      const isDeletingSelectedCourse = modal.mode === "course" && deletedItemId === Number(selectedCourseId);
      const isDeletingSelectedTopic = modal.mode === "topic" && deletedItemId === Number(selectedTopicId);
      const isDeletingSelectedLesson = modal.mode === "lesson" && deletedItemId === Number(selectedLessonId);
      const isDeletingSelectedScene = modal.mode === "scene" && deletedItemId === Number(selectedSceneId);

      if (modal.mode === "course") {
        response = await adminService.deleteCourse(modal.payload.id);
      }

      if (modal.mode === "topic") {
        response = await adminService.deleteTopic(modal.payload.id);
      }

      if (modal.mode === "lesson") {
        response = await adminService.deleteLesson(modal.payload.id);
      }

      if (modal.mode === "exercise") {
        response = await adminService.deleteExercise(modal.payload.id);
      }

      if (modal.mode === "vocabulary") {
        response = await adminService.deleteVocabulary(modal.payload.id);
      }

      if (modal.mode === "scene") {
        response = await adminService.deleteScene(modal.payload.id);
      }

      if (modal.mode === "achievement") {
        response = await adminService.deleteAchievement(modal.payload.id);
      }

      if (modal.mode === "user") {
        response = await adminService.deleteUser(modal.payload.id);
      }

      if (modal.mode === "media") {
        response = await adminService.deleteMediaFile(getMediaRelativePath(modal.payload));
      }

      if (!response?.ok) {
        throw new Error(response?.error || "Не вдалося видалити елемент");
      }

      if (modal.mode === "course") {
        clearCourseDetailsCache(deletedItemId);
      }

      if (modal.mode === "topic") {
        clearTopicDetailsCache(deletedItemId);
      }

      if (modal.mode === "lesson") {
        clearLessonBranchCache(deletedItemId);
      }

      if (modal.mode === "scene") {
        clearSceneDetailsCache(deletedItemId);
      }

      if (isDeletingSelectedCourse) {
        resetDeepSelection(0);
        setShowCourseLandingDetails(false);
        setShowTopicLandingDetails(false);
        setShowLessonLandingDetails(false);
        setCourseLandingMode("");
        await refreshBootCollections();
      } else if (isDeletingSelectedTopic) {
        setSelectedTopicId(0);
        setSelectedLessonId(0);
        setSelectedExerciseId(0);
        setSelectedVocabularyId(0);
        setSelectedSceneId(0);
        setSelectedSceneStepId(0);
        setShowTopicLandingDetails(false);
        setShowLessonLandingDetails(false);
        await refreshBootCollections();
        if (selectedCourseId) {
          await loadCourseDetails(selectedCourseId, true).catch(() => null);
        }
      } else if (isDeletingSelectedLesson) {
        setSelectedLessonId(0);
        setSelectedExerciseId(0);
        setSelectedVocabularyId(0);
        setShowLessonLandingDetails(false);
        await reloadCurrentTree({ skipLessonReload: true });
      } else if (isDeletingSelectedScene) {
        setSelectedSceneId(0);
        setSelectedSceneStepId(0);
        await refreshBootCollections();
        if (selectedCourseId) {
          await loadCourseDetails(selectedCourseId, true).catch(() => null);
        }
      } else if (modal.mode === "media") {
        await loadMediaFiles(mediaSearchValue);
      } else {
        await reloadCurrentTree();
      }

      pushToast("success", modal.mode === "user" ? "Користувача видалено" : modal.mode === "media" ? "Файл видалено" : "Елемент видалено");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Помилка видалення");
    } finally {
      setIsActionLoading(false);
    }
  }, [
    clearCourseDetailsCache,
    clearLessonBranchCache,
    clearSceneDetailsCache,
    clearTopicDetailsCache,
    closeModal,
    loadCourseDetails,
    loadMediaFiles,
    mediaSearchValue,
    modal,
    pushToast,
    refreshBootCollections,
    reloadCurrentTree,
    resetDeepSelection,
    selectedCourseId,
    selectedLessonId,
    selectedSceneId,
    selectedTopicId,
  ]);

  const confirmDeleteVocabularyBulk = useCallback(async () => {
    const vocabularyIds = [...new Set((form.ids || []).map((item) => Number(item || 0)).filter(Boolean))];

    if (!vocabularyIds.length) {
      closeModal();
      resetGeneralVocabularyDeleteState();
      resetGeneralVocabularyExportState();
      return;
    }

    setIsActionLoading(true);

    try {
      const responses = await Promise.all(vocabularyIds.map((id) => adminService.deleteVocabulary(id)));
      const failedResponse = responses.find((response) => !response?.ok);

      if (failedResponse) {
        throw new Error(failedResponse.error || "Не вдалося видалити вибрані слова");
      }

      setSelectedGeneralVocabularyIds([]);
      setSelectedVocabularyId((prev) => (vocabularyIds.includes(Number(prev || 0)) ? 0 : prev));
      resetGeneralVocabularyDeleteState();
      resetGeneralVocabularyExportState();

      await refreshBootCollections();

      if (selectedCourseId) {
        await loadVocabularyByCourseLanguage(selectedCourseId, true);
      }

      if (selectedLessonId) {
        await loadVocabularyForLesson(selectedLessonId, true);
      }

      pushToast("success", vocabularyIds.length === 1 ? "Слово видалено" : "Слова видалено");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Помилка видалення слів");
    } finally {
      setIsActionLoading(false);
    }
  }, [
    closeModal,
    form.ids,
    loadVocabularyByCourseLanguage,
    loadVocabularyForLesson,
    pushToast,
    refreshBootCollections,
    resetGeneralVocabularyDeleteState,
    resetGeneralVocabularyExportState,
    selectedCourseId,
    selectedLessonId,
  ]);

  const unlinkVocabulary = useCallback(async () => {
    if (!selectedLessonId || !selectedVocabularyId) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await adminService.unlinkVocabularyFromLesson(selectedLessonId, selectedVocabularyId);

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося відв'язати слово від уроку");
      }

      await loadVocabularyForLesson(selectedLessonId, true);

      if (selectedCourseId) {
        await loadVocabularyByCourseLanguage(selectedCourseId, true);
      }

      setSelectedVocabularyId(0);
      pushToast("success", "Слово відв'язано від уроку");
    } catch (error) {
      pushToast("error", error.message || "Помилка відв'язування");
    } finally {
      setIsActionLoading(false);
    }
  }, [loadVocabularyByCourseLanguage, loadVocabularyForLesson, pushToast, selectedCourseId, selectedLessonId, selectedVocabularyId]);

  const cleanupTokens = useCallback(async () => {
    setIsActionLoading(true);

    try {
      const response = await adminService.cleanupTokens();

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося очистити токени");
      }

      await loadTokens();
      pushToast("success", `Видалено токенів: ${response.data?.deleted || 0}`);
    } catch (error) {
      pushToast("error", error.message || "Помилка очищення токенів");
    } finally {
      setIsActionLoading(false);
    }
  }, [loadTokens, pushToast]);

  const copyMediaUrl = useCallback(async (item) => {
    const mediaUrl = String(item?.url || "").trim();

    if (!mediaUrl) {
      pushToast("error", "Не вдалося визначити URL файлу");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(mediaUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = mediaUrl;
        textarea.setAttribute("readonly", "readonly");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      pushToast("success", "URL файлу скопійовано");
    } catch (error) {
      pushToast("error", error.message || "Не вдалося скопіювати URL файлу");
    }
  }, [pushToast]);

  const openMediaPreview = useCallback((item) => {
    const mediaUrl = String(item?.url || "").trim();

    if (!mediaUrl) {
      pushToast("error", "Не вдалося відкрити файл");
      return;
    }

    window.open(mediaUrl, "_blank", "noopener,noreferrer");
  }, [pushToast]);

  const handleAdminLogout = useCallback(() => {
    const refreshToken = authStorage.getRefreshToken();

    if (refreshToken) {
      authService.logout({ refreshToken }).catch(() => {
      });
    }

    authStorage.clearGuestPreview();
    authStorage.clearTokens();
    navigate(PATHS.login, { replace: true });
  }, [navigate]);

  const handleCourseLandingEditAction = useCallback(async () => {
    if (!selectedCourseId || !selectedCourse) {
      return;
    }

    if (showCourseLandingDetails && courseLandingMode === "edit") {
      setShowCourseLandingDetails(false);
      setShowTopicLandingDetails(false);
      setShowLessonLandingDetails(false);
      setCourseLandingMode("");
      return;
    }

    try {
      await loadCourseDetails(selectedCourseId, true);
    } catch (error) {
      pushToast("error", error.message || "Не вдалося завантажити курс");
      return;
    }

    setCourseLandingMode("edit");
    setShowCourseLandingDetails(true);
    setShowTopicLandingDetails(false);
    setShowLessonLandingDetails(false);
  }, [courseLandingMode, loadCourseDetails, pushToast, selectedCourse, selectedCourseId, showCourseLandingDetails]);

  const handleVocabularyCourseEditAction = useCallback(async () => {
    if (!selectedCourseId || !selectedCourse) {
      return;
    }

    if (!(showCourseLandingDetails && courseLandingMode === "edit")) {
      try {
        await loadCourseDetails(selectedCourseId, true);
      } catch (error) {
        pushToast("error", error.message || "Не вдалося завантажити курс");
        return;
      }

      setCourseLandingMode("edit");
      setShowCourseLandingDetails(true);
      setShowTopicLandingDetails(false);
      setShowLessonLandingDetails(false);
      setSelectedTopicId(0);
      setSelectedLessonId(0);
      setSelectedVocabularyId(0);
      return;
    }

    if (selectedLessonId) {
      setSelectedLessonId(0);
      setSelectedVocabularyId(0);
      setShowLessonLandingDetails(false);
      return;
    }

    if (selectedTopicId) {
      setSelectedTopicId(0);
      setSelectedLessonId(0);
      setSelectedVocabularyId(0);
      setShowTopicLandingDetails(false);
      setShowLessonLandingDetails(false);
      return;
    }

    setShowCourseLandingDetails(false);
    setShowTopicLandingDetails(false);
    setShowLessonLandingDetails(false);
    setCourseLandingMode("");
    setSelectedVocabularyId(0);
  }, [
    courseLandingMode,
    loadCourseDetails,
    pushToast,
    selectedCourse,
    selectedCourseId,
    selectedLessonId,
    selectedTopicId,
    showCourseLandingDetails,
  ]);

  const handleVocabularyBackToLessons = useCallback(() => {
    if (!selectedLessonId) {
      return;
    }

    setSelectedLessonId(0);
    setSelectedVocabularyId(0);
    setShowLessonLandingDetails(false);
  }, [selectedLessonId]);

  const handleCourseLandingAddAction = useCallback(() => {
    openModal("courseForm", "create", null, buildCourseForm(null));
  }, [openModal]);

  const handleCourseLandingRenameCourseAction = useCallback(() => {
    if (!selectedCourseId || !selectedCourse) {
      return;
    }

    const sourceCourse = selectedCourseDetails || selectedCourse;

    openModal("courseForm", "edit", sourceCourse, buildCourseForm(sourceCourse));
  }, [openModal, selectedCourse, selectedCourseDetails, selectedCourseId]);

  const handleCourseLandingDeleteCourseAction = useCallback(() => {
    if (!selectedCourseId || !selectedCourse) {
      return;
    }

    openModal("confirmDelete", "course", selectedCourse);
  }, [openModal, selectedCourse, selectedCourseId]);

  const handleCourseLandingImportExportCourseAction = useCallback(() => {
    openModal("designerImportExport", "course", { courseId: selectedCourseId || 0 });
  }, [openModal, selectedCourseId]);

  const handleCourseLandingCreateTopicAction = useCallback(() => {
    if (!selectedCourseId) {
      return;
    }

    openModal("topicForm", "create", null, buildTopicForm(null));
  }, [openModal, selectedCourseId]);

  const handleCourseLandingEditTopicAction = useCallback(() => {
    if (!selectedTopicId || !selectedTopic) {
      return;
    }

    setShowTopicLandingDetails((prev) => {
      const nextValue = !prev;

      setSelectedLessonId(0);
      setSelectedExerciseId(0);
      setShowLessonLandingDetails(false);

      return nextValue;
    });
  }, [selectedTopic, selectedTopicId]);

  const handleCourseLandingEditTopicDataAction = useCallback(async () => {
    if (!selectedTopicId || !selectedTopic) {
      return;
    }

    let topicDetails = selectedTopicDetails;

    if (!topicDetails) {
      topicDetails = await loadTopicDetails(selectedTopicId, true).catch(() => null);
    }

    const topicLessons = sortByOrder(topicDetails?.lessons || []);
    const selectedLessonFromTopic = topicLessons.find((item) => Number(item.id) === Number(selectedLessonId));
    const targetLesson = selectedLessonFromTopic || topicLessons[0] || null;
    let lessonDetails = Number(selectedLessonDetails?.id || 0) === Number(targetLesson?.id || 0) ? selectedLessonDetails : null;

    if (!lessonDetails && targetLesson?.id) {
      lessonDetails = await loadLessonDetails(targetLesson.id, true).catch(() => null);
    }

    openModal(
      "topicDataForm",
      "edit",
      {
        ...selectedTopic,
        lesson: lessonDetails,
        scene: currentTopicScene,
      },
      buildTopicDataForm(selectedTopic, currentTopicScene, lessonDetails),
    );
  }, [currentTopicScene, loadLessonDetails, loadTopicDetails, openModal, selectedLessonDetails, selectedLessonId, selectedTopic, selectedTopicDetails, selectedTopicId]);

  const handleCourseLandingTopicImportExportAction = useCallback(() => {
    openModal("designerImportExport", "topic", { topicId: selectedTopicId || 0, courseId: selectedCourseId || 0 });
  }, [openModal, selectedCourseId, selectedTopicId]);

  const handleCourseLandingEditTopicTheoryAction = useCallback(async () => {
    if (!selectedTopicId) {
      return;
    }

    let topicDetails = selectedTopicDetails;

    if (!topicDetails) {
      topicDetails = await loadTopicDetails(selectedTopicId, true).catch(() => null);
    }

    const topicLessons = sortByOrder(topicDetails?.lessons || []);

    if (!topicLessons.length) {
      pushToast("error", "У темі ще немає уроків для зміни теорії");
      return;
    }

    const selectedLessonFromTopic = topicLessons.find((item) => Number(item.id) === Number(selectedLessonId));
    const targetLesson = selectedLessonFromTopic || topicLessons[0];
    let lessonDetails = Number(selectedLessonDetails?.id) === Number(targetLesson.id) ? selectedLessonDetails : null;

    if (!lessonDetails) {
      lessonDetails = await loadLessonDetails(targetLesson.id, true).catch(() => null);
    }

    if (!lessonDetails) {
      pushToast("error", "Не вдалося завантажити урок для зміни теорії");
      return;
    }

    openModal("lessonDesignerForm", "edit", lessonDetails, buildLessonDesignerForm(lessonDetails));
  }, [loadLessonDetails, loadTopicDetails, openModal, pushToast, selectedLessonDetails, selectedLessonId, selectedTopicDetails, selectedTopicId]);

  const handleCourseLandingBindTopicSceneAction = useCallback(() => {
    if (!selectedTopicId || !selectedTopic) {
      return;
    }

    openModal(
      "topicSceneBindingForm",
      "edit",
      {
        topicId: selectedTopic.id,
      },
      buildTopicSceneBindingForm(selectedTopic, currentTopicScene),
    );
  }, [currentTopicScene, openModal, selectedTopic, selectedTopicId]);

  const handleLessonDesignerLessonChange = useCallback(async (event) => {
    const lessonId = Number(event.target.value || 0);

    if (!lessonId) {
      return;
    }

    const lessonDetails = await loadLessonDetails(lessonId, true).catch(() => null);

    if (!lessonDetails) {
      pushToast("error", "Не вдалося завантажити вибраний урок");
      return;
    }

    setModal((prev) => ({
      ...prev,
      payload: lessonDetails,
    }));
    setForm((prev) => ({
      ...prev,
      ...buildLessonDesignerForm(lessonDetails),
    }));
  }, [loadLessonDetails, pushToast]);


  const handleTopicDataLessonChange = useCallback(async (event) => {
    const lessonId = Number(event.target.value || 0);

    if (!lessonId) {
      setForm((prev) => ({
        ...prev,
        lessonId: "",
        theory: "",
      }));
      return;
    }

    const lessonDetails = await loadLessonDetails(lessonId, true).catch(() => null);

    if (!lessonDetails) {
      pushToast("error", "Не вдалося завантажити вибраний урок");
      return;
    }

    setModal((prev) => ({
      ...prev,
      payload: {
        ...(prev.payload || {}),
        lesson: lessonDetails,
      },
    }));
    setForm((prev) => ({
      ...prev,
      lessonId: String(lessonDetails.id || ""),
      theory: String(lessonDetails.theory || ""),
    }));
  }, [loadLessonDetails, pushToast]);

  const handleCourseLandingDeleteTopicAction = useCallback(() => {
    if (!selectedTopicId || !selectedTopic) {
      return;
    }

    openModal("confirmDelete", "topic", selectedTopic);
  }, [openModal, selectedTopic, selectedTopicId]);

  const handleTopicSelection = useCallback((topicId) => {
    if (Number(selectedTopicId) === Number(topicId)) {
      setSelectedTopicId(0);
      setSelectedLessonId(0);
      setSelectedExerciseId(0);
      setShowTopicLandingDetails(false);
      setShowLessonLandingDetails(false);
      return;
    }

    setSelectedTopicId(Number(topicId));
    setSelectedLessonId(0);
    setSelectedExerciseId(0);
    setShowLessonLandingDetails(false);
  }, [selectedTopicId]);

  const handleLessonSelection = useCallback((lessonId) => {
    if (Number(selectedLessonId) === Number(lessonId)) {
      setSelectedLessonId(0);
      setSelectedExerciseId(0);
      setShowLessonLandingDetails(false);
      return;
    }

    setSelectedLessonId(Number(lessonId));
    setSelectedExerciseId(0);
  }, [selectedLessonId]);

  const handleExerciseSelection = useCallback((exerciseId) => {
    if (Number(selectedExerciseId) === Number(exerciseId)) {
      setSelectedExerciseId(0);
      return;
    }

    setSelectedExerciseId(Number(exerciseId));
  }, [selectedExerciseId]);

  const handleCourseLandingCreateLessonAction = useCallback(() => {
    if (!selectedTopicId) {
      return;
    }

    openModal("lessonDesignerForm", "create", null, buildLessonDesignerForm(null, nextLessonOrder));
  }, [nextLessonOrder, openModal, selectedTopicId]);

  const handleCourseLandingDeleteLessonAction = useCallback(() => {
    if (!selectedLessonId || !selectedLessonDetails) {
      return;
    }

    openModal("confirmDelete", "lesson", selectedLessonDetails);
  }, [openModal, selectedLessonDetails, selectedLessonId]);

  const handleCourseLandingEditLessonAction = useCallback(async () => {
    if (!selectedLessonId || !selectedLesson) {
      return;
    }

    if (!selectedLessonDetails) {
      await loadLessonDetails(selectedLessonId, true).catch(() => null);
    }

    setShowLessonLandingDetails((prev) => !prev);
  }, [loadLessonDetails, selectedLesson, selectedLessonDetails, selectedLessonId]);

  const handleCourseLandingEditLessonDataAction = useCallback(async () => {
    if (!selectedLessonId) {
      return;
    }

    let lessonDetails = selectedLessonDetails;

    if (!lessonDetails) {
      lessonDetails = await loadLessonDetails(selectedLessonId, true).catch(() => null);
    }

    if (!lessonDetails) {
      pushToast("error", "Не вдалося завантажити урок для редагування");
      return;
    }

    openModal("lessonForm", "edit", lessonDetails, buildLessonForm(lessonDetails));
  }, [loadLessonDetails, openModal, pushToast, selectedLessonDetails, selectedLessonId]);

  const handleCourseLandingLessonDetailsAction = useCallback(() => {
    if (!selectedLessonId || !selectedLessonDetails) {
      return;
    }

    openModal("lessonPreview", "", selectedLessonDetails, selectedLessonDetails);
  }, [openModal, selectedLessonDetails, selectedLessonId]);

  const handleCourseLandingLessonImportExportAction = useCallback(() => {
    if (!selectedTopicId) {
      return;
    }

    openModal("designerImportExport", "lesson", { lessonId: selectedLessonId || 0, topicId: selectedTopicId });
  }, [openModal, selectedLessonId, selectedTopicId]);

  const handleCourseLandingLessonCopyAction = useCallback(async () => {
    if (!selectedLessonId) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await adminService.copyLesson(selectedLessonId, {});

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося скопіювати урок");
      }

      await loadTopicDetails(selectedTopicId, true);
      openModal("copiedInfo", "lesson", response.data || null);
    } catch (error) {
      pushToast("error", error.message || "Помилка копіювання уроку");
    } finally {
      setIsActionLoading(false);
    }
  }, [loadTopicDetails, openModal, pushToast, selectedLessonId, selectedTopicId]);

  const handleCourseLandingCreateExerciseAction = useCallback(() => {
    if (!selectedLessonId) {
      return;
    }

    openModal("exerciseDesignerForm", "create", null, buildExerciseDesignerForm(null, nextExerciseOrder));
  }, [nextExerciseOrder, openModal, selectedLessonId]);

  const handleCourseLandingEditExerciseAction = useCallback(() => {
    if (!selectedExerciseId || !selectedExercise) {
      return;
    }

    openModal("exerciseDesignerForm", "edit", selectedExercise, buildExerciseDesignerForm(selectedExercise, nextExerciseOrder));
  }, [nextExerciseOrder, openModal, selectedExercise, selectedExerciseId]);

  const handleCourseLandingDeleteExerciseAction = useCallback(() => {
    if (!selectedExerciseId || !selectedExercise) {
      return;
    }

    openModal("confirmDelete", "exercise", selectedExercise);
  }, [openModal, selectedExercise, selectedExerciseId]);

  const handleCourseLandingExerciseImportExportAction = useCallback(() => {
    if (!selectedLessonId) {
      return;
    }

    openModal("designerImportExport", "exercise", {
      ...(selectedExercise || {}),
      exerciseId: selectedExerciseId || 0,
      lessonId: selectedLessonId,
    });
  }, [openModal, selectedExercise, selectedExerciseId, selectedLessonId]);

  const handleCourseLandingPreviewExerciseAction = useCallback(() => {
    if (!selectedExerciseId || !selectedExercise) {
      return;
    }

    openModal("exercisePreview", "", selectedExercise, selectedExercise);
  }, [openModal, selectedExercise, selectedExerciseId]);

  const toolbarButtons = useMemo(() => {
    if (section === "users" || section === "service") {
      return [];
    }

    if (section === "courses" && coursesViewMode === "landing") {
      return [
        { icon: DeleteIcon, label: "Видалити курс", onClick: handleCourseLandingDeleteCourseAction, disabled: !selectedCourseId },
        { icon: EditIcon, label: "Редагувати курс", onClick: handleCourseLandingEditAction, disabled: !selectedCourseId },
        { icon: AddIcon, label: "Додати курс", onClick: handleCourseLandingAddAction, disabled: Boolean(selectedCourseId) },
        { icon: ImportExportIcon, label: "Імпорт / експорт курсу", onClick: handleCourseLandingImportExportCourseAction, disabled: isActionLoading },
        { icon: PreviewIcon, label: "Переглянути вміст курсу", onClick: handlePreviewAction, disabled: !selectedCourseId },
      ];
    }

    if (section === "achievements") {
      return [
        { icon: DeleteIcon, label: "Видалити досягнення", onClick: openDeleteByContext, disabled: !selectedAchievementId },
        { icon: EditIcon, label: "Редагувати досягнення", onClick: openEditByContext, disabled: !selectedAchievementId },
        { icon: AddIcon, label: "Додати досягнення", onClick: openCreateByContext, disabled: isActionLoading },
        { icon: PreviewIcon, label: "Перегляд досягнення", onClick: handlePreviewAction, disabled: !selectedAchievementId || isActionLoading },
      ];
    }

    if (section === "scenes") {
      return [
        { icon: DeleteIcon, label: "Видалити сцену", onClick: openDeleteByContext, disabled: !selectedSceneId },
        { icon: EditIcon, label: "Редагувати сцену", onClick: handleSceneEnterEditMode, disabled: !selectedSceneId },
        { icon: CopyIcon, label: "Копія сцени", onClick: handleSceneCopyAction, disabled: !selectedSceneId || !canCopyScene },
        { icon: ImportExportIcon, label: "Імпорт / експорт сцени", onClick: handleImportExportAction, disabled: isActionLoading },
        { icon: AddIcon, label: "Додати сцену", onClick: openCreateByContext, disabled: !canCreateScene },
      ];
    }

    if (section === "vocabulary") {
      return [
        {
          icon: EditIcon,
          label: "Редагувати курс",
          onClick: handleVocabularyCourseEditAction,
          disabled: !selectedCourseId,
        },
      ];
    }

    if (section === "courses") {
      return [
        { icon: DeleteIcon, label: "Видалити курс", onClick: handleCourseLandingDeleteCourseAction, disabled: !selectedCourseId || isActionLoading },
        { icon: EditIcon, label: "Редагувати курс", onClick: handleCourseLandingRenameCourseAction, disabled: !selectedCourseId || isActionLoading },
        { icon: AddIcon, label: "Додати курс", onClick: handleCourseLandingAddAction, disabled: Boolean(selectedCourseId) || isActionLoading },
        { icon: ImportExportIcon, label: "Імпорт / експорт курсу", onClick: handleCourseLandingImportExportCourseAction, disabled: isActionLoading },
        { icon: PreviewIcon, label: "Переглянути вміст курсу", onClick: handlePreviewAction, disabled: !selectedCourseId || isActionLoading },
      ];
    }

    const hasDeepSelection = selectedExerciseId || selectedLessonId || selectedTopicId || selectedCourseId;
    const addLabel = selectedLessonId ? "Додати вправу" : selectedTopicId ? "Додати урок" : selectedCourseId ? "Додати тему" : "Додати курс";
    const editLabel = selectedExerciseId ? "Редагувати вправу" : selectedLessonId ? "Редагувати урок" : selectedTopicId ? "Редагувати тему" : selectedCourseId ? "Редагувати курс" : "Редагувати";
    const deleteLabel = selectedExerciseId ? "Видалити вправу" : selectedLessonId ? "Видалити урок" : selectedTopicId ? "Видалити тему" : selectedCourseId ? "Видалити курс" : "Видалити";
    const extraLabel = selectedExerciseId
      ? "Імпорт / експорт вправи"
      : selectedLessonId
        ? "Імпорт / експорт уроку"
        : selectedTopicId
          ? "Імпорт / експорт теми"
          : "Оновити дані";
    const showContextImportExport = Boolean(selectedExerciseId || selectedLessonId || selectedTopicId);

    return [
      { icon: DeleteIcon, label: deleteLabel, onClick: openDeleteByContext, disabled: !hasDeepSelection },
      { icon: EditIcon, label: editLabel, onClick: openEditByContext, disabled: !hasDeepSelection },
      { icon: AddIcon, label: addLabel, onClick: openCreateByContext, disabled: false },
      { icon: showContextImportExport ? ImportExportIcon : ReloadIcon, label: extraLabel, onClick: showContextImportExport ? handleImportExportAction : reloadCurrentTree, disabled: false },
    ];
  }, [
    coursesViewMode,
    handleCopyAction,
    handleCourseLandingAddAction,
    handleCourseLandingDeleteCourseAction,
    handleCourseLandingEditAction,
    handleVocabularyCourseEditAction,
    handleCourseLandingImportExportCourseAction,
    handleCourseLandingRenameCourseAction,
    handleImportExportAction,
    handlePreviewAction,
    handleSceneCopyAction,
    handleSceneEnterEditMode,
    courseLandingMode,
    isActionLoading,
    openCreateByContext,
    openDeleteByContext,
    openEditByContext,
    reloadCurrentTree,
    section,
    showCourseLandingDetails,
    selectedAchievementId,
    selectedCourseId,
    selectedExerciseId,
    selectedLessonId,
    selectedSceneId,
    selectedTopicId,
    selectedVocabularyId,
  ]);

  const handleLandingCourseClick = useCallback((course) => {
    if (!course || course.__placeholder) {
      return;
    }

    if (Number(selectedCourseId) === Number(course.id)) {
      resetDeepSelection(0);
      setShowCourseLandingDetails(false);
      setCourseLandingMode("");
      return;
    }

    resetDeepSelection(Number(course.id));
    setShowCourseLandingDetails(false);
    setCourseLandingMode("");
  }, [resetDeepSelection, selectedCourseId]);

  const handleSharedCourseClick = useCallback((course) => {
    if (!course || course.__placeholder) {
      return;
    }

    if (Number(selectedCourseId) === Number(course.id)) {
      resetDeepSelection(0);
      setShowCourseLandingDetails(false);
      setCourseLandingMode("");
      return;
    }

    resetDeepSelection(Number(course.id));
    setShowCourseLandingDetails(false);
    setCourseLandingMode("");
  }, [resetDeepSelection, selectedCourseId]);

  const updateCoursePublishState = useCallback(async (course, nextIsPublished) => {
    if (!course || course.__placeholder) {
      return false;
    }

    setIsActionLoading(true);

    try {
      const response = await adminService.updateCourse(course.id, {
        title: String(course.title || "").trim(),
        description: String(course.description || "").trim(),
        languageCode: String(course.languageCode || "en").trim(),
        level: String(course.level || "").trim(),
        order: Number(course.order || 1),
        prerequisiteCourseId: course.prerequisiteCourseId ? Number(course.prerequisiteCourseId) : null,
        isPublished: Boolean(nextIsPublished),
      });

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося змінити статус публікації курсу");
      }

      await refreshBootCollections();
      await loadCourseDetails(course.id, true).catch(() => null);
      pushToast("success", nextIsPublished ? "Курс опубліковано" : "Курс знято з публікації");
      return true;
    } catch (error) {
      pushToast("error", error.message || "Не вдалося змінити статус публікації курсу");
      return false;
    } finally {
      setIsActionLoading(false);
    }
  }, [loadCourseDetails, pushToast, refreshBootCollections]);

  const handleCoursePublishToggle = useCallback(async (course) => {
    if (!course || course.__placeholder) {
      return;
    }

    const publishMeta = getCoursePublishMeta(course);

    if (!publishMeta.isPublished && publishMeta.isToggleDisabled) {
      openModal("coursePublishBlocked", "", course);
      return;
    }

    if (publishMeta.isPublished) {
      openModal("confirmCourseUnpublish", "", course);
      return;
    }

    await updateCoursePublishState(course, true);
  }, [openModal, updateCoursePublishState]);

  const confirmCourseUnpublish = useCallback(async () => {
    if (modal.type !== "confirmCourseUnpublish" || !modal.payload) {
      return;
    }

    const isSuccess = await updateCoursePublishState(modal.payload, false);

    if (isSuccess) {
      closeModal();
    }
  }, [closeModal, modal, updateCoursePublishState]);

  const renderCoursesLandingSection = () => {
    const courseTopics = sortByOrder(selectedCourseDetails?.topics || []);
    const currentTopicId = Number(selectedTopicId || 0);
    const currentTopic = currentTopicId ? topicDetailsMap[currentTopicId] || selectedTopicDetails : null;
    const currentLessons = sortByOrder(currentTopic?.lessons || selectedTopicDetails?.lessons || []);
    const currentExercises = sortByOrder(selectedLessonDetails?.exercises || []);
    const currentTopicScenesCount = currentTopicId
      ? filteredScenes.filter((item) => Number(item.topicId || 0) === Number(currentTopicId)).length
      : 0;
    const isCourseLandingEditMode = showCourseLandingDetails && courseLandingMode === "edit";

    const getToolbarIconClassName = (icon) => {
      if (icon === DeleteIcon) {
        return styles.coursesLandingDeleteIcon;
      }

      if (icon === EditIcon) {
        return styles.coursesLandingEditIcon;
      }

      return styles.coursesLandingToolbarIcon;
    };

    const lessonToolbarButtons = [
      { icon: DeleteIcon, label: "Видалити урок", onClick: handleCourseLandingDeleteLessonAction, disabled: !selectedLessonId || isActionLoading },
      { icon: EditIcon, label: "Редагувати урок", onClick: handleCourseLandingEditLessonAction, disabled: !selectedLessonId || isActionLoading },
      { icon: AddIcon, label: "Додати урок", onClick: handleCourseLandingCreateLessonAction, disabled: !canCreateLesson || isActionLoading },
      { icon: CopyIcon, label: "Копіювати урок", onClick: handleCourseLandingLessonCopyAction, disabled: !canCopyLesson || isActionLoading },
      { icon: ImportExportIcon, label: "Імпорт / експорт уроку", onClick: handleCourseLandingLessonImportExportAction, disabled: !selectedTopicId || isActionLoading },
      { icon: PreviewIcon, label: "Деталі уроку", onClick: handleCourseLandingLessonDetailsAction, disabled: !selectedLessonId || isActionLoading },
    ];

    const exerciseToolbarButtons = [
      { icon: DeleteIcon, label: "Видалити вправу", onClick: handleCourseLandingDeleteExerciseAction, disabled: !selectedExerciseId || isActionLoading },
      { icon: EditIcon, label: "Редагувати вправу", onClick: handleCourseLandingEditExerciseAction, disabled: !selectedExerciseId || isActionLoading },
      { icon: AddIcon, label: "Додати вправу", onClick: handleCourseLandingCreateExerciseAction, disabled: !canCreateExercise || isActionLoading },
      { icon: ImportExportIcon, label: "Імпорт / експорт вправи", onClick: handleCourseLandingExerciseImportExportAction, disabled: !selectedLessonId || isActionLoading },
      { icon: PreviewIcon, label: "Перегляд вправи", onClick: handleCourseLandingPreviewExerciseAction, disabled: !selectedExerciseId || isActionLoading },
    ];

    return (
      <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded} ${isCourseLandingEditMode ? styles.coursesLandingShellEdit : ""}`.trim()}>
        <div className={styles.coursesLandingHeader}>
          <div className={styles.coursesLandingTitle}>Список курсів</div>
          <div className={styles.coursesLandingToolbar}>
            <ToolbarButton
              icon={DeleteIcon}
              label="Видалити курс"
              onClick={handleCourseLandingDeleteCourseAction}
              disabled={!selectedCourseId || isActionLoading}
              className={styles.coursesLandingToolbarButton}
              imageClassName={styles.coursesLandingDeleteIcon}
            />
            <ToolbarButton
              icon={EditIcon}
              label="Редагувати курс"
              onClick={handleCourseLandingEditAction}
              disabled={!selectedCourseId || isActionLoading}
              className={styles.coursesLandingToolbarButton}
              imageClassName={styles.coursesLandingEditIcon}
            />
            <ToolbarButton
              icon={AddIcon}
              label="Додати курс"
              onClick={handleCourseLandingAddAction}
              disabled={Boolean(selectedCourseId) || isActionLoading}
              className={styles.coursesLandingToolbarButton}
              imageClassName={styles.coursesLandingAddIcon}
            />
            <ToolbarButton
              icon={ImportExportIcon}
              label="Імпорт / експорт курсу"
              onClick={handleCourseLandingImportExportCourseAction}
              disabled={isActionLoading}
              className={styles.coursesLandingToolbarButton}
              imageClassName={styles.coursesLandingToolbarIcon}
            />
            <ToolbarButton
              icon={PreviewIcon}
              label="Переглянути вміст курсу"
              onClick={handlePreviewAction}
              disabled={!selectedCourseId || isActionLoading}
              className={styles.coursesLandingToolbarButton}
              imageClassName={styles.coursesLandingPreviewIcon}
            />
          </div>
        </div>

        <div className={styles.coursesLandingTopLine} />

        <div className={styles.coursesLandingRow}>
          {coursesLandingSlots.map((course) => {
            const isSelected = !course.__placeholder && Number(selectedCourseId) === Number(course.id);
            const publishMeta = getCoursePublishMeta(course);

            return (
              <button
                type="button"
                key={course.id}
                className={`${styles.courseLandingCard} ${isSelected ? styles.courseLandingCardActive : ""} ${course.__placeholder ? styles.courseLandingCardPlaceholder : ""}`.trim()}
                onClick={() => handleLandingCourseClick(course)}
                disabled={course.__placeholder}
                aria-pressed={isSelected}
                title={course.__placeholder ? "" : getCourseTooltipText(course)}
                style={course.__placeholder ? undefined : { "--course-flag": `url(${getFlagByCode(course.languageCode)})` }}
              >
                <span className={styles.courseLandingInner}>
                  <span className={styles.courseLandingMain}>
                    <span className={styles.courseLandingLabel}>{String(course.level || "")}</span>
                  </span>
                  <span
                    className={`${styles.courseLandingToggle} ${publishMeta.isPublished ? styles.courseLandingToggleActive : ""} ${publishMeta.isToggleDisabled ? styles.courseLandingToggleDisabled : ""}`.trim()}
                    role="checkbox"
                    aria-checked={publishMeta.isPublished}
                    aria-disabled={publishMeta.isToggleDisabled}
                    title={publishMeta.toggleTitle}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCoursePublishToggle(course);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleCoursePublishToggle(course);
                      }
                    }}
                    tabIndex={publishMeta.isToggleDisabled ? -1 : 0}
                  >
                    {publishMeta.isPublished ? <span className={styles.courseLandingCheck}>✓</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.coursesLandingMiddleLine} />

        <div className={styles.coursesLandingDetailsHeader}>
          {showCourseLandingDetails && selectedCourseDetails ? (
            <div className={styles.coursesLandingDetailsHeaderTopRow}>
              <div className={styles.coursesLandingSectionTitle}>Теми курсу {resolveCourseLabel(selectedCourse)}</div>
              {isCourseLandingEditMode ? (
                <div className={styles.coursesLandingDetailsToolbarTop}>
                  <ToolbarButton
                    icon={ReloadIcon}
                    label="Оновити"
                    onClick={() => {
                      setSelectedTopicId(0);
                      setSelectedLessonId(0);
                      setSelectedExerciseId(0);
                      setShowTopicLandingDetails(false);
                      setShowLessonLandingDetails(false);
                      reloadCurrentTree();
                    }}
                    disabled={isActionLoading}
                    className={styles.coursesLandingReloadButtonTop}
                    imageClassName={styles.coursesLandingReloadIcon}
                  />
                  <ToolbarButton
                    icon={ImportExportIcon}
                    label="Імпорт / експорт теми"
                    onClick={handleCourseLandingTopicImportExportAction}
                    disabled={isActionLoading}
                    className={styles.coursesLandingToolbarButton}
                    imageClassName={styles.coursesLandingToolbarIcon}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <div className={styles.coursesLandingBottomLine} />
        </div>

        {showCourseLandingDetails && selectedCourseDetails ? (
          <>
            <div className={styles.coursesLandingTopicsGrid}>
              {courseTopics.map((topic, index) => {
                const isSelectedTopic = Number(topic.id) === Number(currentTopicId);

                return (
                  <button
                    type="button"
                    key={topic.id}
                    className={`${styles.coursesLandingTopicCard} ${isSelectedTopic ? styles.coursesLandingTopicCardActive : ""}`.trim()}
                    onClick={() => handleTopicSelection(topic.id)}
                    aria-pressed={isSelectedTopic}
                  >
                    <span className={styles.coursesLandingTopicSmall}>ТЕМА {topic.order || index + 1}</span>
                    <span className={styles.coursesLandingTopicLarge}>{topic.title}</span>
                  </button>
                );
              })}
            </div>

            {isCourseLandingEditMode ? (
              <div className={styles.coursesLandingEditFooter}>
                <div className={styles.coursesLandingEditFooterLine} />
              </div>
            ) : (
              <>
                <div className={styles.coursesLandingStatsLine} />

                <div className={styles.coursesLandingStats}>
                  <div className={styles.coursesLandingStatItem}>Кількість уроків у темі: {currentTopic?.lessonsCount || 0}</div>
                  <div className={styles.coursesLandingStatItem}>Кількість вправ у темі: {currentTopic?.exercisesCount || 0}</div>
                  <div className={styles.coursesLandingStatItem}>Кількість сцен у темі: {currentTopicScenesCount}</div>
                </div>
              </>
            )}

            {isCourseLandingEditMode && showTopicLandingDetails && selectedTopicDetails ? (
              <>
                <div className={styles.courseLandingNestedHeader}>
                  <div className={styles.courseLandingNestedTitle}>Уроки теми {selectedTopicDetails?.order || selectedTopic?.order || ""}</div>
                  <div className={styles.coursesLandingToolbar}>
                    {lessonToolbarButtons.map((item) => (
                      <ToolbarButton
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={styles.coursesLandingToolbarButton}
                        imageClassName={getToolbarIconClassName(item.icon)}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.courseLandingNestedLine} />
                <div className={styles.courseLandingLessonSection}>
                  <div className={styles.courseLandingLessonRow}>
                    {currentLessons.map((lesson, index) => {
                      const isSelectedLesson = Number(lesson.id) === Number(selectedLessonId);

                      return (
                        <button
                          type="button"
                          key={lesson.id}
                          className={`${styles.courseLandingLessonCard} ${isSelectedLesson ? styles.courseLandingLessonCardActive : ""}`.trim()}
                          onClick={() => handleLessonSelection(lesson.id)}
                          aria-pressed={isSelectedLesson}
                        >
                          <span className={styles.courseLandingLessonLabel}>УРОК {lesson.order || index + 1}</span>
                        </button>
                      );
                    })}
                  </div>
                  {isCourseLandingEditMode && showTopicLandingDetails && selectedLessonId && !showLessonLandingDetails ? (
                    <div className={styles.coursesLandingLessonEditActionsInline}>
                      <button
                        type="button"
                        className={styles.coursesLandingEditActionButton}
                        onClick={handleCourseLandingEditLessonDataAction}
                        disabled={!selectedLessonId || isActionLoading}
                      >
                        ЗМІНИТИ ДАНІ УРОКУ
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className={styles.courseLandingNestedPinkLine} />
              </>
            ) : null}

            {isCourseLandingEditMode && showTopicLandingDetails && showLessonLandingDetails && selectedLessonDetails ? (
              <>
                <div className={styles.courseLandingNestedHeader}>
                  <div className={styles.courseLandingNestedTitle}>Вправи теми {selectedTopicDetails?.order || selectedTopic?.order || ""}</div>
                  <div className={styles.coursesLandingToolbar}>
                    {exerciseToolbarButtons.map((item) => (
                      <ToolbarButton
                        key={item.label}
                        icon={item.icon}
                        label={item.label}
                        onClick={item.onClick}
                        disabled={item.disabled}
                        className={styles.coursesLandingToolbarButton}
                        imageClassName={getToolbarIconClassName(item.icon)}
                      />
                    ))}
                  </div>
                </div>
                <div className={styles.courseLandingNestedLine} />
                <div className={styles.courseLandingExerciseGrid}>
                  {currentExercises.map((exercise, index) => {
                    const isSelectedExercise = Number(exercise.id) === Number(selectedExerciseId);

                    return (
                      <button
                        type="button"
                        key={exercise.id}
                        className={`${styles.courseLandingExerciseCard} ${isSelectedExercise ? styles.courseLandingExerciseCardActive : ""}`.trim()}
                        onClick={() => handleExerciseSelection(exercise.id)}
                        aria-pressed={isSelectedExercise}
                      >
                        <span className={styles.courseLandingExerciseLabel}>ВПРАВА {exercise.order || index + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}
          </>
        ) : null}

        {isCourseLandingEditMode && !selectedTopicId ? (
          <div className={styles.coursesLandingEditActions}>
            <button
              type="button"
              className={styles.coursesLandingEditActionButton}
              onClick={handleCourseLandingRenameCourseAction}
              disabled={!selectedCourseId || isActionLoading}
            >
              ЗМІНИТИ ДАНІ КУРСУ
            </button>
            <button
              type="button"
              className={styles.coursesLandingEditActionButton}
              onClick={handleCourseLandingCreateTopicAction}
              disabled={!canCreateTopic || isActionLoading}
            >
              СТВОРИТИ ТЕМУ
            </button>
          </div>
        ) : null}

        {isCourseLandingEditMode && selectedTopicId && !selectedLessonId ? (
          <div className={styles.coursesLandingEditActions}>
            <button
              type="button"
              className={styles.coursesLandingEditActionButton}
              onClick={handleCourseLandingEditTopicDataAction}
              disabled={!selectedTopicId || isActionLoading}
            >
              ЗМІНИТИ ДАНІ ТЕМИ
            </button>
            <button
              type="button"
              className={styles.coursesLandingEditActionButton}
              onClick={handleCourseLandingCreateTopicAction}
              disabled={!canCreateTopic || isActionLoading}
            >
              СТВОРИТИ ТЕМУ
            </button>
            <button
              type="button"
              className={styles.coursesLandingEditActionButton}
              onClick={handleCourseLandingEditTopicAction}
              disabled={!selectedTopicId || isActionLoading}
            >
              РЕДАГУВАТИ ТЕМУ
            </button>
            <button
              type="button"
              className={styles.coursesLandingEditActionButton}
              onClick={handleCourseLandingDeleteTopicAction}
              disabled={!selectedTopicId || isActionLoading}
            >
              ВИДАЛИТИ ТЕМУ
            </button>
          </div>
        ) : null}

      </div>
    );
  };

  const renderCourseChips = () => {
    if (section === "service") {
      return null;
    }

    const getToolbarIconClassName = (icon) => {
      if (icon === DeleteIcon) {
        return styles.coursesLandingDeleteIcon;
      }

      if (icon === EditIcon) {
        return styles.coursesLandingEditIcon;
      }

      return styles.coursesLandingToolbarIcon;
    };

    return (
      <div className={styles.sharedCourseSelectorShell}>
        <div className={styles.coursesLandingHeader}>
          <div className={styles.coursesLandingTitle}>Список курсів</div>
          {section !== "scenes" && section !== "achievements" && toolbarButtons.length ? (
            <div className={styles.coursesLandingToolbar}>
              {toolbarButtons.map((item) => (
                <ToolbarButton
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  onClick={item.onClick}
                  disabled={item.disabled || isActionLoading}
                  className={styles.coursesLandingToolbarButton}
                  imageClassName={getToolbarIconClassName(item.icon)}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className={styles.coursesLandingTopLine} />

        <div className={styles.coursesLandingRow}>
          {coursesLandingSlots.map((course) => {
            const isSelected = !course.__placeholder && Number(selectedCourseId) === Number(course.id);
            const publishMeta = getCoursePublishMeta(course);

            return (
              <button
                type="button"
                key={course.id}
                className={`${styles.courseLandingCard} ${isSelected ? styles.courseLandingCardActive : ""} ${course.__placeholder ? styles.courseLandingCardPlaceholder : ""}`.trim()}
                onClick={() => handleSharedCourseClick(course)}
                disabled={course.__placeholder}
                aria-pressed={isSelected}
                title={course.__placeholder ? "" : getCourseTooltipText(course)}
                style={course.__placeholder ? undefined : { "--course-flag": `url(${getFlagByCode(course.languageCode)})` }}
              >
                <span className={styles.courseLandingInner}>
                  <span className={styles.courseLandingMain}>
                    <span className={styles.courseLandingLabel}>{String(course.level || "")}</span>
                  </span>
                  <span
                    className={`${styles.courseLandingToggle} ${publishMeta.isPublished ? styles.courseLandingToggleActive : ""} ${publishMeta.isToggleDisabled ? styles.courseLandingToggleDisabled : ""}`.trim()}
                    role="checkbox"
                    aria-checked={publishMeta.isPublished}
                    aria-disabled={publishMeta.isToggleDisabled}
                    title={publishMeta.toggleTitle}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleCoursePublishToggle(course);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        event.stopPropagation();
                        handleCoursePublishToggle(course);
                      }
                    }}
                    tabIndex={publishMeta.isToggleDisabled ? -1 : 0}
                  >
                    {publishMeta.isPublished ? <span className={styles.courseLandingCheck}>✓</span> : null}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className={styles.coursesLandingMiddleLine} />
      </div>
    );
  };


  const renderSharedSectionShell = (title, content, sharedToolbarButtons = [], toolbarClassName = "") => {
    const getToolbarIconClassName = (icon) => {
      if (icon === DeleteIcon) {
        return styles.coursesLandingDeleteIcon;
      }

      if (icon === EditIcon) {
        return styles.coursesLandingEditIcon;
      }

      if (icon === PreviewIcon) {
        return styles.coursesLandingPreviewIcon;
      }

      if (icon === AddIcon) {
        return styles.coursesLandingAddIcon;
      }

      return styles.coursesLandingToolbarIcon;
    };

    return (
      <div className={styles.sharedSectionShell}>
        <div className={styles.coursesLandingDetailsHeader}>
          <div className={styles.coursesLandingDetailsHeaderTopRow}>
            <div className={styles.coursesLandingSectionTitle}>{title}</div>
            {sharedToolbarButtons.length ? (
              <div className={`${styles.coursesLandingToolbar} ${styles.sharedSectionToolbar} ${toolbarClassName}`.trim()}>
                {sharedToolbarButtons.map((item) => (
                  <ToolbarButton
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    onClick={item.onClick}
                    disabled={item.disabled || isActionLoading}
                    className={styles.coursesLandingToolbarButton}
                    imageClassName={getToolbarIconClassName(item.icon)}
                  />
                ))}
              </div>
            ) : null}
          </div>
          <div className={styles.coursesLandingBottomLine} />
        </div>
        <div className={styles.sharedSectionContent}>{content}</div>
      </div>
    );
  };

  const renderServiceSectionContent = (content) => {
    return (
      <div className={styles.sharedSectionShell}>
        <div className={styles.sharedSectionContent}>{content}</div>
      </div>
    );
  };

  const renderAchievementsSelectorShell = () => {
    const getToolbarIconClassName = (icon) => {
      if (icon === DeleteIcon) {
        return styles.coursesLandingDeleteIcon;
      }

      if (icon === EditIcon) {
        return styles.coursesLandingEditIcon;
      }

      if (icon === PreviewIcon) {
        return styles.coursesLandingPreviewIcon;
      }

      return styles.coursesLandingToolbarIcon;
    };

    return (
      <div className={styles.sharedAchievementSelectorShell}>
        <div className={styles.coursesLandingHeader}>
          <div className={styles.coursesLandingTitle}>Досягнення</div>
          {toolbarButtons.length ? (
            <div className={styles.coursesLandingToolbar}>
              {toolbarButtons.map((item) => (
                <ToolbarButton
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  onClick={item.onClick}
                  disabled={item.disabled || isActionLoading}
                  className={styles.coursesLandingToolbarButton}
                  imageClassName={getToolbarIconClassName(item.icon)}
                />
              ))}
            </div>
          ) : null}
        </div>
        <div className={styles.coursesLandingTopLine} />
      </div>
    );
  };

  const tokenStats = useMemo(() => {
    return (tokens || []).reduce((acc, item) => {
      acc.total += 1;

      if (item?.isActive) {
        acc.active += 1;
      }

      if (item?.isRevoked) {
        acc.revoked += 1;
      }

      if (item?.isExpired) {
        acc.expired += 1;
      }

      return acc;
    }, {
      total: 0,
      active: 0,
      revoked: 0,
      expired: 0,
    });
  }, [tokens]);

  const mediaFolderOptions = useMemo(() => {
    const folders = [...new Set((mediaFiles || []).map((item) => getMediaFolderName(item)).filter(Boolean))]
      .sort((left, right) => left.localeCompare(right, "uk"));

    return ["all", ...folders];
  }, [mediaFiles]);

  const filteredMediaFiles = useMemo(() => {
    if (selectedMediaFolder === "all") {
      return mediaFiles || [];
    }

    return (mediaFiles || []).filter((item) => getMediaFolderName(item) === selectedMediaFolder);
  }, [mediaFiles, selectedMediaFolder]);

  const mediaStats = useMemo(() => {
    const totalSizeBytes = (mediaFiles || []).reduce((acc, item) => acc + Number(item?.sizeBytes || 0), 0);

    return {
      total: (mediaFiles || []).length,
      folders: Math.max(mediaFolderOptions.length - 1, 0),
      visible: filteredMediaFiles.length,
      totalSizeBytes,
    };
  }, [filteredMediaFiles.length, mediaFiles, mediaFolderOptions.length]);

  useEffect(() => {
    if (mediaFolderOptions.includes(selectedMediaFolder)) {
      return;
    }

    setSelectedMediaFolder("all");
  }, [mediaFolderOptions, selectedMediaFolder]);

  const renderServiceSelectorShell = () => {
    const isTokensView = serviceView === "tokens";

    return (
      <div className={styles.sharedServiceSelectorShell}>
        <div className={`${styles.coursesLandingHeader} ${styles.serviceSelectorHeader}`.trim()}>
          <div className={styles.coursesLandingTitle}>Сервісні дії</div>
          <div className={`${styles.coursesLandingToolbar} ${styles.serviceSelectorToolbar}`.trim()}>
            <button
              type="button"
              className={`${styles.primaryServiceButton} ${styles.sharedServiceButton} ${isTokensView ? styles.serviceViewButtonActive : styles.serviceViewButton}`.trim()}
              onClick={() => setServiceView("tokens")}
              disabled={isActionLoading}
            >
              TOKENS
            </button>
            {isTokensView ? (
              <button type="button" className={`${styles.primaryServiceButton} ${styles.sharedServiceButton}`.trim()} onClick={cleanupTokens} disabled={isActionLoading}>
                CLEANUP TOKENS
              </button>
            ) : null}
            <button
              type="button"
              className={`${styles.primaryServiceButton} ${styles.sharedServiceButton} ${!isTokensView ? styles.serviceViewButtonActive : styles.serviceViewButton}`.trim()}
              onClick={() => setServiceView("media")}
              disabled={isActionLoading}
            >
              MEDIA FILES
            </button>
          </div>
        </div>
        <div className={styles.coursesLandingTopLine} />
      </div>
    );
  };

  const renderCoursesSection = () => {
    if (!selectedCourseDetails) {
      return <div className={styles.separatorBlue} />;
    }

    const topics = sortByOrder(selectedCourseDetails.topics || []);
    const lessons = sortByOrder(selectedTopicDetails?.lessons || []);
    const exercises = sortByOrder(selectedLessonDetails?.exercises || []);

    return (
      <div className={styles.sectionStack}>
        <div className={styles.separatorBlue} />

        <div className={styles.blockTitle}>Теми курсу {resolveCourseLabel(selectedCourse)}</div>
        <div className={styles.separatorBlueThin} />
        <div className={styles.courseContentTopicsGrid}>
          {topics.map((topic, index) => (
            <button
              type="button"
              key={topic.id}
              className={`${styles.topicTile} ${Number(topic.id) === Number(selectedTopicId) ? styles.topicTileActive : ""}`}
              onClick={() => handleTopicSelection(topic.id)}
            >
              <span className={styles.topicSmall}>ТЕМА {topic.order || index + 1}</span>
              <span className={styles.topicLarge}>{topic.title}</span>
            </button>
          ))}
        </div>

        <div className={styles.separatorPinkWide} />

        <div className={styles.statColumn}>
          <div className={styles.statItem}>Кількість уроків у темі: {selectedTopicDetails?.lessonsCount || 0} / 8</div>
          <div className={styles.statItem}>Кількість вправ у темі: {selectedTopicDetails?.exercisesCount || 0} / 72</div>
          <div className={styles.statItem}>Кількість сцен у темі: {filteredScenes.filter((item) => Number(item.topicId || 0) === Number(selectedTopicId)).length} / 1</div>
        </div>

        {selectedTopicDetails ? (
          <>
            <div className={styles.blockRowBetween}>
              <div className={styles.blockTitle}>Уроки теми {selectedTopicDetails.order || ""}</div>
              <div className={styles.inlineActionRow}>
                <ToolbarButton icon={PreviewIcon} label="Переглянути урок" onClick={handlePreviewAction} disabled={!selectedLessonId || isActionLoading} />
                <ToolbarButton
                  icon={CopyIcon}
                  label="Копія"
                  onClick={handleCopyAction}
                  disabled={(!canCopyLesson && !canCopyExercise) || isActionLoading}
                />
              </div>
            </div>
            <div className={styles.separatorBlueThin} />
            <div className={styles.courseContentLessonRow}>
              {lessons.map((lesson) => (
                <button
                  type="button"
                  key={lesson.id}
                  className={`${styles.lessonChip} ${Number(lesson.id) === Number(selectedLessonId) ? styles.lessonChipActive : ""}`}
                  onClick={() => {
                    setSelectedLessonId(Number(lesson.id));
                    setSelectedExerciseId(0);
                  }}
                >
                  {lesson.title}
                </button>
              ))}
            </div>
            <div className={styles.separatorPinkWide} />
          </>
        ) : null}

        {selectedLessonDetails ? (
          <div className={styles.deepLayout}>
            <div className={styles.deepMain}>
              <div className={styles.blockTitle}>Список вправ уроку {selectedLessonDetails.order || ""}</div>
              <div className={styles.separatorBlueThin} />
              <div className={styles.courseContentExerciseRow}>
                {exercises.map((exercise) => (
                  <button
                    type="button"
                    key={exercise.id}
                    className={`${styles.wordChip} ${Number(exercise.id) === Number(selectedExerciseId) ? styles.wordChipActive : ""}`}
                    onClick={() => setSelectedExerciseId(Number(exercise.id))}
                  >
                    {exercise.question}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.sideButtonColumn}>
              <button type="button" className={styles.primaryActionButton} onClick={openCreateByContext}>ДОДАТИ ВПРАВУ</button>
              <button type="button" className={styles.primaryActionButton} onClick={handlePreviewAction} disabled={!selectedExerciseId}>ПЕРЕГЛЯНУТИ ВПРАВУ</button>
              <button
                type="button"
                className={styles.primaryActionButton}
                onClick={() => openModal("reorderExercises", "", null, {
                  items: exercises.map((item) => ({ id: item.id, title: item.question, order: item.order || 1 })),
                })}
                disabled={!exercises.length}
              >
                ЗМІНИТИ ПОРЯДОК
              </button>
              <button type="button" className={styles.primaryActionButton} onClick={handleCopyAction} disabled={!selectedExerciseId}>КОПІЯ ВПРАВИ</button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderVocabularySection = () => {
    const topics = sortByOrder(selectedCourseDetails?.topics || []);
    const lessons = sortByOrder(selectedTopicDetails?.lessons || []);
    const words = currentLessonVocabulary;
    const isCourseEditMode = showCourseLandingDetails && courseLandingMode === "edit";
    const isLessonWordsMode = isCourseEditMode && Boolean(selectedLessonId);
    const lessonNumber = selectedLessonDetails?.order || selectedLesson?.order || "";
    const courseLanguageTitle = resolveLanguageGenitiveLabel(selectedCourse?.languageCode);
    const getToolbarIconClassName = (icon) => {
      if (icon === BackArrowIcon) {
        return styles.coursesLandingBackIcon;
      }

      if (icon === DeleteIcon) {
        return styles.coursesLandingDeleteIcon;
      }

      if (icon === EditIcon) {
        return styles.coursesLandingEditIcon;
      }

      if (icon === AddIcon) {
        return styles.coursesLandingAddIcon;
      }

      if (icon === PreviewIcon) {
        return styles.coursesLandingPreviewIcon;
      }

      return styles.coursesLandingToolbarIcon;
    };

    const wordToolbarButtons = [
      { icon: BackArrowIcon, label: "Назад до уроків", onClick: handleVocabularyBackToLessons, disabled: !selectedLessonId },
      { icon: DeleteIcon, label: "Видалити слово", onClick: openDeleteByContext, disabled: !selectedVocabularyId },
      { icon: EditIcon, label: "Редагувати слово", onClick: openEditByContext, disabled: !selectedVocabularyId },
      { icon: AddIcon, label: "Додати слово", onClick: openCreateByContext, disabled: !selectedLessonId },
      { icon: PreviewIcon, label: "Переглянути слово", onClick: handlePreviewAction, disabled: !selectedVocabularyId },
    ];

    let sectionTitle = "";

    if (isLessonWordsMode) {
      sectionTitle = `Список слів уроку ${lessonNumber}`.trim();
    } else if (selectedCourseId && !isCourseEditMode) {
      sectionTitle = `Загальний словник ${courseLanguageTitle} мови`;
    } else if (selectedCourseDetails && isCourseEditMode) {
      sectionTitle = `Теми курсу ${resolveCourseLabel(selectedCourse)}`;
    }

    return (
      <div className={styles.sharedSectionShell}>
        <div className={styles.coursesLandingDetailsHeader}>
          {sectionTitle ? (
            <div className={styles.coursesLandingDetailsHeaderTopRow}>
              <div className={styles.coursesLandingSectionTitle}>{sectionTitle}</div>
              {isLessonWordsMode ? (
                <div className={styles.coursesLandingToolbar}>
                  {wordToolbarButtons.map((item) => (
                    <ToolbarButton
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      onClick={item.onClick}
                      disabled={item.disabled || isActionLoading}
                      className={styles.coursesLandingToolbarButton}
                      imageClassName={getToolbarIconClassName(item.icon)}
                    />
                  ))}
                </div>
              ) : null}
              {selectedCourseId && !isCourseEditMode ? (
                <div className={styles.adminVocabularyGeneralHeaderControls}>
                  <label className={styles.adminVocabularySearchBox}>
                    <span className={styles.adminVocabularySearchIcon} aria-hidden="true" />
                    <input
                      type="text"
                      className={styles.adminVocabularySearchInput}
                      value={vocabularySearchValue}
                      onChange={(event) => setVocabularySearchValue(event.target.value)}
                      placeholder="Пошук слова"
                    />
                  </label>
                  <div className={styles.adminVocabularyHeaderToolbar}>
                    <ToolbarButton
                      icon={DeleteIcon}
                      label="Видалити слово"
                      onClick={handleGeneralVocabularyDeleteAction}
                      disabled={isActionLoading || (!filteredCourseLanguageVocabulary.length && !isGeneralVocabularyDeleteMode)}
                      className={`${styles.adminVocabularyHeaderIconButton} ${isGeneralVocabularyDeleteMode ? styles.adminVocabularyHeaderIconButtonActive : ""}`.trim()}
                      imageClassName={styles.coursesLandingDeleteIcon}
                    />
                    <ToolbarButton
                      icon={ImportExportIcon}
                      label="Імпорт / експорт слова"
                      onClick={handleGeneralVocabularyImportExportAction}
                      disabled={isActionLoading || (!filteredCourseLanguageVocabulary.length && !isGeneralVocabularyExportMode)}
                      className={`${styles.adminVocabularyHeaderIconButton} ${isGeneralVocabularyExportMode ? styles.adminVocabularyHeaderIconButtonActive : ""}`.trim()}
                      imageClassName={styles.coursesLandingToolbarIcon}
                    />
                    <ToolbarButton
                      icon={AddIcon}
                      label="Додати слово"
                      onClick={openCreateByContext}
                      disabled={isActionLoading}
                      className={styles.adminVocabularyHeaderIconButton}
                      imageClassName={styles.coursesLandingAddIcon}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className={styles.coursesLandingBottomLine} />
        </div>

        {!selectedCourseId ? <div className={styles.adminVocabularyEmptyShell} /> : null}

        {selectedCourseId && !isCourseEditMode ? (
          <div className={`${styles.sharedSectionContent} ${styles.adminVocabularyExpandedContent}`.trim()}>
            {filteredCourseLanguageVocabulary.length ? (
              <div className={`${styles.adminVocabularyWordGrid} ${styles.adminVocabularyWordGridExpanded}`.trim()}>
                {filteredCourseLanguageVocabulary.map((item) => {
                  const translation = getPrimaryVocabularyTranslation(item);
                  const chipTitle = buildVocabularyChipTitle(item);
                  const isSelectionMode = isGeneralVocabularyDeleteMode || isGeneralVocabularyExportMode;
                  const isSelectedForDelete = selectedGeneralVocabularyIds.includes(Number(item.id));
                  const isSelectedForExport = selectedGeneralVocabularyExportIds.includes(Number(item.id));
                  const isSelectedForAction = isGeneralVocabularyDeleteMode ? isSelectedForDelete : isSelectedForExport;

                  return (
                    <div
                      key={item.id}
                      className={`${styles.adminVocabularyWordChipWrap} ${isSelectionMode ? styles.adminVocabularyWordChipWrapSelectable : ""}`.trim()}
                    >
                      <button
                        type="button"
                        className={`${styles.adminVocabularyWordChip} ${isSelectedForAction ? styles.adminVocabularyWordChipMarked : ""}`.trim()}
                        onClick={() => {
                          if (isGeneralVocabularyDeleteMode) {
                            toggleGeneralVocabularySelection(item.id);
                            return;
                          }

                          if (isGeneralVocabularyExportMode) {
                            toggleGeneralVocabularyExportSelection(item.id);
                            return;
                          }

                          openVocabularyEditorModal(item);
                        }}
                        title={chipTitle}
                        aria-pressed={isSelectionMode ? isSelectedForAction : undefined}
                      >
                        <span className={styles.adminVocabularyWordChipWord}>{item.word}</span>
                        {translation ? <span className={styles.adminVocabularyWordChipTranslation}>({translation})</span> : null}
                      </button>
                      {isSelectionMode ? (
                        <span className={`${styles.adminVocabularySelectionBox} ${isSelectedForAction ? styles.adminVocabularySelectionBoxActive : ""}`.trim()} aria-hidden="true">
                          <span className={styles.adminVocabularySelectionInner}>{isSelectedForAction ? "✓" : ""}</span>
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>
                {normalizedVocabularySearchValue ? "За цим запитом слова не знайдено" : "Для цієї мови ще немає слів у загальному словнику"}
              </div>
            )}
          </div>
        ) : null}

        {selectedCourseDetails && isCourseEditMode && !isLessonWordsMode ? (
          <>
            <div className={styles.coursesLandingTopicsGrid}>
              {topics.map((topic, index) => {
                const isSelectedTopic = Number(topic.id) === Number(selectedTopicId);

                return (
                  <button
                    type="button"
                    key={topic.id}
                    className={`${styles.coursesLandingTopicCard} ${isSelectedTopic ? styles.coursesLandingTopicCardActive : ""}`.trim()}
                    onClick={() => handleTopicSelection(topic.id)}
                    aria-pressed={isSelectedTopic}
                  >
                    <span className={styles.coursesLandingTopicSmall}>ТЕМА {topic.order || index + 1}</span>
                    <span className={styles.coursesLandingTopicLarge}>{topic.title}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.coursesLandingEditFooter}>
              <div className={styles.coursesLandingEditFooterLine} />
            </div>
          </>
        ) : null}

        {selectedTopicDetails && isCourseEditMode && !isLessonWordsMode ? (
          <>
            <div className={styles.courseLandingNestedHeader}>
              <div className={styles.courseLandingNestedTitle}>Уроки теми {selectedTopicDetails.order || ""}</div>
            </div>
            <div className={styles.courseLandingNestedLine} />
            <div className={styles.courseLandingLessonRow}>
              {lessons.map((lesson, index) => {
                const isSelectedLesson = Number(lesson.id) === Number(selectedLessonId);

                return (
                  <button
                    type="button"
                    key={lesson.id}
                    className={`${styles.courseLandingLessonCard} ${isSelectedLesson ? styles.courseLandingLessonCardActive : ""}`.trim()}
                    onClick={() => {
                      setSelectedLessonId(Number(lesson.id));
                      setSelectedVocabularyId(0);
                    }}
                    aria-pressed={isSelectedLesson}
                  >
                    <span className={styles.courseLandingLessonLabel}>УРОК {lesson.order || index + 1}</span>
                  </button>
                );
              })}
            </div>
            <div className={styles.courseLandingNestedPinkLine} />
          </>
        ) : null}

        {isLessonWordsMode ? (
          <div className={styles.sharedSectionContent}>
            <div className={styles.courseLandingLessonSection}>
              <div className={styles.deepMain}>
                {words.length ? (
                  <div className={styles.adminVocabularyWordGrid}>
                    {words.map((item) => {
                      const translation = getPrimaryVocabularyTranslation(item);
                      const chipTitle = buildVocabularyChipTitle(item);

                      return (
                        <button
                          type="button"
                          key={item.id}
                          className={`${styles.adminVocabularyWordChip} ${Number(item.id) === Number(selectedVocabularyId) ? styles.adminVocabularyWordChipActive : ""}`}
                          onClick={() => setSelectedVocabularyId((prev) => (Number(prev) === Number(item.id) ? 0 : Number(item.id)))}
                          title={chipTitle}
                          aria-pressed={Number(item.id) === Number(selectedVocabularyId)}
                        >
                          <span className={styles.adminVocabularyWordChipWord}>{item.word}</span>
                          {translation ? <span className={styles.adminVocabularyWordChipTranslation}>({translation})</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className={styles.emptyState}>У цьому уроці ще немає прив'язаних слів</div>
                )}
              </div>
              <div className={styles.coursesLandingLessonEditActionsInline}>
                <button
                  type="button"
                  className={styles.coursesLandingEditActionButton}
                  onClick={() => openModal("linkVocabulary", "", null, { vocabularyItemId: "" })}
                >
                  ПРИВ'ЯЗАТИ ДО УРОКУ
                </button>
                <button
                  type="button"
                  className={styles.coursesLandingEditActionButton}
                  onClick={unlinkVocabulary}
                  disabled={!selectedVocabularyId}
                >
                  ВІДВ'ЯЗАТИ ВІД УРОКУ
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderScenesSection = () => {
    const steps = sortByOrder(selectedSceneDetails?.steps || []);
    const isSceneEditMode = sceneManagementMode === "edit" && Boolean(selectedSceneId);
    const sceneEditorCourseId = Number((isSceneEditMode ? inlineSceneForm.courseId : (selectedSceneDetails?.courseId || selectedScene?.courseId || 0)) || 0);
    const selectedSceneCourseDetails = sceneEditorCourseId
      ? courseDetailsMap[sceneEditorCourseId] || (Number(selectedCourseId) === sceneEditorCourseId ? selectedCourseDetails : null)
      : null;

    const getToolbarIconClassName = (icon) => {
      if (icon === BackArrowIcon) {
        return styles.coursesLandingBackIcon;
      }

      if (icon === DeleteIcon) {
        return styles.coursesLandingDeleteIcon;
      }

      if (icon === EditIcon) {
        return styles.coursesLandingEditIcon;
      }

      if (icon === AddIcon) {
        return styles.coursesLandingAddIcon;
      }

      if (icon === PreviewIcon) {
        return styles.coursesLandingPreviewIcon;
      }

      return styles.coursesLandingToolbarIcon;
    };

    const sceneToolbarButtons = [
      { icon: DeleteIcon, label: "Видалити сцену", onClick: openDeleteByContext, disabled: !selectedSceneId || isActionLoading },
      { icon: EditIcon, label: "Редагувати сцену", onClick: handleSceneEnterEditMode, disabled: !selectedSceneId || isActionLoading },
      { icon: CopyIcon, label: "Копія сцени", onClick: handleSceneCopyAction, disabled: !selectedSceneId || !canCopyScene || isActionLoading },
      { icon: ImportExportIcon, label: "Імпорт / експорт сцени", onClick: handleImportExportAction, disabled: isActionLoading },
      { icon: AddIcon, label: "Додати сцену", onClick: openCreateByContext, disabled: !canCreateScene || isActionLoading },
      { icon: PreviewIcon, label: "Перегляд сцени", onClick: handlePreviewAction, disabled: !selectedSceneId || isActionLoading },
    ];

    const sceneEditHeaderButtons = [
      { icon: BackArrowIcon, label: "Повернутися до списку сцен", onClick: handleSceneBackToList, disabled: isActionLoading },
      { icon: PreviewIcon, label: "Перегляд сцени", onClick: handlePreviewAction, disabled: !selectedSceneId || isActionLoading },
    ];

    return (
      <div className={`${styles.sharedSectionShell} ${isSceneEditMode ? styles.sceneEditorShell : ""}`.trim()}>
        <div className={styles.coursesLandingDetailsHeader}>
          <div className={styles.coursesLandingDetailsHeaderTopRow}>
            <div className={styles.coursesLandingSectionTitle}>
              {isSceneEditMode && selectedSceneDetails
                ? `Редагування сцени ${selectedSceneDetails.title || ""}`.trim()
                : "Сцени"}
            </div>
            <div className={styles.coursesLandingToolbar}>
              {(isSceneEditMode ? sceneEditHeaderButtons : sceneToolbarButtons).map((item) => (
                <ToolbarButton
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  onClick={item.onClick}
                  disabled={item.disabled}
                  className={styles.coursesLandingToolbarButton}
                  imageClassName={getToolbarIconClassName(item.icon)}
                />
              ))}
            </div>
          </div>
          <div className={styles.coursesLandingBottomLine} />
        </div>

        <div className={styles.sharedSectionContent}>
          {!isSceneEditMode ? (
            <div className={`${styles.sectionStack} ${styles.sharedSectionBody}`.trim()}>
              {displayedScenes.length ? (
                <div className={styles.scenesGrid}>
                  {displayedScenes.map((scene) => {
                    const isActive = Number(scene.id) === Number(selectedSceneId);
                    const imageUrl = resolveMediaUrl(scene.backgroundUrl);

                    return (
                      <button
                        type="button"
                        key={scene.id}
                        className={`${styles.sceneCard} ${isActive ? styles.sceneCardActive : ""}`}
                        onClick={() => handleSceneSelection(scene.id)}
                        aria-pressed={isActive}
                      >
                        {imageUrl ? <img src={imageUrl} alt="" className={styles.sceneImage} /> : <span className={styles.scenePlaceholder} />}
                        <span className={styles.sceneTitle}>{scene.title || "сцена"}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.emptyState}>У цьому курсі ще немає сцен</div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.sceneEditorLayout}>
                <div className={styles.sceneEditorMain}>
                  <div className={styles.sceneEditorFormCard}>
                    <div className={styles.formGridTwo}>
                      <div>
                        <label className={styles.formLabel}>Курс</label>
                        <select
                          className={styles.formInput}
                          value={inlineSceneForm.courseId || ""}
                          onChange={(e) => {
                            updateInlineSceneField("courseId", e.target.value);
                            updateInlineSceneField("topicId", "");
                          }}
                        >
                          <option value="">Без курсу</option>
                          {courses.map((item) => (
                            <option key={item.id} value={item.id}>{resolveCourseLabel(item)} · {item.title}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={styles.formLabel}>Тема</label>
                        <select
                          className={styles.formInput}
                          value={inlineSceneForm.topicId || ""}
                          onChange={(e) => {
                            updateInlineSceneField("topicId", e.target.value);

                            if (e.target.value) {
                              updateInlineSceneField("sceneType", "Sun");
                            }
                          }}
                          disabled={!Number(inlineSceneForm.courseId || 0)}
                        >
                          <option value="">Без теми</option>
                          {sortByOrder(selectedSceneCourseDetails?.topics || []).map((item) => (
                            <option key={item.id} value={item.id}>{item.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGridTwo}>
                      <div>
                        <label className={styles.formLabel}>Назва</label>
                        <input className={styles.formInput} value={inlineSceneForm.title || ""} onChange={(e) => updateInlineSceneField("title", e.target.value)} title={FIELD_HINTS.sceneTitle} placeholder="Назва сцени" />
                      </div>
                      <div>
                        <label className={styles.formLabel}>Порядок</label>
                        <input className={styles.formInput} value={inlineSceneForm.order || ""} onChange={(e) => updateInlineSceneField("order", e.target.value)} title={FIELD_HINTS.sceneOrder} placeholder="1" />
                      </div>
                    </div>

                    <label className={styles.formLabel}>Опис сцени</label>
                    <textarea className={styles.textareaMedium} value={inlineSceneForm.description || ""} onChange={(e) => updateInlineSceneField("description", e.target.value)} title={FIELD_HINTS.sceneDescription} placeholder="Короткий опис сцени" />

                    <label className={styles.formLabel}>Тип сцени</label>
                    <select className={styles.formInput} value={inlineSceneForm.sceneType || "Dialog"} onChange={(e) => updateInlineSceneField("sceneType", e.target.value)} title={FIELD_HINTS.sceneType}>
                      {SCENE_TYPE_OPTIONS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>

                    {String(inlineSceneForm.topicId || "").trim() ? (
                      <div className={styles.sceneTypeHint}>Для сцени, яка прив'язується до теми, потрібно залишити тип Sun.</div>
                    ) : null}

                    <label className={styles.formLabel}>Background URL</label>
                    <input className={styles.formInput} value={inlineSceneForm.backgroundUrl || ""} onChange={(e) => updateInlineSceneField("backgroundUrl", e.target.value)} title={FIELD_HINTS.sceneBackgroundUrl} placeholder="https://... або /uploads/..." />

                    <label className={styles.formLabel}>Audio URL</label>
                    <input className={styles.formInput} value={inlineSceneForm.audioUrl || ""} onChange={(e) => updateInlineSceneField("audioUrl", e.target.value)} title={FIELD_HINTS.sceneAudioUrl} placeholder="https://... або /uploads/..." />

                    <div className={styles.sceneEditorCardActions}>
                      <button
                        type="button"
                        className={styles.primaryActionButtonModal}
                        onClick={handleInlineSceneSave}
                        disabled={!selectedSceneDetails || isActionLoading}
                      >
                        ЗБЕРЕГТИ СЦЕНУ
                      </button>
                    </div>
                  </div>

                  <div className={styles.blockTitle}>Кроки сцени</div>
                  <div className={styles.separatorBlueThin} />

                  {steps.length ? (
                    <div className={styles.sceneEditorStepsList}>
                      {steps.map((step, index) => {
                        const stepForm = inlineSceneStepForms[step.id] || buildSceneStepForm(step);
                        const isActive = Number(step.id) === Number(selectedSceneStepId);

                        return (
                          <div
                            key={step.id}
                            className={`${styles.sceneEditorStepCard} ${styles.sceneEditorStepEditCard} ${isActive ? styles.sceneEditorStepEditCardActive : ""}`.trim()}
                            onClick={() => setSelectedSceneStepId((prev) => (Number(prev) === Number(step.id) ? 0 : Number(step.id)))}
                          >
                            <div className={styles.sceneEditorStepHeader}>
                              <div className={styles.sceneEditorStepTitle}>{`Крок ${step.order || index + 1}`}</div>
                              <div className={styles.sceneEditorStepType}>{stepForm.stepType || "Line"}</div>
                            </div>

                            <div className={styles.formGridTwo}>
                              <div>
                                <label className={styles.formLabel}>Speaker</label>
                                <input className={styles.formInput} value={stepForm.speaker || ""} onChange={(e) => updateInlineSceneStepField(step.id, "speaker", e.target.value)} title={FIELD_HINTS.sceneStepSpeaker} placeholder="Narrator" />
                              </div>
                              <div>
                                <label className={styles.formLabel}>Порядок</label>
                                <input className={styles.formInput} value={stepForm.order || ""} onChange={(e) => updateInlineSceneStepField(step.id, "order", e.target.value)} title={FIELD_HINTS.sceneStepOrder} placeholder="1" />
                              </div>
                            </div>

                            <label className={styles.formLabel}>Text</label>
                            <textarea className={styles.textareaMedium} value={stepForm.text || ""} onChange={(e) => updateInlineSceneStepField(step.id, "text", e.target.value)} title={FIELD_HINTS.sceneStepText} placeholder="Текст репліки або кроку" />

                            <label className={styles.formLabel}>Тип кроку</label>
                            <select className={styles.formInput} value={stepForm.stepType || "Line"} onChange={(e) => updateInlineSceneStepField(step.id, "stepType", e.target.value)} title={FIELD_HINTS.sceneStepType}>
                              {SCENE_STEP_TYPE_OPTIONS.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>


                            {stepForm.stepType === "Choice" ? (
                              <>
                                <label className={styles.formLabel}>Варіанти відповіді</label>
                                <div className={styles.sceneChoicesEditor}>
                                  {(stepForm.choiceItems || []).map((choiceItem, choiceIndex) => (
                                    <div key={choiceItem.id || `${step.id}-${choiceIndex}`} className={styles.sceneChoiceRow}>
                                      <label className={styles.sceneChoiceCorrectWrap}>
                                        <input
                                          type="radio"
                                          name={`scene-step-correct-${step.id}`}
                                          checked={Boolean(choiceItem.isCorrect)}
                                          onChange={(e) => {
                                            e.stopPropagation();
                                            setInlineSceneChoiceCorrect(step.id, choiceIndex);
                                          }}
                                        />
                                        <span>Правильна</span>
                                      </label>
                                      <input
                                        className={styles.sceneChoiceInput}
                                        value={choiceItem.text || ""}
                                        onChange={(e) => updateInlineSceneChoiceItem(step.id, choiceIndex, "text", e.target.value)}
                                        placeholder={`Варіант ${choiceIndex + 1}`}
                                      />
                                      <button
                                        type="button"
                                        className={styles.sceneChoiceRemoveButton}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeInlineSceneChoiceItem(step.id, choiceIndex);
                                        }}
                                        disabled={(stepForm.choiceItems || []).length <= 1}
                                      >
                                        Видалити
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                <div className={styles.sceneEditorSecondaryActions}>
                                  <button
                                    type="button"
                                    className={styles.secondaryActionButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addInlineSceneChoiceItem(step.id);
                                    }}
                                  >
                                    ДОДАТИ ВАРІАНТ
                                  </button>
                                </div>
                              </>
                            ) : null}

                            {stepForm.stepType === "Input" ? (
                              <>
                                <label className={styles.formLabel}>Правильна відповідь</label>
                                <input
                                  className={styles.formInput}
                                  value={stepForm.inputCorrectAnswer || ""}
                                  onChange={(e) => updateInlineSceneStepField(step.id, "inputCorrectAnswer", e.target.value)}
                                  placeholder="Введи правильну відповідь"
                                />
                              </>
                            ) : null}

                            <div className={styles.sceneEditorCardActions}>
                              <button
                                type="button"
                                className={styles.primaryActionButtonModal}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInlineSceneStepSave(step.id);
                                }}
                                disabled={isActionLoading}
                              >
                                ЗБЕРЕГТИ КРОК
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>У цій сцені ще немає кроків</div>
                  )}
                </div>
              </div>

              <div className={styles.sceneEditorActionsDocked}>
                <button
                  type="button"
                  className={styles.coursesLandingEditActionButton}
                  onClick={() => openModal("sceneStepForm", "create", null, buildSceneStepForm(null))}
                  disabled={!selectedSceneId || isActionLoading}
                >
                  ДОДАТИ КРОК
                </button>
                <button
                  type="button"
                  className={styles.coursesLandingEditActionButton}
                  onClick={() => openModal("confirmDeleteSceneStep", "", selectedSceneStep)}
                  disabled={!selectedSceneStepId || isActionLoading}
                >
                  ВИДАЛИТИ КРОК
                </button>
                <button
                  type="button"
                  className={styles.coursesLandingEditActionButton}
                  onClick={() => openModal("reorderSceneSteps", "", null, {
                    items: steps.map((item) => ({ id: item.id, title: item.text, order: item.order || 1 })),
                  })}
                  disabled={!steps.length || isActionLoading}
                >
                  ЗМІНИТИ ПОРЯДОК КРОКІВ
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderAchievementsSection = () => {
    return (
      <div className={`${styles.sharedSectionShell} ${styles.sharedAchievementsSectionShell}`.trim()}>
        <div className={`${styles.sectionStack} ${styles.sharedSectionBody} ${styles.sharedAchievementsBody}`.trim()}>
          <div className={`${styles.achievementGrid} ${styles.achievementGridExpanded}`.trim()}>
            {achievements.map((item) => {
              const isActive = Number(item.id) === Number(selectedAchievementId);
              const imageUrl = resolveMediaUrl(item.imageUrl);

              return (
                <button
                  type="button"
                  key={item.id}
                  className={`${styles.achievementCard} ${isActive ? styles.achievementCardActive : ""}`}
                  onClick={() => setSelectedAchievementId(Number(item.id))}
                >
                  {imageUrl ? <img src={imageUrl} alt="" className={styles.achievementImage} /> : <div className={styles.achievementImagePlaceholder} />}
                  <div className={styles.achievementName}>{item.title || "назва"}</div>
                  <div className={styles.achievementDescription}>{item.description || "опис"}</div>
                </button>
              );
            })}
          </div>
          <div className={styles.separatorPinkWide} />
        </div>
      </div>
    );
  };

  const renderUsersSection = () => {
    const left = filteredUsers.slice(0, Math.ceil(filteredUsers.length / 2));
    const right = filteredUsers.slice(Math.ceil(filteredUsers.length / 2));

    const canEditUser = (user) => {
      if (!user) {
        return false;
      }

      if (user.isPrimaryAdmin) {
        return isCurrentPrimaryAdmin && Number(user.id || 0) === Number(currentAdminUserId || 0);
      }

      if (String(user.role || "").trim().toLowerCase() === "admin") {
        return isCurrentPrimaryAdmin;
      }

      return true;
    };

    const canDeleteUser = (user) => {
      if (!user) {
        return false;
      }

      if (Number(user.id || 0) === Number(currentAdminUserId || 0)) {
        return false;
      }

      if (user.isPrimaryAdmin) {
        return false;
      }

      if (String(user.role || "").trim().toLowerCase() === "admin") {
        return isCurrentPrimaryAdmin;
      }

      return true;
    };

    const usersToolbarButtons = [
      {
        icon: EditIcon,
        label: "Редагувати користувача",
        onClick: () => {
          if (!selectedAdminUser || !canEditUser(selectedAdminUser)) {
            return;
          }

          openModal("userForm", "edit", selectedAdminUser, buildUserForm(selectedAdminUser));
        },
        disabled: !selectedAdminUser || !canEditUser(selectedAdminUser),
      },
      {
        icon: AddIcon,
        label: "Додати користувача",
        onClick: () => openModal("userForm", "create", null, buildUserForm(null)),
        disabled: false,
      },
    ];

    const renderColumn = (items, startIndex) => (
      <div className={styles.usersColumn}>
        {items.map((user, index) => {
          const canDelete = canDeleteUser(user);
          const isSelected = Number(user.id || 0) === Number(selectedAdminUserId || 0);
          const isAdminRole = String(user.role || "").trim().toLowerCase() === "admin";
          const languageCode = user.targetLanguageCode || user.nativeLanguageCode || "en";
          const languageLabel = resolveLanguageDisplayLabel(languageCode);
          const userPoints = Number(user.points || 0);
          const userCrystals = Number(user.crystals || 0);
          const userHearts = Number(user.hearts || 0);

          return (
            <div
              className={`${styles.userRow} ${isSelected ? styles.userRowSelected : ""} ${isAdminRole ? styles.userRowAdmin : ""}`.trim()}
              key={user.id || `${startIndex}-${index}`}
              onClick={() => toggleSelectedAdminUser(user.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  toggleSelectedAdminUser(user.id);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div className={styles.userRank}>{startIndex + index + 1}</div>
              <div className={styles.userAvatarWrap}>
                {user.avatarUrl ? <img src={resolveMediaUrl(user.avatarUrl)} alt="" className={styles.userAvatar} /> : <div className={styles.userAvatarPlaceholder} />}
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userTextBlock}>
                  <div className={styles.userName}>{getUserTitle(user)}</div>
                  <div className={styles.userEmail}>{user.email || "—"}</div>
                  {user.isBlocked ? <div className={styles.userBlockedBadge}>Заблоковано до {formatAdminDateTime(user.blockedUntilUtc)}</div> : null}
                  {!isAdminRole ? (
                    <div className={styles.userLanguageLine}>
                      <img src={getFlagByCode(languageCode)} alt="" className={styles.userFlag} />
                      <span className={styles.userMeta}>{languageLabel}</span>
                    </div>
                  ) : null}
                </div>
              </div>
              {!isAdminRole ? (
                <div className={styles.userStatsColumn}>
                  <div className={styles.userStatLine}>
                    <img src={CrystalIcon} alt="" className={styles.userStatIcon} />
                    <span>{userCrystals}</span>
                  </div>
                  <div className={styles.userStatLine}>
                    <img src={PointsIcon} alt="" className={styles.userStatIcon} />
                    <span>{userPoints}</span>
                  </div>
                  <div className={styles.userStatLine}>
                    <img src={LessonEnergyIcon} alt="" className={styles.userStatIcon} />
                    <span>{userHearts}</span>
                  </div>
                </div>
              ) : null}
              <button
                type="button"
                className={`${styles.userActionButton} ${canDelete ? "" : styles.userActionButtonDisabled}`.trim()}
                onClick={(event) => {
                  event.stopPropagation();
                  openModal("confirmDelete", "user", user);
                }}
                disabled={!canDelete || isActionLoading}
                aria-label={`Видалити ${getUserTitle(user)}`}
                title={canDelete ? "Видалити користувача" : Number(user.id || 0) === Number(currentAdminUserId || 0) ? "Не можна видалити себе" : "Недостатньо прав для видалення"}
              >
                <img src={DeleteIcon} alt="" />
              </button>
            </div>
          );
        })}
      </div>
    );

    return renderSharedSectionShell(
      "Користувачі",
      <div className={`${styles.sectionStack} ${styles.sharedSectionBody}`.trim()}>
        <div className={styles.usersLayout}>
          {filteredUsers.length ? (
            <>
              {renderColumn(left, 0)}
              {renderColumn(right, left.length)}
            </>
          ) : (
            <div className={styles.emptyState}>{selectedCourseId ? "Для цього курсу ще немає користувачів" : "У додатку ще немає користувачів"}</div>
          )}
        </div>
      </div>,
      usersToolbarButtons,
      styles.usersSectionToolbar,
    );
  };

  const renderServiceSection = () => {
    if (serviceView === "media") {
      return renderServiceSectionContent(
        <div className={`${styles.sectionStack} ${styles.sharedSectionBody} ${styles.sharedServiceBody}`.trim()}>
          <div className={styles.serviceStatsRow}>
            <div className={styles.serviceStatCard}>
              <div className={styles.serviceStatLabel}>Усього файлів</div>
              <div className={styles.serviceStatValue}>{mediaStats.total}</div>
            </div>
            <div className={styles.serviceStatCard}>
              <div className={styles.serviceStatLabel}>Папок</div>
              <div className={styles.serviceStatValue}>{mediaStats.folders}</div>
            </div>
            <div className={styles.serviceStatCard}>
              <div className={styles.serviceStatLabel}>У вибраній папці</div>
              <div className={styles.serviceStatValue}>{mediaStats.visible}</div>
            </div>
            <div className={styles.serviceStatCard}>
              <div className={styles.serviceStatLabel}>Загальний розмір</div>
              <div className={styles.serviceStatValue}>{formatFileSize(mediaStats.totalSizeBytes)}</div>
            </div>
          </div>

          <div className={styles.serviceMediaToolbar}>
            <div className={styles.serviceMediaSearchWrap}>
              <input
                type="text"
                value={mediaSearchValue}
                onChange={(event) => setMediaSearchValue(event.target.value)}
                className={`${styles.formInput} ${styles.serviceMediaSearchInput}`.trim()}
                placeholder="Пошук по шляху або назві файлу"
              />
            </div>
          </div>

          <div className={styles.serviceFolderRow}>
            {mediaFolderOptions.map((folder) => {
              const isActive = folder === selectedMediaFolder;
              const label = folder === "all" ? "Усі папки" : folder;

              return (
                <button
                  type="button"
                  key={folder}
                  className={`${styles.serviceFolderChip} ${isActive ? styles.serviceFolderChipActive : ""}`.trim()}
                  onClick={() => setSelectedMediaFolder(folder)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className={styles.serviceMediaList}>
            {isMediaLoading ? (
              <div className={styles.emptyState}>Завантаження медіафайлів...</div>
            ) : filteredMediaFiles.length ? (
              filteredMediaFiles.map((item) => {
                const relativePath = getMediaRelativePath(item);
                const folderName = getMediaFolderName(item);
                const shortName = getMediaFileShortName(item);

                return (
                  <div className={styles.serviceMediaCard} key={relativePath || item.url}>
                    <div className={styles.serviceMediaHeader}>
                      <div className={styles.serviceTokenUserBlock}>
                        <div className={styles.serviceTokenUserName}>{shortName}</div>
                        <div className={styles.serviceTokenUserMeta}>{folderName}</div>
                      </div>
                      <div className={styles.serviceMediaExtensionBadge}>{String(item.extension || "—").toUpperCase()}</div>
                    </div>

                    {isImageMediaFile(item) ? (
                      <div className={styles.serviceMediaPreviewWrap}>
                        <img src={item.url} alt="" className={styles.serviceMediaPreview} loading="lazy" />
                      </div>
                    ) : null}

                    <div className={styles.serviceTokenGrid}>
                      <div className={styles.serviceTokenField}>
                        <div className={styles.serviceTokenFieldLabel}>Шлях</div>
                        <div className={styles.serviceTokenFieldValueBreak}>{relativePath || "—"}</div>
                      </div>
                      <div className={styles.serviceTokenField}>
                        <div className={styles.serviceTokenFieldLabel}>Розмір</div>
                        <div className={styles.serviceTokenFieldValue}>{formatFileSize(item.sizeBytes)}</div>
                      </div>
                      <div className={styles.serviceTokenField}>
                        <div className={styles.serviceTokenFieldLabel}>Оновлено</div>
                        <div className={styles.serviceTokenFieldValue}>{formatAdminDateTime(item.lastModifiedUtc)}</div>
                      </div>
                      <div className={`${styles.serviceTokenField} ${styles.serviceTokenFieldWide}`.trim()}>
                        <div className={styles.serviceTokenFieldLabel}>URL</div>
                        <div className={styles.serviceTokenFieldValueBreak}>{item.url || "—"}</div>
                      </div>
                      <div className={`${styles.serviceTokenField} ${styles.serviceTokenFieldWide}`.trim()}>
                        <div className={styles.serviceTokenFieldLabel}>Прив’язано до</div>
                        <div className={styles.serviceTokenFieldValueBreak}>
                          {Array.isArray(item.bindings) && item.bindings.length ? (
                            <>
                              {item.bindings.slice(0, 5).map((binding, index) => (
                                <div key={`${relativePath || item.url}-binding-${index}`}>{binding}</div>
                              ))}
                              {Number(item.bindingCount || item.bindings.length || 0) > 5 ? (
                                <div>Ще {Number(item.bindingCount || item.bindings.length) - 5}</div>
                              ) : null}
                            </>
                          ) : (
                            "Файл зараз ніде не використовується"
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.serviceMediaActions}>
                      <button type="button" className={`${styles.primaryServiceButton} ${styles.serviceSmallButton}`.trim()} onClick={() => openMediaPreview(item)}>
                        ПЕРЕГЛЯНУТИ
                      </button>
                      <button type="button" className={`${styles.primaryServiceButton} ${styles.serviceSmallButton}`.trim()} onClick={() => copyMediaUrl(item)}>
                        КОПІЮВАТИ URL
                      </button>
                      <button type="button" className={`${styles.primaryServiceButton} ${styles.serviceSmallButton}`.trim()} onClick={() => openModal("mediaRename", "", item, buildMediaRenameForm(item))} disabled={isActionLoading}>
                        ПЕРЕЙМЕНУВАТИ
                      </button>
                      <button type="button" className={`${styles.primaryServiceButton} ${styles.serviceSmallButton} ${styles.serviceDangerButton}`.trim()} onClick={() => openModal("confirmDelete", "media", item)} disabled={isActionLoading}>
                        ВИДАЛИТИ
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>Медіафайли поки що не знайдені</div>
            )}
          </div>
        </div>,
      );
    }

    return renderServiceSectionContent(
      <div className={`${styles.sectionStack} ${styles.sharedSectionBody} ${styles.sharedServiceBody}`.trim()}>
        <div className={styles.serviceStatsRow}>
          <div className={styles.serviceStatCard}>
            <div className={styles.serviceStatLabel}>Усього</div>
            <div className={styles.serviceStatValue}>{tokenStats.total}</div>
          </div>
          <div className={styles.serviceStatCard}>
            <div className={styles.serviceStatLabel}>Активні</div>
            <div className={styles.serviceStatValue}>{tokenStats.active}</div>
          </div>
          <div className={styles.serviceStatCard}>
            <div className={styles.serviceStatLabel}>Відкликані</div>
            <div className={styles.serviceStatValue}>{tokenStats.revoked}</div>
          </div>
          <div className={styles.serviceStatCard}>
            <div className={styles.serviceStatLabel}>Прострочені</div>
            <div className={styles.serviceStatValue}>{tokenStats.expired}</div>
          </div>
        </div>

        <div className={styles.serviceTokensList}>
          {isTokensLoading ? (
            <div className={styles.emptyState}>Завантаження токенів...</div>
          ) : tokens.length ? (
            tokens.map((item) => {
              const tokenUserTitle = getUserTitle(item);
              const statusText = item.isActive ? "Активний" : item.isRevoked ? "Відкликаний" : item.isExpired ? "Прострочений" : "Неактивний";

              return (
                <div className={styles.serviceTokenCard} key={item.id || `${item.userId}-${item.tokenHash}`}>
                  <div className={styles.serviceTokenHeader}>
                    <div className={styles.serviceTokenUserBlock}>
                      <div className={styles.serviceTokenUserName}>{tokenUserTitle}</div>
                      <div className={styles.serviceTokenUserMeta}>{item.email || "—"} • {item.role || "—"}</div>
                    </div>
                    <div
                      className={`${styles.serviceTokenStatus} ${item.isActive ? styles.serviceTokenStatusActive : item.isRevoked ? styles.serviceTokenStatusRevoked : item.isExpired ? styles.serviceTokenStatusExpired : ""}`.trim()}
                    >
                      {statusText}
                    </div>
                  </div>

                  <div className={styles.serviceTokenGrid}>
                    <div className={styles.serviceTokenField}>
                      <div className={styles.serviceTokenFieldLabel}>Token ID</div>
                      <div className={styles.serviceTokenFieldValue}>{item.id || "—"}</div>
                    </div>
                    <div className={styles.serviceTokenField}>
                      <div className={styles.serviceTokenFieldLabel}>User ID</div>
                      <div className={styles.serviceTokenFieldValue}>{item.userId || "—"}</div>
                    </div>
                    <div className={styles.serviceTokenField}>
                      <div className={styles.serviceTokenFieldLabel}>Створено</div>
                      <div className={styles.serviceTokenFieldValue}>{formatAdminDateTime(item.createdAt)}</div>
                    </div>
                    <div className={styles.serviceTokenField}>
                      <div className={styles.serviceTokenFieldLabel}>Діє до</div>
                      <div className={styles.serviceTokenFieldValue}>{formatAdminDateTime(item.expiresAt)}</div>
                    </div>
                    <div className={styles.serviceTokenField}>
                      <div className={styles.serviceTokenFieldLabel}>Відкликано</div>
                      <div className={styles.serviceTokenFieldValue}>{formatAdminDateTime(item.revokedAt)}</div>
                    </div>
                    <div className={`${styles.serviceTokenField} ${styles.serviceTokenFieldWide}`.trim()}>
                      <div className={styles.serviceTokenFieldLabel}>Token hash</div>
                      <div className={styles.serviceTokenFieldValueBreak}>{item.tokenHash || "—"}</div>
                    </div>
                    <div className={`${styles.serviceTokenField} ${styles.serviceTokenFieldWide}`.trim()}>
                      <div className={styles.serviceTokenFieldLabel}>Replaced by token hash</div>
                      <div className={styles.serviceTokenFieldValueBreak}>{item.replacedByTokenHash || "—"}</div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>Токени поки що не знайдені</div>
          )}
        </div>
      </div>,
    );
  };

  const handleSceneStepDelete = useCallback(async () => {
    if (!selectedSceneId || !selectedSceneStepId) {
      return;
    }

    setIsActionLoading(true);

    try {
      const response = await adminService.deleteSceneStep(selectedSceneId, selectedSceneStepId);

      if (!response.ok) {
        throw new Error(response.error || "Не вдалося видалити крок");
      }

      await loadSceneDetails(selectedSceneId, true);
      setSelectedSceneStepId(0);
      pushToast("success", "Крок видалено");
      closeModal();
    } catch (error) {
      pushToast("error", error.message || "Помилка видалення кроку");
    } finally {
      setIsActionLoading(false);
    }
  }, [closeModal, loadSceneDetails, pushToast, selectedSceneId, selectedSceneStepId]);

  const triggerAddCourseJsonImport = useCallback((field) => {
    addCourseImportRefs.current[field]?.click();
  }, []);

  const handleAddCourseJsonImport = useCallback(async (field, event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = safeParseJson(text);
      const nextValue = normalizeJsonFieldValue(field, parsed ?? text);

      updateFormField(field, nextValue);
      pushToast("success", `JSON для поля «${field}» імпортовано`);
    } catch {
      pushToast("error", "Не вдалося імпортувати JSON");
    } finally {
      event.target.value = "";
    }
  }, [pushToast, updateFormField]);

  const handleAddCourseJsonExport = useCallback((field) => {
    const sourceValue = String(form?.[field] || "").trim();

    if (!sourceValue) {
      pushToast("error", "Немає даних для експорту");
      return;
    }

    const parsed = safeParseJson(sourceValue);
    const payload = parsed ?? sourceValue;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${field}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    pushToast("success", `JSON для поля «${field}» експортовано`);
  }, [form, pushToast]);

  const renderModalContent = () => {
    if (!modal.type) {
      return null;
    }

    if (modal.type === "confirmDelete") {
      const deleteMessageMap = {
        course: "Впевнені що хочете видалити цей курс?",
        topic: "Впевнені що хочете видалити цю тему?",
        lesson: "Впевнені що хочете видалити цей урок?",
        exercise: "Впевнені що хочете видалити цю вправу?",
        vocabulary: "Впевнені що хочете видалити це слово?",
        scene: "Впевнені що хочете видалити цю сцену?",
        achievement: "Впевнені що хочете видалити це досягнення?",
        user: "Впевнені що хочете видалити цього користувача?",
        media: "Впевнені що хочете видалити цей медіафайл?",
      };

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.deleteConfirmCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.deleteConfirmClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.deleteConfirmCloseIcon}></span>
            </button>
            <div className={styles.deleteConfirmTextWrap}>
              <div className={styles.deleteConfirmText}>{deleteMessageMap[modal.mode] || "Впевнені що хочете видалити цей елемент?"}</div>
            </div>
            <div className={styles.deleteConfirmActions}>
              <button type="button" className={styles.deleteConfirmYesButton} onClick={confirmDelete} disabled={isActionLoading}>ТАК</button>
              <button type="button" className={styles.deleteConfirmNoButton} onClick={closeModal}>НІ</button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "confirmDeleteVocabularyBulk") {
      const selectedCount = [...new Set((form.ids || []).map((item) => Number(item || 0)).filter(Boolean))].length;
      const deleteText = selectedCount > 1
        ? "Впевнені що хочете видалити ці слова?"
        : "Впевнені що хочете видалити це слово?";

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.deleteConfirmCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.deleteConfirmClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.deleteConfirmCloseIcon}></span>
            </button>
            <div className={styles.deleteConfirmTextWrap}>
              <div className={styles.deleteConfirmText}>{deleteText}</div>
            </div>
            <div className={styles.deleteConfirmActions}>
              <button type="button" className={styles.deleteConfirmYesButton} onClick={confirmDeleteVocabularyBulk} disabled={isActionLoading}>ТАК</button>
              <button type="button" className={styles.deleteConfirmNoButton} onClick={closeModal}>НІ</button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "confirmDeleteSceneStep") {
      return (
        <ModalShell title="Видалення кроку" subtitle="Підтвердь дію" onClose={closeModal} compact>
          <div className={styles.confirmText}>Видалити вибраний крок сцени?</div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={handleSceneStepDelete} disabled={isActionLoading}>Видалити</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "mediaRename") {
      const currentFileName = getMediaFileShortName(modal.payload);

      return (
        <ModalShell title="Перейменування файлу" subtitle={currentFileName} onClose={closeModal} compact>
          <label className={styles.formLabel}>Нова назва файлу</label>
          <input
            className={styles.formInput}
            value={form.newFileName || ""}
            onChange={(e) => updateFormField("newFileName", e.target.value)}
            placeholder="Введіть нову назву файлу"
          />
          <div className={styles.fieldHelperText}>Можна вказати назву з розширенням або без нього. Папка і формат файлу залишаться без змін.</div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={saveForm} disabled={isActionLoading || !String(form.newFileName || "").trim()}>
              Зберегти
            </button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "userForm") {
      const availableCourses = sortByOrder(courses || []);
      const selectedCourseIds = Array.isArray(form.courseIds) ? form.courseIds.map((item) => String(item)) : [];
      const selectedActiveCourseId = String(form.activeCourseId || "");
      const isEditMode = modal.mode === "edit";
      const isEditingPrimaryAdmin = Boolean(modal.payload?.isPrimaryAdmin);
      const isAdminRole = String(form.role || "User").trim().toLowerCase() === "admin";
      const adminUserFormError = validateAdminUserForm(form, {
        isEditMode,
        currentUsername: modal.payload?.username || "",
        ignoreUserId: modal.mode === "edit" ? modal.payload?.id : 0,
        users,
      });
      const wrapUserInputWithHint = (inputNode, hint) => (
        <div className={styles.userInputHintWrap} data-tooltip={hint}>
          {inputNode}
          <div className={styles.userInputHoverHint}>{hint}</div>
        </div>
      );

      return (
        <ModalShell
          title={isEditMode ? "Редагування користувача" : "Додавання користувача"}
          subtitle=""
          onClose={closeModal}
          cardClassName={styles.userFormModalCard}
          topRightContent={adminUserFormError ? <div className={styles.modalTopWarning}>{adminUserFormError}</div> : null}
        >
          <div className={styles.formGridTwo}>
            <div>
              <label className={styles.formLabel}>Username</label>
              {wrapUserInputWithHint(
                <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.username || ""} onChange={(e) => updateFormField("username", e.target.value)} />,
                USER_FORM_FIELD_HINTS.username,
              )}
            </div>
            <div>
              <label className={styles.formLabel}>Email</label>
              {wrapUserInputWithHint(
                <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.email || ""} onChange={(e) => updateFormField("email", e.target.value)} disabled={isEditingPrimaryAdmin} />,
                USER_FORM_FIELD_HINTS.email,
              )}
            </div>
          </div>

          <div className={styles.formGridTwo}>
            <div>
              <label className={styles.formLabel}>{isEditMode ? "Новий пароль" : "Пароль"}</label>
              {wrapUserInputWithHint(
                <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.password || ""} onChange={(e) => updateFormField("password", e.target.value)} />,
                isEditMode ? USER_FORM_FIELD_HINTS.passwordEdit : USER_FORM_FIELD_HINTS.passwordCreate,
              )}
            </div>
            <div>
              <label className={styles.formLabel}>Avatar URL</label>
              {wrapUserInputWithHint(
                <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.avatarUrl || ""} onChange={(e) => updateFormField("avatarUrl", e.target.value)} />,
                USER_FORM_FIELD_HINTS.avatarUrl,
              )}
            </div>
          </div>

          <div className={styles.formGridTwo}>
            <div>
              <label className={styles.formLabel}>Роль</label>
              <select className={styles.formInput} value={form.role || "User"} onChange={(e) => updateFormField("role", e.target.value)} disabled={isEditingPrimaryAdmin}>
                <option value="User">User</option>
                <option value="Admin" disabled={!isCurrentPrimaryAdmin && String(form.role || "User") !== "Admin"}>Admin</option>
              </select>
            </div>
            <div>
              <label className={styles.formLabel}>Тема</label>
              <select className={styles.formInput} value={form.theme || "light"} onChange={(e) => updateFormField("theme", e.target.value)}>
                <option value="light">light</option>
                <option value="dark">dark</option>
              </select>
            </div>
          </div>

          {!isAdminRole ? (
            <>
              <div className={styles.formGridTwo}>
                <div>
                  <label className={styles.formLabel}>Рідна мова</label>
                  <select className={styles.formInput} value={form.nativeLanguageCode || "uk"} onChange={(e) => updateFormField("nativeLanguageCode", e.target.value)}>
                    <option value="uk">Українська</option>
                    {LANGUAGE_OPTIONS.map((item) => (
                      <option key={`native-${item.value}`} value={item.value}>{item.tooltipLabel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>Мова вивчення</label>
                  <select className={styles.formInput} value={form.targetLanguageCode || "en"} onChange={(e) => updateFormField("targetLanguageCode", e.target.value)}>
                    {LANGUAGE_OPTIONS.map((item) => (
                      <option key={`target-${item.value}`} value={item.value}>{item.tooltipLabel}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGridTwo}>
                <div>
                  <label className={styles.formLabel}>Бали</label>
                  {wrapUserInputWithHint(
                    <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.points || "0"} onChange={(e) => updateFormField("points", e.target.value)} />,
                    USER_FORM_FIELD_HINTS.points,
                  )}
                </div>
                <div>
                  <label className={styles.formLabel}>Кристали</label>
                  {wrapUserInputWithHint(
                    <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.crystals || "0"} onChange={(e) => updateFormField("crystals", e.target.value)} />,
                    USER_FORM_FIELD_HINTS.crystals,
                  )}
                </div>
              </div>

              <div className={styles.formGridTwo}>
                <div>
                  <label className={styles.formLabel}>Енергія</label>
                  {wrapUserInputWithHint(
                    <input className={`${styles.formInput} ${styles.userFormInput}`.trim()} value={form.hearts || "0"} onChange={(e) => updateFormField("hearts", e.target.value)} />,
                    USER_FORM_FIELD_HINTS.hearts,
                  )}
                </div>
                <div className={styles.userFormCheckboxWrap}>
                  <label className={`${styles.checkboxRow} ${styles.userFormCheckboxRow}`.trim()}>
                    <input type="checkbox" checked={Boolean(form.isEmailVerified)} onChange={(e) => updateFormField("isEmailVerified", e.target.checked)} />
                    <span>Email підтверджений</span>
                  </label>
                </div>
              </div>

              <label className={styles.formLabel}>Курси користувача</label>
              <div className={styles.userCourseGrid}>
                {availableCourses.map((course) => {
                  const normalizedId = String(course.id || "");
                  const isSelected = selectedCourseIds.includes(normalizedId);

                  return (
                    <label key={`user-course-${course.id}`} className={`${styles.userCourseItem} ${isSelected ? styles.userCourseItemActive : ""}`.trim()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUserCourseSelection(course.id)}
                      />
                      <span>{resolveCourseLabel(course)}</span>
                    </label>
                  );
                })}
              </div>

              <label className={styles.formLabel}>Активний курс</label>
              <select className={styles.formInput} value={selectedActiveCourseId} onChange={(e) => updateFormField("activeCourseId", e.target.value)}>
                <option value="">Не обрано</option>
                {availableCourses.filter((course) => selectedCourseIds.includes(String(course.id || ""))).map((course) => (
                  <option key={`active-course-${course.id}`} value={String(course.id)}>{resolveCourseLabel(course)}</option>
                ))}
              </select>
            </>
          ) : null}

          {isAdminRole ? (
            <div className={styles.userFormCheckboxWrapSingle}>
              <label className={`${styles.checkboxRow} ${styles.userFormCheckboxRow}`.trim()}>
                <input type="checkbox" checked={Boolean(form.isEmailVerified)} onChange={(e) => updateFormField("isEmailVerified", e.target.checked)} />
                <span>Email підтверджений</span>
              </label>
            </div>
          ) : null}

          <label className={styles.formLabel}>Блокування користувача</label>
          <div className={styles.userBlockCard}>
            <label className={`${styles.checkboxRow} ${styles.userFormCheckboxRow}`.trim()}>
              <input
                type="checkbox"
                checked={Boolean(form.isBlocked)}
                onChange={(e) => updateFormField("isBlocked", e.target.checked)}
                disabled={isEditingPrimaryAdmin}
              />
              <span>{isEditingPrimaryAdmin ? "Основного адміністратора блокувати не можна" : "Заблокувати користувача"}</span>
            </label>

            {Boolean(form.isBlocked) ? (
              <>
                <div className={styles.formGridTwo}>
                  <div>
                    <label className={styles.formLabel}>Термін блокування</label>
                    <select className={styles.formInput} value={form.blockPreset || "1d"} onChange={(e) => updateFormField("blockPreset", e.target.value)}>
                      <option value="1h">На 1 годину</option>
                      <option value="6h">На 6 годин</option>
                      <option value="12h">На 12 годин</option>
                      <option value="1d">На 1 день</option>
                      <option value="3d">На 3 дні</option>
                      <option value="7d">На 7 днів</option>
                      <option value="30d">На 30 днів</option>
                      <option value="custom">До конкретної дати</option>
                    </select>
                  </div>
                  <div>
                    <label className={styles.formLabel}>Дата розблокування</label>
                    {wrapUserInputWithHint(
                      <input
                        type="datetime-local"
                        className={styles.formInput}
                        value={form.blockedUntilLocal || ""}
                        onChange={(e) => updateFormField("blockedUntilLocal", e.target.value)}
                        disabled={String(form.blockPreset || "1d") !== "custom"}
                      />,
                      USER_FORM_FIELD_HINTS.blockedUntilLocal,
                    )}
                  </div>
                </div>
                <div className={styles.userBlockHint}>
                  {modal.mode === "edit" && modal.payload?.isBlocked
                    ? `Користувач зараз заблокований до ${formatAdminDateTime(modal.payload?.blockedUntilUtc)}.`
                    : "Після блокування користувач не зможе увійти або працювати з уже виданим токеном."}
                </div>
              </>
            ) : modal.mode === "edit" && modal.payload?.isBlocked ? (
              <div className={styles.userBlockHint}>Після збереження користувача буде розблоковано.</div>
            ) : null}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button
              type="button"
              className={styles.primaryActionButtonModal}
              onClick={saveForm}
              disabled={isActionLoading || Boolean(adminUserFormError)}
            >
              {isEditMode ? "Зберегти" : "Додати"}
            </button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "coursePublishBlocked") {
      const publishMeta = getCoursePublishMeta(modal.payload || {});

      return (
        <ModalShell title="Курс ще не готовий до публікації" subtitle="Заверши наповнення курсу" onClose={closeModal} compact>
          <div className={styles.confirmText}>{publishMeta.toggleTitle || "Курс ще не заповнений повністю."}</div>
          {publishMeta.publishIssues.length ? (
            <ul className={styles.publishIssuesList}>
              {publishMeta.publishIssues.map((issue, index) => (
                <li key={`${issue}-${index}`} className={styles.publishIssueItem}>{issue}</li>
              ))}
            </ul>
          ) : null}
          <div className={styles.modalActions}>
            <button type="button" className={styles.primaryActionButtonModal} onClick={closeModal}>Зрозуміло</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "confirmCourseUnpublish") {
      return (
        <ModalShell title="Зняти курс з публікації?" subtitle="Підтвердь дію" onClose={closeModal} compact>
          <div className={styles.confirmText}>Після зняття публікації курс зникне з проходження для користувачів.</div>
          <div className={styles.publishConfirmNote}>Збережений прогрес користувачів не видаляється. Якщо курс знову опублікувати, прогрес і пройдені етапи відобразяться знову.</div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={confirmCourseUnpublish} disabled={isActionLoading}>Зняти</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "courseForm" && modal.mode !== "edit") {
      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.addCourseCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.addCourseClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>

            <label className={styles.addCourseLabel}>Назва курсу</label>
            <input
              className={styles.addCourseInput}
              value={form.title || ""}
              onChange={(e) => updateFormField("title", e.target.value)}
              title={FIELD_HINTS.courseTitle}
              placeholder="Наприклад: Beginner English A1"
            />

            <label className={styles.addCourseLabel}>Теми</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.topics || ""} onChange={(e) => updateFormField("topics", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("topics")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("topics");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для тем"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.topics = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("topics", e)}
              />
            </div>

            <label className={styles.addCourseLabel}>Уроки</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.lessons || ""} onChange={(e) => updateFormField("lessons", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("lessons")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("lessons");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для уроків"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.lessons = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("lessons", e)}
              />
            </div>

            <label className={styles.addCourseLabel}>Вправи</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.exercises || ""} onChange={(e) => updateFormField("exercises", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("exercises")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("exercises");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для вправ"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.exercises = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("exercises", e)}
              />
            </div>

            <label className={styles.addCourseLabel}>Сцени</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.scenes || ""} onChange={(e) => updateFormField("scenes", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("scenes")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("scenes");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для сцен"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.scenes = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("scenes", e)}
              />
            </div>

            <div className={styles.modalSplitActions}>
              <button
                type="button"
                className={styles.secondaryModalWideButton}
                onClick={() => openModal("courseManualForm", "create", null, buildCourseForm(null))}
                disabled={isActionLoading}
              >
                ДОДАТИ ВРУЧНУ
              </button>
              <button type="button" className={styles.addCourseSubmit} onClick={saveForm} disabled={isActionLoading || !String(form.title || "").trim()}>
                ДОБАВИТИ КУРС
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "lessonPreview") {
      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.designerInfoCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.designerModalClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>

            <label className={styles.designerModalLabel}>Теорія</label>
            <div className={`${styles.designerModalBox} ${styles.designerModalBoxTall} ${styles.designerModalTheoryBox}`.trim()}>
              <div className={styles.designerModalTheoryContent}>{modal.payload?.theory || ""}</div>
            </div>

            <label className={styles.designerModalLabel}>Вправи</label>
            <div className={styles.designerModalBox}>{(modal.payload?.exercises || []).length}</div>

            <label className={styles.designerModalLabel}>Словник уроку</label>
            <div className={styles.designerModalBox}>{(currentLessonVocabulary || []).length}</div>
          </div>
        </div>
      );
    }

    if (modal.type === "exercisePreview") {
      const previewExercise = modal.payload || {};
      const previewOptions = buildExercisePreviewOptions(previewExercise);
      const previewType = String(previewExercise?.type || "MultipleChoice");
      const previewTitle = getExercisePreviewTitle(previewExercise);
      const previewSubtitle = getExercisePreviewSubtitle(previewExercise);
      const previewImageUrl = resolveMediaUrl(previewExercise?.imageUrl);
      const parsedData = safeParseJson(previewExercise?.data);
      const matchPairs = Array.isArray(parsedData) ? parsedData : [];
      const inputSlots = buildExercisePreviewInputSlots(previewExercise?.correctAnswer || "");

      return (
        <div className={styles.lessonPreviewViewport} role="dialog" aria-modal="true">
          <button type="button" className={styles.lessonPreviewClose} onClick={closeModal} aria-label="Закрити">×</button>
          <div className={styles.lessonPreviewProgressTrack}>
            <span style={{ width: "100%" }}></span>
          </div>
          <div className={styles.lessonPreviewEnergy}>
            <img src={LessonEnergyIcon} alt="" />
            <span>5</span>
          </div>

          <div className={styles.lessonPreviewCard}>
            <div className={styles.lessonPreviewTitle}>{previewTitle}</div>
            {previewSubtitle ? <div className={styles.lessonPreviewSubtitle}>{previewSubtitle}</div> : null}

            {previewType === "MultipleChoice" ? (
              <>
                {previewImageUrl ? (
                  <img src={previewImageUrl} alt="" className={styles.lessonPreviewImage} />
                ) : (
                  <div className={styles.lessonPreviewQuestionText}>{previewExercise?.question || ""}</div>
                )}
                <div className={styles.lessonPreviewOptions}>
                  {previewOptions.map((item) => {
                    const isCorrect = String(item || "").trim().toLowerCase() === String(previewExercise?.correctAnswer || "").trim().toLowerCase();

                    return (
                      <button
                        type="button"
                        key={item}
                        className={`${styles.lessonPreviewOptionButton} ${isCorrect ? styles.lessonPreviewOptionButtonCorrect : ""}`.trim()}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : null}

            {previewType === "Input" ? (
              <>
                <div className={styles.lessonPreviewQuestionText}>{previewExercise?.question || ""}</div>
                <div className={styles.lessonPreviewInputSlots}>
                  {inputSlots.map((symbol, index) => {
                    const isSpace = symbol === " ";

                    return (
                      <span
                        key={`${symbol}-${index}`}
                        className={`${styles.lessonPreviewInputSlot} ${isSpace ? styles.lessonPreviewInputSlotSpace : ""}`.trim()}
                      >
                        {!isSpace ? <span className={styles.lessonPreviewInputUnderline} /> : null}
                        {!isSpace ? <span className={styles.lessonPreviewInputLetter}>{symbol}</span> : null}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : null}

            {previewType === "Match" ? (
              <div className={styles.lessonPreviewMatchGrid}>
                {matchPairs.map((item, index) => (
                  <div key={`${item?.left || "left"}-${index}`} className={styles.lessonPreviewMatchRow}>
                    <div className={`${styles.lessonPreviewMatchCell} ${styles.lessonPreviewMatchCellCorrect}`.trim()}>{String(item?.left || "")}</div>
                    <div className={`${styles.lessonPreviewMatchCell} ${styles.lessonPreviewMatchCellCorrect}`.trim()}>{String(item?.right || "")}</div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button type="button" className={styles.lessonPreviewCheckButton}>ПРАВИЛЬНА ВІДПОВІДЬ</button>
        </div>
      );
    }

    if (modal.type === "scenePreview") {
      const previewScene = modal.payload || {};
      const previewSteps = sortByOrder(previewScene?.steps || []);
      const previewImageUrl = resolveMediaUrl(previewScene?.backgroundUrl);

      return (
        <div className={styles.lessonPreviewViewport} role="dialog" aria-modal="true">
          <button type="button" className={styles.lessonPreviewClose} onClick={closeModal} aria-label="Закрити">×</button>
          <div className={styles.lessonPreviewProgressTrack}>
            <span style={{ width: "100%" }}></span>
          </div>
          <div className={styles.lessonPreviewEnergy}>
            <img src={LessonEnergyIcon} alt="" />
            <span>{previewSteps.length || 0}</span>
          </div>

          <div className={`${styles.lessonPreviewCard} ${styles.scenePreviewCard}`.trim()}>
            <div className={styles.lessonPreviewTitle}>{previewScene?.title || "Сцена"}</div>
            {previewScene?.description ? <div className={styles.lessonPreviewSubtitle}>{previewScene.description}</div> : null}
            {previewImageUrl ? <img src={previewImageUrl} alt="" className={styles.scenePreviewBanner} /> : null}

            <div className={styles.scenePreviewSteps}>
              {previewSteps.length ? previewSteps.map((step, index) => {
                const stepType = String(step?.stepType || "Line").trim();
                const isQuestion = isSceneQuestionStep(step);
                const isUserBubble = isScenePreviewUserDialogue(step, index);
                const choiceOptions = getScenePreviewChoiceOptions(step);
                const correctAnswer = getScenePreviewCorrectAnswer(step);
                const inputSlots = buildExercisePreviewInputSlots(correctAnswer || "");

                return (
                  <div key={step.id || `${stepType}-${index}`} className={styles.scenePreviewStepCard}>
                    <div className={styles.scenePreviewStepHeader}>
                      <span className={styles.scenePreviewStepOrder}>{`КРОК ${step.order || index + 1}`}</span>
                      <span className={styles.scenePreviewStepKind}>{stepType}</span>
                    </div>

                    {!isQuestion ? (
                      <div className={`${styles.scenePreviewDialogueBubble} ${isUserBubble ? styles.scenePreviewDialogueBubbleRight : styles.scenePreviewDialogueBubbleLeft}`.trim()}>
                        {step?.speaker ? <div className={styles.scenePreviewSpeaker}>{step.speaker}</div> : null}
                        <div className={styles.scenePreviewDialogueText}>{step?.text || ""}</div>
                      </div>
                    ) : null}

                    {stepType === "Choice" ? (
                      <>
                        <div className={styles.scenePreviewQuestionText}>{step?.text || ""}</div>
                        <div className={styles.scenePreviewChoiceGrid}>
                          {choiceOptions.map((item) => {
                            const isCorrect = String(item || "").trim().toLowerCase() === String(correctAnswer || "").trim().toLowerCase();

                            return (
                              <div key={item} className={`${styles.scenePreviewChoiceItem} ${isCorrect ? styles.scenePreviewChoiceItemCorrect : ""}`.trim()}>
                                {item}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    ) : null}

                    {stepType === "Input" ? (
                      <>
                        <div className={styles.scenePreviewQuestionText}>{step?.text || ""}</div>
                        <div className={styles.lessonPreviewInputSlots}>
                          {inputSlots.map((symbol, inputIndex) => {
                            const isSpace = symbol === " ";

                            return (
                              <span
                                key={`${symbol}-${inputIndex}`}
                                className={`${styles.lessonPreviewInputSlot} ${isSpace ? styles.lessonPreviewInputSlotSpace : ""}`.trim()}
                              >
                                {!isSpace ? <span className={styles.lessonPreviewInputUnderline} /> : null}
                                {!isSpace ? <span className={styles.lessonPreviewInputLetter}>{symbol}</span> : null}
                              </span>
                            );
                          })}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              }) : <div className={styles.emptyState}>У цій сцені ще немає кроків</div>}
            </div>
          </div>

          <button type="button" className={styles.lessonPreviewCheckButton}>ПРАВИЛЬНІ ВІДПОВІДІ</button>
        </div>
      );
    }

    if (modal.type === "designerImportExport") {
      const isLessonImportExport = modal.mode === "lesson";
      const isCourseImportExport = modal.mode === "course";
      const isTopicImportExport = modal.mode === "topic";
      const isExerciseImportExport = modal.mode === "exercise";
      const isSceneImportExport = modal.mode === "scene";
      const isVocabularyImportExport = modal.mode === "vocabulary";

      const handleExport = async () => {
        if (isActionLoading) {
          return;
        }

        setIsActionLoading(true);

        try {
          if (isVocabularyImportExport) {
            if (!selectedCourseId) {
              throw new Error("Спочатку оберіть курс для експортування");
            }

            resetGeneralVocabularyDeleteState();
            setIsGeneralVocabularyExportMode(true);
            setSelectedGeneralVocabularyExportIds([]);
            closeModal();
            pushToast("success", "Оберіть слова та натисніть значок імпорт / експорт ще раз");
            return;
          }

          if (isCourseImportExport) {
            if (!selectedCourseId) {
              throw new Error("Спочатку оберіть курс для експортування");
            }

            const payload = await buildCourseExportPayload(selectedCourseId);
            const exportLabel = String(selectedCourse?.level || selectedCourse?.title || selectedCourseId).trim() || selectedCourseId;

            downloadJsonFile(`course-${exportLabel}.json`, payload);
            pushToast("success", "Курс успішно експортовано");
            closeModal();
            return;
          }

          if (isTopicImportExport) {
            if (!selectedTopicId) {
              throw new Error("Спочатку оберіть тему для експортування");
            }

            const payload = await buildTopicExportPayload(selectedTopicId);
            const exportLabel = String(selectedTopic?.order || selectedTopicId).trim() || selectedTopicId;

            downloadJsonFile(`topic-${exportLabel}.json`, payload);
            pushToast("success", "Тему успішно експортовано");
            closeModal();
            return;
          }

          if (isLessonImportExport) {
            if (!selectedLessonId) {
              throw new Error("Спочатку оберіть урок для експортування");
            }

            const payload = await buildLessonExportPayload(selectedLessonId);
            const exportLabel = String(selectedLessonDetails?.order || selectedLesson?.order || selectedLessonId).trim() || selectedLessonId;

            downloadJsonFile(`lesson-${exportLabel}.json`, payload);
            pushToast("success", "Урок успішно експортовано");
            closeModal();
            return;
          }

          if (isSceneImportExport) {
            if (!selectedSceneId) {
              throw new Error("Спочатку оберіть сцену для експортування");
            }

            const response = await adminService.exportScene(selectedSceneId);

            if (!response.ok) {
              throw new Error(response.error || "Не вдалося експортувати сцену");
            }

            const payload = response.data || {};
            const exportLabel = String(selectedSceneDetails?.order || selectedScene?.order || selectedSceneId).trim() || selectedSceneId;

            downloadJsonFile(`scene-${exportLabel}.json`, payload);
            pushToast("success", "Сцену успішно експортовано");
            closeModal();
            return;
          }

          if (!selectedExerciseId) {
            throw new Error("Спочатку оберіть вправу для експортування");
          }

          const payload = await buildExerciseExportPayload(selectedExerciseId);
          const exportLabel = String(selectedExercise?.order || selectedExerciseId).trim() || selectedExerciseId;

          downloadJsonFile(`exercise-${exportLabel}.json`, payload);
          pushToast("success", "Вправу успішно експортовано");
          closeModal();
        } catch (error) {
          pushToast("error", error.message || "Не вдалося експортувати JSON");
        } finally {
          setIsActionLoading(false);
        }
      };

      const handleImportClick = () => {
        if (isVocabularyImportExport) {
          if (!selectedCourseId) {
            pushToast("error", "Спочатку оберіть курс для імпорту слів");
            return;
          }

          vocabularyImportInputRef.current?.click();
          closeModal();
          return;
        }

        if (isCourseImportExport) {
          courseImportInputRef.current?.click();
          return;
        }

        if (isSceneImportExport) {
          sceneImportInputRef.current?.click();
          return;
        }

        if (isTopicImportExport) {
          if (!selectedCourseId) {
            pushToast("error", "Спочатку оберіть курс для імпорту теми");
            return;
          }

          if (!selectedTopicId && topicsCount >= MAX_TOPICS_PER_COURSE) {
            pushToast("error", `У курсі вже є ${MAX_TOPICS_PER_COURSE} тем. Імпорт більше недоступний`);
            return;
          }

          topicImportInputRef.current?.click();
          return;
        }

        if (isLessonImportExport) {
          if (!selectedTopicId) {
            pushToast("error", "Спочатку оберіть тему для імпорту уроку");
            return;
          }

          if (!selectedLessonId && lessonsCount >= MAX_LESSONS_PER_TOPIC) {
            pushToast("error", `У темі вже є ${MAX_LESSONS_PER_TOPIC} уроків. Імпорт більше недоступний`);
            return;
          }

          lessonImportInputRef.current?.click();
          return;
        }

        if (!selectedLessonId) {
          pushToast("error", "Спочатку оберіть урок для імпорту вправи");
          return;
        }

        if (!selectedExerciseId && exercisesCount >= MAX_EXERCISES_PER_LESSON) {
          pushToast("error", `В уроці вже є ${MAX_EXERCISES_PER_LESSON} вправ. Імпорт більше недоступний`);
          return;
        }

        exerciseImportInputRef.current?.click();
      };

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.designerImportExportCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.designerModalClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>
            <div className={styles.designerImportExportInner}>
              <button
                type="button"
                className={styles.designerImportButton}
                onClick={handleImportClick}
                disabled={isActionLoading}
              >
                IMPORT
              </button>
              <button type="button" className={styles.designerExportButton} onClick={handleExport} disabled={isActionLoading}>EXPORT</button>
            </div>
            <input ref={courseImportInputRef} type="file" accept="application/json,.json" className={styles.hiddenFileInput} onChange={handleCourseImportFileChange} />
            <input ref={sceneImportInputRef} type="file" accept="application/json,.json" className={styles.hiddenFileInput} onChange={handleSceneImportFileChange} />
            <input ref={topicImportInputRef} type="file" accept="application/json,.json" className={styles.hiddenFileInput} onChange={handleTopicImportFileChange} />
            <input ref={lessonImportInputRef} type="file" accept="application/json,.json" className={styles.hiddenFileInput} onChange={handleLessonImportFileChange} />
            <input ref={exerciseImportInputRef} type="file" accept="application/json,.json" className={styles.hiddenFileInput} onChange={handleExerciseImportFileChange} />
            <input ref={vocabularyImportInputRef} type="file" accept="application/json,.json" className={styles.hiddenFileInput} onChange={handleVocabularyImportFileChange} />
          </div>
        </div>
      );
    }

    if (modal.type === "copiedInfo") {
      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.designerCopiedCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.designerModalClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>
            <div className={styles.designerCopiedInner}>
              <button type="button" className={styles.designerCopiedButton} onClick={closeModal}>COPIED</button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "lessonDesignerForm") {
      const submitLabel = modal.mode === "edit" ? "ЗБЕРЕГТИ УРОК" : "ДОБАВИТИ УРОК";
      const lessonOptions = sortByOrder(selectedTopicDetails?.lessons || []);

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={`${styles.designerFormCard} ${styles.lessonDesignerFormCard}`.trim()} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.designerModalClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>

            {modal.mode === "edit" && lessonOptions.length ? (
              <>
                <label className={styles.designerModalLabel}>Урок</label>
                <select
                  className={styles.designerModalInput}
                  value={form.lessonId || String(modal.payload?.id || "")}
                  onChange={handleLessonDesignerLessonChange}
                  title="Оберіть урок цієї теми, для якого потрібно відкрити та змінити теорію."
                >
                  {lessonOptions.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{`УРОК ${lesson.order || ""} · ${lesson.title || "Без назви"}`}</option>
                  ))}
                </select>
              </>
            ) : null}

            <label className={styles.designerModalLabel}>Назва уроку</label>
            <input
              className={styles.designerModalInput}
              value={form.title || ""}
              onChange={(e) => updateFormField("title", e.target.value)}
              title={FIELD_HINTS.lessonTitle}
              placeholder="Наприклад: Present Simple"
            />

            <label className={styles.designerModalLabel}>Вправи</label>
            <div className={styles.designerImportFieldWrap} title={FIELD_HINTS.lessonExercisesImport}>
              <input className={styles.designerModalInput} value={form.sourceName || ""} readOnly placeholder="Завантаж JSON з вправами" />
              <button type="button" className={styles.designerImportFieldButton} onClick={() => lessonDesignerImportInputRef.current?.click()} aria-label="Завантажити JSON вправ уроку">
                <img src={ImportExportIcon} alt="" className={styles.designerImportFieldIcon} />
              </button>
              <input
                ref={lessonDesignerImportInputRef}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={handleLessonDesignerFileChange}
              />
            </div>

            <div className={styles.modalSplitActions}>
              <button
                type="button"
                className={styles.secondaryModalWideButton}
                onClick={() => openModal("lessonForm", modal.mode, modal.payload, {
                  ...buildLessonForm(modal.payload, nextLessonOrder),
                  lessonId: String(form.lessonId || modal.payload?.id || ""),
                })}
                disabled={isActionLoading}
              >
                {modal.mode === "edit" ? "РЕДАГУВАТИ ВРУЧНУ" : "ДОДАТИ ВРУЧНУ"}
              </button>
              <button
                type="button"
                className={styles.designerModalSubmit}
                onClick={saveForm}
                disabled={isActionLoading || !String(form.title || "").trim()}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "exerciseDesignerForm") {
      const submitLabel = modal.mode === "edit" ? "ЗБЕРЕГТИ ЗМІНИ" : "ДОБАВИТИ ВПРАВУ";
      const orderLabel = "Номер вправи";

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={styles.designerFormCard} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.designerModalClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>

            <label className={styles.designerModalLabel}>{orderLabel}</label>
            <input
              className={styles.designerModalInput}
              value={form.order || ""}
              onChange={(e) => updateFormField("order", e.target.value)}
              title={FIELD_HINTS.exerciseOrder}
              placeholder="Наприклад: 1"
            />

            <label className={styles.designerModalLabel}>Вправи</label>
            <div className={styles.designerImportFieldWrap} title={FIELD_HINTS.lessonExercisesImport}>
              <input className={styles.designerModalInput} value={form.sourceName || ""} readOnly placeholder="Завантаж JSON вправи" />
              <button type="button" className={styles.designerImportFieldButton} onClick={() => exerciseDesignerImportInputRef.current?.click()}>
                <img src={ImportExportIcon} alt="" className={styles.designerImportFieldIcon} />
              </button>
              <input
                ref={exerciseDesignerImportInputRef}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={handleExerciseDesignerFileChange}
              />
            </div>

            <div className={styles.modalSplitActions}>
              <button
                type="button"
                className={styles.secondaryModalWideButton}
                onClick={() => openModal("exerciseForm", modal.mode, modal.payload, buildExerciseForm(modal.payload, nextExerciseOrder))}
                disabled={isActionLoading}
              >
                {modal.mode === "edit" ? "РЕДАГУВАТИ ВРУЧНУ" : "ДОДАТИ ВРУЧНУ"}
              </button>
              <button
                type="button"
                className={styles.designerModalSubmit}
                onClick={saveForm}
                disabled={isActionLoading || (modal.mode !== "edit" && !String(form.importedJson || "").trim() && !String(form.question || "").trim())}
              >
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "vocabularyPreview") {
      const translation = getPrimaryVocabularyTranslation(modal.payload);
      const exampleLines = parseVocabularyDisplayLines(Array.isArray(modal.payload?.examples) && modal.payload.examples.length ? modal.payload.examples.join("\n") : modal.payload?.example);
      const synonymLines = buildVocabularyRelationLines(modal.payload?.synonyms);
      const idiomLines = buildVocabularyRelationLines(modal.payload?.idioms);

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={`${styles.vocabularyDesignerModal} ${styles.vocabularyDesignerModalPreview}`.trim()} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.vocabularyDesignerClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.vocabularyDesignerCloseIcon}></span>
            </button>

            <div className={styles.vocabularyDesignerHeaderRow}>
              <div className={styles.vocabularyDesignerTitleGroup}>
                <div className={styles.vocabularyDesignerTitleLine}>
                  <span className={styles.vocabularyDesignerWordTitle}>{modal.payload?.word || "-"}</span>
                  {translation ? <span className={styles.vocabularyDesignerTranslationTitle}>({translation})</span> : null}
                </div>
                {modal.payload?.partOfSpeech ? <div className={styles.vocabularyDesignerSpeechLabel}>{modal.payload.partOfSpeech}</div> : null}
              </div>
            </div>

            <div className={styles.vocabularyDesignerCards}>
              <div className={`${styles.vocabularyDesignerCard} ${styles.vocabularyDesignerCardDefinition}`.trim()}>
                <div className={styles.vocabularyDesignerCardLabel}>визначення</div>
                <div className={styles.vocabularyDesignerCardText}>{modal.payload?.definition || "—"}</div>
              </div>

              <div className={`${styles.vocabularyDesignerCard} ${styles.vocabularyDesignerCardExample}`.trim()}>
                <div className={styles.vocabularyDesignerCardLabel}>приклад</div>
                {exampleLines.length ? (
                  <div className={styles.vocabularyDesignerExampleBlock}>
                    {exampleLines.map((line, index) => (
                      <div key={`${line}-${index}`} className={index === 0 ? styles.vocabularyDesignerExamplePrimary : styles.vocabularyDesignerExampleSecondary}>{line}</div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.vocabularyDesignerCardText}>—</div>
                )}
              </div>

              <div className={styles.vocabularyDesignerCard}>
                <div className={styles.vocabularyDesignerCardLabel}>подібні слова/синоніми</div>
                <div className={styles.vocabularyDesignerCardText}>
                  {synonymLines.length ? synonymLines.map((line, index) => <div key={`${line}-${index}`}>{line}</div>) : "—"}
                </div>
              </div>

              <div className={styles.vocabularyDesignerCard}>
                <div className={styles.vocabularyDesignerCardLabel}>стійкі вирази, які варто знати</div>
                <div className={styles.vocabularyDesignerCardText}>
                  {idiomLines.length ? idiomLines.map((line, index) => <div key={`${line}-${index}`}>{line}</div>) : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (modal.type === "vocabularyForm") {
      const isEditMode = modal.mode === "edit";

      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={`${styles.vocabularyDesignerModal} ${isEditMode ? styles.vocabularyDesignerModalEdit : styles.vocabularyDesignerModalCreate}`.trim()} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.vocabularyDesignerClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.vocabularyDesignerCloseIcon}></span>
            </button>

            {isEditMode ? (
              <div className={styles.vocabularyDesignerEditTopStack}>
                {[
                  { key: "word", label: "слово", value: form.word || "", placeholder: "слово" },
                  { key: "translations", label: "переклад", value: form.translations || "", placeholder: "переклад" },
                  { key: "partOfSpeech", label: "частина мови", value: form.partOfSpeech || "", placeholder: "частина мови" },
                  { key: "transcription", label: "транскрипція", value: form.transcription || "", placeholder: "транскрипція" },
                ].map((item) => {
                  const isFieldEditable = activeVocabularyEditField === item.key;

                  return (
                    <div key={item.key} className={styles.vocabularyDesignerEditFieldRow}>
                      <div className={`${styles.vocabularyDesignerInputShell} ${styles.vocabularyDesignerEditInputShell}`.trim()}>
                        <div className={styles.vocabularyDesignerInputLabel}>{item.label}</div>
                        <input
                          ref={(node) => {
                            vocabularyEditFieldRefs.current[item.key] = node;
                          }}
                          className={`${styles.vocabularyDesignerInput} ${styles.vocabularyDesignerEditInput}`.trim()}
                          value={item.value}
                          onChange={(e) => updateFormField(item.key, e.target.value)}
                          placeholder={item.placeholder}
                          readOnly={!isFieldEditable}
                        />
                      </div>
                      <button
                        type="button"
                        className={styles.vocabularyDesignerEditFieldButton}
                        onClick={() => activateVocabularyEditField(item.key)}
                        aria-label={`Редагувати поле ${item.label}`}
                        title={`Редагувати поле ${item.label}`}
                      >
                        <img src={EditIcon} alt="" className={styles.vocabularyDesignerPencilIcon} />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.vocabularyDesignerCreateTopGrid}>
                <div className={styles.vocabularyDesignerInputShell}>
                  <div className={styles.vocabularyDesignerInputLabel}>слово</div>
                  <input className={styles.vocabularyDesignerInput} value={form.word || ""} onChange={(e) => updateFormField("word", e.target.value)} />
                </div>
                <div className={styles.vocabularyDesignerInputShell}>
                  <div className={styles.vocabularyDesignerInputLabel}>переклад</div>
                  <input className={styles.vocabularyDesignerInput} value={form.translations || ""} onChange={(e) => updateFormField("translations", e.target.value)} />
                </div>
                <div className={styles.vocabularyDesignerInputShell}>
                  <div className={styles.vocabularyDesignerInputLabel}>частина мови</div>
                  <input className={styles.vocabularyDesignerInput} value={form.partOfSpeech || ""} onChange={(e) => updateFormField("partOfSpeech", e.target.value)} />
                </div>
                <div className={styles.vocabularyDesignerInputShell}>
                  <div className={styles.vocabularyDesignerInputLabel}>транскрипція</div>
                  <input className={styles.vocabularyDesignerInput} value={form.transcription || ""} onChange={(e) => updateFormField("transcription", e.target.value)} />
                </div>
              </div>
            )}

            <div className={styles.vocabularyDesignerCards}>
              <div className={`${styles.vocabularyDesignerCard} ${styles.vocabularyDesignerCardDefinition} ${isEditMode ? styles.vocabularyDesignerCardEditable : ""}`.trim()}>
                <div className={styles.vocabularyDesignerCardLabel}>визначення</div>
                <textarea
                  ref={(node) => {
                    vocabularyEditFieldRefs.current.definition = node;
                  }}
                  className={`${styles.vocabularyDesignerTextarea} ${styles.vocabularyDesignerTextareaDefinition}`.trim()}
                  value={form.definition || ""}
                  onChange={(e) => updateFormField("definition", e.target.value)}
                  readOnly={isEditMode && activeVocabularyEditField !== "definition"}
                />
                {isEditMode ? (
                  <button
                    type="button"
                    className={styles.vocabularyDesignerCardIcon}
                    onClick={() => activateVocabularyEditField("definition")}
                    aria-label="Редагувати поле визначення"
                    title="Редагувати поле визначення"
                  >
                    <img src={EditIcon} alt="" className={styles.vocabularyDesignerPencilIcon} />
                  </button>
                ) : null}
              </div>

              <div className={`${styles.vocabularyDesignerCard} ${styles.vocabularyDesignerCardExample} ${isEditMode ? styles.vocabularyDesignerCardEditable : ""}`.trim()}>
                <div className={styles.vocabularyDesignerCardLabel}>приклад</div>
                <textarea
                  ref={(node) => {
                    vocabularyEditFieldRefs.current.example = node;
                  }}
                  className={`${styles.vocabularyDesignerTextarea} ${styles.vocabularyDesignerTextareaExample}`.trim()}
                  value={form.example || ""}
                  onChange={(e) => updateFormField("example", e.target.value)}
                  readOnly={isEditMode && activeVocabularyEditField !== "example"}
                />
                {isEditMode ? (
                  <button
                    type="button"
                    className={styles.vocabularyDesignerCardIcon}
                    onClick={() => activateVocabularyEditField("example")}
                    aria-label="Редагувати поле приклад"
                    title="Редагувати поле приклад"
                  >
                    <img src={EditIcon} alt="" className={styles.vocabularyDesignerPencilIcon} />
                  </button>
                ) : null}
              </div>

              <div className={`${styles.vocabularyDesignerCard} ${isEditMode ? styles.vocabularyDesignerCardEditable : ""}`.trim()}>
                <div className={styles.vocabularyDesignerCardLabel}>подібні слова/синоніми</div>
                <textarea
                  ref={(node) => {
                    vocabularyEditFieldRefs.current.synonyms = node;
                  }}
                  className={styles.vocabularyDesignerTextarea}
                  value={form.synonyms || ""}
                  onChange={(e) => updateFormField("synonyms", e.target.value)}
                  readOnly={isEditMode && activeVocabularyEditField !== "synonyms"}
                />
                {isEditMode ? (
                  <button
                    type="button"
                    className={styles.vocabularyDesignerCardIcon}
                    onClick={() => activateVocabularyEditField("synonyms")}
                    aria-label="Редагувати поле подібні слова або синоніми"
                    title="Редагувати поле подібні слова або синоніми"
                  >
                    <img src={EditIcon} alt="" className={styles.vocabularyDesignerPencilIcon} />
                  </button>
                ) : null}
              </div>

              <div className={`${styles.vocabularyDesignerCard} ${isEditMode ? styles.vocabularyDesignerCardEditable : ""}`.trim()}>
                <div className={styles.vocabularyDesignerCardLabel}>стійкі вирази, які варто знати</div>
                <textarea
                  ref={(node) => {
                    vocabularyEditFieldRefs.current.idioms = node;
                  }}
                  className={styles.vocabularyDesignerTextarea}
                  value={form.idioms || ""}
                  onChange={(e) => updateFormField("idioms", e.target.value)}
                  readOnly={isEditMode && activeVocabularyEditField !== "idioms"}
                />
                {isEditMode ? (
                  <button
                    type="button"
                    className={styles.vocabularyDesignerCardIcon}
                    onClick={() => activateVocabularyEditField("idioms")}
                    aria-label="Редагувати поле стійкі вирази, які варто знати"
                    title="Редагувати поле стійкі вирази, які варто знати"
                  >
                    <img src={EditIcon} alt="" className={styles.vocabularyDesignerPencilIcon} />
                  </button>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              className={styles.vocabularyDesignerSubmit}
              onClick={saveForm}
              disabled={isActionLoading || !String(form.word || "").trim()}
            >
              {isEditMode ? "ЗБЕРЕГТИ ЗМІНИ" : "ДОБАВИТИ СЛОВО"}
            </button>
          </div>
        </div>
      );
    }

    if (modal.type === "lessonImportExport" || modal.type === "sceneJson") {
      return (
        <ModalShell title={modal.type === "lessonImportExport" ? "Import / Export вправ" : "Import / Export сцени"} onClose={closeModal} cardClassName={styles.modalCardImportExport}>
          <div className={styles.formLabel}>JSON</div>
          <textarea className={styles.textareaTall} value={form.json || ""} onChange={(e) => updateFormField("json", e.target.value)} />
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Закрити</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={saveForm} disabled={isActionLoading}>Імпортувати</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "sceneCopyForm") {
      const targetCourseId = Number(form.targetCourseId || 0);
      const targetCourseDetails = courseDetailsMap[targetCourseId] || (Number(selectedCourseId) === Number(targetCourseId) ? selectedCourseDetails : null);
      const availableTopics = sortByOrder(targetCourseDetails?.topics || []).filter((topic) => !scenes.some((scene) => Number(scene.topicId || 0) === Number(topic.id || 0)));

      return (
        <ModalShell
          title="Копія сцени"
          subtitle={modal.payload?.title ? `Оберіть, куди скопіювати сцену «${modal.payload.title}»` : "Оберіть курс і тему для копії сцени"}
          onClose={closeModal}
          compact
        >
          <div className={styles.formLabel}>Курс</div>
          <select className={styles.formInput} value={form.targetCourseId || ""} onChange={(e) => updateFormField("targetCourseId", e.target.value)}>
            <option value="">Оберіть курс</option>
            {courses.map((item) => (
              <option key={item.id} value={item.id}>{item.title || `Курс ${item.id}`}</option>
            ))}
          </select>

          <div className={styles.formLabel}>Тема</div>
          <select className={styles.formInput} value={form.targetTopicId || ""} onChange={(e) => updateFormField("targetTopicId", e.target.value)} disabled={!targetCourseId || !availableTopics.length}>
            <option value="">Оберіть тему</option>
            {availableTopics.map((item) => (
              <option key={item.id} value={item.id}>{`ТЕМА ${item.order || ""} · ${item.title || "Без назви"}`}</option>
            ))}
          </select>
          {!targetCourseId ? null : !availableTopics.length ? <div className={styles.fieldHelperText}>У цьому курсі зараз немає вільної теми для копії сцени.</div> : null}

          <div className={styles.formLabel}>Суфікс назви</div>
          <input className={styles.formInput} value={form.titleSuffix || ""} onChange={(e) => updateFormField("titleSuffix", e.target.value)} placeholder=" (копія)" />

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={saveForm} disabled={isActionLoading || !form.targetCourseId || !form.targetTopicId}>Копіювати</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "reorderExercises" || modal.type === "reorderSceneSteps") {
      return (
        <ModalShell title={modal.type === "reorderExercises" ? "Змінити порядок вправ" : "Змінити порядок кроків"} onClose={closeModal}>
          <div className={styles.reorderList}>
            {(form.items || []).map((item, index) => (
              <div className={styles.reorderRow} key={item.id}>
                <div className={styles.reorderTitle}>{item.title || `Елемент ${index + 1}`}</div>
                <input
                  className={styles.smallInput}
                  value={item.order}
                  onChange={(e) => {
                    const nextItems = [...(form.items || [])];
                    nextItems[index] = {
                      ...nextItems[index],
                      order: e.target.value,
                    };
                    updateFormField("items", nextItems);
                  }}
                />
              </div>
            ))}
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={saveForm} disabled={isActionLoading}>Зберегти</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "linkVocabulary") {
      const linkedIds = new Set((currentLessonVocabulary || []).map((item) => Number(item.id)));
      const availableWords = allVocabulary.filter((item) => !linkedIds.has(Number(item.id)));

      return (
        <ModalShell title="Прив'язати слово до уроку" onClose={closeModal} compact>
          <div className={styles.formLabel}>Слово</div>
          <select className={styles.formInput} value={form.vocabularyItemId || ""} onChange={(e) => updateFormField("vocabularyItemId", e.target.value)}>
            <option value="">Оберіть слово</option>
            {availableWords.map((item) => (
              <option key={item.id} value={item.id}>{item.word}</option>
            ))}
          </select>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
            <button type="button" className={styles.primaryActionButtonModal} onClick={saveForm} disabled={!form.vocabularyItemId || isActionLoading}>Прив'язати</button>
          </div>
        </ModalShell>
      );
    }

    if (modal.type === "courseForm" && modal.mode === "edit") {
      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={`${styles.addCourseCard} ${styles.addCourseCardEdit}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.addCourseClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>

            <label className={styles.addCourseLabel}>Назва курсу</label>
            <input
              className={styles.addCourseInput}
              value={form.title || ""}
              onChange={(e) => updateFormField("title", e.target.value)}
              title={FIELD_HINTS.topicTitle}
              placeholder="Наприклад: Travel basics"
            />

            <label className={styles.addCourseLabel}>Опис курсу</label>
            <textarea
              className={`${styles.addCourseInput} ${styles.addCourseTextarea}`}
              value={form.description || ""}
              onChange={(e) => updateFormField("description", e.target.value)}
            />

            <label className={styles.addCourseLabel}>Мова курсу</label>
            <div className={styles.addCourseSelectWrap}>
              <select className={`${styles.addCourseInput} ${styles.addCourseSelect}`} value={form.languageCode || "en"} onChange={(e) => updateFormField("languageCode", e.target.value)}>
                {LANGUAGE_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </div>

            <label className={styles.addCourseLabel}>Рівень курсу</label>
            <div className={styles.addCourseSelectWrap}>
              <select className={`${styles.addCourseInput} ${styles.addCourseSelect}`} value={form.level || "A1"} onChange={(e) => updateFormField("level", e.target.value)}>
                {LEVEL_OPTIONS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>

            <label className={styles.addCourseLabel}>Порядок курсу</label>
            <input
              className={styles.addCourseInput}
              value={form.order || ""}
              onChange={(e) => updateFormField("order", e.target.value)}
              title={FIELD_HINTS.topicOrder}
              placeholder="Наприклад: 1"
            />

            <label className={styles.addCourseLabel}>Попередній курс</label>
            <div className={styles.addCourseSelectWrap}>
              <select className={`${styles.addCourseInput} ${styles.addCourseSelect}`} value={form.prerequisiteCourseId || ""} onChange={(e) => updateFormField("prerequisiteCourseId", e.target.value)}>
                <option value="">Без передумови</option>
                {courses
                  .filter((item) => Number(item.id) !== Number(modal.payload?.id || 0))
                  .map((item) => (
                    <option key={item.id} value={item.id}>{resolveCourseLabel(item)} · {item.title}</option>
                  ))}
              </select>
            </div>


            <button type="button" className={styles.addCourseSubmit} onClick={saveForm} disabled={isActionLoading || !String(form.title || "").trim()}>
              РЕДАГУВАТИ КУРС
            </button>
          </div>
        </div>
      );
    }

    if (modal.type === "topicForm") {
      return (
        <div className={styles.modalBackdrop} role="presentation">
          <div className={`${styles.addCourseCard} ${styles.addTopicCard}`} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.addCourseClose} onClick={closeModal} aria-label="Закрити">
              <span className={styles.addCourseCloseIcon}></span>
            </button>

            <label className={styles.addCourseLabel}>Номер теми</label>
            <input
              className={styles.addCourseInput}
              value={form.order || ""}
              onChange={(e) => updateFormField("order", e.target.value)}
            />

            <label className={styles.addCourseLabel}>Назва теми</label>
            <input
              className={styles.addCourseInput}
              value={form.title || ""}
              onChange={(e) => updateFormField("title", e.target.value)}
            />

            <label className={styles.addCourseLabel}>Уроки</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.lessons || ""} onChange={(e) => updateFormField("lessons", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("lessons")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("lessons");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для уроків"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.lessons = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("lessons", e)}
              />
            </div>

            <label className={styles.addCourseLabel}>Вправи</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.exercises || ""} onChange={(e) => updateFormField("exercises", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("exercises")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("exercises");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для вправ"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.exercises = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("exercises", e)}
              />
            </div>

            <label className={styles.addCourseLabel}>Сцени</label>
            <div className={styles.addCourseSelectWrap}>
              <input className={styles.addCourseInput} value={form.scenes || ""} onChange={(e) => updateFormField("scenes", e.target.value)} />
              <button
                type="button"
                className={styles.addCourseSelectButton}
                onClick={() => triggerAddCourseJsonImport("scenes")}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleAddCourseJsonExport("scenes");
                }}
                title="Лівий клік — імпорт JSON, правий клік — експорт JSON"
                aria-label="Імпорт або експорт JSON для сцен"
              >
                <img src={ImportExportIcon} alt="" className={styles.addCourseSelectIcon} />
              </button>
              <input
                ref={(node) => {
                  addCourseImportRefs.current.scenes = node;
                }}
                type="file"
                accept="application/json,.json"
                className={styles.hiddenFileInput}
                onChange={(e) => handleAddCourseJsonImport("scenes", e)}
              />
            </div>

            <div className={styles.modalSplitActions}>
              <button
                type="button"
                className={styles.secondaryModalWideButton}
                onClick={() => openModal("topicManualForm", modal.mode, modal.payload, { title: String(form.title || ""), order: String(form.order || 1) })}
                disabled={isActionLoading}
              >
                {modal.mode === "edit" ? "РЕДАГУВАТИ ВРУЧНУ" : "ДОДАТИ ВРУЧНУ"}
              </button>
              <button type="button" className={styles.addCourseSubmit} onClick={saveForm} disabled={isActionLoading || !String(form.title || "").trim()}>
                {modal.mode === "edit" ? "РЕДАГУВАТИ ТЕМУ" : "ДОБАВИТИ ТЕМУ"}
              </button>
            </div>
          </div>
        </div>
      );
    }

    const sceneModalCourseId = Number(form.courseId || selectedCourseId || 0);
    const sceneModalCourseDetails = courseDetailsMap[sceneModalCourseId] || null;
    const sceneModalTopics = sortByOrder(sceneModalCourseDetails?.topics || []);

    const titleMap = {
      courseForm: modal.mode === "edit" ? "Змінити дані курсу" : "Назва курсу",
      courseManualForm: modal.mode === "edit" ? "Редагувати курс вручну" : "Додати курс вручну",
      courseTitleForm: "Змінити дані курсу",
      topicForm: modal.mode === "edit" ? "Редагувати тему" : "Створити тему",
      topicManualForm: modal.mode === "edit" ? "Редагувати тему вручну" : "Додати тему вручну",
      topicSceneBindingForm: "Змінити сцену теми",
      topicDataForm: "Змінити дані теми",
      lessonForm: modal.mode === "edit" ? "Змінити дані уроку" : "Додати урок вручну",
      lessonTitleForm: "Змінити назву уроку",
      lessonTheoryForm: "Змінити теорію уроку",
      exerciseForm: modal.mode === "edit" ? "Редагувати вправу вручну" : "Додати вправу вручну",
      vocabularyForm: modal.mode === "edit" ? "Редагувати слово" : "Додати слово",
      achievementForm: modal.mode === "edit" ? "Редагувати досягнення" : "Додати досягнення",
      sceneForm: modal.mode === "edit" ? "Редагувати сцену" : "Додати сцену",
      sceneStepForm: modal.mode === "edit" ? "Редагувати крок" : "Додати крок",
    };

    const topicSceneBindingSelectedScene = topicSceneBindingOptions.find((item) => Number(item.id) === Number(form.sceneId || 0)) || null;
    const topicSceneBindingSelectedSceneTopic = topicSceneBindingSelectedScene && Number(topicSceneBindingSelectedScene.topicId || 0)
      ? (selectedCourseDetails?.topics || []).find((item) => Number(item.id) === Number(topicSceneBindingSelectedScene.topicId || 0)) || null
      : null;
    const modalSubtitle = "";

    return (
      <ModalShell title={titleMap[modal.type] || "Форма"} subtitle={modalSubtitle} onClose={closeModal}>
        {modal.type === "courseForm" || modal.type === "courseManualForm" ? (
          <>
            <label className={styles.formLabel}>Назва курсу</label>
            <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.courseTitle} placeholder="Наприклад: Beginner English A1" />
            <label className={styles.formLabel}>Опис</label>
            <textarea className={styles.textareaMedium} value={form.description || ""} onChange={(e) => updateFormField("description", e.target.value)} title={FIELD_HINTS.courseDescription} placeholder="Короткий опис курсу" />
            <div className={styles.formGridTwo}>
              <div>
                <label className={styles.formLabel}>Мова</label>
                <select className={styles.formInput} value={form.languageCode || "en"} onChange={(e) => updateFormField("languageCode", e.target.value)} title={FIELD_HINTS.courseLanguageCode}>
                  {LANGUAGE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.formLabel}>Рівень</label>
                <select className={styles.formInput} value={form.level || "A1"} onChange={(e) => updateFormField("level", e.target.value)} title={FIELD_HINTS.courseLevel}>
                  {LEVEL_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formGridTwo}>
              <div>
                <label className={styles.formLabel}>Порядок</label>
                <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.courseOrder} placeholder="1" />
              </div>
              <div>
                <label className={styles.formLabel}>Попередній курс</label>
                <select className={styles.formInput} value={form.prerequisiteCourseId || ""} onChange={(e) => updateFormField("prerequisiteCourseId", e.target.value)} title={FIELD_HINTS.coursePrerequisiteCourseId}>
                  <option value="">Без передумови</option>
                  {courses
                    .filter((item) => Number(item.id) !== Number(modal.payload?.id || 0))
                    .map((item) => (
                      <option key={item.id} value={item.id}>{resolveCourseLabel(item)} · {item.title}</option>
                    ))}
                </select>
              </div>
            </div>
          </>
        ) : null}

        {modal.type === "topicForm" || modal.type === "topicManualForm" ? (
          <>
            <label className={styles.formLabel}>Назва теми</label>
            <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.topicTitle} placeholder="Наприклад: Travel basics" />
            <label className={styles.formLabel}>Порядок</label>
            <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.topicOrder} placeholder="1" />
          </>
        ) : null}

        {modal.type === "topicSceneBindingForm" ? (
          <>
            <label className={styles.formLabel}>Тема</label>
            <input
              className={styles.formInput}
              value={selectedTopic?.title || ""}
              readOnly
              title="Поточна тема, для якої потрібно вибрати фінальну сцену."
            />
            <label className={styles.formLabel}>Сцена</label>
            <select
              className={styles.formInput}
              value={form.sceneId || ""}
              onChange={(e) => updateFormField("sceneId", e.target.value)}
              title={FIELD_HINTS.topicSceneSelect}
            >
              <option value="">Оберіть сцену</option>
              {topicSceneBindingOptions.map((item) => (
                <option key={item.id} value={item.id}>{`${item.order || ""} · ${item.title || "Без назви"}`}</option>
              ))}
            </select>
            {topicSceneBindingSelectedSceneTopic && Number(topicSceneBindingSelectedSceneTopic.id) !== Number(selectedTopicId || 0) ? (
              <div className={styles.modalSubtitle}>
                Ця сцена зараз стоїть на темі {topicSceneBindingSelectedSceneTopic.order || ""} · {topicSceneBindingSelectedSceneTopic.title || "Без назви"}. Після збереження вона перейде на поточну тему.
              </div>
            ) : null}
            {!topicSceneBindingOptions.length ? (
              <div className={styles.modalSubtitle}>
                У цьому курсі поки немає жодної фінальної сцени Sun, яку можна поставити на тему.
              </div>
            ) : null}
          </>
        ) : null}

        {modal.type === "topicDataForm" ? (
          <>
            <label className={styles.formLabel}>Назва теми</label>
            <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.topicTitle} placeholder="Наприклад: Travel basics" />
            <label className={styles.formLabel}>Порядок</label>
            <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.topicOrder} placeholder="1" />
            <label className={styles.formLabel}>Сцена теми</label>
            <select
              className={styles.formInput}
              value={form.sceneId || ""}
              onChange={(e) => updateFormField("sceneId", e.target.value)}
              title={FIELD_HINTS.topicSceneSelect}
            >
              <option value="">Оберіть сцену</option>
              {topicSceneBindingOptions.map((item) => (
                <option key={item.id} value={item.id}>{`${item.order || ""} · ${item.title || "Без назви"}`}</option>
              ))}
            </select>
            {topicSceneBindingSelectedSceneTopic && Number(topicSceneBindingSelectedSceneTopic.id) !== Number(selectedTopicId || 0) ? (
              <div className={styles.modalSubtitle}>
                Ця сцена зараз стоїть на темі {topicSceneBindingSelectedSceneTopic.order || ""} · {topicSceneBindingSelectedSceneTopic.title || "Без назви"}. Після збереження вона перейде на поточну тему.
              </div>
            ) : null}
            {!topicSceneBindingOptions.length ? (
              <div className={styles.modalSubtitle}>
                У цьому курсі поки немає жодної фінальної сцени Sun, яку можна поставити на тему.
              </div>
            ) : null}
            {sortByOrder(selectedTopicDetails?.lessons || []).length ? (
              <>
                <label className={styles.formLabel}>Урок для теорії</label>
                <select
                  className={styles.formInput}
                  value={form.lessonId || ""}
                  onChange={handleTopicDataLessonChange}
                  title="Оберіть урок цієї теми, для якого потрібно змінити теорію."
                >
                  <option value="">Оберіть урок</option>
                  {sortByOrder(selectedTopicDetails?.lessons || []).map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>{`УРОК ${lesson.order || ""} · ${lesson.title || "Без назви"}`}</option>
                  ))}
                </select>
                <label className={styles.formLabel}>Теорія уроку</label>
                <textarea className={styles.textareaTall} value={form.theory || ""} onChange={(e) => updateFormField("theory", e.target.value)} title={FIELD_HINTS.lessonTheory} placeholder="Текст теорії уроку" />
              </>
            ) : (
              <div className={styles.modalSubtitle}>
                У цій темі поки немає уроків, тому зараз можна змінити тільки назву, порядок і сцену.
              </div>
            )}
          </>
        ) : null}

        {modal.type === "lessonForm" ? (
          <>
            <label className={styles.formLabel}>Назва уроку</label>
            <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.lessonTitle} placeholder="Наприклад: Present Simple" />
            <label className={styles.formLabel}>Теорія</label>
            <textarea className={styles.textareaTall} value={form.theory || ""} onChange={(e) => updateFormField("theory", e.target.value)} title={FIELD_HINTS.lessonTheory} placeholder="Текст теорії уроку" />
            <label className={styles.formLabel}>Порядок</label>
            <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.lessonOrder} placeholder="1" />
          </>
        ) : null}

        {modal.type === "courseTitleForm" ? (
          <>
            <label className={styles.formLabel}>Назва курсу</label>
            <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.courseTitle} placeholder="Наприклад: Beginner English A1" />
          </>
        ) : null}

        {modal.type === "lessonTitleForm" ? (
          <>
            <label className={styles.formLabel}>Назва уроку</label>
            <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.lessonTitle} placeholder="Наприклад: Present Simple" />
          </>
        ) : null}

        {modal.type === "lessonTheoryForm" ? (
          <>
            <label className={styles.formLabel}>Теорія уроку</label>
            <textarea className={styles.textareaTall} value={form.theory || ""} onChange={(e) => updateFormField("theory", e.target.value)} title={FIELD_HINTS.lessonTheory} placeholder="Текст теорії уроку" />
          </>
        ) : null}

        {modal.type === "exerciseForm" ? (() => {
          const exerciseUiConfig = getExerciseFormUiConfig(form.type || "MultipleChoice");
          const isMatchExercise = String(form.type || "MultipleChoice") === "Match";

          return (
            <>
              <div className={styles.formGridTwo}>
                <div>
                  <label className={styles.formLabel}>Тип</label>
                  <select className={styles.formInput} value={form.type || "MultipleChoice"} onChange={(e) => updateFormField("type", e.target.value)} title={FIELD_HINTS.exerciseType}>
                    {EXERCISE_TYPE_OPTIONS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={styles.formLabel}>Порядок</label>
                  <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.exerciseOrder} placeholder="1" />
                </div>
              </div>
              <label className={styles.formLabel}>Питання</label>
              <input className={styles.formInput} value={form.question || ""} onChange={(e) => updateFormField("question", e.target.value)} title={FIELD_HINTS.exerciseQuestion} placeholder="Введи текст вправи" />
              <label className={styles.formLabel}>Data</label>
              <textarea className={styles.textareaMedium} value={form.data || ""} onChange={(e) => updateFormField("data", e.target.value)} title={exerciseUiConfig.dataTitle} placeholder={exerciseUiConfig.dataPlaceholder} />
              <label className={styles.formLabel}>Правильна відповідь</label>
              <input className={styles.formInput} value={isMatchExercise ? "" : form.correctAnswer || ""} onChange={(e) => updateFormField("correctAnswer", e.target.value)} title={exerciseUiConfig.correctAnswerTitle} placeholder={exerciseUiConfig.correctAnswerPlaceholder} readOnly={isMatchExercise} />
              <label className={styles.formLabel}>Image URL</label>
              <div className={styles.uploadRow}>
                <input className={styles.formInput} value={form.imageUrl || ""} onChange={(e) => updateFormField("imageUrl", e.target.value)} title={FIELD_HINTS.exerciseImageUrl} placeholder="https://... або /uploads/..." />
                <button type="button" className={styles.uploadButton} onClick={() => startUpload("imageUrl")}>Завантажити</button>
              </div>
            </>
          );
        })() : null}

        {modal.type === "vocabularyForm" ? (
          <>
            <label className={styles.formLabel}>Слово</label>
            <input className={styles.formInput} value={form.word || ""} onChange={(e) => updateFormField("word", e.target.value)} />
            {modal.mode === "create" && vocabularyExistingMatches.length ? (
              <div className={styles.vocabularyExistingMatchesBox}>
                <div className={styles.vocabularyExistingMatchesTitle}>У словнику вже знайдено схожі слова:</div>
                <div className={styles.vocabularyExistingMatchesList}>
                  {vocabularyExistingMatches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.vocabularyExistingMatchButton}
                      onClick={() => openModal("vocabularyPreview", "preview", buildVocabularyModalPayload(item))}
                    >
                      <span className={styles.vocabularyExistingMatchWord}>{item.word || "слово"}</span>
                      <span className={styles.vocabularyExistingMatchTranslation}>{getPrimaryVocabularyTranslation(item)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <label className={styles.formLabel}>Переклади через кому</label>
            <input className={styles.formInput} value={form.translations || ""} onChange={(e) => updateFormField("translations", e.target.value)} />
            <label className={styles.formLabel}>Приклад</label>
            <input className={styles.formInput} value={form.example || ""} onChange={(e) => updateFormField("example", e.target.value)} />
            <div className={styles.formGridTwo}>
              <div>
                <label className={styles.formLabel}>Частина мови</label>
                <input className={styles.formInput} value={form.partOfSpeech || ""} onChange={(e) => updateFormField("partOfSpeech", e.target.value)} />
              </div>
              <div>
                <label className={styles.formLabel}>Gender</label>
                <input className={styles.formInput} value={form.gender || ""} onChange={(e) => updateFormField("gender", e.target.value)} />
              </div>
            </div>
            <label className={styles.formLabel}>Definition</label>
            <textarea className={styles.textareaMedium} value={form.definition || ""} onChange={(e) => updateFormField("definition", e.target.value)} />
            <label className={styles.formLabel}>Transcription</label>
            <input className={styles.formInput} value={form.transcription || ""} onChange={(e) => updateFormField("transcription", e.target.value)} />
            <label className={styles.formLabel}>Examples (кожен з нового рядка)</label>
            <textarea className={styles.textareaMedium} value={form.examples || ""} onChange={(e) => updateFormField("examples", e.target.value)} />
            <label className={styles.formLabel}>Synonyms: word - translation</label>
            <textarea className={styles.textareaMedium} value={form.synonyms || ""} onChange={(e) => updateFormField("synonyms", e.target.value)} />
            <label className={styles.formLabel}>Idioms: word - translation</label>
            <textarea className={styles.textareaMedium} value={form.idioms || ""} onChange={(e) => updateFormField("idioms", e.target.value)} />
          </>
        ) : null}

        {modal.type === "achievementForm" ? (() => {
          const achievementCodeList = Array.from(new Set((achievements || [])
            .map((item) => String(item?.code || "").trim())
            .filter(Boolean)))
            .sort((left, right) => left.localeCompare(right));

          return (
            <>
              {modal.mode !== "edit" ? (
                <>
                  <label className={styles.formLabel}>Code</label>
                  <div className={styles.achievementCodeHintWrap}>
                    <input className={styles.formInput} value={form.code || ""} onChange={(e) => updateFormField("code", e.target.value)} title={FIELD_HINTS.achievementCode} />
                    <div className={styles.achievementCodeHoverHint}>
                      <div className={styles.achievementCodeHoverTitle}>Коди, які вже є в бекенді:</div>
                      <div className={styles.achievementCodeHoverNote}>Новий код краще писати без префікса <strong>sys.</strong>, наприклад: <strong>ten_lessons_completed</strong></div>
                      <div className={styles.achievementCodeHoverList}>
                        {achievementCodeList.length ? achievementCodeList.map((code) => (
                          <div key={code} className={styles.achievementCodeHoverItem}>{code}</div>
                        )) : (
                          <div className={styles.achievementCodeHoverItem}>Поки що кодів немає.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
              <label className={styles.formLabel}>Назва</label>
              <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.achievementTitle} />
              <label className={styles.formLabel}>Опис</label>
              <textarea className={styles.textareaMedium} value={form.description || ""} onChange={(e) => updateFormField("description", e.target.value)} title={FIELD_HINTS.achievementDescription} placeholder="Короткий опис досягнення" />
              {!isSystemAchievementCode(modal.payload?.code) ? (
                <>
                  <div className={`${styles.formGridTwo} ${styles.achievementConditionRow}`.trim()}>
                    <div className={styles.achievementConditionField}>
                      <label className={`${styles.formLabel} ${styles.achievementConditionLabel}`.trim()}>Автовидача</label>
                      <select className={styles.formInput} value={form.conditionType || ""} onChange={(e) => updateFormField("conditionType", e.target.value)} title={FIELD_HINTS.achievementConditionType}>
                        {ACHIEVEMENT_CONDITION_OPTIONS.map((item) => (
                          <option key={item.value || "empty"} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.achievementConditionField}>
                      <label className={`${styles.formLabel} ${styles.achievementConditionLabel}`.trim()}>Поріг</label>
                      <input className={styles.formInput} value={form.conditionThreshold || ""} onChange={(e) => updateFormField("conditionThreshold", e.target.value.replace(/[^0-9]/g, ""))} title={FIELD_HINTS.achievementConditionThreshold} />
                    </div>
                  </div>
                  {formatAchievementConditionSummary(form) ? (
                    <div className={styles.sceneTypeHint}>Досягнення буде автоматично видаватися так: {formatAchievementConditionSummary(form)}</div>
                  ) : (
                    <div className={styles.sceneTypeHint}>Якщо залишити автовидачу порожньою, досягнення буде лише карткою без автоматичної умови.</div>
                  )}
                </>
              ) : (
                <div className={styles.sceneTypeHint}>Для системних досягнень логіка автовидачі керується бекендом.</div>
              )}
              <label className={styles.formLabel}>Image URL</label>
              <div className={styles.uploadRow}>
                <input className={styles.formInput} value={form.imageUrl || ""} onChange={(e) => updateFormField("imageUrl", e.target.value)} title={FIELD_HINTS.achievementImageUrl} />
                <button type="button" className={styles.uploadButton} onClick={() => startUpload("imageUrl")}>Завантажити</button>
              </div>
            </>
          );
        })() : null}

        {modal.type === "sceneForm" ? (
          <>
            <div className={styles.formGridTwo}>
              <div>
                <label className={styles.formLabel}>Курс</label>
                <select
                  className={styles.formInput}
                  value={form.courseId || ""}
                  onChange={(e) => {
                    updateFormField("courseId", e.target.value);
                    updateFormField("topicId", "");
                  }}
                >
                  <option value="">Без курсу</option>
                  {courses.map((item) => (
                    <option key={item.id} value={item.id}>{resolveCourseLabel(item)} · {item.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={styles.formLabel}>Тема</label>
                <select
                  className={styles.formInput}
                  value={form.topicId || ""}
                  onChange={(e) => {
                    updateFormField("topicId", e.target.value);

                    if (e.target.value) {
                      updateFormField("sceneType", "Sun");
                    }
                  }}
                  disabled={!sceneModalCourseId}
                >
                  <option value="">Без теми</option>
                  {sceneModalTopics.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formGridTwo}>
              <div>
                <label className={styles.formLabel}>Назва</label>
                <input className={styles.formInput} value={form.title || ""} onChange={(e) => updateFormField("title", e.target.value)} title={FIELD_HINTS.sceneTitle} placeholder="Назва сцени" />
              </div>
              <div>
                <label className={styles.formLabel}>Порядок</label>
                <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.sceneOrder} placeholder="1" />
              </div>
            </div>
            <label className={styles.formLabel}>Опис</label>
            <textarea className={styles.textareaMedium} value={form.description || ""} onChange={(e) => updateFormField("description", e.target.value)} title={FIELD_HINTS.sceneDescription} placeholder="Короткий опис сцени" />
            <label className={styles.formLabel}>Тип сцени</label>
            <select className={styles.formInput} value={form.sceneType || "Dialog"} onChange={(e) => updateFormField("sceneType", e.target.value)} title={FIELD_HINTS.sceneType}>
              {SCENE_TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {String(form.topicId || "").trim() ? (
              <div className={styles.sceneTypeHint}>Для сцени, яка прив'язується до теми, потрібно залишити тип Sun.</div>
            ) : null}
            <label className={styles.formLabel}>Background URL</label>
            <div className={styles.uploadRow}>
              <input className={styles.formInput} value={form.backgroundUrl || ""} onChange={(e) => updateFormField("backgroundUrl", e.target.value)} title={FIELD_HINTS.sceneBackgroundUrl} placeholder="https://... або /uploads/..." />
              <button type="button" className={styles.uploadButton} onClick={() => startUpload("backgroundUrl")}>Завантажити</button>
            </div>
            <label className={styles.formLabel}>Audio URL</label>
            <div className={styles.uploadRow}>
              <input className={styles.formInput} value={form.audioUrl || ""} onChange={(e) => updateFormField("audioUrl", e.target.value)} title={FIELD_HINTS.sceneAudioUrl} placeholder="https://... або /uploads/..." />
              <button type="button" className={styles.uploadButton} onClick={() => startUpload("audioUrl")}>Завантажити</button>
            </div>
          </>
        ) : null}

        {modal.type === "sceneStepForm" ? (
          <>
            <div className={styles.formGridTwo}>
              <div>
                <label className={styles.formLabel}>Speaker</label>
                <input className={styles.formInput} value={form.speaker || ""} onChange={(e) => updateFormField("speaker", e.target.value)} title={FIELD_HINTS.sceneStepSpeaker} placeholder="Narrator" />
              </div>
              <div>
                <label className={styles.formLabel}>Порядок</label>
                <input className={styles.formInput} value={form.order || ""} onChange={(e) => updateFormField("order", e.target.value)} title={FIELD_HINTS.sceneStepOrder} placeholder="1" />
              </div>
            </div>
            <label className={styles.formLabel}>Text</label>
            <textarea className={styles.textareaMedium} value={form.text || ""} onChange={(e) => updateFormField("text", e.target.value)} title={FIELD_HINTS.sceneStepText} placeholder="Текст репліки або кроку" />
            <label className={styles.formLabel}>Тип кроку</label>
            <select className={styles.formInput} value={form.stepType || "Line"} onChange={(e) => updateFormField("stepType", e.target.value)} title={FIELD_HINTS.sceneStepType}>
              {SCENE_STEP_TYPE_OPTIONS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            {form.stepType === "Choice" ? (
              <>
                <label className={styles.formLabel}>Варіанти відповіді</label>
                <div className={styles.sceneChoicesEditor}>
                  {(form.choiceItems || []).map((choiceItem, choiceIndex) => (
                    <div key={choiceItem.id || `scene-modal-choice-${choiceIndex}`} className={styles.sceneChoiceRow}>
                      <label className={styles.sceneChoiceCorrectWrap}>
                        <input
                          type="radio"
                          name="scene-step-form-correct"
                          checked={Boolean(choiceItem.isCorrect)}
                          onChange={() => {
                            const nextItems = (form.choiceItems || []).map((item, index) => ({
                              ...item,
                              isCorrect: index === choiceIndex,
                            }));
                            updateFormField("choiceItems", nextItems);
                          }}
                        />
                        <span>Правильна</span>
                      </label>
                      <input
                        className={styles.sceneChoiceInput}
                        value={choiceItem.text || ""}
                        onChange={(e) => {
                          const nextItems = [...(form.choiceItems || [])];
                          nextItems[choiceIndex] = {
                            ...nextItems[choiceIndex],
                            text: e.target.value,
                          };
                          updateFormField("choiceItems", nextItems);
                        }}
                        placeholder={`Варіант ${choiceIndex + 1}`}
                      />
                      <button
                        type="button"
                        className={styles.sceneChoiceRemoveButton}
                        onClick={() => {
                          const nextItems = [...(form.choiceItems || [])];
                          nextItems.splice(choiceIndex, 1);

                          if (nextItems.length && !nextItems.some((item) => item.isCorrect)) {
                            nextItems[0] = {
                              ...nextItems[0],
                              isCorrect: true,
                            };
                          }

                          updateFormField("choiceItems", nextItems);
                        }}
                        disabled={(form.choiceItems || []).length <= 1}
                      >
                        Видалити
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.sceneEditorSecondaryActions}>
                  <button
                    type="button"
                    className={styles.secondaryActionButton}
                    onClick={() => updateFormField("choiceItems", [
                      ...(form.choiceItems || []),
                      {
                        id: Date.now() + (form.choiceItems || []).length,
                        text: "",
                        isCorrect: !(form.choiceItems || []).length,
                      },
                    ])}
                  >
                    ДОДАТИ ВАРІАНТ
                  </button>
                </div>
              </>
            ) : null}

            {form.stepType === "Input" ? (
              <>
                <label className={styles.formLabel}>Правильна відповідь</label>
                <input className={styles.formInput} value={form.inputCorrectAnswer || ""} onChange={(e) => updateFormField("inputCorrectAnswer", e.target.value)} placeholder="Введи правильну відповідь" />
              </>
            ) : null}
          </>
        ) : null}

        <div className={styles.modalActions}>
          <button type="button" className={styles.secondaryActionButton} onClick={closeModal}>Скасувати</button>
          <button
            type="button"
            className={styles.primaryActionButtonModal}
            onClick={saveForm}
            disabled={
              isActionLoading
              || (modal.type === "topicSceneBindingForm" && !String(form.sceneId || "").trim())
              || ((modal.type === "topicDataForm" || modal.type === "courseTitleForm" || modal.type === "lessonTitleForm") && !String(form.title || "").trim())
            }
          >
            {modal.type === "topicSceneBindingForm" ? "ЗБЕРЕГТИ СЦЕНУ" : "Зберегти"}
          </button>
        </div>
      </ModalShell>
    );
  };

  return (
    <div className={styles.viewport}>
      <input ref={fileInputRef} type="file" hidden onChange={handleFileChange} />
      <div ref={stageRef} className={styles.stage} id="admin-stage-root">
        <aside className={styles.sidebar}>
          <div className={styles.logo}>LUMINO</div>
          <div className={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => (
              <button
                type="button"
                key={item.key}
                className={`${styles.sidebarButton} ${section === item.key ? styles.sidebarButtonActive : ""}`}
                onClick={() => handleSectionChange(item.key)}
              >
                <img src={item.icon} alt="" className={styles.sidebarIcon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className={styles.content}>
          <button type="button" className={styles.adminLogoutButton} onClick={handleAdminLogout}>
            <svg viewBox="0 0 24 24" className={styles.adminLogoutIcon} aria-hidden="true">
              <path d="M12 3V11" />
              <path d="M7.05 5.05C5.2 6.32 4 8.45 4 10.86C4 14.8 7.13 18 11 18C14.87 18 18 14.8 18 10.86C18 8.45 16.8 6.32 14.95 5.05" />
            </svg>
            <span>ВИЙТИ</span>
          </button>
          {!isBootLoading && section === "courses" && coursesViewMode === "landing" ? renderCoursesLandingSection() : null}
          {!isBootLoading && section === "courses" && coursesViewMode === "content" ? (
            <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded}`.trim()}>
              {renderCourseChips()}
              {renderCoursesSection()}
            </div>
          ) : null}

          {isBootLoading ? <div className={styles.loadingLabel}>Завантаження адмінки...</div> : null}
          {!isBootLoading && section === "vocabulary" ? (
            <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded}`.trim()}>
              {renderCourseChips()}
              {renderVocabularySection()}
            </div>
          ) : null}
          {!isBootLoading && section === "scenes" ? (
            <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded}`.trim()}>
              {renderCourseChips()}
              {renderScenesSection()}
            </div>
          ) : null}
          {!isBootLoading && section === "achievements" ? (
            <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded}`.trim()}>
              {renderAchievementsSelectorShell()}
              {renderAchievementsSection()}
            </div>
          ) : null}
          {!isBootLoading && section === "users" ? (
            <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded}`.trim()}>
              {renderCourseChips()}
              {renderUsersSection()}
            </div>
          ) : null}
          {!isBootLoading && section === "service" ? (
            <div className={`${styles.coursesLandingShell} ${styles.coursesLandingShellExpanded}`.trim()}>
              {renderServiceSelectorShell()}
              {renderServiceSection()}
            </div>
          ) : null}
        </main>

        {toast.text ? <div className={`${styles.toast} ${toast.type === "error" ? styles.toastError : styles.toastSuccess}`}>{toast.text}</div> : null}
        {isAchievementPreviewOpen ? (
          <ModalShell
            title={achievementPreviewTitle}
            onClose={() => setIsAchievementPreviewOpen(false)}
            compact
            hideTitle
            cardClassName={styles.achievementPreviewModal}
          >
            <div className={styles.achievementPreviewPanel}>
              {achievementPreviewImageUrl ? <img src={achievementPreviewImageUrl} alt="" className={styles.achievementPreviewImage} /> : null}
              <div className={styles.achievementPreviewTitle}>{achievementPreviewTitle}</div>
              <div className={styles.achievementPreviewDescription}>{achievementPreviewMessage}</div>
            </div>
            <div className={`${styles.modalActions} ${styles.achievementPreviewActions}`.trim()}>
              <button
                type="button"
                className={`${styles.primaryActionButtonModal} ${styles.achievementPreviewButton}`.trim()}
                onClick={() => setIsAchievementPreviewOpen(false)}
              >
                Добре
              </button>
            </div>
          </ModalShell>
        ) : null}
        {renderModalContent()}
      </div>
    </div>
  );
}
