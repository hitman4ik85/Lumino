import styles from "./GlassModal.module.css";

export default function GlassModal({
  open,
  title,
  message,
  onClose,
  primaryText = "Добре",
  secondaryText = "",
  onPrimary,
  onSecondary,
}) {
  if (!open) return null;

  const handlePrimary = () => {
    if (onPrimary) {
      onPrimary();
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  const handleSecondary = () => {
    if (onSecondary) {
      onSecondary();
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="glass-modal-title"
        aria-describedby="glass-modal-message"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="glass-modal-title" className={styles.title}>
          {title}
        </h2>

        <p id="glass-modal-message" className={styles.message}>
          {message}
        </p>

        <div className={styles.actions}>
          {!!secondaryText && (
            <button className={`${styles.btn} ${styles.secondaryBtn}`} type="button" onClick={handleSecondary}>
              {secondaryText}
            </button>
          )}

          <button className={`${styles.btn} ${styles.primaryBtn}`} type="button" onClick={handlePrimary}>
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}
