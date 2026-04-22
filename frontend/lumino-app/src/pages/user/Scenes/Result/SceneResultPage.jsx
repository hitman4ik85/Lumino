import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import { PATHS } from "../../../../routes/paths.js";
import { preloadAchievementsCache } from "../../../../services/achievementsCache.js";
import GlassModal from "../../../../components/common/GlassModal/GlassModal.jsx";
import styles from "./SceneResultPage.module.css";

import BgLeft from "../../../../assets/lesson/backgrounds/bg4-left_finish.webp";
import BgRight from "../../../../assets/lesson/backgrounds/bg4-right_finish.webp";
import Mascot from "../../../../assets/mascot/mascot1.svg";
import PointsIcon from "../../../../assets/home/shared/points.svg";
import CrystalIcon from "../../../../assets/home/header/crystal.svg";

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

function getSceneTitle(scene, sceneId) {
  const title = String(scene?.title || scene?.name || scene?.Title || "").trim();
  return title || `Сцена #${sceneId}`;
}

export default function SceneResultPage() {
  const { sceneId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute", containBelow: 1180, containMinWidth: 700 });

  const result = location.state?.result || null;
  const scene = location.state?.scene || null;
  const isMistakesMode = location.state?.mode === "mistakes";
  const newlyEarnedAchievements = Array.isArray(location.state?.newlyEarnedAchievements) ? location.state.newlyEarnedAchievements : [];

  const accuracyPercent = useMemo(() => {
    const total = Number(result?.totalQuestions || 0);
    const correct = Number(result?.correctAnswers || 0);

    if (!total) {
      return 0;
    }

    return Math.round((correct / total) * 100);
  }, [result]);

  const pointsValue = useMemo(() => Number(result?.earnedPoints || 0), [result]);
  const crystalsValue = useMemo(() => Number(result?.earnedCrystals || 0), [result]);
  const mistakesCount = useMemo(() => Array.isArray(result?.mistakeStepIds) ? result.mistakeStepIds.length : 0, [result]);
  const title = useMemo(() => getSceneTitle(scene, sceneId), [scene, sceneId]);
  const [showTitle, setShowTitle] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [achievementModalIndex, setAchievementModalIndex] = useState(0);
  const [achievementModalOpen, setAchievementModalOpen] = useState(false);

  useEffect(() => {
    if (!isMistakesMode && newlyEarnedAchievements.length > 0) {
      setAchievementModalIndex(0);
      setAchievementModalOpen(true);
      return;
    }

    setAchievementModalOpen(false);
    setAchievementModalIndex(0);
  }, [isMistakesMode, newlyEarnedAchievements]);

  useEffect(() => {
    if (!result) {
      return undefined;
    }

    preloadAchievementsCache().catch(() => {
    });

    return undefined;
  }, [result]);

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

  const currentAchievement = newlyEarnedAchievements[achievementModalIndex] || null;
  const achievementIllustrationSrc = useMemo(
    () => resolveAchievementImageUrl(currentAchievement?.imageUrl || ""),
    [currentAchievement]
  );
  const achievementTitle = useMemo(
    () => String(currentAchievement?.title || "Нова нагорода!").trim() || "Нова нагорода!",
    [currentAchievement]
  );
  const achievementMessage = useMemo(() => {
    const description = String(currentAchievement?.description || "").trim();

    if (description) {
      return description;
    }

    return "Ти отримав нову нагороду за проходження сцени.";
  }, [currentAchievement]);

  const handleCloseAchievementModal = () => {
    const nextIndex = achievementModalIndex + 1;

    if (nextIndex < newlyEarnedAchievements.length) {
      setAchievementModalIndex(nextIndex);
      return;
    }

    setAchievementModalOpen(false);
  };

  const handleContinue = () => {
    navigate(PATHS.home, {
      replace: true,
      state: {
        refreshLearning: true,
        refreshScenes: true,
        completedSceneId: Number(scene?.id || sceneId || 0),
      },
    });
  };

  const handleOpenMistakes = () => {
    navigate(PATHS.scene(sceneId), {
      replace: true,
      state: {
        scene,
        mode: "mistakes",
      },
    });
  };

  const hasMistakesButton = !isMistakesMode && mistakesCount > 0;

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage} id="scene-result-stage-root">
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        {!result ? (
          <div className={styles.emptyPage}>
            <div>Результат сцени не знайдено.</div>
            <button type="button" className={styles.continueButton} onClick={() => navigate(PATHS.home)}>На головну</button>
          </div>
        ) : (
          <>
            <div className={styles.heroWrap}>
              <img className={`${styles.mascot} ${styles.mascotEnter}`} src={Mascot} alt="" />
              <div className={`${styles.title} ${showTitle ? styles.titleVisible : styles.titleHidden}`}>{isMistakesMode ? "Повторення завершено!" : "Сцену завершено!"}</div>
              <div className={`${styles.sceneName} ${showTitle ? styles.titleVisible : styles.titleHidden}`}>{title}</div>
            </div>

            <div className={`${styles.statsRow} ${showStats ? styles.statsVisible : styles.statsHidden}`}>
              <StatCard label="Бали" value={pointsValue} icon={PointsIcon} />
              <StatCard label="Кристали" value={crystalsValue} icon={CrystalIcon} />
              <StatCard label="Вірно" value={accuracyPercent} suffix="%" />
            </div>

            <div className={styles.bottomLine} />

            <GlassModal
              open={achievementModalOpen}
              title={achievementTitle}
              message={achievementMessage}
              onClose={handleCloseAchievementModal}
              primaryText="Добре"
              variant="achievement"
              illustrationSrc={achievementIllustrationSrc}
              stageTargetId="scene-result-stage-root"
            />

            <div className={`${styles.actionsRow} ${!hasMistakesButton ? styles.actionsRowSingle : ""}`}>
              {hasMistakesButton ? (
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
