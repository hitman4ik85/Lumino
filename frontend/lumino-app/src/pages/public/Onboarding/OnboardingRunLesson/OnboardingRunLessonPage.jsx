import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import { demoLessonService } from "../../../../services/demoLessonService.js";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import styles from "./OnboardingRunLessonPage.module.css";

import BgLeft from "../../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../../assets/backgrounds/bg-right.webp";
import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble1.svg";
import Mascot from "../../../../assets/mascot/mascot7.svg";
import AnimatedMascotBubble from "../shared/AnimatedMascotBubble.jsx";

const LEVEL_TITLES = {
  a1: "A1",
  a2: "A2",
  b1: "B1",
  b2: "B2",
  c1: "C1",
};

const LANG_TITLES = {
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

export default function OnboardingRunLessonPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const [loading, setLoading] = useState(false);

  const lessonText = useMemo(() => {
    const languageCode = localStorage.getItem("targetLanguage") || "en";
    const level = localStorage.getItem("lumino_course_level") || "a1";

    const languageTitle = LANG_TITLES[languageCode] || "англійської";
    const levelTitle = LEVEL_TITLES[level] || "A1";

    return `Чудово! Розпочнімо ваш перший 1-хвилинний урок ${languageTitle} мови рівня ${levelTitle}.`;
  }, []);

  const handleBack = () => {
    navigate(PATHS.onboardingTrial);
  };

  const handleContinue = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    const languageCode = localStorage.getItem("targetLanguage") || "en";
    const level = localStorage.getItem("lumino_course_level") || "a1";
    const res = await demoLessonService.getNextPack(0, languageCode, level);

    setLoading(false);

    if (!res.ok || !res.data?.lesson) {
      navigate(PATHS.onboardingDemoLessonStub, {
        replace: true,
        state: {
          error: res.error || "Не вдалося підготувати демо-урок.",
        },
      });
      return;
    }

    navigate(PATHS.lesson(res.data.lesson.id), {
      replace: true,
      state: {
        demoLesson: true,
        lesson: res.data.lesson,
        demoExercises: Array.isArray(res.data.exercises) ? res.data.exercises : [],
        demoStep: Number(res.data.step || 0),
        demoTotal: Number(res.data.total || 1),
        demoLanguageCode: languageCode,
        demoLevel: level,
      },
    });
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <button className={styles.backBtn} type="button" onClick={handleBack}>
          <img className={styles.backIcon} src={ArrowPrev} alt="back" />
        </button>

        <AnimatedMascotBubble
          mascotSrc={Mascot}
          bubbleSrc={Bubble}
          mascotClassName={styles.mascot}
          bubbleClassName={styles.bubble}
          textClassName={styles.bubbleText}
          bubbleFirst
        >
          {lessonText}
        </AnimatedMascotBubble>

        <button className={styles.continueBtn} type="button" onClick={handleContinue} disabled={loading}>
          {loading ? "ЗАВАНТАЖЕННЯ..." : "ПРОДОВЖИТИ"}
        </button>
      </div>
    </div>
  );
}
