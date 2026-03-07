import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import styles from "./OnboardingLevelQuestionFlyPage.module.css";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import BgLeft from "../../../../assets/backgrounds/bg1-left.webp";
import BgRight from "../../../../assets/backgrounds/bg1-right.webp";

import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble3.svg";
import Mascot from "../../../../assets/mascot/mascot4.svg";

export default function OnboardingLevelQuestionFlyPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);


  const handleBack = () => {
    navigate(PATHS.onboardingLevelQuestion);
  };

  const handleContinue = () => {
    navigate(PATHS.onboardingQuestionGoal);
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <div
          className={styles.bg}
          style={{
            backgroundImage: `url(${BgLeft}), url(${BgRight})`,
          }}
        />

        <div className={styles.bottomShade} />

        <button className={styles.backBtn} type="button" onClick={handleBack}>
          <img className={styles.backIcon} src={ArrowPrev} alt="back" />
        </button>

        <div className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>

        <img className={styles.bubble} src={Bubble} alt="" />
        <p className={styles.bubbleText}>
          <span>Полетіли тренувати</span>
          <span>мовлення?</span>
        </p>

        <img className={styles.mascot} src={Mascot} alt="" />

        <button className={styles.continueBtn} type="button" onClick={handleContinue}>
          ПРОДОВЖИТИ
        </button>
      </div>
    </div>
  );
}
