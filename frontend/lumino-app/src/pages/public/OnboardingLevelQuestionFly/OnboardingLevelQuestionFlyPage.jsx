import { useEffect, useRef } from "react";
import styles from "./OnboardingLevelQuestionFlyPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg1-left.png";
import BgRight from "../../../assets/backgrounds/bg1-right.png";

export default function OnboardingLevelQuestionFlyPage() {
  const stageRef = useRef(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const resize = () => {
      const w = 1920;
      const h = 1080;

      const sx = window.innerWidth / w;
      const sy = window.innerHeight / h;
      const s = Math.min(sx, sy);

      stage.style.transform = `
        translate(${Math.round((window.innerWidth - w * s) / 2)}px, ${Math.round((window.innerHeight - h * s) / 2)}px)
        scale(${s})
      `;
    };

    resize();
    window.addEventListener("resize", resize);

    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <div className={styles.bg} style={{ backgroundImage: `url(${BgLeft}), url(${BgRight})` }} />
        <div className={styles.bottomShade} />
      </div>
    </div>
  );
}
