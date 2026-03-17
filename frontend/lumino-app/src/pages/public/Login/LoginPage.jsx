import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import { authService } from "../../../services/authService.js";
import { authStorage } from "../../../services/authStorage.js";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import styles from "./LoginPage.module.css";

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
      <span className={styles.googleIconCircle}>
        <span className={styles.googleIconLetter}>G</span>
      </span>
    </span>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const navigate = useNavigate();
  const stageRef = useRef(null);
  const googleBtnHostRef = useRef(null);

  useStageScale(stageRef, { mode: "absolute" });

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [focused, setFocused] = useState({
    email: false,
    password: false,
  });

  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [errorText, setErrorText] = useState("");
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
            setErrorText("Не вдалося виконати вхід через Google.");
            return;
          }

          setSubmitting(true);

          const res = await authService.oauthGoogle({
            idToken: credential,
            username: null,
          });

          if (!res.ok) {
            setErrorText(res.error || "Не вдалося виконати вхід через Google.");
            setSubmitting(false);
            return;
          }

          const token = res.data?.token || "";
          const refreshToken = res.data?.refreshToken || "";

          if (!token || !refreshToken) {
            setErrorText("Бекенд не повернув токени авторизації.");
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
  }, [navigate]);

  const emailError = useMemo(() => {
    const value = form.email.trim();

    if (!value) return "Введіть електронну адресу.";
    if (!EMAIL_RE.test(value)) return "Введіть дійсну адресу ел. пошти.";

    return "";
  }, [form.email]);

  const passwordError = useMemo(() => {
    const value = form.password;

    if (!value) return "Введіть пароль.";
    if (value.length < 6) return "Пароль має містити щонайменше 6 символів.";

    return "";
  }, [form.password]);

  const isValid = !emailError && !passwordError;
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

    setErrorText("");
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

  const handleGoToRegister = () => {
    navigate(PATHS.register, {
      state: {
        backTo: PATHS.start,
      },
    });
  };

  const handleForgotPassword = () => {
    navigate(PATHS.forgotPassword);
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
      },
      onSecondary: null,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setTouched({
      email: true,
      password: true,
    });

    if (!isValid || submitting) {
      return;
    }

    setSubmitting(true);
    setErrorText("");

    try {
      const res = await authService.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (!res.ok) {
        const text = (res.error || "").toLowerCase();

        if (text.includes("email not verified")) {
          setModal({
            open: true,
            title: "Підтвердіть email",
            message:
              "Ваш email ще не підтверджено. Перейдіть у свою пошту, відкрийте лист і підтвердьте адресу, а потім увійдіть знову.",
            primaryText: "Добре",
            secondaryText: "Надіслати ще раз",
            onPrimary: () => {
              resetModal();
            },
            onSecondary: handleResendVerification,
          });
        } else {
          setErrorText("Невірна електронна адреса або пароль.");
        }

        return;
      }

      const token = res.data?.token || "";
      const refreshToken = res.data?.refreshToken || "";

      if (!token || !refreshToken) {
        setErrorText("Бекенд не повернув токени авторизації.");
        return;
      }

      authStorage.setTokens(token, refreshToken);
      navigate(PATHS.home);
    } catch {
      setErrorText("Сталася помилка під час входу. Спробуйте ще раз.");
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

    setErrorText("Google кнопка ще завантажується. Спробуйте ще раз за мить.");
  };

  return (
    <div className={styles.viewport}>
      <GlassLoading open={submitting} text="Виконуємо вхід..." />
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

        <button className={styles.registerLink} type="button" onClick={handleGoToRegister}>
          РЕЄСТРАЦІЯ
        </button>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>З поверненням!</h1>
          <p className={styles.subtitle}>Готові продовжити свій шлях навчання?</p>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
                autoComplete="current-password"
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

            <button className={styles.forgotLink} type="button" onClick={handleForgotPassword}>
              Забули пароль?
            </button>

            <button className={styles.loginBtn} type="submit" disabled={!canSubmit}>
              УВІЙТИ
            </button>

            {!!errorText && <div className={styles.inlineError}>{errorText}</div>}
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
