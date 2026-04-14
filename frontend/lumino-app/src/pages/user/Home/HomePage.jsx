import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { authStorage } from "../../../services/authStorage.js";
import { getCachedLessonPack, preloadLessonPack } from "../../../services/lessonPackCache.js";
import { getCachedScenePack, preloadScenePack } from "../../../services/scenePackCache.js";
import { readPersistentUserCache, removePersistentUserCache, writePersistentUserCache } from "../../../services/userPersistentCache.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { onboardingService } from "../../../services/onboardingService.js";
import { coursesService } from "../../../services/coursesService.js";
import { learningService } from "../../../services/learningService.js";
import { userService } from "../../../services/userService.js";
import { streakService } from "../../../services/streakService.js";
import { scenesService } from "../../../services/scenesService.js";
import { preloadAchievementsCache } from "../../../services/achievementsCache.js";
import { preloadProfileSnapshot } from "../../../services/profileSnapshotCache.js";
import { preloadVocabularyCache } from "../../../services/vocabularySnapshotCache.js";
import { warmMediaUrls } from "../../../services/mediaWarmup.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import ProfileContent from "../Profile/ProfileContent.jsx";
import AchievementsContent from "../Achievements/AchievementsContent.jsx";
import VocabularyContent from "../Vocabulary/VocabularyContent.jsx";
import styles from "./HomePage.module.css";
import { getKyivCurrentMonth, getKyivDaysBetween, getKyivMonthLabel, getKyivTodayIso } from "../../../utils/kyivDate.js";

import FlagEn from "../../../assets/flags/flag-en.svg";
import FlagDe from "../../../assets/flags/flag-de.svg";
import FlagIt from "../../../assets/flags/flag-it.svg";
import FlagEs from "../../../assets/flags/flag-es.svg";
import FlagFr from "../../../assets/flags/flag-fr.svg";
import FlagPl from "../../../assets/flags/flag-pl.svg";
import FlagJa from "../../../assets/flags/flag-ja.svg";
import FlagKo from "../../../assets/flags/flag-ko.svg";
import FlagZh from "../../../assets/flags/flag-zn.svg";
import { HOME_BG_LEFT, HOME_HEADER_ICONS, HOME_NAV_ICONS, HOME_ORBIT_ASSETS, HOME_SHARED_ASSETS } from "./homeAssets.js";
import ArrowPrevious from "../../../assets/icons/arrow-previous.svg";
import ProgressTrackIcon from "../../../assets/home/shared/progress track.svg";
import MascotModal from "../../../assets/mascot/mascotmodal.svg";

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

const LANGUAGE_LABELS = {
  en: "Англійська",
  de: "Німецька",
  it: "Італійська",
  es: "Іспанська",
  fr: "Французька",
  pl: "Польська",
  ja: "Японська",
  ko: "Корейська",
  zh: "Китайська",
};

const NAV_ITEMS = [
  { key: "learning", label: "НАВЧАННЯ" },
  { key: "achievements", label: "НАГОРОДИ" },
  { key: "dictionary", label: "СЛОВНИК" },
  { key: "profile", label: "ПРОФІЛЬ" },
];

const HEADER_COUNTERS = {
  flag: { x: 1228, y: 40, w: 98, h: 72 },
  star: { x: 1377, y: 39, w: 129, h: 66 },
  crystal: { x: 1572, y: 57, w: 114.34, h: 39.86 },
  energy: { x: 1732, y: 39, w: 149, h: 69 },
};

const ORBIT_SEQUENCE = [1, 2, 3, 1, 2, 3, 1, 2, 3, 1];
const SECTION_WIDTH = 879.47;
const TAB_QUERY_VIEWS = ["profile", "achievements", "dictionary"];
const FULL_PANEL_VIEWS = ["languages", "courses", "scenes", "lesson", ...TAB_QUERY_VIEWS];
const TOP_BAR_HIDDEN_VIEWS = ["languages", "lesson", ...TAB_QUERY_VIEWS];
const WEEK_DAYS = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "НД"];
const LANGUAGE_ORDER = ["en", "de", "it", "es", "fr", "pl", "ja", "ko", "zh"];

const COURSE_TOPICS_COUNT = 10;
const COURSE_LESSONS_PER_TOPIC = 8;
const COURSE_EXERCISES_PER_LESSON = 9;
const COURSE_SCENES_PER_TOPIC = 1;

const ORBIT_LAYOUTS = {
  1: {
    lessons: [
      { left: 390, top: 180, width: 43, height: 43 },
      { left: 200, top: 290, width: 66, height: 66 },
      { left: 445, top: 420, width: 70, height: 68 },
      { left: 65, top: 375, width: 37, height: 37 },
      { left: 210, top: 520, width: 38, height: 38 },
      { left: 590, top: 510, width: 75, height: 75 },
      { left: 400, top: 630, width: 64, height: 64 },
      { left: 145, top: 685, width: 51, height: 48 },
    ],
    sun: { left: 297, top: 431, width: 107, height: 107 },
    decor: [
      { left: 225, top: 220, size: 15, accent: "#86A8D3" },
      { left: 527, top: 260, size: 11, accent: "#AACDF1" },
      { left: 302, top: 280, size: 16, accent: "#C38CC4" },
      { left: 391, top: 354, size: 12, accent: "#A8D4FF" },
      { left: 520, top: 385, size: 16, accent: "#D9A4D0" },
      { left: 278, top: 423, size: 10, accent: "#C18FCB" },
      { left: 64, top: 437, size: 13, accent: "#6D97C9" },
      { left: 210, top: 470, size: 16, accent: "#5A7D99" },
      { left: 391, top: 520, size: 15, accent: "#86B4E5" },
      { left: 306, top: 562, size: 10, accent: "#E4B7CF" },
      { left: 173, top: 584, size: 17, accent: "#E0B2CF" },
      { left: 422, top: 586, size: 14, accent: "#79A4DB" },
      { left: 378, top: 678, size: 9, accent: "#C792C4" },
      { left: 507, top: 707, size: 18, accent: "#74A4D7" },
      { left: 250, top: 747, size: 12, accent: "#B6D7FF" },
    ],
  },
  2: {
    lessons: [
      { left: 440, top: 200, width: 46, height: 46 },
      { left: 190, top: 270, width: 95, height: 95 },
      { left: 60, top: 350, width: 50, height: 50 },
      { left: 600, top: 390, width: 55, height: 55 },
      { left: 445, top: 410, width: 63, height: 63 },
      { left: 340, top: 600, width: 40, height: 40 },
      { left: 465, top: 590, width: 70, height: 70 },
      { left: 100, top: 640, width: 70, height: 70 },
    ],
    sun: { left: 297, top: 431, width: 107, height: 107 },
    decor: [
      { left: 225, top: 220, size: 15, accent: "#86A8D3" },
      { left: 527, top: 260, size: 11, accent: "#AACDF1" },
      { left: 302, top: 280, size: 16, accent: "#C38CC4" },
      { left: 391, top: 354, size: 12, accent: "#A8D4FF" },
      { left: 520, top: 385, size: 16, accent: "#D9A4D0" },
      { left: 278, top: 423, size: 10, accent: "#C18FCB" },
      { left: 64, top: 437, size: 13, accent: "#6D97C9" },
      { left: 210, top: 470, size: 16, accent: "#5A7D99" },
      { left: 391, top: 520, size: 15, accent: "#86B4E5" },
      { left: 306, top: 562, size: 10, accent: "#E4B7CF" },
      { left: 173, top: 584, size: 17, accent: "#E0B2CF" },
      { left: 422, top: 586, size: 14, accent: "#79A4DB" },
      { left: 378, top: 678, size: 9, accent: "#C792C4" },
      { left: 507, top: 707, size: 18, accent: "#74A4D7" },
      { left: 250, top: 747, size: 12, accent: "#B6D7FF" },
    ],
  },
  3: {
    lessons: [
      { left: 170, top: 230, width: 40, height: 40 },
      { left: 380, top: 240, width: 120, height: 120 },
      { left: 560, top: 300, width: 70, height: 70 },
      { left: 160, top: 350, width: 50, height: 50 },
      { left: 450, top: 420, width: 65, height: 65 },
      { left: 25, top: 520, width: 100, height: 100 },
      { left: 270, top: 650, width: 60, height: 60 },
      { left: 545, top: 636, width: 60, height: 60 },
    ],
    sun: { left: 297, top: 431, width: 107, height: 107 },
    decor: [
      { left: 225, top: 220, size: 15, accent: "#86A8D3" },
      { left: 527, top: 260, size: 11, accent: "#AACDF1" },
      { left: 302, top: 280, size: 16, accent: "#C38CC4" },
      { left: 391, top: 354, size: 12, accent: "#A8D4FF" },
      { left: 520, top: 385, size: 16, accent: "#D9A4D0" },
      { left: 278, top: 423, size: 10, accent: "#C18FCB" },
      { left: 64, top: 437, size: 13, accent: "#6D97C9" },
      { left: 210, top: 470, size: 16, accent: "#5A7D99" },
      { left: 391, top: 520, size: 15, accent: "#86B4E5" },
      { left: 306, top: 562, size: 10, accent: "#E4B7CF" },
      { left: 173, top: 584, size: 17, accent: "#E0B2CF" },
      { left: 422, top: 586, size: 14, accent: "#79A4DB" },
      { left: 378, top: 678, size: 9, accent: "#C792C4" },
      { left: 507, top: 707, size: 18, accent: "#74A4D7" },
      { left: 250, top: 747, size: 12, accent: "#B6D7FF" },
    ],
  },
};

const GUEST_USER = {
  hearts: 5,
  heartsMax: 5,
  crystals: 500,
  currentStreakDays: 15,
  bestStreakDays: 24,
  heartRegenMinutes: 30,
  crystalCostPerHeart: 20,
  nextHeartInSeconds: 0,
};

function normalizeCode(code) {
  return String(code || "").trim().toLowerCase();
}

function isUserNotFoundResponse(res) {
  if (!res || res.ok) return false;

  const type = normalizeCode(res.data?.type);
  const detail = normalizeCode(res.data?.detail || res.error);

  return res.status === 404 && type === "not_found" && detail === "user not found";
}

function isAuthExpiredResponse(res) {
  if (!res || res.ok) return false;

  return res.status === 401 || isUserNotFoundResponse(res);
}

function getFlagByCode(code) {
  return FLAG_MAP[normalizeCode(code)] || FlagEn;
}

function getLanguageLabel(code) {
  return LANGUAGE_LABELS[normalizeCode(code)] || String(code || "").toUpperCase();
}

function buildGuestTopics() {
  const names = [
    "Buy clothes",
    "Food",
    "Travel",
    "Family",
    "Work",
    "Hobbies",
    "Health",
    "Shopping",
    "Weather",
    "Daily life",
  ];

  return names.map((title, index) => ({
    id: index + 1,
    order: index + 1,
    title,
    lessons: Array.from({ length: 8 }, (_, lessonIndex) => ({
      id: index * 100 + lessonIndex + 1,
      order: lessonIndex + 1,
      title: `Lesson ${lessonIndex + 1}`,
      isUnlocked: index === 0 && lessonIndex === 0,
      isPassed: false,
    })),
    scene: {
      id: index + 1,
      order: index + 1,
      title: `Сцена ${index + 1}`,
      isUnlocked: false,
      isCompleted: false,
      unlockReason: "Щоб відкрити сцену, потрібно пройти всі 8 уроків цієї теми.",
    },
  }));
}

function getOrbitType(index) {
  return ORBIT_SEQUENCE[index] || 1;
}

function getOrbitBundle(index) {
  return HOME_ORBIT_ASSETS[getOrbitType(index)];
}

function formatDuration(totalSeconds) {
  const safeTotalSeconds = Math.max(0, Number(totalSeconds || 0));
  const hours = Math.floor(safeTotalSeconds / 3600);
  const minutes = Math.floor((safeTotalSeconds % 3600) / 60);
  const seconds = safeTotalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatCourseBadge(course, topicIndex) {
  const level = String(course?.level || course?.title || "A1").match(/A1|A2|B1|B2|C1|C2/i)?.[0]?.toUpperCase() || "A1";
  return `${level}, ТЕМА ${topicIndex + 1}`;
}
function getCourseLevel(course) {
  return String(course?.level || course?.title || "A1").match(/A1|A2|B1|B2|C1|C2/i)?.[0]?.toUpperCase() || "A1";
}

function getCourseTotals(pathData) {
  const topicsCount = Math.max(Number(pathData?.topics?.length || 0), COURSE_TOPICS_COUNT);
  const lessonsCount = Math.max(
    Array.isArray(pathData?.topics)
      ? pathData.topics.reduce((sum, topic) => sum + Number(topic?.lessons?.length || 0), 0)
      : 0,
    topicsCount * COURSE_LESSONS_PER_TOPIC
  );
  const scenesCount = Math.max(Number(pathData?.scenes?.length || 0), topicsCount * COURSE_SCENES_PER_TOPIC);
  const totalSteps = (lessonsCount * COURSE_EXERCISES_PER_LESSON) + scenesCount;

  return {
    topicsCount,
    lessonsCount,
    scenesCount,
    totalSteps,
  };
}

function getCourseProgressPercent(courseItem, pathData, isSelectedCourse) {
  if (isSelectedCourse && pathData) {
    const totals = getCourseTotals(pathData);
    const passedLessons = Array.isArray(pathData?.topics)
      ? pathData.topics.reduce((sum, topic) => sum + topic.lessons.filter((lesson) => lesson?.isPassed).length, 0)
      : 0;
    const completedScenes = Array.isArray(pathData?.scenes)
      ? pathData.scenes.filter((scene) => scene?.isCompleted).length
      : 0;
    const completedSteps = (passedLessons * COURSE_EXERCISES_PER_LESSON) + completedScenes;

    if (!totals.totalSteps) {
      return 0;
    }

    return Math.max(0, Math.min(100, (completedSteps / totals.totalSteps) * 100));
  }

  return Math.max(0, Math.min(100, Number(courseItem?.completionPercent || 0)));
}


function buildMonth(year, month, activeDates, registrationDates = []) {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const prevLast = new Date(year, month - 1, 0);
  const startWeekDay = (first.getDay() + 6) % 7;
  const totalDays = last.getDate();
  const activeSet = new Set(activeDates);
  const registrationSet = new Set(registrationDates);
  const cells = [];

  for (let i = startWeekDay - 1; i >= 0; i -= 1) {
    cells.push({
      key: `prev-${i}`,
      day: prevLast.getDate() - i,
      active: false,
      registered: false,
      muted: true,
      currentMonth: false,
    });
  }

  for (let day = 1; day <= totalDays; day += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      key: iso,
      day,
      active: activeSet.has(iso),
      registered: registrationSet.has(iso),
      muted: false,
      currentMonth: true,
    });
  }

  let nextDay = 1;

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `next-${nextDay}`,
      day: nextDay,
      active: false,
      registered: false,
      muted: true,
      currentMonth: false,
    });
    nextDay += 1;
  }

  return cells;
}

