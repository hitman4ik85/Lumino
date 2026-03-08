import { useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { authService } from "../../../services/authService.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import styles from "./ResetPasswordPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg2-left.webp";
import BgRight from "../../../assets/backgrounds/bg2-right.webp";

function CloseIcon() {
  return (
    <svg width="35" height="35" viewBox="0 0 35 35" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M8 8L27 27" stroke="#26415E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 8L8 27" stroke="#26415E" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon({ opened }) {
  return (
    <svg width="30" height="23" viewBox="0 0 30 23" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M15 4C8.6 4 3.62 7.73 1.3 11.5C3.62 15.27 8.6 19 15 19C21.4 19 26.38 15.27 28.7 11.5C26.38 7.73 21.4 4 15 4Z"
        stroke="#6A7D90"
        strokeWidth="1.5"
      />
      <circle cx="15" cy="11.5" r="4.2" stroke="#6A7D90" strokeWidth="1.5" />
      {!opened && <path d="M4 21L26 2" stroke="#6A7D90" strokeWidth="1.5" strokeLinecap="round" />}
    </svg>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stageRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRepeatPassword, setShowRepeatPassword] = useState(false);
  const [inlineError, setInlineError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const token = searchParams.get("token") || "";

  const passwordError = useMemo(() => {
    if (!password) return "Введіть новий пароль.";
    if (password.length < 6) return "Пароль має містити щонайменше 6 символів.";
    if (password.length > 64) return "Пароль має містити не більше 64 символів.";
    return "";
  }, [password]);

  const repeatError = useMemo(() => {
    if (!repeatPassword) return "Повторіть пароль.";
    if (repeatPassword !== password) return "Паролі не співпадають.";
    return "";
  }, [password, repeatPassword]);

  const canSubmit = !passwordError && !repeatError && token && !submitting;

  const mapBackendError = (errorText) => {
    const text = (errorText || "").toLowerCase();

    if (text.includes("confirmpassword is required")) {
      return "Підтвердіть новий пароль.";
    }

    if (text.includes("passwords do not match")) {
      return "Паролі не співпадають.";
    }

    if (text.includes("token expired")) {
      return "Посилання для зміни пароля вже неактуальне.";
    }

    if (text.includes("invalid token")) {
      return "Невірне або прострочене посилання.";
    }

    if (text.includes("token already used")) {
      return "Це посилання вже було використане.";
    }

    if (text.includes("newpassword must be at least 6 characters")) {
      return "Пароль має містити щонайменше 6 символів.";
    }

    if (text.includes("newpassword must be at most 64 characters")) {
      return "Пароль має містити не більше 64 символів.";
    }

    return errorText || "Не вдалося змінити пароль.";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit) {
      setInlineError(passwordError || repeatError || "Невірне або прострочене посилання.");
      return;
    }

    setSubmitting(true);
    setInlineError("");

    try {
      const res = await authService.resetPassword({
        token,
        newPassword: password,
        confirmPassword: repeatPassword,
      });

      if (!res.ok) {
        setInlineError(mapBackendError(res.error));
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
      <GlassLoading open={submitting} text="Змінюємо пароль..." />

      <GlassModal
        open={modalOpen}
        title="Пароль змінено"
        message="Тепер ви можете увійти з новим паролем."
        onClose={() => {
          setModalOpen(false);
          navigate(PATHS.login);
        }}
        primaryText="До входу"
      />

      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <button className={styles.closeBtn} type="button" onClick={() => navigate(PATHS.login)}>
          <CloseIcon />
        </button>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>Новий пароль</h1>
          <p className={styles.subtitle}>Введіть новий пароль для вашого профілю.</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setInlineError("");
                }}
                placeholder="Новий пароль"
                autoComplete="new-password"
              />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowPassword((prev) => !prev)}>
                <EyeIcon opened={showPassword} />
              </button>
            </div>

            <div className={styles.inputWrapRepeat}>
              <input
                className={styles.input}
                type={showRepeatPassword ? "text" : "password"}
                value={repeatPassword}
                onChange={(e) => {
                  setRepeatPassword(e.target.value);
                  setInlineError("");
                }}
                placeholder="Повторіть пароль"
                autoComplete="new-password"
              />
              <button className={styles.eyeBtn} type="button" onClick={() => setShowRepeatPassword((prev) => !prev)}>
                <EyeIcon opened={showRepeatPassword} />
              </button>
            </div>

            <button className={styles.saveBtn} type="submit" disabled={!canSubmit}>
              ЗБЕРЕГТИ
            </button>

            {!!inlineError && <div className={styles.inlineError}>{inlineError}</div>}
          </form>
        </div>
      </div>
    </div>
  );
}
