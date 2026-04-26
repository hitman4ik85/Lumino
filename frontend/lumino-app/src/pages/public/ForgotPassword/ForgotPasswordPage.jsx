import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { validateEmail } from "../../../utils/validation.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { authService } from "../../../services/authService.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import styles from "./ForgotPasswordPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg2-left.webp";
import BgRight from "../../../assets/backgrounds/bg2-right.webp";
import ArrowPrev from "../../../assets/icons/arrow-previous.svg";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const stageRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const emailError = useMemo(() => validateEmail(email, { required: true }), [email]);

  useEffect(() => {
    const stateEmail = String(location.state?.email || "").trim();

    if (stateEmail) {
      setEmail(stateEmail);
    }
  }, [location.state]);

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
      const trimmedEmail = email.trim();
      const res = await authService.forgotPassword({ email: trimmedEmail });

      if (!res.ok) {
        const text = res.error || "";

        if (text.toLowerCase().includes("invalid")) {
          setInlineError("Введіть дійсну адресу ел. пошти.");
        } else {
          setInlineError("Не вдалося надіслати лист. Спробуйте ще раз.");
        }

        return;
      }

      localStorage.setItem("lumino_registered_email", trimmedEmail);
      setRequestSent(true);
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
        message="Якщо обліковий запис існує, ми надіслали лист для скидання пароля на вашу електронну адресу. Перевірте пошту та відкрийте посилання з листа."
        onClose={() => {
          setModalOpen(false);
          navigate(PATHS.login, {
            state: {
              prefillEmail: email.trim(),
            },
          });
        }}
        primaryText="До входу"
      />

      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <button className={styles.closeBtn} type="button" onClick={handleClose}>
          <img className={styles.backIcon} src={ArrowPrev} alt="back" />
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

          {requestSent ? (
            <div className={styles.infoBox}>
              Ми підготували лист для відновлення пароля. Перевірте вашу пошту та відкрийте посилання з листа.
            </div>
          ) : null}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputWrap}>
              <input
                className={!touched || !emailError ? styles.input : `${styles.input} ${styles.inputError}`}
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setInlineError("");
                  setRequestSent(false);
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