function extractCalendarPayload(data) {
  if (!data) {
    return { activeDates: [], registrationDates: [], daysSinceJoined: 0, currentKyivDateTimeText: "" };
  }

  const source = Array.isArray(data.days)
    ? data.days
    : Array.isArray(data.items)
      ? data.items
      : [];

  const activeDates = source
    .filter((item) => item?.isCompleted || item?.completed || item?.active || item?.isActive)
    .map((item) => String(item.date || item.dateUtc || item.day || item.dayUtc || ""))
    .filter(Boolean);

  const registrationDates = source
    .filter((item) => item?.isRegistrationDay)
    .map((item) => String(item.date || item.dateUtc || item.day || item.dayUtc || ""))
    .filter(Boolean);

  return {
    activeDates,
    registrationDates,
    daysSinceJoined: Number(data.daysSinceJoined ?? 0),
    currentKyivDateTimeText: String(data.currentKyivDateTimeText || "").trim(),
  };
}

function getWeekProgress(days) {
  const safeDays = Math.max(0, Number(days || 0));

  if (safeDays === 0) {
    return {
      filled: 0,
    };
  }

  const weekProgress = ((safeDays - 1) % 7) + 1;
  return {
    filled: weekProgress,
  };
}

function getComputedNextPointers(topics, scenes) {
  const safeTopics = Array.isArray(topics) ? topics : [];
  const safeScenes = Array.isArray(scenes) ? scenes : [];

  let nextLessonId = null;

  for (const topic of safeTopics) {
    const lessons = Array.isArray(topic?.lessons) ? topic.lessons : [];

    for (const lesson of lessons) {
      if (lesson?.isUnlocked && !lesson?.isPassed) {
        nextLessonId = Number(lesson?.id || 0) || null;
        break;
      }
    }

    if (nextLessonId) {
      break;
    }
  }

  let nextSceneId = null;

  for (const scene of safeScenes) {
    if (scene?.isUnlocked && !scene?.isCompleted) {
      nextSceneId = Number(scene?.id || 0) || null;
      break;
    }
  }

  return {
    nextLessonId,
    nextSceneId,
  };
}

function normalizeCoursePath(data) {
  if (!data) return null;

  const topics = Array.isArray(data.topics) ? data.topics : [];
  const scenes = Array.isArray(data.scenes) ? data.scenes : [];
  const computedNextPointers = getComputedNextPointers(topics, scenes);

  return {
    topics,
    scenes,
    nextPointers: {
      nextLessonId: Number(data?.nextPointers?.nextLessonId ?? data?.nextPointers?.NextLessonId ?? data?.NextPointers?.NextLessonId ?? 0) || computedNextPointers.nextLessonId,
      nextSceneId: Number(data?.nextPointers?.nextSceneId ?? data?.nextPointers?.NextSceneId ?? data?.NextPointers?.NextSceneId ?? 0) || computedNextPointers.nextSceneId,
    },
  };
}

function cloneCoursePath(path) {
  const normalizedPath = normalizeCoursePath(path);

  if (!normalizedPath) {
    return null;
  }

  return {
    topics: normalizedPath.topics.map((topic) => ({
      ...topic,
      lessons: Array.isArray(topic?.lessons)
        ? topic.lessons.map((lesson) => ({ ...lesson }))
        : [],
    })),
    scenes: normalizedPath.scenes.map((scene) => ({ ...scene })),
    nextPointers: {
      nextLessonId: Number(normalizedPath?.nextPointers?.nextLessonId || 0) || null,
      nextSceneId: Number(normalizedPath?.nextPointers?.nextSceneId || 0) || null,
    },
  };
}

function applyOptimisticLessonCompletion(path, lessonId, isPassed) {
  if (!path || !lessonId || !isPassed) {
    return normalizeCoursePath(path);
  }

  const nextPath = cloneCoursePath(path);

  if (!nextPath) {
    return null;
  }

  let changed = false;
  let topicIndex = -1;
  let lessonIndex = -1;

  for (let i = 0; i < nextPath.topics.length; i += 1) {
    const currentLessonIndex = nextPath.topics[i]?.lessons?.findIndex((lesson) => Number(lesson?.id || 0) === Number(lessonId));

    if (currentLessonIndex >= 0) {
      topicIndex = i;
      lessonIndex = currentLessonIndex;
      break;
    }
  }

  if (topicIndex === -1 || lessonIndex === -1) {
    return nextPath;
  }

  const currentTopic = nextPath.topics[topicIndex];
  const currentLesson = currentTopic?.lessons?.[lessonIndex];

  if (!currentLesson) {
    return nextPath;
  }

  if (!currentLesson.isUnlocked) {
    currentLesson.isUnlocked = true;
    changed = true;
  }

  if (!currentLesson.isPassed) {
    currentLesson.isPassed = true;
    changed = true;
  }

  const nextLesson = currentTopic.lessons?.[lessonIndex + 1];

  if (nextLesson && !nextLesson.isUnlocked) {
    nextLesson.isUnlocked = true;
    changed = true;
  }

  if (!nextLesson) {
    const currentTopicId = Number(currentTopic?.id || 0);
    const currentTopicScene = nextPath.scenes.find((scene) => Number(scene?.topicId || 0) === currentTopicId);

    if (currentTopicScene && !currentTopicScene.isUnlocked) {
      currentTopicScene.isUnlocked = true;
      changed = true;
    }
  }

  nextPath.nextPointers = getComputedNextPointers(nextPath.topics, nextPath.scenes);

  return changed ? nextPath : nextPath;
}

function applyOptimisticSceneCompletion(path, sceneId) {
  if (!path || !sceneId) {
    return normalizeCoursePath(path);
  }

  const nextPath = cloneCoursePath(path);

  if (!nextPath) {
    return null;
  }

  const sceneIndex = nextPath.scenes.findIndex((scene) => Number(scene?.id || 0) === Number(sceneId));

  if (sceneIndex === -1) {
    return nextPath;
  }

  let changed = false;
  const currentScene = nextPath.scenes[sceneIndex];

  if (!currentScene.isUnlocked) {
    currentScene.isUnlocked = true;
    changed = true;
  }

  if (!currentScene.isCompleted) {
    currentScene.isCompleted = true;
    changed = true;
  }

  const currentTopicId = Number(currentScene?.topicId || 0);

  if (currentTopicId > 0) {
    const orderedTopicIndex = nextPath.topics.findIndex((topic) => Number(topic?.id || 0) === currentTopicId);
    const nextTopic = orderedTopicIndex >= 0 ? nextPath.topics[orderedTopicIndex + 1] : null;
    const firstLesson = nextTopic?.lessons?.[0];

    if (firstLesson && !firstLesson.isUnlocked) {
      firstLesson.isUnlocked = true;
      changed = true;
    }
  }

  nextPath.nextPointers = getComputedNextPointers(nextPath.topics, nextPath.scenes);

  return changed ? nextPath : nextPath;
}

function applyOptimisticHomeRefresh(snapshot, locationState) {
  if (!snapshot) {
    return null;
  }

  const completedLessonId = Number(locationState?.completedLessonId || 0);
  const isLessonPassed = Boolean(locationState?.isLessonPassed);
  const completedSceneId = Number(locationState?.completedSceneId || 0);

  let nextPath = normalizeCoursePath(snapshot.path);

  if (completedLessonId > 0 && isLessonPassed) {
    nextPath = applyOptimisticLessonCompletion(nextPath, completedLessonId, true);
  }

  if (completedSceneId > 0) {
    nextPath = applyOptimisticSceneCompletion(nextPath, completedSceneId);
  }

  if (nextPath === snapshot.path) {
    return snapshot;
  }

  return {
    ...snapshot,
    path: nextPath,
  };
}

const HOME_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const COURSE_PATH_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const SCENES_OVERVIEW_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const SUPPORTED_LANGUAGES_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const CALENDAR_MONTH_CACHE_TTL_MS = Number.POSITIVE_INFINITY;

function getCoursePathCacheKey(languageCode, courseId) {
  const userKey = authStorage.getUserCacheKey();
  const normalizedLanguageCode = normalizeCode(languageCode || "");
  const normalizedCourseId = Number(courseId || 0);

  if (!userKey || !normalizedLanguageCode || !normalizedCourseId) {
    return "";
  }

  return `lumino-course-path:${userKey}:${normalizedLanguageCode}:${normalizedCourseId}`;
}

function getScenesOverviewCacheKey(languageCode, courses) {
  const userKey = authStorage.getUserCacheKey();
  const normalizedLanguageCode = normalizeCode(languageCode);
  const courseIds = Array.isArray(courses)
    ? courses.map((item) => Number(item?.id || 0)).filter(Boolean).sort((a, b) => a - b)
    : [];

  if (!userKey || !normalizedLanguageCode || courseIds.length === 0) {
    return "";
  }

  return `lumino-scenes-overview:${userKey}:${normalizedLanguageCode}:${courseIds.join(",")}`;
}

function getCachedScenesOverview(languageCode, courses) {
  const key = getScenesOverviewCacheKey(languageCode, courses);
  const value = readPersistentUserCache(key, { ttlMs: SCENES_OVERVIEW_CACHE_TTL_MS });
  const items = Array.isArray(value) ? value : null;

  if (Array.isArray(items) && items.length > 0) {
    warmMediaUrls(items.filter((item) => item?.isUnlocked).map((item) => item?.previewUrl));
  }

  return items;
}

function setCachedScenesOverview(languageCode, courses, value) {
  const key = getScenesOverviewCacheKey(languageCode, courses);

  if (!key) {
    return;
  }

  if (Array.isArray(value) && value.length > 0) {
    writePersistentUserCache(key, value);
    return;
  }

  removePersistentUserCache(key);
}

function buildScenesOverviewItems(sourceCourses, responses) {
  const nextScenes = [];

  sourceCourses.forEach((item, courseIndex) => {
    const res = Array.isArray(responses) ? responses[courseIndex] : null;
    const courseScenes = Array.isArray(res?.data) ? res.data : [];

    courseScenes
      .slice()
      .sort((first, second) => Number(first?.order || 0) - Number(second?.order || 0))
      .forEach((scene, sceneIndex) => {
        nextScenes.push({
          ...scene,
          key: `${item?.id || courseIndex}-${scene?.id || sceneIndex}`,
          courseId: item?.id || null,
          courseLevel: getCourseLevel(item),
          courseOrder: Number(item?.order || courseIndex + 1),
          topicOrder: sceneIndex + 1,
          previewUrl: resolveMediaUrl(scene?.backgroundUrl || scene?.BackgroundUrl),
        });
      });
  });

  warmMediaUrls(nextScenes.map((item) => item?.previewUrl));
  return nextScenes;
}

function buildScenesOverviewFallback(sourceCourses, path) {
  const normalizedPath = normalizeCoursePath(path);
  const primaryCourse = Array.isArray(sourceCourses) ? sourceCourses[0] : null;
  const scenes = Array.isArray(normalizedPath?.scenes) ? normalizedPath.scenes : [];

  if (!primaryCourse || scenes.length === 0) {
    return [];
  }

  const nextScenes = scenes
    .slice()
    .sort((first, second) => Number(first?.order || 0) - Number(second?.order || 0))
    .map((scene, sceneIndex) => ({
      ...scene,
      key: `${primaryCourse?.id || 0}-${scene?.id || sceneIndex}`,
      courseId: primaryCourse?.id || null,
      courseLevel: getCourseLevel(primaryCourse),
      courseOrder: Number(primaryCourse?.order || 1),
      topicOrder: sceneIndex + 1,
      previewUrl: resolveMediaUrl(scene?.backgroundUrl || scene?.BackgroundUrl || scene?.previewUrl || scene?.PreviewUrl),
    }));

  warmMediaUrls(nextScenes.filter((item) => item?.isUnlocked).map((item) => item?.previewUrl));
  return nextScenes;
}

function mergeScenesOverviewWithPath(items, path) {
  const normalizedPath = normalizeCoursePath(path);
  const sourceItems = Array.isArray(items) ? items : [];
  const sourceScenes = Array.isArray(normalizedPath?.scenes) ? normalizedPath.scenes : [];

  if (sourceItems.length === 0 || sourceScenes.length === 0) {
    return sourceItems;
  }

  const scenesById = new Map(
    sourceScenes
      .map((scene) => [Number(scene?.id || 0), scene])
      .filter(([id]) => id > 0)
  );

  const nextItems = sourceItems.map((item) => {
    const id = Number(item?.id || 0);
    const pathScene = scenesById.get(id);

    if (!pathScene) {
      return {
        ...item,
        previewUrl: resolveMediaUrl(item?.previewUrl || item?.backgroundUrl || item?.BackgroundUrl || item?.previewUrl || item?.PreviewUrl),
      };
    }

    return {
      ...item,
      ...pathScene,
      key: item?.key,
      courseId: item?.courseId || null,
      courseLevel: item?.courseLevel,
      courseOrder: item?.courseOrder,
      topicOrder: item?.topicOrder,
      previewUrl: resolveMediaUrl(item?.previewUrl || pathScene?.backgroundUrl || pathScene?.BackgroundUrl || pathScene?.previewUrl || pathScene?.PreviewUrl),
    };
  });

  warmMediaUrls(nextItems.filter((item) => item?.isUnlocked).map((item) => item?.previewUrl));
  return nextItems;
}

