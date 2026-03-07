import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import styles from "./OnboardingDemoLessonStubPage.module.css";

import BgLeft from "../../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../../assets/backgrounds/bg-right.webp";
import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble6.svg";
import Mascot from "../../../../assets/mascot/mascot5.svg";

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

export default function OnboardingDemoLessonStubPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const demoText = useMemo(() => {
    const languageCode = localStorage.getItem("targetLanguage") || "en";
    const level = localStorage.getItem("lumino_course_level") || "a1";

    const languageTitle = LANG_TITLES[languageCode] || "англійської";
    const levelTitle = LEVEL_TITLES[level] || "A1";

    return `Тут буде демо-урок з 3 перших вправ ${languageTitle} мови рівня ${levelTitle}.`;
  }, []);

  const handleBack = () => {
    navigate(PATHS.onboardingRunLesson);
  };

  const handleContinue = () => {
    navigate(PATHS.onboardingPreCreateProf);
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <div className={styles.bottomShade} />

        <button className={styles.backBtn} type="button" onClick={handleBack}>
          <img className={styles.backIcon} src={ArrowPrev} alt="back" />
        </button>

        <img className={styles.mascot} src={Mascot} alt="" />
        <img className={styles.bubble} src={Bubble} alt="" />

        <p className={styles.bubbleText}>
          <span>Демо-вправи</span>
          <span>підключимо далі!</span>
        </p>

        <h1 className={styles.title}>Ваш перший демо-урок буде тут</h1>
        <p className={styles.description}>{demoText}</p>
        <p className={styles.note}>Поки що переходимо далі до наступного кроку реєстрації.</p>

        <button className={styles.continueBtn} type="button" onClick={handleContinue}>
          ПРОДОВЖИТИ
        </button>
      </div>
    </div>
  );
}
