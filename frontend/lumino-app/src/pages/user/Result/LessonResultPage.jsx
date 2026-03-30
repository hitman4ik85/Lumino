import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { PATHS } from "../../../routes/paths.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import styles from "./LessonResultPage.module.css";

import BgLeft from "../../../assets/lesson/backgrounds/bg4-left_finish.webp";
import BgRight from "../../../assets/lesson/backgrounds/bg4-right_finish.webp";
import Mascot from "../../../assets/mascot/mascot1.svg";
import PointsIcon from "../../../assets/home/shared/points.svg";
import CrystalIcon from "../../../assets/home/header/crystal.svg";
import EnergyIcon from "../../../assets/home/header/energy.svg";

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

function StatCard({ label, value, icon, prefix = "", suffix = "" }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statCardHeader}>{label}</div>
      <div className={styles.statCardBody}>
        {icon ? <img className={styles.statIcon} src={icon} alt="" aria-hidden="true" /> : null}
        <span>{prefix}{value}{suffix}</span>
      </div>
    </div>
  );
}

export default function LessonResultPage() {
  const { lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const result = location.state?.result || null;
  const lesson = location.state?.lesson || null;
  const isMistakesMode = location.state?.mode === "mistakes";
  const isDemoLesson = Boolean(location.state?.demoLesson);
  const newlyEarnedAchievements = Array.isArray(location.state?.newlyEarnedAchievements) ? location.state.newlyEarnedAchievements : [];
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const achievementIllustrationSrc = useMemo(() => resolveAchievementImageUrl(newlyEarnedAchievements[0]?.imageUrl || ""), [newlyEarnedAchievements]);

  const accuracyPercent = useMemo(() => {
    const total = Number(result?.totalExercises || 0);
    const correct = Number(result?.correctAnswers || 0);

    if (!total) {
      return 0;
    }

    return Math.round((correct / total) * 100);
  }, [result]);

  const pointsValue = useMemo(() => Number(result?.earnedPoints || 0), [result]);
  const crystalsValue = useMemo(() => Number(result?.earnedCrystals || 0), [result]);
  const mistakesCount = Array.isArray(result?.mistakeExerciseIds) ? result.mistakeExerciseIds.length : 0;
  const restoredHearts = Number(result?.restoredHearts || 0);
  const [showTitle, setShowTitle] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (!isMistakesMode && newlyEarnedAchievements.length > 0) {
      setAchievementModalOpen(true);
    }
  }, [isMistakesMode, newlyEarnedAchievements.length]);

  useEffect(() => {
    setShowTitle(false);
    setShowStats(false);

    if (!result) {
      return undefined;
    }

    const titleTimer = setTimeout(() => {
      setShowTitle(true);
    }, 700);

    const statsTimer = setTimeout(() => {
      setShowStats(true);
    }, 1350);

    return () => {
      clearTimeout(titleTimer);
      clearTimeout(statsTimer);
    };
  }, [result]);

  const achievementMessage = useMemo(() => {
    if (!newlyEarnedAchievements.length) {
      return "";
    }

    const titles = newlyEarnedAchievements
      .map((item) => String(item?.title || "").trim())
      .filter(Boolean);

    if (!titles.length) {
      return "Ти отримав нову нагороду за проходження уроку.";
    }

    if (titles.length === 1) {
      return `Ти отримав нагороду: ${titles[0]}`;
    }

    return `Ти отримав нові нагороди: ${titles.join(", ")}`;
  }, [newlyEarnedAchievements]);

  const handleContinue = () => {
    if (isDemoLesson) {
      navigate(PATHS.onboardingPreCreateProf, {
        replace: true,
        state: {
          isDemoLesson: true,
        },
      });
      return;
    }

    navigate(PATHS.home, {
      replace: true,
      state: {
        refreshLearning: true,
        completedLessonId: Number(lesson?.id || lessonId || 0),
        isLessonPassed: Boolean(result?.isPassed),
      },
    });
  };

  const handleOpenMistakes = () => {
    if (isDemoLesson) {
      return;
    }

    navigate(PATHS.lesson(lessonId), {
      replace: true,
      state: {
        lesson,
        mode: "mistakes",
      },
    });
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage} id="lesson-result-stage-root">
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        {!result ? (
          <div className={styles.emptyPage}>
            <div>Результат уроку не знайдено.</div>
            <button type="button" className={styles.continueButton} onClick={() => navigate(isDemoLesson ? PATHS.onboardingRunLesson : PATHS.home)}>На головну</button>
          </div>
        ) : (
          <>
            <div className={styles.heroWrap}>
              <img className={`${styles.mascot} ${styles.mascotEnter}`} src={Mascot} alt="" />
              <div className={`${styles.title} ${showTitle ? styles.titleVisible : styles.titleHidden}`}>{isMistakesMode ? "Повторення завершено!" : (isDemoLesson ? "Демо-урок завершено!" : "Урок завершено!")}</div>
            </div>

            {!isMistakesMode ? (
              <div className={`${styles.statsRow} ${showStats ? styles.statsVisible : styles.statsHidden}`}>
                <StatCard label="Бали" value={pointsValue} icon={PointsIcon} />
                <StatCard label="Кристали" value={crystalsValue} icon={CrystalIcon} />
                <StatCard label="Вірно" value={accuracyPercent} suffix="%" />
              </div>
            ) : (
              <div className={`${styles.practiceStatsWrap} ${showStats ? styles.statsVisible : styles.statsHidden}`}>
                <StatCard label="Енергія" value={restoredHearts > 0 ? `+${restoredHearts}` : "+0"} icon={EnergyIcon} />
              </div>
            )}

            <div className={styles.bottomLine} />

            <GlassModal
              open={achievementModalOpen}
              title="Нова нагорода!"
              message={achievementMessage}
              onClose={() => setAchievementModalOpen(false)}
              primaryText="Добре"
              illustrationSrc={achievementIllustrationSrc}
              stageTargetId="lesson-result-stage-root"
            />

            <div className={styles.actionsRow}>
              {!isMistakesMode && !isDemoLesson && mistakesCount > 0 ? (
                <button type="button" className={styles.mistakesButton} onClick={handleOpenMistakes}>
                  ПОМИЛКИ
                </button>
              ) : <div className={styles.actionsSpacer} />}

              <button type="button" className={styles.continueButton} onClick={handleContinue}>
                ПРОДОВЖИТИ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
