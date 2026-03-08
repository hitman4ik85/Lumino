import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { authService } from "../../../services/authService.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import styles from "./ForgotPasswordPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg2-left.webp";
import BgRight from "../../../assets/backgrounds/bg2-right.webp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CloseIcon() {
  return (
    <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 8L27 27" stroke="#26415E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 8L8 27" stroke="#26415E" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const emailError = useMemo(() => {
    const value = email.trim();

    if (!value) return "Введіть електронну адресу.";
    if (!EMAIL_RE.test(value)) return "Введіть дійсну адресу ел. пошти.";

    return "";
  }, [email]);

  const canSubmit = !emailError && !submitting;

  const handleClose = () => {
    navigate(PATHS.login);
  };

  const handleGoToLogin = () => {
    navigate(PATHS.login);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched(true);

    if (emailError || submitting) {
      setInlineError(emailError || "");
      return;
    }

    setSubmitting(true);
    setInlineError("");

    try {
      const res = await authService.forgotPassword({ email: email.trim() });

      if (!res.ok) {
        const text = res.error || "";

        if (text.toLowerCase().includes("invalid")) {
          setInlineError("Введіть дійсну адресу ел. пошти.");
        } else {
          setInlineError("Обліковий запис не знайдено");
        }

        return;
      }

      setModalOpen(true);
    } catch {
      setInlineError("Сталася помилка. Спробуйте ще раз.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.viewport}>
      <GlassLoading open={submitting} text="Надсилаємо лист..." />

      <GlassModal
        open={modalOpen}
        title="Лист надіслано"
        message="Якщо обліковий запис існує, ми надіслали лист для скидання пароля на вашу електронну адресу."
        onClose={() => {
          setModalOpen(false);
          navigate(PATHS.login);
        }}
        primaryText="До входу"
      />

      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <button className={styles.closeBtn} type="button" onClick={handleClose}>
          <CloseIcon />
        </button>

        <button className={styles.loginLink} type="button" onClick={handleGoToLogin}>
          УВІЙТИ
        </button>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>Забули пароль?</h1>
          <p className={styles.subtitle}>
            Укажіть вашу адресу електронної пошти, щоб
            <br />
            отримати посилання для скидання пароля.
          </p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputWrap}>
              <input
                className={!touched || !emailError ? styles.input : `${styles.input} ${styles.inputError}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInlineError("");
                }}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setFocused(false);
                  setTouched(true);
                }}
                placeholder={focused || email ? "" : "Електронна адреса"}
                autoComplete="email"
              />
            </div>

            <button className={styles.sendBtn} type="submit" disabled={!canSubmit}>
              НАДІСЛАТИ
            </button>

            {!!inlineError && <div className={styles.inlineError}>{inlineError}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
