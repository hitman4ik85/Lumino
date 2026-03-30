import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import styles from "./OnboardingPreCreateProfPage.module.css";

import BgLeft from "../../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../../assets/backgrounds/bg-right.webp";
import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble.svg";
import Mascot from "../../../../assets/mascot/mascot7.svg";
import AnimatedMascotBubble from "../shared/AnimatedMascotBubble.jsx";

export default function OnboardingPreCreateProfPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const handleBack = () => {
    if (location.state?.isDemoLesson) {
      navigate(-1);
      return;
    }

    navigate(PATHS.onboardingDemoLessonStub);
  };

  const handleCreateProfile = () => {
    navigate(PATHS.register);
  };

  const handleLater = () => {
    navigate(PATHS.onboardingCreateProfLater);
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
          Створімо профіль!
        </AnimatedMascotBubble>

        <button className={styles.createBtn} type="button" onClick={handleCreateProfile}>
          СТВОРИТИ ПРОФІЛЬ
        </button>

        <button className={styles.laterBtn} type="button" onClick={handleLater}>
          ПІЗНІШЕ
        </button>
      </div>
    </div>
  );
}