function getSupportedLanguagesCacheKey() {
  const userKey = authStorage.getUserCacheKey();

  if (!userKey) {
    return "";
  }

  return `lumino-supported-languages:${userKey}`;
}

function getCachedSupportedLanguages() {
  const key = getSupportedLanguagesCacheKey();
  const value = readPersistentUserCache(key, { ttlMs: SUPPORTED_LANGUAGES_CACHE_TTL_MS });

  return Array.isArray(value) ? value : [];
}

function setCachedSupportedLanguages(value) {
  const key = getSupportedLanguagesCacheKey();

  if (!key) {
    return;
  }

  if (Array.isArray(value) && value.length > 0) {
    writePersistentUserCache(key, value);
    return;
  }

  removePersistentUserCache(key);
}

function getCalendarMonthCacheKey(year, month) {
  const userKey = authStorage.getUserCacheKey();
  const normalizedYear = Number(year || 0);
  const normalizedMonth = Number(month || 0);

  if (!userKey || !normalizedYear || !normalizedMonth) {
    return "";
  }

  return `lumino-calendar-month:${userKey}:${normalizedYear}:${normalizedMonth}`;
}

function getCachedCalendarMonth(year, month) {
  const key = getCalendarMonthCacheKey(year, month);
  const value = readPersistentUserCache(key, { ttlMs: CALENDAR_MONTH_CACHE_TTL_MS });

  if (!value || typeof value !== "object") {
    return null;
  }

  return {
    activeDates: Array.isArray(value.activeDates) ? value.activeDates : [],
    registrationDates: Array.isArray(value.registrationDates) ? value.registrationDates : [],
    daysSinceJoined: Number(value.daysSinceJoined || 0),
    currentKyivDateTimeText: String(value.currentKyivDateTimeText || ""),
  };
}

function setCachedCalendarMonth(year, month, value) {
  const key = getCalendarMonthCacheKey(year, month);

  if (!key) {
    return;
  }

  if (!value || typeof value !== "object") {
    removePersistentUserCache(key);
    return;
  }

  writePersistentUserCache(key, {
    activeDates: Array.isArray(value.activeDates) ? value.activeDates : [],
    registrationDates: Array.isArray(value.registrationDates) ? value.registrationDates : [],
    daysSinceJoined: Number(value.daysSinceJoined || 0),
    currentKyivDateTimeText: String(value.currentKyivDateTimeText || ""),
  });
}

function getCachedCoursePath(languageCode, courseId) {
  const key = getCoursePathCacheKey(languageCode, courseId);
  const value = readPersistentUserCache(key, { ttlMs: COURSE_PATH_CACHE_TTL_MS });

  return normalizeCoursePath(value);
}

function setCachedCoursePath(languageCode, courseId, value) {
  const key = getCoursePathCacheKey(languageCode, courseId);

  if (!key) {
    return;
  }

  if (value) {
    writePersistentUserCache(key, value);
    return;
  }

  removePersistentUserCache(key);
}


function getHomeCacheKey() {
  const userKey = authStorage.getUserCacheKey();

  if (!userKey) {
    return "";
  }

  return `lumino-home-cache:${userKey}`;
}

function getCachedHomeSnapshot() {
  const key = getHomeCacheKey();
  const parsed = readPersistentUserCache(key, { ttlMs: HOME_CACHE_TTL_MS });

  if (!parsed) {
    return null;
  }

  const activeLanguageCode = normalizeCode(parsed?.course?.languageCode || parsed?.languageState?.activeTargetLanguageCode || "");
  const activeCourseId = Number(parsed?.course?.id || 0);
  const cachedPath = normalizeCoursePath(parsed?.path) || getCachedCoursePath(activeLanguageCode, activeCourseId);

  return {
    user: parsed?.user || null,
    languageState: parsed?.languageState || { activeTargetLanguageCode: "", learningLanguages: [] },
    courses: Array.isArray(parsed?.courses) ? parsed.courses : [],
    course: parsed?.course || null,
    path: cachedPath,
    calendarDates: Array.isArray(parsed?.calendarDates) ? parsed.calendarDates : [],
    calendarRegistrationDates: Array.isArray(parsed?.calendarRegistrationDates) ? parsed.calendarRegistrationDates : [],
    calendarDaysSinceJoined: Number(parsed?.calendarDaysSinceJoined || 0),
    calendarCurrentKyivDateTimeText: String(parsed?.calendarCurrentKyivDateTimeText || ""),
    calendarMonth: parsed?.calendarMonth || null,
  };
}

function setCachedHomeSnapshot(value) {
  const key = getHomeCacheKey();

  if (!key) {
    return;
  }

  if (!value) {
    removePersistentUserCache(key);
    return;
  }

  const activeLanguageCode = normalizeCode(value?.course?.languageCode || value?.languageState?.activeTargetLanguageCode || "");
  const activeCourseId = Number(value?.course?.id || 0);
  const normalizedPath = normalizeCoursePath(value?.path);

  if (activeLanguageCode && activeCourseId && normalizedPath) {
    setCachedCoursePath(activeLanguageCode, activeCourseId, normalizedPath);
  }

  const { path, ...compactValue } = value;

  writePersistentUserCache(key, compactValue);
}

function resolveMediaUrl(value) {
  const src = String(value || "").trim();

  if (!src) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";

  if (src.startsWith("/")) {
    return `${origin}${src}`;
  }

  const apiBase = String(import.meta.env.VITE_API_BASE_URL || "/api").trim();

  if (/^https?:\/\//i.test(apiBase)) {
    const root = apiBase.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    return `${root}/${src.replace(/^\/+/, "")}`;
  }

  return `${origin}/${src.replace(/^\/+/, "")}`;
}

function getSceneLockedMessage(scene) {
  const topicOrder = Number(scene?.topicOrder || scene?.order || 0);

  if (topicOrder > 0) {
    return `ПРОЙДІТЬ ТЕМУ ${topicOrder}, ЩОБ РОЗБЛОКУВАТИ СЦЕНУ`;
  }

  return "ПРОЙДІТЬ ТЕМУ, ЩОБ РОЗБЛОКУВАТИ СЦЕНУ";
}

function getTopicLockedMessage(topic, index) {
  const topicOrder = Number(index) + 1;
  const previousTopicOrder = topicOrder > 1 ? topicOrder - 1 : 1;

  if (topicOrder > 1) {
    return `ПРОЙДІТЬ ТЕМУ ${previousTopicOrder} ТА ЇЇ СЦЕНУ, ЩОБ ВІДКРИТИ ТЕМУ ${topicOrder}`;
  }

  return "ЦЯ ТЕМА ЩЕ ЗАКРИТА";
}

function getSceneCardLabel(scene, index) {
  const title = String(scene?.title || scene?.Title || "").trim();

  if (title) {
    return title;
  }

  const topicOrder = Number(scene?.topicOrder || scene?.order || index + 1);

  if (topicOrder > 0) {
    return `Сцена ${topicOrder}`;
  }

  return "Сцена";
}

function normalizeUser(data) {
  if (!data) return null;

  return {
    hearts: data.hearts ?? data.heartsCount ?? GUEST_USER.hearts,
    heartsMax: data.heartsMax ?? data.maxHearts ?? GUEST_USER.heartsMax,
    crystals: data.crystals ?? data.crystalsCount ?? GUEST_USER.crystals,
    currentStreakDays: data.currentStreakDays ?? GUEST_USER.currentStreakDays,
    bestStreakDays: data.bestStreakDays ?? GUEST_USER.bestStreakDays,
    createdAt: data.createdAt || data.createdAtUtc || null,
    heartRegenMinutes: data.heartRegenMinutes ?? GUEST_USER.heartRegenMinutes,
    crystalCostPerHeart: data.crystalCostPerHeart ?? GUEST_USER.crystalCostPerHeart,
    nextHeartInSeconds: data.nextHeartInSeconds ?? GUEST_USER.nextHeartInSeconds,
  };
}

function getPreferredCurrentCourse(items, fallbackCourse = null) {
  const sourceItems = Array.isArray(items) ? items.filter(Boolean) : [];

  if (!sourceItems.length) {
    return fallbackCourse || null;
  }

  const sortedItems = [...sourceItems].sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
  const firstUnlockedIncompleteCourse = sortedItems.find((item) => !item?.isLocked && !item?.isCompleted);

  if (firstUnlockedIncompleteCourse) {
    return firstUnlockedIncompleteCourse;
  }

  const firstUnlockedCourse = sortedItems.find((item) => !item?.isLocked);

  if (firstUnlockedCourse) {
    return firstUnlockedCourse;
  }

  if (fallbackCourse) {
    const fallbackId = Number(fallbackCourse?.id || 0);
    const existingFallback = sortedItems.find((item) => Number(item?.id || 0) === fallbackId);

    if (existingFallback) {
      return existingFallback;
    }
  }

  return sortedItems[0] || null;
}

function HeaderIcon({ src, alt = "" }) {
  return <img className={styles.headerSvg} src={src} alt={alt} aria-hidden="true" />;
}

function NavIcon({ type }) {
  return <img className={styles.navSvg} src={HOME_NAV_ICONS[type]} alt="" aria-hidden="true" />;
}

function OrbitSection({
  item,
  index,
  course,
  isGuest,
  nextLessonId,
  nextSceneId,
  onTitleClick,
  onSceneButtonClick,
  onSceneSunClick,
  onLessonClick,
  onLessonWarm,
  onSceneWarm,
  onSceneWarmForLesson,
}) {
  const orbitType = getOrbitType(index);
  const layout = ORBIT_LAYOUTS[orbitType];
  const bundle = getOrbitBundle(index);
  const dividerDone = Boolean(item?.scene?.isCompleted);
  const isTopicUnlocked = isGuest
    ? index === 0
    : Boolean(item?.lessons?.some((lesson) => lesson?.isUnlocked) || item?.scene?.isUnlocked);
  const nextLessonPointer = Number(nextLessonId || 0);
  const nextScenePointer = Number(nextSceneId || 0);

  return (
    <section className={styles.section} style={{ left: `${SECTION_WIDTH * index}px` }}>
      <button
        type="button"
        className={`${styles.topicCard} ${isTopicUnlocked ? "" : styles.topicCardLocked}`}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => onTitleClick(item, !isTopicUnlocked, index)}
      >
        <span className={styles.topicMeta}>{formatCourseBadge(course, index)}</span>
        <span className={styles.topicTitle}>{item?.title || `Topic ${index + 1}`}</span>
      </button>

      <div className={styles.orbitBox}>
        <div className={`${styles.ring} ${styles.ring1}`} />
        <div className={`${styles.ring} ${styles.ring2}`} />
        <div className={`${styles.ring} ${styles.ring3}`} />
        <div className={`${styles.ring} ${styles.ring4}`} />
        <div className={`${styles.ring} ${styles.ring5}`} />

        {layout.decor.map((decor) => (
          <span
            key={`${index}-${decor.left}-${decor.top}`}
            className={styles.decor}
            style={{
              left: `${decor.left}px`,
              top: `${decor.top}px`,
              width: `${decor.size}px`,
              height: `${decor.size}px`,
              background: decor.accent,
            }}
          />
        ))}

        {bundle.lessons.map((lessonImage, lessonIndex) => {
          const lesson = item?.lessons?.[lessonIndex];
          const isUnlocked = isGuest ? index === 0 && lessonIndex === 0 : Boolean(lesson?.isUnlocked);
          const isPassed = Boolean(lesson?.isPassed);
          const lessonLayout = layout.lessons[lessonIndex];
          const lessonImageSrc = isUnlocked ? (bundle.lessonsActive?.[lessonIndex] || lessonImage) : lessonImage;
          const lessonMinSize = Math.min(lessonLayout.width, lessonLayout.height);
          const lessonOrbitInset = Math.max(7, Math.round(lessonMinSize * 0.24));
          const lessonOrbitRadius = Math.max(lessonMinSize / 2, Math.round((lessonMinSize / 2) + (lessonOrbitInset * 0.68)));
          const lessonSatelliteSize = Math.max(8, Math.round(lessonMinSize * 0.22));
          const isNextLesson = Number(lesson?.id || 0) === nextLessonPointer && isUnlocked && !isPassed;

          return (
            <button
              key={`${item?.id || index}-lesson-${lessonIndex + 1}`}
              type="button"
              disabled={!isGuest && !isUnlocked}
              className={`${styles.lessonButton} ${isUnlocked ? styles.lessonButtonOpen : styles.lessonButtonLocked} ${isNextLesson ? styles.lessonButtonTarget : ""}`}
              style={{
                left: `${lessonLayout.left}px`,
                top: `${lessonLayout.top}px`,
                width: `${lessonLayout.width}px`,
                height: `${lessonLayout.height}px`,
              }}
              onMouseDown={(event) => event.stopPropagation()}
              onMouseEnter={() => {
                if (isUnlocked) {
                  onLessonWarm(lesson?.id);
                  onSceneWarmForLesson(item, lesson);
                }
              }}
              onFocus={() => {
                if (isUnlocked) {
                  onLessonWarm(lesson?.id);
                  onSceneWarmForLesson(item, lesson);
                }
              }}
              onClick={() => onLessonClick(item, lesson, !isUnlocked)}
            >
              {isNextLesson ? (
                <span
                  className={styles.lessonTargetOrbit}
                  style={{
                    "--lesson-orbit-inset": `-${lessonOrbitInset}px`,
                    "--lesson-orbit-radius": `${lessonOrbitRadius}px`,
                    "--lesson-satellite-size": `${lessonSatelliteSize}px`,
                    "--lesson-satellite-glow": `${Math.max(16, Math.round(lessonSatelliteSize * 2.5))}px`,
                  }}
                  aria-hidden="true"
                >
                  <span className={styles.lessonTargetSatellite} />
                </span>
              ) : null}
              <img className={styles.lessonImage} src={lessonImageSrc} alt="" aria-hidden="true" />
              {isPassed ? <span className={styles.lessonPassedDot} /> : null}
            </button>
          );
        })}

        <button
          type="button"
          disabled={!isGuest && !item?.scene?.isUnlocked}
          className={`${styles.sunButton} ${item?.scene?.isUnlocked ? styles.sunButtonOpen : styles.sunButtonLocked} ${Number(item?.scene?.id || 0) === nextScenePointer && item?.scene?.isUnlocked && !item?.scene?.isCompleted ? styles.sunButtonTarget : ""}`}
          style={{
            left: `${layout.sun.left}px`,
            top: `${layout.sun.top}px`,
            width: `${layout.sun.width}px`,
            height: `${layout.sun.height}px`,
          }}
          onMouseDown={(event) => event.stopPropagation()}
          onMouseEnter={() => {
            if (item?.scene?.isUnlocked) {
              onSceneWarm(item?.scene);
            }
          }}
          onFocus={() => {
            if (item?.scene?.isUnlocked) {
              onSceneWarm(item?.scene);
            }
          }}
          onClick={() => onSceneSunClick(item, item?.scene, !item?.scene?.isUnlocked)}
        >
          {Number(item?.scene?.id || 0) === nextScenePointer && item?.scene?.isUnlocked && !item?.scene?.isCompleted ? (
            <span
              className={styles.sunTargetGlow}
              style={{
                "--sun-glow-inset": `-${Math.max(12, Math.round(Math.min(layout.sun.width, layout.sun.height) * 0.18))}px`,
                "--sun-glow-blur": `${Math.max(12, Math.round(Math.min(layout.sun.width, layout.sun.height) * 0.12))}px`,
              }}
              aria-hidden="true"
            />
          ) : null}
          <img className={styles.sunImage} src={item?.scene?.isUnlocked ? (bundle.sunActive || bundle.sun) : bundle.sun} alt="" aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className={`${styles.sceneButton} ${isTopicUnlocked ? "" : styles.sceneButtonLockedState}`}
        onMouseDown={(event) => event.stopPropagation()}
        onClick={() => onSceneButtonClick(item, !isTopicUnlocked, index)}
      >
        <img
          className={styles.sceneButtonImage}
          src={HOME_SHARED_ASSETS.sceneButton}
          alt=""
          aria-hidden="true"
        />
      </button>

      {index < 9 ? (
        <div className={styles.sectionDivider}>
          <div className={styles.dividerTop} />
          <div className={styles.dividerIcon}>
            <img src={dividerDone ? HOME_SHARED_ASSETS.unlockedStar : HOME_SHARED_ASSETS.lock} alt="" aria-hidden="true" />
          </div>
          <div className={styles.dividerBottom} />
        </div>
      ) : null}
    </section>
  );
}

