import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { authService } from "../../../services/authService.js";
import { authStorage } from "../../../services/authStorage.js";
import Modal from "../../../components/common/Modal/Modal.jsx";
import styles from "./RegisterPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg2-left.webp";
import BgRight from "../../../assets/backgrounds/bg2-right.webp";
import ArrowPrev from "../../../assets/icons/arrow-previous.svg";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "356032698202-a51919qlrad2bhf4384ldl429qan5nad.apps.googleusercontent.com";

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
      G
    </span>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
            return;
          }

          authStorage.setTokens(token, refreshToken);
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
      initGoogle();
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = "true";
    script.onload = initGoogle;
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [navigate, form.username]);

  const usernameError = useMemo(() => {
    const value = form.username.trim();

    if (!value) return "Введіть ім'я.";
    if (value.length < 2) return "Ім'я має містити щонайменше 2 символи.";
    if (value.length > 32) return "Ім'я має містити не більше 32 символів.";

    return "";
  }, [form.username]);

  const emailError = useMemo(() => {
    const value = form.email.trim();

    if (!value) return "Введіть електронну адресу.";
    if (!EMAIL_RE.test(value)) return "Введіть коректну електронну адресу.";

    return "";
  }, [form.email]);

  const passwordError = useMemo(() => {
    const value = form.password;

    if (!value) return "Введіть пароль.";
    if (value.length < 6) return "Пароль має містити щонайменше 6 символів.";

    return "";
  }, [form.password]);

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
    navigate(location.state?.backTo || PATHS.onboardingPreCreateProf);
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
      secondaryText: "",
      onPrimary: () => {
        resetModal();
        navigate(PATHS.login);
      },
      onSecondary: null,
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
        setModal({
          open: true,
          title: "Не вдалося створити профіль",
          message: res.error || "Спробуйте ще раз трохи пізніше.",
          primaryText: "OK",
          secondaryText: "",
          onPrimary: null,
          onSecondary: null,
        });
        return;
      }

      localStorage.setItem("lumino_registered_email", dto.email);

      setModal({
        open: true,
        title: "Підтвердіть email",
        message:
          "Ми надіслали лист для підтвердження пошти. Перейдіть у свій email, відкрийте лист і натисніть підтвердження. Після цього ви зможете увійти у свій профіль.",
        primaryText: "До входу",
        secondaryText: "Надіслати ще раз",
        onPrimary: () => {
          resetModal();
          navigate(PATHS.login);
        },
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
      <Modal
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
              {submitting ? "СТВОРЕННЯ..." : "СТВОРИТИ ПРОФІЛЬ"}
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
