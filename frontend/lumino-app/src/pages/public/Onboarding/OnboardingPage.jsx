import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import styles from "./OnboardingPage.module.css";
import { useStageScale } from "../../../hooks/useStageScale.js";
import BgLeft from "../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../assets/backgrounds/bg-right.webp";

import Bubble from "../../../assets/onboarding/bubble.svg";
import Mascot from "../../../assets/mascot/mascot1.svg";

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

        <img className={styles.bubble} src={Bubble} alt="" />
        <p className={styles.bubbleText}>
          Привіт! Мене звати <strong>Lumi</strong>
        </p>

        <img className={styles.mascot} src={Mascot} alt="" />

        <button className={styles.continueBtn} onClick={handleContinue}>
          ПРОДОВЖИТИ
        </button>
      </div>
    </div>
  );
}
