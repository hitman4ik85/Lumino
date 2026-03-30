import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { authStorage } from "../../../services/authStorage.js";
import { achievementsService } from "../../../services/achievementsService.js";
import styles from "./AchievementsPage.module.css";

const PLACEHOLDER_COUNT = 12;

const DESCRIPTION_BY_CODE = {
  "sys.first_day_learning": "За перший завершений день навчання",
  "sys.first_lesson": "За проходження першого уроку",
  "sys.five_lessons": "За проходження 5 уроків",
  "sys.perfect_lesson": "За урок без жодної помилки",
  "sys.perfect_three_in_row": "За кілька уроків підряд без помилок",
  "sys.hundred_xp": "За отримання 500 XP",
  "sys.first_scene": "За проходження першої сцени",
  "sys.first_topic_completed": "За завершення першої теми",
  "sys.five_scenes": "За проходження 5 сцен",
  "sys.streak_starter": "За серію навчання 3 дні поспіль",
  "sys.streak_7": "За серію навчання 7 днів поспіль",
  "sys.streak_30": "За серію навчання 30 днів поспіль",
  "sys.daily_goal": "За виконання денної цілі",
  "sys.return_after_break": "За повернення до навчання після перерви",
};

function getAchievementMediaRoot() {
  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "/api").trim();

  if (/^https?:\/\//i.test(apiBaseUrl)) {
    try {
      return apiBaseUrl.replace(/\/api\/?$/i, "").replace(/\/$/, "");
    } catch {
      return typeof window !== "undefined" ? window.location.origin : "";
    }
  }

  return typeof window !== "undefined" ? window.location.origin : "";
}

function resolveAchievementImageUrl(url) {
  const src = String(url || "").trim();

  if (!src) {
    return "";
  }

  if (/^(https?:)?\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:")) {
    return src;
  }

  const mediaRoot = getAchievementMediaRoot();

  if (src.startsWith("/")) {
    return `${mediaRoot}${src}`;
  }

  return `${mediaRoot}/${src.replace(/^\/+/, "")}`;
}

function normalizeAchievement(item) {
  const code = String(item?.code || "").trim();
  const earnedAtRaw = String(item?.earnedAt || "").trim();
  const earnedAtTime = earnedAtRaw ? Date.parse(earnedAtRaw) : NaN;

  return {
    id: item?.id || code || 0,
    code,
    title: String(item?.title || "").trim(),
    description: String(DESCRIPTION_BY_CODE[code] || item?.description || "").trim(),
    isEarned: Boolean(item?.isEarned),
    earnedAt: earnedAtRaw,
    earnedAtTime: Number.isNaN(earnedAtTime) ? 0 : earnedAtTime,
    imageUrl: resolveAchievementImageUrl(String(item?.imageUrl || "").trim()),
  };
}

function sortAchievements(items) {
  return [...items].sort((a, b) => {
    if (a.isEarned !== b.isEarned) {
      return a.isEarned ? -1 : 1;
    }

    if (a.isEarned && b.isEarned && a.earnedAtTime !== b.earnedAtTime) {
      return b.earnedAtTime - a.earnedAtTime;
    }

    return Number(a.id || 0) - Number(b.id || 0);
  });
}

export default function AchievementsContent() {
  const navigate = useNavigate();
  const [achievements, setAchievements] = useState([]);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadAchievements = async () => {
      const res = await achievementsService.getMine();

      if (!res.ok) {
        if (res.shouldClearTokens) {
          authStorage.clearTokens();
          navigate(PATHS.login, { replace: true });
        }

        return;
      }

      if (cancelled) {
        return;
      }

      const list = Array.isArray(res.data)
        ? sortAchievements(res.data.map(normalizeAchievement).filter((item) => item.title))
        : [];

      setAchievements(list);
    };

    loadAchievements();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const displayItems = useMemo(() => {
    const filled = [...achievements];
    const targetCount = Math.max(PLACEHOLDER_COUNT, filled.length);

    while (filled.length < targetCount) {
      filled.push(null);
    }

    return filled;
  }, [achievements]);

  const handleImageError = (key) => {
    setImageErrors((prev) => {
      if (prev[key]) {
        return prev;
      }

      return { ...prev, [key]: true };
    });
  };

  return (
    <div className={styles.viewport}>
      <div className={styles.topDivider} />

      <div className={styles.achievementsBody}>
        <div className={styles.grid}>
          {displayItems.map((item, index) => {
            if (!item) {
              return (
                <div key={`placeholder-${index}`} className={styles.cardLocked}>
                  <div className={styles.cardVisual}>
                    <div className={styles.cardImagePlaceholder} />
                  </div>

                  <div className={styles.cardTitleLocked}>назва</div>
                </div>
              );
            }

            const key = item.id || `achievement-${index}`;
            const hasImage = item.imageUrl && !imageErrors[key];
            const cardClassName = item.isEarned ? styles.card : styles.cardLocked;
            const titleClassName = item.isEarned ? styles.cardTitle : styles.cardTitleLocked;
            const descriptionClassName = item.isEarned ? styles.cardDescription : styles.cardDescriptionLocked;

            return (
              <div key={key} className={cardClassName}>
                <div className={styles.cardVisual}>
                  {hasImage ? (
                    <img
                      className={styles.cardImage}
                      src={item.imageUrl}
                      alt={item.title}
                      onError={() => handleImageError(key)}
                    />
                  ) : (
                    <div className={item.isEarned ? styles.cardImagePlaceholderEarned : styles.cardImagePlaceholder} />
                  )}

                  {!item.isEarned && <div className={styles.cardLockedOverlay} />}
                </div>

                <div className={titleClassName}>{item.title}</div>
                <div className={descriptionClassName}>{item.description}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.bottomDivider} />
      <div className={styles.footerNote}>*більше нагород попереду</div>
    </div>
  );
}