function FullPanel({ title, subtitle, onClose, children }) {
  return (
    <div className={styles.panelWrap}>
      <div className={styles.panelCard}>
        <button type="button" className={styles.panelClose} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.panelTitle}>{title}</h2>
        <p className={styles.panelSubtitle}>{subtitle}</p>
        <div className={styles.panelContent}>{children}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageRef = useRef(null);
  const trackRef = useRef(null);
  const dragRef = useRef({ active: false, startX: 0, startLeft: 0 });
  const dropdownRef = useRef(null);
  const scenesRequestRef = useRef(0);
  const loadHomeRequestRef = useRef(0);
  const loadHomeStartedRef = useRef(false);
  const noPublishedCoursesWarningRef = useRef("");

  useStageScale(stageRef, { mode: "absolute" });

  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const location = useLocation();
  const isGuest = isSessionExpired || !authStorage.isAuthed();
  const shouldUseCoursePathCache = true;
  const initialHomeCacheRef = useRef(!isGuest ? applyOptimisticHomeRefresh(getCachedHomeSnapshot(), location.state) : null);
  const [loading, setLoading] = useState(initialHomeCacheRef.current == null);
  const [restoringHearts, setRestoringHearts] = useState(false);
  const initialTab = TAB_QUERY_VIEWS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "learning";
  const [activeNav, setActiveNav] = useState(initialTab === "learning" ? "learning" : initialTab);
  const [bodyView, setBodyView] = useState(initialTab);
  const bodyViewRef = useRef(initialTab);
  const [openDropdown, setOpenDropdown] = useState("");
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [modal, setModal] = useState({ open: false, title: "", message: "", primaryText: "Добре", secondaryText: "", onPrimary: null, onSecondary: null, variant: "default", illustrationSrc: "" });
  const [user, setUser] = useState(initialHomeCacheRef.current?.user || GUEST_USER);
  const [languageState, setLanguageState] = useState(initialHomeCacheRef.current?.languageState || { activeTargetLanguageCode: "", learningLanguages: [] });
  const [supportedLanguages, setSupportedLanguages] = useState(() => getCachedSupportedLanguages());
  const [courses, setCourses] = useState(initialHomeCacheRef.current?.courses || []);
  const [course, setCourse] = useState(initialHomeCacheRef.current?.course || null);
  const [path, setPath] = useState(initialHomeCacheRef.current?.path || null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [scenesOverview, setScenesOverview] = useState([]);
  const [scenePreviewsEnabled, setScenePreviewsEnabled] = useState(false);
  const [calendarDates, setCalendarDates] = useState(initialHomeCacheRef.current?.calendarDates || []);
  const [calendarRegistrationDates, setCalendarRegistrationDates] = useState(initialHomeCacheRef.current?.calendarRegistrationDates || []);
  const [calendarDaysSinceJoined, setCalendarDaysSinceJoined] = useState(Number(initialHomeCacheRef.current?.calendarDaysSinceJoined || 0));
  const [calendarCurrentKyivDateTimeText, setCalendarCurrentKyivDateTimeText] = useState(String(initialHomeCacheRef.current?.calendarCurrentKyivDateTimeText || ""));
  const [calendarMonth, setCalendarMonth] = useState(initialHomeCacheRef.current?.calendarMonth || getKyivCurrentMonth());

  useEffect(() => {
    if (isGuest) {
      return;
    }

    const initialCourseId = Number(initialHomeCacheRef.current?.course?.id || 0);
    const initialLanguageCode = normalizeCode(
      initialHomeCacheRef.current?.course?.languageCode ||
      initialHomeCacheRef.current?.languageState?.activeTargetLanguageCode ||
      ""
    );

    if (!initialCourseId || !initialLanguageCode || !initialHomeCacheRef.current?.path) {
      return;
    }

    setCachedCoursePath(initialLanguageCode, initialCourseId, initialHomeCacheRef.current.path);
  }, [isGuest]);

  const currentTabFromUrl = useMemo(() => {
    const tab = String(new URLSearchParams(location.search).get("tab") || "").trim();

    return TAB_QUERY_VIEWS.includes(tab) ? tab : "";
  }, [location.search]);

  useEffect(() => {
    bodyViewRef.current = bodyView;
  }, [bodyView]);

  useEffect(() => {
    if (!currentTabFromUrl) {
      if (TAB_QUERY_VIEWS.includes(bodyView)) {
        setActiveNav("learning");
        setBodyView("learning");
      }

      return;
    }

    if (activeNav !== currentTabFromUrl) {
      setActiveNav(currentTabFromUrl);
    }

    if (bodyView !== currentTabFromUrl) {
      setBodyView(currentTabFromUrl);
    }
  }, [activeNav, bodyView, currentTabFromUrl]);

  useEffect(() => {
    setScenePreviewsEnabled(bodyView === "scenes");
  }, [bodyView]);

  const topics = useMemo(() => {
    if (path?.topics?.length) {
      return path.topics.slice(0, 10).map((topic, index) => {
        const scene = path.scenes?.find((item) => item?.topicId === topic.id) || {
          id: index + 1,
          order: index + 1,
          title: `Сцена ${index + 1}`,
          isUnlocked: false,
          isCompleted: false,
          unlockReason: "Щоб відкрити сцену, потрібно пройти всі уроки цієї теми.",
        };

        return {
          ...topic,
          scene,
        };
      });
    }

    if (isGuest) {
      return buildGuestTopics();
    }

    return [];
  }, [isGuest, path]);

  const nextPathPointers = useMemo(() => {
    if (isGuest) {
      return {
        nextLessonId: 1,
        nextSceneId: null,
      };
    }

    return path?.nextPointers || getComputedNextPointers(path?.topics, path?.scenes);
  }, [isGuest, path]);


  const lessonPrefetchIds = useMemo(() => {
    if (isGuest || Number(user.hearts || 0) <= 0) {
      return [];
    }

    const ids = [];
    const pushLessonId = (value) => {
      const id = Number(value || 0);

      if (!id || ids.includes(id)) {
        return;
      }

      ids.push(id);
    };

    const activeTopic = topics.find((item) => item?.lessons?.some((lesson) => lesson?.isUnlocked && !lesson?.isPassed))
      || topics.find((item) => item?.lessons?.some((lesson) => lesson?.isUnlocked))
      || null;

    pushLessonId(nextPathPointers?.nextLessonId);

    if (activeTopic) {
      activeTopic.lessons
        .filter((lesson) => lesson?.isUnlocked)
        .forEach((lesson) => pushLessonId(lesson?.id));
    }

    return ids.slice(0, 9);
  }, [isGuest, nextPathPointers?.nextLessonId, topics, user.hearts]);

  const scenePrefetchItems = useMemo(() => {
    if (isGuest) {
      return [];
    }

    const items = [];
    const pushScene = (value) => {
      const id = Number(value?.id || value || 0);

      if (!id || items.some((item) => Number(item?.id || 0) === id)) {
        return;
      }

      const scene = topics.map((topic) => topic?.scene).find((item) => Number(item?.id || 0) === id) || value;

      if (!scene || typeof scene !== "object") {
        return;
      }

      items.push(scene);
    };

    pushScene(nextPathPointers?.nextSceneId);

    topics
      .map((topic) => topic?.scene)
      .filter((scene) => scene?.isUnlocked)
      .forEach((scene) => pushScene(scene));

    return items.slice(0, 4);
  }, [isGuest, nextPathPointers?.nextSceneId, topics]);

  useEffect(() => {
    if (lessonPrefetchIds.length === 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      lessonPrefetchIds.forEach((id) => {
        preloadLessonPack(id).catch(() => {
        });
      });
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [lessonPrefetchIds]);


  useEffect(() => {
    if (scenePrefetchItems.length === 0) {
      return undefined;
    }

    const timerId = window.setTimeout(() => {
      scenePrefetchItems.forEach((scene) => {
        preloadScenePack(scene?.id, { scene }).catch(() => {
        });
      });
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [scenePrefetchItems]);

  useEffect(() => {
    if (isGuest || loading) {
      return undefined;
    }

    preloadVocabularyCache().catch(() => {
    });
    preloadAchievementsCache().catch(() => {
    });
    preloadProfileSnapshot({
      languages: languageState.learningLanguages,
      activeTargetLanguageCode: languageState.activeTargetLanguageCode,
    }).catch(() => {
    });

    return undefined;
  }, [isGuest, languageState.activeTargetLanguageCode, languageState.learningLanguages, loading]);

  useEffect(() => {
    const handleEscClose = (e) => {
      if (e.key !== "Escape") {
        return;
      }

      if (showFullCalendar) {
        setShowFullCalendar(false);
      }

      if (openDropdown) {
        setOpenDropdown("");
      }

      const activeElement = document.activeElement;

      if (activeElement && typeof activeElement.blur === "function") {
        activeElement.blur();
      }
    };

    window.addEventListener("keydown", handleEscClose);

    return () => {
      window.removeEventListener("keydown", handleEscClose);
    };
  }, [openDropdown, showFullCalendar]);

  const guestTargetLanguageCode = normalizeCode(localStorage.getItem("targetLanguage") || "en");
  const activeLanguageCode = normalizeCode(languageState.activeTargetLanguageCode || course?.languageCode || (isGuest ? guestTargetLanguageCode : ""));
  const monthCells = useMemo(() => buildMonth(calendarMonth.year, calendarMonth.month, calendarDates, calendarRegistrationDates), [calendarDates, calendarMonth, calendarRegistrationDates]);
  const streakProgress = useMemo(() => getWeekProgress(user.currentStreakDays), [user.currentStreakDays]);
  const daysInApp = useMemo(() => {
    if (calendarDaysSinceJoined > 0) {
      return calendarDaysSinceJoined;
    }

    if (!user?.createdAt) {
      return 0;
    }

    return getKyivDaysBetween(user.createdAt);
  }, [calendarDaysSinceJoined, user?.createdAt]);
  const energySteps = useMemo(() => Math.max(1, Number(user.heartsMax || 5)), [user.heartsMax]);
  const energyRestoreTimerText = useMemo(() => {
    if (Number(user.hearts || 0) >= Number(user.heartsMax || 0)) {
      return "";
    }

    if (Number(user.nextHeartInSeconds || 0) <= 0) {
      return "";
    }

    return formatDuration(user.nextHeartInSeconds);
  }, [user.hearts, user.heartsMax, user.nextHeartInSeconds]);
  const isFullPanelView = FULL_PANEL_VIEWS.includes(bodyView);
  const isTopBarHidden = TOP_BAR_HIDDEN_VIEWS.includes(bodyView);
  const showBlockingHomeLoading = (loading || restoringHearts) && !["profile", "achievements", "dictionary"].includes(bodyView);

  const languageItems = useMemo(() => {
    if (Array.isArray(languageState.learningLanguages) && languageState.learningLanguages.length > 0) {
      return languageState.learningLanguages;
    }

    return [{ code: activeLanguageCode, title: getLanguageLabel(activeLanguageCode), isActive: true }];
  }, [activeLanguageCode, languageState.learningLanguages]);

  const availableLanguageItems = useMemo(() => {
    const sourceItems = supportedLanguages.length > 0
      ? supportedLanguages
      : Object.entries(LANGUAGE_LABELS).map(([code, title]) => ({ code, title }));

    return [...sourceItems].sort((a, b) => {
      const firstIndex = LANGUAGE_ORDER.indexOf(normalizeCode(a.code));
      const secondIndex = LANGUAGE_ORDER.indexOf(normalizeCode(b.code));
      const safeFirstIndex = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
      const safeSecondIndex = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;

      return safeFirstIndex - safeSecondIndex;
    });
  }, [supportedLanguages]);

  const isLanguageWarningModal = modal.open && modal.variant === "languageWarning";

  const courseItemsForView = useMemo(() => {
    const items = courses.length ? courses : [course].filter(Boolean);

    return [...items].sort((a, b) => Number(a?.order || 0) - Number(b?.order || 0));
  }, [course, courses]);
  const currentCourseForScenes = useMemo(() => {
    const selectedCourseId = Number(course?.id || 0);

    if (selectedCourseId > 0) {
      const existingSelectedCourse = courseItemsForView.find((item) => Number(item?.id || 0) === selectedCourseId);

      if (existingSelectedCourse) {
        return existingSelectedCourse;
      }
    }

    return getPreferredCurrentCourse(courseItemsForView, course);
  }, [course, courseItemsForView]);
  const hasPublishedCoursesForActiveLanguage = courseItemsForView.length > 0;

  useEffect(() => {
    if (isGuest || !currentCourseForScenes?.id || !activeLanguageCode) {
      return undefined;
    }

    const sourceCourses = [currentCourseForScenes].filter(Boolean);
    const cachedScenes = getCachedScenesOverview(activeLanguageCode, sourceCourses);

    if (cachedScenes && cachedScenes.length > 0) {
      warmMediaUrls(cachedScenes.map((item) => item?.previewUrl));
      return undefined;
    }

    let cancelled = false;

    (async () => {
      const responses = await Promise.all(sourceCourses.map((item) => scenesService.getForMe(item?.id)));

      if (cancelled) {
        return;
      }

      const nextScenes = buildScenesOverviewItems(sourceCourses, responses);
      setCachedScenesOverview(activeLanguageCode, sourceCourses, nextScenes);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeLanguageCode, currentCourseForScenes, isGuest]);


  const guestPrompt = useCallback(() => {
    setModal({
      open: true,
      title: "Створіть профіль",
      message: "Щоб відкривати уроки, сцени та зберігати прогрес, потрібно увійти або створити профіль.",
      primaryText: "СТВОРИТИ",
      secondaryText: "ПІЗНІШЕ",
      onPrimary: () => navigate(PATHS.register),
      onSecondary: () => setModal((prev) => ({ ...prev, open: false })),
      variant: "default",
      illustrationSrc: "",
    });
  }, [navigate]);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    if (!isLanguageWarningModal) {
      return undefined;
    }

    const handleModalEscape = (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };

    window.addEventListener("keydown", handleModalEscape);

    return () => {
      window.removeEventListener("keydown", handleModalEscape);
    };
  }, [closeModal, isLanguageWarningModal]);

  const showInfo = useCallback((title, message) => {
    setModal({
      open: true,
      title,
      message,
      primaryText: "Добре",
      secondaryText: "",
      onPrimary: null,
      onSecondary: null,
      variant: "default",
      illustrationSrc: "",
    });
  }, []);

  const showNoPublishedCoursesWarning = useCallback((languageCode) => {
    const languageLabel = getLanguageLabel(languageCode);

    showInfo(
      `Для мови «${languageLabel}» зараз немає опублікованих курсів`,
      "Курс для цієї мови тимчасово знято з публікації або ще не опубліковано. Твій прогрес не видаляється: після повторної публікації він знову відобразиться у проходженні."
    );
  }, [showInfo]);

  const loadHome = useCallback(async (preferredLanguageCode = "", showBlocking = true) => {
    const requestId = loadHomeRequestRef.current + 1;
    loadHomeRequestRef.current = requestId;
    loadHomeStartedRef.current = true;

    if (showBlocking) {
      setLoading(true);
    }

    try {
      const preferred = isGuest
        ? normalizeCode(preferredLanguageCode || localStorage.getItem("targetLanguage") || guestTargetLanguageCode || "en")
        : normalizeCode(preferredLanguageCode || languageState.activeTargetLanguageCode || "");
      onboardingService.getSupportedLanguages().then((supportedRes) => {
        if (supportedRes.ok) {
          const nextSupportedLanguages = Array.isArray(supportedRes.items) ? supportedRes.items : [];
          setSupportedLanguages(nextSupportedLanguages);
          setCachedSupportedLanguages(nextSupportedLanguages);
        }
      });

      if (isGuest) {
        const publicCoursesRes = await coursesService.getPublishedCourses(preferred);
        const publicCourses = publicCoursesRes.items || [];
        const nextCourse = publicCourses[0] || null;
        const todayIso = getKyivTodayIso();
        const currentMonth = getKyivCurrentMonth();

        setCourses(publicCourses);
        setCourse(nextCourse);
        setPath(null);
        setUser(GUEST_USER);
        setCachedHomeSnapshot(null);
        setLanguageState({
          activeTargetLanguageCode: preferred,
          learningLanguages: [{ code: preferred, title: getLanguageLabel(preferred), isActive: true }],
        });
        setCalendarMonth(currentMonth);
        setCalendarDates([todayIso]);
        return { hasCourses: publicCourses.length > 0, activeTargetLanguageCode: preferred };
      }

      const [userRes, languagesRes] = await Promise.all([userService.getMe({ force: true }), onboardingService.getMyLanguages()]);

      if (isAuthExpiredResponse(userRes) || isAuthExpiredResponse(languagesRes)) {
        return { hasCourses: courses.length > 0, activeTargetLanguageCode: preferred };
      }

      const nextUser = normalizeUser(userRes.ok ? userRes.data : null) || GUEST_USER;
      const targetCode = normalizeCode(
        languagesRes?.activeTargetLanguageCode ||
          languagesRes?.data?.activeTargetLanguageCode ||
          nextUser?.targetLanguageCode ||
          preferred ||
          "en"
      );

      setIsSessionExpired(false);
      setUser(nextUser);
      setLanguageState(languagesRes?.ok ? {
        activeTargetLanguageCode: targetCode,
        learningLanguages: languagesRes.learningLanguages || [],
      } : {
        activeTargetLanguageCode: targetCode,
        learningLanguages: [{ code: targetCode, title: getLanguageLabel(targetCode), isActive: true }],
      });

      const myCoursesRes = await coursesService.getMyCourses(targetCode);
      const nextCourses = myCoursesRes.items || [];

      if (nextCourses.length === 0) {
        const availabilityRes = await onboardingService.getLanguageAvailability(targetCode);

        if (loadHomeRequestRef.current !== requestId) {
          return { hasCourses: false, activeTargetLanguageCode: targetCode };
        }

        setCourses([]);
        setCourse(null);
        setPath(null);
        setSelectedTopic(null);
        setSelectedLesson(null);
        setScenesOverview([]);

        if (availabilityRes.ok && !availabilityRes.hasPublishedCourses && noPublishedCoursesWarningRef.current !== targetCode) {
          noPublishedCoursesWarningRef.current = targetCode;
          showNoPublishedCoursesWarning(targetCode);
        }

        setCachedHomeSnapshot({
          user: nextUser,
          languageState: languagesRes?.ok ? {
            activeTargetLanguageCode: targetCode,
            learningLanguages: languagesRes.learningLanguages || [],
          } : {
            activeTargetLanguageCode: targetCode,
            learningLanguages: [{ code: targetCode, title: getLanguageLabel(targetCode), isActive: true }],
          },
          courses: [],
          course: null,
          path: null,
          calendarDates,
          calendarRegistrationDates,
          calendarDaysSinceJoined,
          calendarCurrentKyivDateTimeText,
          calendarMonth,
        });

        return { hasCourses: false, activeTargetLanguageCode: targetCode };
      }

      noPublishedCoursesWarningRef.current = "";

      const activeCourse = getPreferredCurrentCourse(nextCourses, course);
      const cachedPath = activeCourse?.id && shouldUseCoursePathCache
        ? getCachedCoursePath(targetCode, activeCourse.id)
        : null;

      let nextPathForCache = cachedPath;

      if (activeCourse?.id && !cachedPath) {
        const pathRes = await learningService.getMyCoursePath(activeCourse.id);

        if (loadHomeRequestRef.current !== requestId) {
          return { hasCourses: nextCourses.length > 0, activeTargetLanguageCode: targetCode };
        }

        if (pathRes?.ok) {
          nextPathForCache = normalizeCoursePath(pathRes.data);
          setCachedCoursePath(targetCode, activeCourse.id, nextPathForCache);
        }
      }

      setCourses(nextCourses);
      setCourse(activeCourse);
      setPath(nextPathForCache);
      setCachedHomeSnapshot({
        user: nextUser,
        languageState: languagesRes?.ok ? {
          activeTargetLanguageCode: targetCode,
          learningLanguages: languagesRes.learningLanguages || [],
        } : {
          activeTargetLanguageCode: targetCode,
          learningLanguages: [{ code: targetCode, title: getLanguageLabel(targetCode), isActive: true }],
        },
        courses: nextCourses,
        course: activeCourse,
        path: nextPathForCache,
        calendarDates,
        calendarRegistrationDates,
        calendarDaysSinceJoined,
        calendarCurrentKyivDateTimeText,
        calendarMonth,
      });
      setLoading(false);

      const backgroundRequests = [
        streakService.getMyStreak(),
        streakService.getMyCalendarMonth(calendarMonth.year, calendarMonth.month),
      ];

      if (activeCourse?.id && cachedPath) {
        backgroundRequests.unshift(learningService.getMyCoursePath(activeCourse.id));
      }

      Promise.all(backgroundRequests).then((responses) => {
        if (loadHomeRequestRef.current !== requestId) {
          return;
        }

        const hasPathResponse = Boolean(activeCourse?.id && cachedPath);
        const pathRes = hasPathResponse ? responses[0] : null;
        const streakRes = responses[hasPathResponse ? 1 : 0];
        const calendarRes = responses[hasPathResponse ? 2 : 1];

        let nextPathForCacheForBackground = nextPathForCache;
        let nextUserForCache = nextUser;
        let nextCalendarDatesForCache = calendarDates;
        let nextCalendarRegistrationDatesForCache = calendarRegistrationDates;
        let nextCalendarDaysSinceJoinedForCache = calendarDaysSinceJoined;
        let nextCalendarCurrentKyivDateTimeTextForCache = calendarCurrentKyivDateTimeText;

        if (pathRes?.ok) {
          const normalizedPath = normalizeCoursePath(pathRes.data);
          setPath(normalizedPath);
          setCachedCoursePath(targetCode, activeCourse.id, normalizedPath);
          nextPathForCacheForBackground = normalizedPath;
        }

        if (streakRes?.ok && streakRes.data) {
          nextUserForCache = {
            ...nextUserForCache,
            currentStreakDays: streakRes.data.currentStreakDays ?? nextUserForCache.currentStreakDays,
            bestStreakDays: streakRes.data.bestStreakDays ?? nextUserForCache.bestStreakDays,
          };

          setUser((prev) => ({
            ...prev,
            currentStreakDays: streakRes.data.currentStreakDays ?? prev.currentStreakDays,
            bestStreakDays: streakRes.data.bestStreakDays ?? prev.bestStreakDays,
          }));
        }

        if (calendarRes?.ok) {
          const calendarPayload = extractCalendarPayload(calendarRes.data);
          nextCalendarDatesForCache = calendarPayload.activeDates;
          nextCalendarRegistrationDatesForCache = calendarPayload.registrationDates;
          nextCalendarDaysSinceJoinedForCache = calendarPayload.daysSinceJoined;
          nextCalendarCurrentKyivDateTimeTextForCache = calendarPayload.currentKyivDateTimeText;
          setCalendarDates(nextCalendarDatesForCache);
          setCalendarRegistrationDates(nextCalendarRegistrationDatesForCache);
          setCalendarDaysSinceJoined(nextCalendarDaysSinceJoinedForCache);
          setCalendarCurrentKyivDateTimeText(nextCalendarCurrentKyivDateTimeTextForCache);
          setCachedCalendarMonth(calendarMonth.year, calendarMonth.month, calendarPayload);
        }

        setCachedHomeSnapshot({
          user: nextUserForCache,
          languageState: languagesRes?.ok ? {
            activeTargetLanguageCode: targetCode,
            learningLanguages: languagesRes.learningLanguages || [],
          } : {
            activeTargetLanguageCode: targetCode,
            learningLanguages: [{ code: targetCode, title: getLanguageLabel(targetCode), isActive: true }],
          },
          courses: nextCourses,
          course: activeCourse,
          path: nextPathForCacheForBackground,
          calendarDates: nextCalendarDatesForCache,
          calendarRegistrationDates: nextCalendarRegistrationDatesForCache,
          calendarDaysSinceJoined: nextCalendarDaysSinceJoinedForCache,
          calendarCurrentKyivDateTimeText: nextCalendarCurrentKyivDateTimeTextForCache,
          calendarMonth,
        });
      });

      return { hasCourses: nextCourses.length > 0, activeTargetLanguageCode: targetCode };
    } finally {
      if (loadHomeRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [calendarCurrentKyivDateTimeText, calendarMonth.month, calendarMonth.year, courses.length, guestTargetLanguageCode, isGuest, languageState.activeTargetLanguageCode, shouldUseCoursePathCache, showNoPublishedCoursesWarning]);

  useEffect(() => {
    const hasCache = initialHomeCacheRef.current != null;

    if (loadHomeStartedRef.current && !hasCache) {
      return;
    }

    loadHome("", !hasCache);
  }, [loadHome]);

  useEffect(() => {
    let currentKyivDate = getKyivTodayIso();

    const intervalId = window.setInterval(() => {
      const nextKyivDate = getKyivTodayIso();

      if (nextKyivDate === currentKyivDate) {
        return;
      }

      currentKyivDate = nextKyivDate;
      const currentMonth = getKyivCurrentMonth();
      const hasMonthChanged = calendarMonth.year !== currentMonth.year || calendarMonth.month !== currentMonth.month;

      if (hasMonthChanged) {
        setCalendarMonth(currentMonth);
        return;
      }

      loadHome("", false);
    }, 60000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadHome]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current) return;
      if (dropdownRef.current.contains(event.target)) return;
      setOpenDropdown("");
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (Number(user.hearts || 0) >= Number(user.heartsMax || 0)) {
      return undefined;
    }

    if (Number(user.nextHeartInSeconds || 0) <= 0) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setUser((prev) => {
        const currentHearts = Number(prev.hearts || 0);
        const maxHearts = Number(prev.heartsMax || 0);
        const nextHeartInSeconds = Math.max(0, Number(prev.nextHeartInSeconds || 0));

        if (currentHearts >= maxHearts || nextHeartInSeconds <= 0) {
          return prev;
        }

        if (nextHeartInSeconds === 1) {
          const restoredHearts = Math.min(maxHearts, currentHearts + 1);
          const hasMoreHeartsToRestore = restoredHearts < maxHearts;

          return {
            ...prev,
            hearts: restoredHearts,
            nextHeartInSeconds: hasMoreHeartsToRestore ? Math.max(1, Number(prev.heartRegenMinutes || 0)) * 60 : 0,
          };
        }

        return {
          ...prev,
          nextHeartInSeconds: nextHeartInSeconds - 1,
        };
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [user.hearts, user.heartsMax, user.heartRegenMinutes, user.nextHeartInSeconds]);

  const handleLanguageSwitch = useCallback(async (code) => {
    const nextCode = normalizeCode(code);

    if (!nextCode) return;

    if (isGuest) {
      guestPrompt();
      return;
    }

    if (nextCode === activeLanguageCode) {
      closeModal();
      setOpenDropdown("");
      setBodyView("learning");
      return;
    }

    closeModal();
    setLoading(true);

    try {
      const availableCoursesRes = await coursesService.getPublishedCourses(nextCode);
      const availableCourses = availableCoursesRes.items || [];

      if (!availableCourses.length) {
        showInfo("Для цієї мови поки немає курсів", "Цю мову поки не можна обрати, тому що для неї ще немає наповнення курсами.");
        return;
      }

      const res = await onboardingService.updateMyTargetLanguage(nextCode);

      if (!res.ok) {
        showInfo("Не вдалося змінити мову", res.error || "Спробуй ще раз трохи пізніше.");
        return;
      }

      setOpenDropdown("");
      setBodyView("learning");
      localStorage.setItem("targetLanguage", nextCode);
      await loadHome(nextCode);
    } finally {
      setLoading(false);
    }
  }, [activeLanguageCode, closeModal, guestPrompt, isGuest, loadHome, showInfo]);

  const handleLanguageCardClick = useCallback((code) => {
    const nextCode = normalizeCode(code);

    if (!nextCode || nextCode === activeLanguageCode) {
      return;
    }

    setModal({
      open: true,
      title: "Хочете закінчити\nвивчати цю мову?",
      message: "",
      primaryText: "ТАК",
      secondaryText: "НІ",
      onPrimary: () => handleLanguageSwitch(nextCode),
      onSecondary: () => setModal((prev) => ({ ...prev, open: false })),
      variant: "default",
      illustrationSrc: "",
    });
  }, [activeLanguageCode, handleLanguageSwitch]);

  const handleFullRestoreHearts = useCallback(async () => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const heartsToRestore = Math.max(0, Number(user.heartsMax || 0) - Number(user.hearts || 0));

    if (!heartsToRestore) {
      showInfo("Енергія повна", "У тебе вже повністю відновлена енергія.");
      return;
    }

    const neededCrystals = heartsToRestore * Number(user.crystalCostPerHeart || 0);

    if (Number(user.crystals || 0) < neededCrystals) {
      showInfo("Недостатньо кристалів", "У тебе недостатньо кристалів, щоб відновити енергію.");
      return;
    }

    setRestoringHearts(true);

    try {
      const res = await userService.restoreHearts(heartsToRestore);

      if (!res.ok) {
        showInfo("Не вдалося відновити енергію", res.error || "Спробуй ще раз трохи пізніше.");
        return;
      }

      setUser((prev) => ({
        ...prev,
        hearts: res.data?.hearts ?? res.data?.heartsCount ?? prev.hearts,
        heartsMax: res.data?.heartsMax ?? res.data?.maxHearts ?? prev.heartsMax,
        crystals: res.data?.crystals ?? res.data?.crystalsCount ?? prev.crystals,
        heartRegenMinutes: res.data?.heartRegenMinutes ?? prev.heartRegenMinutes,
        crystalCostPerHeart: res.data?.crystalCostPerHeart ?? prev.crystalCostPerHeart,
        nextHeartInSeconds: res.data?.nextHeartInSeconds ?? prev.nextHeartInSeconds,
      }));
      setOpenDropdown("");
    } finally {
      setRestoringHearts(false);
    }
  }, [guestPrompt, isGuest, showInfo, user.crystalCostPerHeart, user.crystals, user.hearts, user.heartsMax]);

  const handleRestoreOneHeart = useCallback(async () => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    if (Number(user.hearts || 0) >= Number(user.heartsMax || 0)) {
      showInfo("Енергія повна", "Тобі зараз не потрібно відновлювати ще одну енергію.");
      return;
    }

    const neededCrystals = Number(user.crystalCostPerHeart || 0);

    if (Number(user.crystals || 0) < neededCrystals) {
      showInfo("Недостатньо кристалів", "У тебе недостатньо кристалів, щоб додати ще одну енергію.");
      return;
    }

    setRestoringHearts(true);

    try {
      const res = await userService.restoreHearts(1);

      if (!res.ok) {
        showInfo("Не вдалося додати +1", res.error || "Спробуй ще раз трохи пізніше.");
        return;
      }

      setUser((prev) => ({
        ...prev,
        hearts: res.data?.hearts ?? res.data?.heartsCount ?? prev.hearts,
        heartsMax: res.data?.heartsMax ?? res.data?.maxHearts ?? prev.heartsMax,
        crystals: res.data?.crystals ?? res.data?.crystalsCount ?? prev.crystals,
        heartRegenMinutes: res.data?.heartRegenMinutes ?? prev.heartRegenMinutes,
        crystalCostPerHeart: res.data?.crystalCostPerHeart ?? prev.crystalCostPerHeart,
        nextHeartInSeconds: res.data?.nextHeartInSeconds ?? prev.nextHeartInSeconds,
      }));
      setOpenDropdown("");
    } finally {
      setRestoringHearts(false);
    }
  }, [guestPrompt, isGuest, showInfo, user.crystalCostPerHeart, user.crystals, user.hearts, user.heartsMax]);

  const syncHomeTab = useCallback((key) => {
    const nextTab = TAB_QUERY_VIEWS.includes(key) ? key : "";
    const nextBodyView = nextTab || "learning";

    setActiveNav(nextBodyView);
    setBodyView(nextBodyView);
    setOpenDropdown("");
    setShowFullCalendar(false);

    if (currentTabFromUrl === nextTab) {
      return;
    }

    if (nextTab) {
      setSearchParams({ tab: nextTab }, { replace: true });
      return;
    }

    setSearchParams({}, { replace: true });
  }, [currentTabFromUrl, setSearchParams]);

  const handleNavClick = useCallback((key) => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    syncHomeTab(key);
  }, [guestPrompt, isGuest, syncHomeTab]);

  const handleCourseSelect = useCallback((item) => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    if (item?.isLocked) {
      showInfo("Курс закритий", "Цей курс відкриється після повного проходження попереднього курсу.");
      return;
    }

    setCourse(item || null);
    setSelectedTopic(null);
    setSelectedLesson(null);
    setOpenDropdown("");
    setBodyView("learning");

    if (!item?.id) {
      setPath(null);
      return;
    }

    const targetCode = normalizeCode(item?.languageCode || activeLanguageCode || languageState.activeTargetLanguageCode || "");
    const cachedPath = getCachedCoursePath(targetCode, item.id);

    setPath(cachedPath);

    learningService.getMyCoursePath(item.id).then((pathRes) => {
      if (pathRes.ok) {
        const normalizedPath = normalizeCoursePath(pathRes.data);
        setPath(normalizedPath);
        setCachedCoursePath(targetCode, item.id, normalizedPath);
        return;
      }

      if (!cachedPath) {
        setPath(null);
      }
    });
  }, [activeLanguageCode, guestPrompt, isGuest, languageState.activeTargetLanguageCode, showInfo]);

  const loadScenesOverview = useCallback(async () => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    const requestId = scenesRequestRef.current + 1;
    scenesRequestRef.current = requestId;

    const sourceCourses = [currentCourseForScenes].filter(Boolean);

    if (!sourceCourses.length) {
      setScenesOverview([]);
      setSelectedTopic(null);
      setOpenDropdown("");
      setBodyView("scenes");
      return;
    }

    const cachedScenes = mergeScenesOverviewWithPath(getCachedScenesOverview(activeLanguageCode, sourceCourses), path);
    const fallbackScenes = buildScenesOverviewFallback(sourceCourses, path);
    const initialScenes = cachedScenes && cachedScenes.length > 0 ? cachedScenes : fallbackScenes;

    setSelectedTopic(null);
    setOpenDropdown("");
    setBodyView("scenes");

    if (initialScenes.length > 0) {
      setScenesOverview(initialScenes);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const responses = await Promise.all(sourceCourses.map((item) => scenesService.getForMe(item?.id)));
      const nextScenes = mergeScenesOverviewWithPath(buildScenesOverviewItems(sourceCourses, responses), path);

      if (scenesRequestRef.current !== requestId) {
        return;
      }

      setScenesOverview(nextScenes);
      setCachedScenesOverview(activeLanguageCode, sourceCourses, nextScenes);

      if (bodyViewRef.current !== "scenes") {
        return;
      }
    } finally {
      if (scenesRequestRef.current === requestId) {
        setLoading(false);
      }
    }
  }, [activeLanguageCode, currentCourseForScenes, guestPrompt, isGuest, path]);

  const handleTitleClick = useCallback((topic, disabled = false, index = 0) => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    if (disabled) {
      setModal({
        open: true,
        title: "",
        message: getTopicLockedMessage(topic, index),
        primaryText: "",
        secondaryText: "",
        onPrimary: null,
        onSecondary: null,
        variant: "sceneLocked",
        illustrationSrc: MascotModal,
      });
      return;
    }

    setSelectedTopic(topic || null);
    setBodyView("courses");
    setOpenDropdown("");
  }, [guestPrompt, isGuest]);

  const handleSceneButtonClick = useCallback((topic, disabled = false, index = 0) => {
    if (disabled) {
      setModal({
        open: true,
        title: "",
        message: getTopicLockedMessage(topic, index),
        primaryText: "",
        secondaryText: "",
        onPrimary: null,
        onSecondary: null,
        variant: "sceneLocked",
        illustrationSrc: MascotModal,
      });
      return;
    }

    loadScenesOverview();
  }, [loadScenesOverview]);

  const warmLessonPack = useCallback((lessonId) => {
    preloadLessonPack(lessonId).catch(() => {
    });
  }, []);

  const warmScenePack = useCallback((scene) => {
    preloadScenePack(scene?.id, { scene }).catch(() => {
    });
  }, []);

  const warmSceneForLastLesson = useCallback((topic, lesson) => {
    const lessons = Array.isArray(topic?.lessons) ? topic.lessons : [];
    const lessonId = Number(lesson?.id || 0);

    if (!lessonId || lessons.length === 0) {
      return;
    }

    const lessonIndex = lessons.findIndex((item) => Number(item?.id || 0) === lessonId);

    if (lessonIndex === -1 || lessonIndex !== lessons.length - 1) {
      return;
    }

    const scene = topic?.scene;

    if (!scene?.id) {
      return;
    }

    preloadScenePack(scene.id, { scene }).catch(() => {
    });
  }, []);

  const openScene = useCallback(async (topic, scene) => {
    if (!getCachedScenePack(scene?.id)) {
      const preloadRequest = preloadScenePack(scene?.id, { scene }).catch(() => null);

      await Promise.race([
        preloadRequest,
        new Promise((resolve) => {
          window.setTimeout(resolve, 260);
        }),
      ]);
    }

    navigate(PATHS.scene(scene?.id), {
      state: {
        topic,
        scene,
      },
    });
  }, [navigate]);

  const handleSceneSunClick = useCallback(async (topic, scene, disabled) => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    if (disabled) {
      setModal({
        open: true,
        title: "",
        message: getSceneLockedMessage(scene),
        primaryText: "",
        secondaryText: "",
        onPrimary: null,
        onSecondary: null,
        variant: "sceneLocked",
        illustrationSrc: MascotModal,
      });
      return;
    }

    warmScenePack(scene);
    await openScene(topic, scene);
  }, [guestPrompt, isGuest, openScene, warmScenePack]);

  const handleLessonClick = useCallback(async (topic, lesson, disabled) => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    if (disabled) {
      showInfo("Урок закритий", "Щоб відкрити цей урок, потрібно повністю пройти попередній урок із 9 вправами.");
      return;
    }

    if (Number(user.hearts || 0) <= 0) {
      showInfo("Енергія закінчилась", "Щоб почати урок, спочатку віднови енергію.");
      return;
    }

    warmSceneForLastLesson(topic, lesson);

    if (!getCachedLessonPack(lesson?.id)) {
      const preloadRequest = preloadLessonPack(lesson?.id).catch(() => null);

      await Promise.race([
        preloadRequest,
        new Promise((resolve) => {
          window.setTimeout(resolve, 120);
        }),
      ]);
    }

    navigate(PATHS.lesson(lesson?.id), {
      state: {
        topic,
        lesson,
      },
    });
  }, [guestPrompt, isGuest, navigate, showInfo, user.hearts, warmSceneForLastLesson]);

  const handleTrackMouseDown = useCallback((event) => {
    const track = trackRef.current;
    if (!track) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startLeft: track.scrollLeft,
    };

    track.classList.add(styles.dragging);
  }, []);

  const handleTrackMouseMove = useCallback((event) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.active) return;

    const dx = event.clientX - dragRef.current.startX;
    track.scrollLeft = dragRef.current.startLeft - dx;
  }, []);

  const handleTrackMouseUp = useCallback(() => {
    const track = trackRef.current;
    dragRef.current.active = false;
    if (track) {
      track.classList.remove(styles.dragging);
    }
  }, []);

  const handleOpenFullCalendar = useCallback(async () => {
    if (isGuest) {
      guestPrompt();
      return;
    }

    setShowFullCalendar(true);
    setOpenDropdown("");

    const cachedCalendarPayload = getCachedCalendarMonth(calendarMonth.year, calendarMonth.month);

    if (cachedCalendarPayload) {
      setCalendarDates(cachedCalendarPayload.activeDates);
      setCalendarRegistrationDates(cachedCalendarPayload.registrationDates);
      setCalendarDaysSinceJoined(cachedCalendarPayload.daysSinceJoined);
      setCalendarCurrentKyivDateTimeText(cachedCalendarPayload.currentKyivDateTimeText);
    }

    const res = await streakService.getMyCalendarMonth(calendarMonth.year, calendarMonth.month);

    if (res.ok) {
      const calendarPayload = extractCalendarPayload(res.data);
      setCalendarDates(calendarPayload.activeDates);
      setCalendarRegistrationDates(calendarPayload.registrationDates);
      setCalendarDaysSinceJoined(calendarPayload.daysSinceJoined);
      setCalendarCurrentKyivDateTimeText(calendarPayload.currentKyivDateTimeText);
      setCachedCalendarMonth(calendarMonth.year, calendarMonth.month, calendarPayload);
    }
  }, [calendarMonth.month, calendarMonth.year, guestPrompt, isGuest]);

  const handleChangeCalendarMonth = useCallback(async (direction) => {
    const current = new Date(calendarMonth.year, calendarMonth.month - 1, 1);
    current.setMonth(current.getMonth() + direction);
    const next = { year: current.getFullYear(), month: current.getMonth() + 1 };
    setCalendarMonth(next);

    if (isGuest) {
      return;
    }

    const cachedCalendarPayload = getCachedCalendarMonth(next.year, next.month);

    if (cachedCalendarPayload) {
      setCalendarDates(cachedCalendarPayload.activeDates);
      setCalendarRegistrationDates(cachedCalendarPayload.registrationDates);
      setCalendarDaysSinceJoined(cachedCalendarPayload.daysSinceJoined);
      setCalendarCurrentKyivDateTimeText(cachedCalendarPayload.currentKyivDateTimeText);
    }

    const res = await streakService.getMyCalendarMonth(next.year, next.month);

    if (res.ok) {
      const calendarPayload = extractCalendarPayload(res.data);
      setCalendarDates(calendarPayload.activeDates);
      setCalendarRegistrationDates(calendarPayload.registrationDates);
      setCalendarDaysSinceJoined(calendarPayload.daysSinceJoined);
      setCalendarCurrentKyivDateTimeText(calendarPayload.currentKyivDateTimeText);
      setCachedCalendarMonth(next.year, next.month, calendarPayload);
    }
  }, [calendarMonth.month, calendarMonth.year, isGuest]);

  const renderNoPublishedCoursesState = (title, message) => (
    <div className={styles.emptyCoursesStateWrap}>
      <div className={styles.emptyCoursesStateCard}>
        <div className={styles.emptyCoursesStateTitle}>{title}</div>
        <div className={styles.emptyCoursesStateText}>{message}</div>
      </div>
    </div>
  );

  const renderLearningView = () => (
    <div
      ref={trackRef}
      className={styles.learningTrackViewport}
      onMouseDown={handleTrackMouseDown}
      onMouseMove={handleTrackMouseMove}
      onMouseUp={handleTrackMouseUp}
      onMouseLeave={handleTrackMouseUp}
    >
      {hasPublishedCoursesForActiveLanguage ? (
        <div className={styles.learningTrack}>
          {topics.map((item, index) => (
            <OrbitSection
              key={item.id || index}
              item={item}
              index={index}
              course={course}
              isGuest={isGuest}
              nextLessonId={nextPathPointers?.nextLessonId}
              nextSceneId={nextPathPointers?.nextSceneId}
              onTitleClick={handleTitleClick}
              onSceneButtonClick={handleSceneButtonClick}
              onSceneSunClick={handleSceneSunClick}
              onLessonClick={handleLessonClick}
              onLessonWarm={warmLessonPack}
              onSceneWarm={warmScenePack}
              onSceneWarmForLesson={warmSceneForLastLesson}
            />
          ))}
        </div>
      ) : renderNoPublishedCoursesState(
        "Для цієї мови зараз немає опублікованих курсів",
        "Коли курс знову опублікують, твій збережений прогрес повернеться автоматично. Поки що можна обрати іншу мову у профілі або через кнопку мови зверху."
      )}
    </div>
  );

  const renderCoursesView = () => (
    <div className={styles.coursesPage}>
      <button type="button" className={styles.coursesBackButton} onClick={() => setBodyView("learning")}>
        <img src={ArrowPrevious} alt="Назад" />
      </button>

      <div className={styles.coursesDivider} />

      <div className={styles.coursesListWrap}>
        {hasPublishedCoursesForActiveLanguage ? (
          <div className={styles.coursesList}>
            {courseItemsForView.map((item, index) => {
              const isSelectedCourse = Number(item?.id || 0) === Number(course?.id || 0);
              const isUnlocked = isGuest ? index === 0 : !item?.isLocked;
              const progressPercent = getCourseProgressPercent(item, path, isSelectedCourse);

              return (
                <button
                  key={item?.id || `${getCourseLevel(item)}-${index}`}
                  type="button"
                  className={styles.courseStageCard}
                  onClick={() => handleCourseSelect(item)}
                >
                  <div className={styles.courseStageLevel}>{getCourseLevel(item)}</div>

                  <div className={styles.courseStageTrack}>
                    <div className={styles.courseStageTrackBase} />
                    <div className={styles.courseStageTrackFill} style={{ width: `${progressPercent}%` }} />
                    {!isUnlocked ? <div className={styles.courseStageTrackCutout} /> : null}
                  </div>

                  <img
                    className={`${styles.courseStageIcon} ${isUnlocked ? styles.courseStageIconProgress : styles.courseStageIconLock}`}
                    src={isUnlocked ? ProgressTrackIcon : HOME_SHARED_ASSETS.lock}
                    alt=""
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        ) : renderNoPublishedCoursesState(
          "Список курсів поки порожній",
          "Для вибраної мови зараз немає жодного опублікованого курсу. Прогрес за раніше пройденими курсами збережений і знову з’явиться після повторної публікації."
        )}
      </div>
    </div>
  );

  const renderLanguagesView = () => (
    <div className={styles.languagePage}>
      <button type="button" className={styles.languageBackButton} onClick={() => setBodyView("learning")}>
        <img src={ArrowPrevious} alt="Назад" />
      </button>

      <div className={styles.languagePageHeader}>
        <h1 className={styles.languagePageTitle}>Вибір мови для вивчення</h1>
        <div className={styles.languagePageDivider} />
      </div>

      <div className={styles.languagePageGrid}>
        {availableLanguageItems.map((item) => {
          const code = normalizeCode(item.code);
          const isActive = code === activeLanguageCode;

          return (
            <button
              key={code}
              type="button"
              className={`${styles.languagePageCard} ${isActive ? styles.languagePageCardActive : ""}`}
              onClick={() => handleLanguageCardClick(code)}
            >
              {isActive ? (
                <span className={styles.languagePageCheckBadge} aria-hidden="true">
                  <span className={styles.languagePageCheckBadgeInner}>
                    <svg viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.5 8.5L7.4 13L17.5 3" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </span>
              ) : null}

              <img className={styles.languagePageFlag} src={getFlagByCode(code)} alt="" aria-hidden="true" />
              <span className={styles.languagePageCardLabel}>{getLanguageLabel(code)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderScenesView = () => (
    <div className={styles.scenesPage}>
      <button type="button" className={styles.scenesBackButton} onClick={() => setBodyView("learning")}>
        <img src={ArrowPrevious} alt="Назад" />
      </button>

      <div className={styles.scenesPageHeader}>
        <h1 className={styles.scenesPageTitle}>Сцени</h1>
        <div className={styles.scenesPageDivider} />
      </div>

      <div className={styles.scenesGridWrap}>
        {hasPublishedCoursesForActiveLanguage ? (
          <div className={styles.scenesGrid}>
            {scenesOverview.map((scene, index) => {
              const locked = !scene?.isUnlocked;
              const shouldRenderPreviewImage = scenePreviewsEnabled && !locked && scene?.previewUrl;

              return (
                <button
                  key={scene.key || scene.id || index}
                  type="button"
                  className={`${styles.scenesCard} ${locked ? styles.scenesCardLocked : styles.scenesCardOpen}`}
                  onMouseEnter={() => {
                    if (!locked) {
                      warmScenePack(scene);
                    }
                  }}
                  onFocus={() => {
                    if (!locked) {
                      warmScenePack(scene);
                    }
                  }}
                  onClick={() => {
                    if (locked) {
                      setModal({
                        open: true,
                        title: "",
                        message: getSceneLockedMessage(scene),
                        primaryText: "",
                        secondaryText: "",
                        onPrimary: null,
                        onSecondary: null,
                        variant: "sceneLocked",
                        illustrationSrc: MascotModal,
                      });
                      return;
                    }

                    warmScenePack(scene);
                    openScene(null, scene);
                  }}
                >
                  <span className={`${styles.scenesCardPreview} ${locked ? styles.scenesCardPreviewLocked : styles.scenesCardPreviewOpen}`}>
                    {shouldRenderPreviewImage ? (
                      <img
                        className={styles.scenesCardPreviewImage}
                        src={scene.previewUrl}
                        alt=""
                        aria-hidden="true"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                  </span>
                  <span className={styles.scenesCardLabel}>{getSceneCardLabel(scene, index)}</span>
                </button>
              );
            })}
          </div>
        ) : renderNoPublishedCoursesState(
          "Сцени тимчасово недоступні",
          "Для вибраної мови зараз немає опублікованих курсів, тому і сцени не відображаються. Після повторної публікації все повернеться разом із твоїм прогресом."
        )}
      </div>

      <div className={styles.scenesBottomDivider} />
    </div>
  );

  const renderLessonView = () => (
    <FullPanel
      title={selectedLesson?.title || "Урок"}
      subtitle="Тут поки що стоїть заглушка під окрему сторінку уроку з 3 типами вправ та хрестиком зверху зліва."
      onClose={() => setBodyView("learning")}
    >
      <div className={styles.lessonStubGrid}>
        <div className={styles.lessonStubCard}>Вправа 1 — словникова</div>
        <div className={styles.lessonStubCard}>Вправа 2 — вибір правильної відповіді</div>
        <div className={styles.lessonStubCard}>Вправа 3 — складання речення</div>
      </div>
      <div className={styles.lessonStubHint}>
        У кожному уроці буде 9 вправ: по 3 різні типи, які повторюються всередині обраного уроку.
      </div>
    </FullPanel>
  );

  const renderStubView = (title, subtitle) => (
    <FullPanel title={title} subtitle={subtitle} onClose={() => { setActiveNav("learning"); setBodyView("learning"); }}>
      <div className={styles.stubText}>Тут підключимо цей розділ на наступних етапах, не ламаючи готову Home-сторінку.</div>
    </FullPanel>
  );

  const renderBody = () => {
    if (bodyView === "achievements") {
      return <AchievementsContent />;
    }

    if (bodyView === "dictionary") {
      return <VocabularyContent />;
    }

    if (bodyView === "profile") {
      return <ProfileContent onProfileChange={(nextProfile) => {
        setUser((prev) => ({
          ...prev,
          hearts: Number(nextProfile?.hearts ?? nextProfile?.heartsCount ?? prev.hearts ?? 0),
          heartsMax: Number(nextProfile?.heartsMax ?? nextProfile?.maxHearts ?? prev.heartsMax ?? 5),
          crystals: Number(nextProfile?.crystals ?? nextProfile?.crystalsCount ?? prev.crystals ?? 0),
          currentStreakDays: Number(nextProfile?.currentStreakDays ?? prev.currentStreakDays ?? 0),
          bestStreakDays: Number(nextProfile?.bestStreakDays ?? prev.bestStreakDays ?? 0),
          heartRegenMinutes: Number(nextProfile?.heartRegenMinutes ?? prev.heartRegenMinutes ?? 0),
          crystalCostPerHeart: Number(nextProfile?.crystalCostPerHeart ?? prev.crystalCostPerHeart ?? 0),
          nextHeartInSeconds: Number(nextProfile?.nextHeartInSeconds ?? prev.nextHeartInSeconds ?? 0),
        }));
      }} />;
    }

    if (bodyView === "languages") {
      return renderLanguagesView();
    }

    if (bodyView === "courses") {
      return renderCoursesView();
    }

    if (bodyView === "scenes") {
      return renderScenesView();
    }

    if (bodyView === "lesson") {
      return renderLessonView();
    }

    return renderLearningView();
  };

  return (
    <div className={styles.viewport}>
      <GlassLoading open={showBlockingHomeLoading} text={restoringHearts ? "Відновлюємо енергію..." : "Завантажуємо Home..."} stageTargetId="lumino-home-stage" />
      {!isLanguageWarningModal ? (
        <GlassModal
          open={modal.open}
          title={modal.title}
          message={modal.message}
          onClose={closeModal}
          primaryText={modal.primaryText}
          secondaryText={modal.secondaryText}
          onPrimary={modal.onPrimary}
          onSecondary={modal.onSecondary}
          variant={modal.variant || (bodyView === "languages" ? "languageWarning" : "default")}
          illustrationSrc={modal.illustrationSrc}
          stageTargetId="lumino-home-stage"
        />
      ) : null}

      <div id="lumino-home-stage" ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={HOME_BG_LEFT} alt="" aria-hidden="true" />

        <aside className={styles.sidebar}>
          <div className={styles.logo}>LUMINO</div>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item) => {
              const active = activeNav === item.key;

              return (
                <button
                  key={item.key}
                  type="button"
                  className={`${styles.navButton} ${active ? styles.navButtonActive : ""}`}
                  onClick={() => handleNavClick(item.key)}
                >
                  <NavIcon type={item.key} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {isLanguageWarningModal && stageRef.current ? createPortal(
          <div className={styles.homeWarningOverlay}>
            <div className={styles.homeWarningBackdrop} role="presentation" />
            <div className={styles.homeWarningModal} role="dialog" aria-modal="true" aria-labelledby="home-warning-title" onClick={(e) => e.stopPropagation()}>
              <button type="button" className={styles.homeWarningClose} onClick={closeModal} aria-label="Закрити" />

              <div className={styles.homeWarningContentBox}>
                <h2 id="home-warning-title" className={styles.homeWarningTitle}>{modal.title}</h2>
              </div>

              <div className={styles.homeWarningActions}>
                <button type="button" className={`${styles.homeWarningButton} ${styles.homeWarningButtonLight}`} onClick={modal.onPrimary || closeModal}>
                  {String(modal.primaryText || "").toUpperCase()}
                </button>

                {modal.secondaryText ? (
                  <button type="button" className={`${styles.homeWarningButton} ${styles.homeWarningButtonDark}`} onClick={modal.onSecondary || closeModal}>
                    {String(modal.secondaryText || "").toUpperCase()}
                  </button>
                ) : null}
              </div>
            </div>
          </div>,
          stageRef.current
        ) : null}

        <div className={styles.sidebarDivider} />

        {!isTopBarHidden ? (
          <div ref={dropdownRef} className={styles.topBar}>
            <button
              type="button"
              className={styles.flagButton}
              style={{ left: `${HEADER_COUNTERS.flag.x}px`, top: `${HEADER_COUNTERS.flag.y}px`, width: `${HEADER_COUNTERS.flag.w}px`, height: `${HEADER_COUNTERS.flag.h}px` }}
              onClick={() => {
                if (isGuest) {
                  guestPrompt();
                  return;
                }

                setOpenDropdown((prev) => (prev === "language" ? "" : "language"));
              }}
            >
              <img className={styles.flagIcon} src={getFlagByCode(activeLanguageCode)} alt="" aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.counterButton}
              style={{ left: `${HEADER_COUNTERS.star.x}px`, top: `${HEADER_COUNTERS.star.y}px`, width: `${HEADER_COUNTERS.star.w}px`, height: `${HEADER_COUNTERS.star.h}px` }}
              onClick={() => {
                if (isGuest) {
                  guestPrompt();
                  return;
                }

                setOpenDropdown((prev) => (prev === "streak" ? "" : "streak"));
              }}
            >
              <HeaderIcon src={HOME_HEADER_ICONS.streak} />
              <span>{Number(user.currentStreakDays || 0)}</span>
            </button>

            <div
              className={styles.counterStatic}
              style={{ left: `${HEADER_COUNTERS.crystal.x}px`, top: `${HEADER_COUNTERS.crystal.y}px`, width: `${HEADER_COUNTERS.crystal.w}px`, height: `${HEADER_COUNTERS.crystal.h}px` }}
            >
              <HeaderIcon src={HOME_HEADER_ICONS.crystal} />
              <span>{Number(user.crystals || 0)}</span>
            </div>

            <button
              type="button"
              className={styles.counterButton}
              style={{ left: `${HEADER_COUNTERS.energy.x}px`, top: `${HEADER_COUNTERS.energy.y}px`, width: `${HEADER_COUNTERS.energy.w}px`, height: `${HEADER_COUNTERS.energy.h}px` }}
              onClick={() => {
                if (isGuest) {
                  guestPrompt();
                  return;
                }

                setOpenDropdown((prev) => (prev === "energy" ? "" : "energy"));
              }}
            >
              <img className={`${styles.headerSvg} ${styles.headerEnergySvg}`} src={HOME_HEADER_ICONS.energy} alt="" aria-hidden="true" />
              <span>{Number(user.hearts || 0)}</span>
            </button>

            {openDropdown === "language" ? (
              <div className={`${styles.dropdownCard} ${styles.languageDropdownCard}`} style={{ left: "1102px", top: "136px", width: "402px", minHeight: "180px" }}>
                <div className={styles.languageDropdownTitle}>КУРСИ</div>
                <div className={styles.languageDropdownDivider} />
                <div className={styles.languageDropdownActions}>
                  {languageItems.slice(0, 1).map((item) => (
                    <button key={item.code} type="button" className={styles.languageDropdownAction} onClick={() => handleLanguageSwitch(item.code)}>
                      <div className={styles.languageDropdownFlagWrap}>
                        <img src={getFlagByCode(item.code)} alt="" aria-hidden="true" />
                      </div>
                      <span>{getLanguageLabel(item.code)}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    className={styles.languageDropdownAction}
                    onClick={() => {
                      if (isGuest) {
                        guestPrompt();
                        return;
                      }

                      setBodyView("languages");
                      setOpenDropdown("");
                    }}
                  >
                    <div className={`${styles.languageDropdownFlagWrap} ${styles.languageDropdownPlusWrap}`}>+</div>
                    <span>Мова</span>
                  </button>
                </div>
              </div>
            ) : null}

            {openDropdown === "streak" ? (
              <div className={`${styles.dropdownCard} ${styles.streakDropdownCard}`} style={{ left: "1240px", top: "125px", width: "402px", minHeight: "390px" }}>
                <div className={styles.streakDropdownTop}>
                  <div className={styles.streakHeroContent}>
                    <div className={styles.streakHeroDays}>{Number(user.currentStreakDays || 0)}</div>
                    <div className={styles.streakHeroLabel}>-денний відрізок!</div>
                  </div>
                  <img className={styles.streakHeroIcon} src={HOME_HEADER_ICONS.streak} alt="" aria-hidden="true" />
                </div>
                <div className={styles.streakDropdownBottom}>
                  <div className={styles.streakCalendarCard}>
                    <div className={styles.streakProgressDays}>
                      {WEEK_DAYS.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                    <div className={styles.streakProgressBar}>
                      <div
                        className={styles.streakProgressFill}
                        style={{ width: `${Math.max((streakProgress.filled / 7) * 100, streakProgress.filled > 0 ? 18 : 0)}%` }}
                      >
                        {streakProgress.filled > 0 ? (
                          <img
                            className={styles.streakProgressStar}
                            src={HOME_HEADER_ICONS.streak}
                            alt=""
                            aria-hidden="true"
                            style={{ left: "calc(100% - 26px)" }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <button type="button" className={`${styles.dropdownPrimaryLink} ${styles.streakPrimaryLink}`} onClick={handleOpenFullCalendar}>
                    ДОКЛАДНІШЕ
                  </button>
                </div>
              </div>
            ) : null}

            {openDropdown === "energy" ? (
              <div className={`${styles.dropdownCard} ${styles.energyDropdownCard}`} style={{ left: "1518px", top: "135px", width: "402px", minHeight: "293px" }}>
                <div className={styles.energyDropdownTitle}>Енергія</div>
                <div className={styles.energyChargeLabel}>ЗАРЯДЖЕННЯ{energyRestoreTimerText ? ` (${energyRestoreTimerText})` : ""}</div>
                <div className={styles.energyScale}>
                  <div className={styles.energyScaleTrack} />
                  <div className={styles.energyScaleFill} style={{ width: `${(Number(user.hearts || 0) / energySteps) * 100}%` }}>
                    <span className={styles.energyScaleValue}>
                      {Number(user.hearts || 0)}/{energySteps}
                    </span>
                  </div>
                  <span className={styles.energyScaleIconWrap} aria-hidden="true" style={{ left: `calc(${Math.max(0, Math.min(100, (Number(user.hearts || 0) / energySteps) * 100))}% - 18px)` }}>
                    <img className={styles.energyScaleIcon} src={HOME_HEADER_ICONS.energyScale} alt="" />
                  </span>
                </div>
                <button type="button" className={styles.energyAction} onClick={handleFullRestoreHearts}>
                  <div className={styles.energyActionLeft}>
                    <img className={`${styles.energyActionSun} ${styles.energyActionSunPrimary}`} src={HOME_HEADER_ICONS.energy} alt="" aria-hidden="true" />
                    <span className={styles.energyActionText}>Відновити енергію</span>
                  </div>
                  <div className={styles.energyActionRight}>
                    <img className={styles.energyActionCrystal} src={HOME_HEADER_ICONS.crystal} alt="" aria-hidden="true" />
                    <span>{Math.max(0, Math.max(0, Number(user.heartsMax || 0) - Number(user.hearts || 0)) * Number(user.crystalCostPerHeart || 0))}</span>
                  </div>
                </button>
                <button type="button" className={`${styles.energyAction} ${styles.energyActionSecondary}`} onClick={handleRestoreOneHeart}>
                  <div className={styles.energyActionLeft}>
                    <span className={styles.energyActionSunBadge} aria-hidden="true">
                      <img className={styles.energyActionSun} src={HOME_SHARED_ASSETS.energySmall} alt="" />
                      <span className={styles.energyActionSunBadgeValue}>1</span>
                    </span>
                    <span className={styles.energyActionText}>+1 одиниця енергії</span>
                  </div>
                  <div className={styles.energyActionRight}>
                    <img className={styles.energyActionCrystal} src={HOME_HEADER_ICONS.crystal} alt="" aria-hidden="true" />
                    <span>{Number(user.crystalCostPerHeart || 0)}</span>
                  </div>
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {showFullCalendar ? (
          <div className={styles.calendarOverlay}>
            <div className={styles.calendarModal}>
              <div className={styles.calendarTop}>
                <button type="button" className={styles.calendarClose} onClick={() => setShowFullCalendar(false)}>
                  ×
                </button>
                <div className={styles.calendarTopTitle}>Відрізок</div>
              </div>
              <div className={styles.calendarTopDivider} />
              <div className={styles.calendarHero}>
                <div className={styles.calendarCurrentKyivDateTime}>Дата/Час: {calendarCurrentKyivDateTimeText || "—"}</div>
                <div className={styles.calendarHeroCard}>
                  <div className={styles.calendarHeroDays}>{Number(user.currentStreakDays || 0)}</div>
                  <div className={styles.calendarHeroLabel}>-денний відрізок!</div>
                </div>
                <img className={styles.calendarHeroIcon} src={HOME_HEADER_ICONS.streak} alt="" aria-hidden="true" />
              </div>
              <div className={styles.calendarSectionTitle}>Календар{daysInApp > 0 ? ` · у застосунку ${daysInApp} днів` : ""}</div>
              <div className={styles.calendarMonthCard}>
                <div className={styles.calendarHeader}>
                  <span>
                    {getKyivMonthLabel(calendarMonth.year, calendarMonth.month)} {calendarMonth.year} <span style={{ textTransform: "none" }}>р.</span>
                  </span>
                  <div className={styles.calendarHeaderActions}>
                    <button type="button" onClick={() => handleChangeCalendarMonth(-1)}>‹</button>
                    <button type="button" onClick={() => handleChangeCalendarMonth(1)}>›</button>
                  </div>
                </div>
                <div className={styles.calendarGridCard}>
                  <div className={styles.calendarWeekdays}>
                    {WEEK_DAYS.map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div className={styles.calendarGrid}>
                    {monthCells.map((cell) => (
                      <span
                        key={cell.key}
                        className={`${styles.calendarCell} ${cell.active || cell.registered ? styles.calendarCellActive : ""} ${cell.muted ? styles.calendarCellMuted : ""}`}
                        title={cell.registered ? "День реєстрації" : cell.active ? "День навчання" : ""}
                      >
                        {cell.active || cell.registered ? <img className={styles.calendarCellStar} src={HOME_HEADER_ICONS.streak} alt="" aria-hidden="true" /> : null}
                        <span className={styles.calendarCellText}>{cell.day}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <main className={`${styles.body} ${isFullPanelView ? styles.bodyFull : ""}`}>{renderBody()}</main>
      </div>
    </div>
  );
}
