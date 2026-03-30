import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import styles from "./OnboardingCreateProfLaterPage.module.css";

import BgLeft from "../../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../../assets/backgrounds/bg-right.webp";
import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble1.svg";
import Mascot from "../../../../assets/mascot/mascot8.svg";
import AnimatedMascotBubble from "../shared/AnimatedMascotBubble.jsx";
import MascotPlanet from "../../../../assets/mascot/mascotplanet.svg";

export default function OnboardingCreateProfLaterPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const handleBack = () => {
    navigate(PATHS.onboardingPreCreateProf);
  };

  const handleContinue = () => {
    localStorage.setItem("lumino_guest_preview", "true");
    navigate(PATHS.home);
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
          decorationSrc={MascotPlanet}
          decorationClassName={styles.mascotPlanet}
        >
          <span>Спочатку можете</span>
          <span>ознайомитися з курсом, а</span>
          <span>профіль створити пізніше.</span>
        </AnimatedMascotBubble>

        <button className={styles.continueBtn} type="button" onClick={handleContinue}>
          ПРОДОВЖИТИ
        </button>
      </div>
    </div>
  );
}
