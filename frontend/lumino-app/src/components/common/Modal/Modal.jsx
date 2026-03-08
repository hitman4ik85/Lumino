import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

export default function Modal({
  open,
  title,
  message,
  onClose,
  primaryText = "OK",
  onPrimary,
  secondaryText = "",
  onSecondary,
}) {
  const primaryBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const prevFocus = document.activeElement;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    document.addEventListener("keydown", onKeyDown);
    setTimeout(() => primaryBtnRef.current?.focus(), 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const handlePrimary = () => {
    if (onPrimary) {
      onPrimary();
      return;
    }

    onClose?.();
  };

  const handleSecondary = () => {
    if (onSecondary) {
      onSecondary();
      return;
    }

    onClose?.();
  };

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title || "Повідомлення"}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {!!title && <div className={styles.title}>{title}</div>}
        {!!message && <div className={styles.message}>{message}</div>}

        <div className={styles.actions}>
          {!!secondaryText && (
            <button className={`${styles.okBtn} ${styles.secondaryBtn}`} type="button" onClick={handleSecondary}>
              {secondaryText}
            </button>
          )}

          <button ref={primaryBtnRef} className={styles.okBtn} type="button" onClick={handlePrimary}>
            {primaryText}
          </button>
        </div>
      </div>
    </div>
  );
}
