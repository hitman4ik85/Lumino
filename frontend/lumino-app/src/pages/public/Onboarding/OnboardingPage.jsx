import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import styles from "./OnboardingPage.module.css";
import { useStageScale } from "../../../hooks/useStageScale.js";
import BgLeft from "../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../assets/backgrounds/bg-right.webp";

import Bubble from "../../../assets/onboarding/bubble.svg";
import Mascot from "../../../assets/mascot/mascot1.svg";
import AnimatedMascotBubble from "./shared/AnimatedMascotBubble.jsx";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);


  const handleContinue = () => {
    navigate(PATHS.onboardingLevel);
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <AnimatedMascotBubble
          mascotSrc={Mascot}
          bubbleSrc={Bubble}
          mascotClassName={styles.mascot}
          bubbleClassName={styles.bubble}
          textClassName={styles.bubbleText}
          bubbleFirst
        >
          Привіт! Мене звати <strong>Lumi</strong>
        </AnimatedMascotBubble>

        <button className={styles.continueBtn} onClick={handleContinue}>
          ПРОДОВЖИТИ
        </button>
      </div>
    </div>
  );
}
