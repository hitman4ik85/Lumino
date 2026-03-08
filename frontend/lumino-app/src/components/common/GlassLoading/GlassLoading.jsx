import SolarLoading from "../SolarLoading/SolarLoading.jsx";
import styles from "./GlassLoading.module.css";

export default function GlassLoading({ open, text = "Завантаження..." }) {
  if (!open) return null;

  return (
    <div className={styles.backdrop} role="presentation">
      <div className={styles.box} role="status" aria-live="polite">
        <SolarLoading />
        <p className={styles.text}>{text}</p>
      </div>
    </div>
  );
}
