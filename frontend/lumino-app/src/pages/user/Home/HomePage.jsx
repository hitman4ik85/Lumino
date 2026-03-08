import { useNavigate } from "react-router-dom";
import { useRef } from "react";
import { PATHS } from "../../../routes/paths.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import styles from "./HomePage.module.css";

import BgLeft from "../../../assets/backgrounds/bg-left.webp";
import BgRight from "../../../assets/backgrounds/bg-right.webp";

export default function HomePage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef);

  const handleCreateProfile = () => {
    navigate(PATHS.register);
  };

  return (
    <div className={styles.viewport}>
      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <div className={styles.card}>
          <h1 className={styles.title}>Home</h1>
          <p className={styles.text}>Тут поки що буде заглушка домашньої сторінки користувача.</p>
          <p className={styles.note}>Після реєстрації тут підключимо справжній екран курсу.</p>

          <button className={styles.btn} type="button" onClick={handleCreateProfile}>
            СТВОРИТИ ПРОФІЛЬ
          </button>
        </div>
      </div>
    </div>
  );
}
