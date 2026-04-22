import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import { authStorage } from "../../../../services/authStorage.js";
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
    authStorage.enableGuestPreview();
    navigate(PATHS.home, { replace: true });
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <div className={styles.headerSection}>
          <button className={styles.backBtn} type="button" onClick={handleBack}>
            <img className={styles.backIcon} src={ArrowPrev} alt="back" />
          </button>
        </div>

        <div className={styles.mainSection}>
          <div className={styles.heroSection}>
            <div className={styles.heroGroup}>
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
            </div>
          </div>

          <div className={styles.actionSection}>
            <button className={styles.continueBtn} type="button" onClick={handleContinue}>
              ПРОДОВЖИТИ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
