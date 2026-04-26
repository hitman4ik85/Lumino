import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { validateEmail, validateNewPassword, validateUsername } from "../../../utils/validation.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { authService } from "../../../services/authService.js";
import { authStorage } from "../../../services/authStorage.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import styles from "./RegisterPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg2-left.webp";
import BgRight from "../../../assets/backgrounds/bg2-right.webp";
import ArrowPrev from "../../../assets/icons/arrow-previous.svg";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "356032698202-a51919qlrad2bhf4384ldl429qan5nad.apps.googleusercontent.com";

const VERIFY_SYNC_STORAGE_KEY = "lumino_verify_email_sync";
const VERIFY_SYNC_CHANNEL_NAME = "lumino-verify-email-sync";
const VERIFY_SYNC_MAX_AGE_MS = 5 * 60 * 1000;

function normalizeSyncEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function isFreshVerifySyncPayload(payload) {
  if (!payload || payload.type !== "email-verified") {
    return false;
  }

  const at = Number(payload.at || 0);

  if (!at) {
    return false;
  }

  return Date.now() - at <= VERIFY_SYNC_MAX_AGE_MS;
}

function parseVerifySyncPayload(value) {
  try {
    const parsed = JSON.parse(String(value || ""));
    return isFreshVerifySyncPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
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

function GoogleIcon() {
  return (
    <span className={styles.googleIcon} aria-hidden="true">
      <span className={styles.googleIconCircle}>
        <span className={styles.googleIconLetter}>G</span>
      </span>
    </span>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const googleBtnHostRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [focused, setFocused] = useState({
    username: false,
    email: false,
    password: false,
  });

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    primaryText: "OK",
    secondaryText: "",
    onPrimary: null,
    onSecondary: null,
  });

  useEffect(() => {
    let cancelled = false;

    const initGoogle = () => {
      if (cancelled || !window.google?.accounts?.id || !googleBtnHostRef.current) {
        return;
      }

      googleBtnHostRef.current.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const credential = response?.credential || "";

          if (!credential) {
            setModal({
              open: true,
              title: "Google вхід",
              message: "Не вдалося отримати токен Google. Спробуйте ще раз.",
              primaryText: "OK",
              secondaryText: "",
              onPrimary: null,
              onSecondary: null,
            });
            return;
          }

          const dto = {
            idToken: credential,
            username: form.username.trim() || null,
          };

          setSubmitting(true);

          const res = await authService.oauthGoogle(dto);

          if (!res.ok) {
            setModal({
              open: true,
              title: "Google вхід",
              message: res.error || "Не вдалося виконати вхід через Google.",
              primaryText: "OK",
              secondaryText: "",
              onPrimary: null,
              onSecondary: null,
            });
            setSubmitting(false);
            return;
          }

          const token = res.data?.token || "";
          const refreshToken = res.data?.refreshToken || "";

          if (!token || !refreshToken) {
            setModal({
              open: true,
              title: "Google вхід",
              message: "Бекенд не повернув токени авторизації.",
              primaryText: "OK",
              secondaryText: "",
              onPrimary: null,
              onSecondary: null,
            });
            setSubmitting(false);
            return;
          }

          authStorage.setTokens(token, refreshToken);
          setSubmitting(false);
          navigate(PATHS.home);
        },
      });

      window.google.accounts.id.renderButton(googleBtnHostRef.current, {
        theme: "outline",
        size: "large",
        width: 580,
        text: "continue_with",
        shape: "rectangular",
      });

      setGoogleReady(true);
    };

    const existingScript = document.querySelector('script[data-google-gsi="true"]');

    if (existingScript) {
      if (window.google?.accounts?.id) {
        initGoogle();
      } else {
        existingScript.addEventListener("load", initGoogle, { once: true });
      }

      return () => {
        cancelled = true;
        existingScript.removeEventListener("load", initGoogle);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.addEventListener("load", initGoogle, { once: true });
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", initGoogle);
    };
  }, [navigate, form.username]);

  const usernameError = useMemo(() => validateUsername(form.username, { required: true }), [form.username]);

  const emailError = useMemo(() => validateEmail(form.email, { required: true }), [form.email]);

  const passwordError = useMemo(() => validateNewPassword(form.password, { required: true }), [form.password]);
  const normalizedVerificationEmail = useMemo(() => normalizeSyncEmail(verificationEmail), [verificationEmail]);

  const isValid = !usernameError && !emailError && !passwordError;
  const canSubmit = isValid && !submitting;

  const resetModal = () => {
    setModal({
      open: false,
      title: "",
      message: "",
      primaryText: "OK",
      secondaryText: "",
      onPrimary: null,
      onSecondary: null,
    });
  };

  const openVerificationWaitingModal = () => {
    setModal({
      open: true,
      title: "Підтвердіть email",
      message:
        "Ми очікуємо підтвердження вашої електронної адреси. Після підтвердження ця вкладка оновиться автоматично, і ви зможете перейти до входу.",
      primaryText: "Добре",
      secondaryText: "Надіслати ще раз",
      onPrimary: resetModal,
      onSecondary: handleResendVerification,
    });
  };

  const openVerificationSuccessModal = (email) => {
    const prefillEmail = String(email || verificationEmail || "").trim();

    localStorage.removeItem("lumino_registered_email");

    setModal({
      open: true,
      title: "Пошту підтверджено",
      message: "Пошту успішно підтверджено. Тепер ви можете увійти до свого профілю.",
      primaryText: "До входу",
      secondaryText: "",
      onPrimary: () => {
        resetModal();
        setVerificationEmail("");
        navigate(PATHS.login, {
          state: {
            from: "register",
            prefillEmail,
          },
        });
      },
      onSecondary: null,
    });
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFocus = (field) => () => {
    setFocused((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleBlur = (field) => () => {
    setFocused((prev) => ({
      ...prev,
      [field]: false,
    }));

    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const getPlaceholder = (field, fallback) => {
    if (focused[field]) return "";
    if (form[field]) return "";
    return fallback;
  };

  const getInputClassName = (field, error) => {
    if (!touched[field] || !error) {
      return styles.input;
    }

    return `${styles.input} ${styles.inputError}`;
  };

  const handleBack = () => {
    navigate(PATHS.start);
  };

  const handleGoToLogin = () => {
    navigate(PATHS.login);
  };

  const handleResendVerification = async () => {
    const email = form.email.trim();

    if (!email) {
      resetModal();
      return;
    }

    const res = await authService.resendVerification({ email });

    setModal({
      open: true,
      title: res.ok ? "Лист надіслано повторно" : "Не вдалося надіслати лист",
      message: res.ok
        ? "Ми ще раз надіслали лист для підтвердження email. Перевірте свою пошту."
        : (res.error || "Спробуйте трохи пізніше."),
      primaryText: "Добре",
      secondaryText: res.ok ? "До підтвердження" : "",
      onPrimary: resetModal,
      onSecondary: res.ok ? openVerificationWaitingModal : null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      username: true,
      email: true,
      password: true,
    });

    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);

    try {
      const dto = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        targetLanguageCode: localStorage.getItem("targetLanguage") || null,
        nativeLanguageCode: localStorage.getItem("nativeLanguage") || null,
      };

      const res = await authService.register(dto);

      if (!res.ok) {
        const isConflict = res.status === 409;

        setModal({
          open: true,
          title: isConflict ? "Профіль уже існує" : "Не вдалося створити профіль",
          message: res.error || "Спробуйте ще раз трохи пізніше.",
          primaryText: isConflict ? "До входу" : "OK",
          secondaryText: isConflict ? "Забули пароль?" : "",
          onPrimary: isConflict
            ? () => {
                resetModal();
                navigate(PATHS.login, {
                  state: {
                    from: "start",
                    prefillEmail: dto.email,
                  },
                });
              }
            : null,
          onSecondary: isConflict
            ? () => {
                resetModal();
                navigate(PATHS.forgotPassword, {
                  state: {
                    email: dto.email,
                  },
                });
              }
            : null,
        });
        return;
      }

      window.localStorage.removeItem(VERIFY_SYNC_STORAGE_KEY);
      localStorage.setItem("lumino_registered_email", dto.email);
      setVerificationEmail(dto.email);

      setModal({
        open: true,
        title: "Підтвердіть email",
        message:
          "Ми надіслали лист для підтвердження пошти. Перейдіть у свій email, відкрийте лист і натисніть підтвердження. Після цього ця вкладка оновиться автоматично, і ви зможете увійти у свій профіль.",
        primaryText: "До підтвердження",
        secondaryText: "Надіслати ще раз",
        onPrimary: openVerificationWaitingModal,
        onSecondary: handleResendVerification,
      });
    } catch {
      setModal({
        open: true,
        title: "Помилка",
        message: "Сталася помилка під час реєстрації. Спробуйте ще раз.",
        primaryText: "OK",
        secondaryText: "",
        onPrimary: null,
        onSecondary: null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!normalizedVerificationEmail) {
      return undefined;
    }

    const applySyncPayload = (payload) => {
      if (!isFreshVerifySyncPayload(payload)) {
        return;
      }

      if (payload.email && payload.email !== normalizedVerificationEmail) {
        return;
      }

      openVerificationSuccessModal(verificationEmail);
    };

    applySyncPayload(parseVerifySyncPayload(window.localStorage.getItem(VERIFY_SYNC_STORAGE_KEY)));

    const handleStorage = (event) => {
      if (event.key !== VERIFY_SYNC_STORAGE_KEY) {
        return;
      }

      applySyncPayload(parseVerifySyncPayload(event.newValue));
    };

    let channel = null;
    let handleChannelMessage = null;

    try {
      if (typeof window.BroadcastChannel === "function") {
        channel = new window.BroadcastChannel(VERIFY_SYNC_CHANNEL_NAME);
        handleChannelMessage = (event) => {
          applySyncPayload(event?.data);
        };

        channel.addEventListener("message", handleChannelMessage);
      }
    } catch {
      channel = null;
      handleChannelMessage = null;
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);

      if (channel && handleChannelMessage) {
        channel.removeEventListener("message", handleChannelMessage);
        channel.close();
      }
    };
  }, [normalizedVerificationEmail, verificationEmail, navigate]);

  const handleGoogleClick = () => {
    if (googleReady) {
      const realGoogleButton = googleBtnHostRef.current?.querySelector('[role="button"]');

      if (realGoogleButton) {
        realGoogleButton.click();
        return;
      }
    }

    setModal({
      open: true,
      title: "Google вхід",
      message: "Google кнопка ще завантажується. Спробуйте ще раз за мить.",
      primaryText: "OK",
      secondaryText: "",
      onPrimary: null,
      onSecondary: null,
    });
  };

  return (
    <div className={styles.viewport}>
      <GlassLoading open={submitting} text="Створюємо профіль..." />
      <GlassModal
        open={modal.open}
        title={modal.title}
        message={modal.message}
        onClose={resetModal}
        primaryText={modal.primaryText}
        secondaryText={modal.secondaryText}
        onPrimary={modal.onPrimary}
        onSecondary={modal.onSecondary}
      />

      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <button className={styles.backBtn} type="button" onClick={handleBack}>
          <img className={styles.backIcon} src={ArrowPrev} alt="back" />
        </button>

        <button className={styles.loginLink} type="button" onClick={handleGoToLogin}>
          ВХІД
        </button>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>Створення профілю</h1>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <div className={styles.inputWrap}>
              <input
                className={getInputClassName("username", usernameError)}
                type="text"
                value={form.username}
                onChange={handleChange("username")}
                onFocus={handleFocus("username")}
                onBlur={handleBlur("username")}
                placeholder={getPlaceholder("username", "Ім’я")}
                autoComplete="username"
                maxLength={32}
              />
            </div>

            <div className={styles.inputWrap}>
              <input
                className={getInputClassName("email", emailError)}
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                onFocus={handleFocus("email")}
                onBlur={handleBlur("email")}
                placeholder={getPlaceholder("email", "Електронна адреса")}
                autoComplete="email"
              />
            </div>

            <div className={styles.inputWrap}>
              <input
                className={`${getInputClassName("password", passwordError)} ${styles.passwordInput}`}
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                onFocus={handleFocus("password")}
                onBlur={handleBlur("password")}
                placeholder={getPlaceholder("password", "Пароль")}
                autoComplete="new-password"
              />

              <button
                className={styles.eyeBtn}
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Сховати пароль" : "Показати пароль"}
              >
                <EyeIcon opened={showPassword} />
              </button>
            </div>

            <button className={styles.createBtn} type="submit" disabled={!canSubmit}>
              СТВОРИТИ ПРОФІЛЬ
            </button>
          </form>

          <div className={styles.orWrap}>
            <div className={styles.orLine} />
            <div className={styles.orText}>АБО</div>
            <div className={styles.orLine} />
          </div>

          <div
            className={`${styles.googleBtn} ${googleReady ? "" : styles.googleBtnDisabled}`}
            role="button"
            tabIndex={0}
            onClick={handleGoogleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleGoogleClick();
              }
            }}
          >
            <GoogleIcon />
            <span className={styles.googleText}>УВІЙТИ ЧЕРЕЗ GOOGLE</span>
            <div ref={googleBtnHostRef} className={styles.googleOverlay} />
          </div>
        </div>
      </div>
    </div>
  );
}
