const ACHIEVEMENT_LABELS_BY_CODE = {
  "sys.first_day_learning": {
    title: "Перший день навчання",
    description: "За перший завершений день навчання",
  },
  "sys.first_lesson": {
    title: "Перший урок",
    description: "За проходження першого уроку",
  },
  "sys.five_lessons": {
    title: "5 уроків пройдено",
    description: "За проходження 5 уроків",
  },
  "sys.perfect_lesson": {
    title: "Ідеальний урок",
    description: "За урок без жодної помилки",
  },
  "sys.perfect_three_in_row": {
    title: "Серія без помилок",
    description: "За кілька уроків підряд без помилок",
  },
  "sys.hundred_xp": {
    title: "500 XP",
    description: "За отримання 500 XP",
  },
  "sys.first_scene": {
    title: "Перша сцена",
    description: "За проходження першої сцени",
  },
  "sys.first_topic_completed": {
    title: "Перша тема завершена",
    description: "За завершення першої теми",
  },
  "sys.five_scenes": {
    title: "5 сцен пройдено",
    description: "За проходження 5 сцен",
  },
  "sys.streak_starter": {
    title: "Початок серії",
    description: "За серію навчання 3 дні поспіль",
  },
  "sys.streak_7": {
    title: "Серія 7 днів",
    description: "За серію навчання 7 днів поспіль",
  },
  "sys.streak_30": {
    title: "Серія 30 днів",
    description: "За серію навчання 30 днів поспіль",
  },
  "sys.daily_goal": {
    title: "Щоденна ціль",
    description: "За виконання денної цілі",
  },
  "sys.return_after_break": {
    title: "З поверненням",
    description: "За повернення до навчання після перерви",
  },
};

export function getAchievementLabelByCode(code) {
  return ACHIEVEMENT_LABELS_BY_CODE[String(code || "").trim().toLowerCase()] || null;
}

export function normalizeAchievementLabels(item) {
  if (!item) {
    return item;
  }

  const labels = getAchievementLabelByCode(item.code);

  if (!labels) {
    return item;
  }

  return {
    ...item,
    title: labels.title,
    description: labels.description,
  };
}

export function normalizeAchievementLabelsList(items) {
  return Array.isArray(items) ? items.map(normalizeAchievementLabels) : items;
}
