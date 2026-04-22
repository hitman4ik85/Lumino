import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import { demoLessonService } from "../../../../services/demoLessonService.js";
import { authStorage } from "../../../../services/authStorage.js";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import styles from "./OnboardingDemoLessonStubPage.module.css";

import BgLeft from "../../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../../assets/backgrounds/bg-right.webp";
import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble6.svg";
import Mascot from "../../../../assets/mascot/mascot5.svg";
import AnimatedMascotBubble from "../shared/AnimatedMascotBubble.jsx";

export default function OnboardingDemoLessonStubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const [error, setError] = useState(location.state?.error || "");
  const [loading, setLoading] = useState(!location.state?.error);

  useEffect(() => {
    if (location.state?.error) {
      return;
    }

    let ignore = false;

    const load = async () => {
      const languageCode = localStorage.getItem("targetLanguage") || "en";
      const level = localStorage.getItem("lumino_course_level") || "a1";
      const res = await demoLessonService.getNextPack(0, languageCode, level);

      if (ignore) {
        return;
      }

      if (!res.ok || !res.data?.lesson) {
        setError(res.error || "Не вдалося підготувати демо-урок.");
        setLoading(false);
        return;
      }

      authStorage.enableGuestPreview();

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

    load();

    return () => {
      ignore = true;
    };
  }, [location.state?.error, navigate]);

  const handleBack = () => {
    navigate(PATHS.onboardingRunLesson);
  };

  const handleRetry = () => {
    setError("");
    setLoading(true);
    navigate(PATHS.onboardingDemoLessonStub, { replace: true, state: null });
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

        <div className={styles.heroGroup}>
          <AnimatedMascotBubble
            key={loading ? "loading" : "error"}
            mascotSrc={Mascot}
            bubbleSrc={Bubble}
            mascotClassName={styles.mascot}
            bubbleClassName={styles.bubble}
            textClassName={styles.bubbleText}
          >
            <span>{loading ? "Готуємо" : "Не вдалося"}</span>
            <span>{loading ? "ваші демо-вправи" : "завантажити демо"}</span>
          </AnimatedMascotBubble>
        </div>

        <h1 className={styles.title}>{loading ? "Зараз відкриємо перші 3 вправи" : "Демо-урок поки недоступний"}</h1>
        <p className={styles.description}>{loading ? "Завантажуємо перший демо-урок і одразу переходимо до вправ." : (error || "Спробуйте ще раз трохи пізніше.")}</p>
        <p className={styles.note}>{loading ? "Будь ласка, зачекайте кілька секунд." : "Можете повторити спробу або повернутися назад."}</p>

        {!loading ? (
          <button className={styles.continueBtn} type="button" onClick={handleRetry}>
            СПРОБУВАТИ ЩЕ РАЗ
          </button>
        ) : null}
      </div>
    </div>
  );
}
