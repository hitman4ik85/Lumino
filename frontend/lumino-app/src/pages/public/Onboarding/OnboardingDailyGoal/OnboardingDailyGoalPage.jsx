import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../../routes/paths.js";
import styles from "./OnboardingDailyGoalPage.module.css";
import { useStageScale } from "../../../../hooks/useStageScale.js";
import BgLeft from "../../../../assets/backgrounds/bg1-left.webp";
import BgRight from "../../../../assets/backgrounds/bg1-right.webp";

import ArrowPrev from "../../../../assets/icons/arrow-previous.svg";
import Bubble from "../../../../assets/onboarding/bubble5.svg";
import Mascot from "../../../../assets/mascot/mascot3.svg";
import AnimatedMascotBubble from "../shared/AnimatedMascotBubble.jsx";

import FiveMinIcon from "../../../../assets/icons/goal/daygoal/5min.png";
import TenMinIcon from "../../../../assets/icons/goal/daygoal/10min.png";
import TwentyMinIcon from "../../../../assets/icons/goal/daygoal/20min.png";

const STORAGE_KEY = "lumino_daily_goal";

export default function OnboardingDailyGoalPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const [dailyGoal, setDailyGoal] = useState("");


  useEffect(() => {
    if (!dailyGoal) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    localStorage.setItem(STORAGE_KEY, dailyGoal);
  }, [dailyGoal]);

  const goals = useMemo(
    () => [
      { key: "5min", title: "5 хв/день", icon: FiveMinIcon, x: 598, y: 585, w: 213 },
      { key: "10min", title: "10 хв/день", icon: TenMinIcon, x: 841, y: 585, w: 225 },
      { key: "20min", title: "20 хв/день", icon: TwentyMinIcon, x: 1096, y: 585, w: 226 },
    ],
    []
  );

  const handleBack = () => {
    navigate(PATHS.onboardingResults);
  };

  const handleContinue = () => {
    navigate(PATHS.onboardingTrial);
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

        <div className={styles.headerSection}>
          <button className={styles.backBtn} type="button" onClick={handleBack}>
            <img className={styles.backIcon} src={ArrowPrev} alt="back" />
          </button>

          <div className={styles.progressTrack}>
            <div className={styles.progressFill} />
          </div>
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
          >
            <span>Регулярність</span>
            <span>творить магію!</span>
          </AnimatedMascotBubble>
            </div>
          </div>

          <div className={styles.contentSection}>
            <h1 className={styles.title}>Яку щоденну ціль оберемо?</h1>

            <div className={styles.goalsSection}>
              <div className={styles.goalsContainer}>
          {goals.map((it) => (
          <button
            key={it.key}
            type="button"
            className={`${styles.goalBtn} ${dailyGoal === it.key ? styles.goalBtnActive : ""}`}
            style={{ left: `${it.x}px`, top: `${it.y}px`, width: `${it.w}px` }}
            onClick={() => setDailyGoal(it.key)}
          >
            <img className={styles.goalIcon} src={it.icon} alt="" />
            {it.title}
          </button>
        ))}
              </div>
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
