import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { validateEmail, validatePassword } from "../../../utils/validation.js";
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

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [modal, setModal] = useState({
    open: false,
    title: "",
    message: "",
    primaryText: "OK",
    secondaryText: "",
    onPrimary: null,
    onSecondary: null,
  });

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

  const showLoginModal = (title, message) => {
    setModal({
      open: true,
      title,
      message,
      primaryText: "Добре",
      secondaryText: "",
      onPrimary: () => {
        resetModal();
      },
      onSecondary: null,
    });
  };

  const getLoginFailureModal = (res) => {
    const text = String(res?.error || res?.data?.detail || res?.data?.message || res?.data?.error || "").trim();
    const normalizedText = text.toLowerCase();
    const responseType = String(res?.data?.type || "").trim().toLowerCase();
    const status = Number(res?.status || 0);

    if (responseType === "database_unavailable" || status === 503) {
      return {
        title: "База даних тимчасово недоступна",
        message: "Сервер зараз не зміг підключитися до бази даних. Спробуйте ще раз через кілька секунд.",
      };
    }

    if (responseType === "request_timeout") {
      return {
        title: "Сервер не відповідає",
        message: "Запит виконувався занадто довго. Спробуйте ще раз через кілька секунд.",
      };
    }

    if (responseType === "network_error" || status === 0) {
      return {
        title: "Сервер тимчасово недоступний",
        message: "Не вдалося з'єднатися із сервером. Перевірте інтернет або спробуйте ще раз.",
      };
    }

    if (normalizedText.includes("user not found") || (normalizedText.includes("користувач") && normalizedText.includes("не знайден")) || status === 404) {
      return {
        title: "Користувача не знайдено",
        message: "Користувача з такою електронною адресою немає в базі. Перевірте адресу або зареєструйте новий профіль.",
      };
    }

    if (normalizedText.includes("invalid password") || normalizedText.includes("wrong password") || normalizedText.includes("incorrect password")) {
      return {
        title: "Невірний пароль",
        message: "Пароль для цієї електронної адреси введено невірно. Перевірте пароль і спробуйте ще раз.",
      };
    }

    if (Number(res?.status || 0) === 401) {
      return {
        title: "Не вдалося увійти",
        message: "Електронна адреса або пароль введені невірно. Перевірте дані й спробуйте ще раз.",
      };
    }

    return {
      title: "Не вдалося увійти",
      message: text || "Спробуйте ще раз трохи пізніше.",
    };
  };

  const getSuccessPath = () => {
    return authStorage.isAdmin() ? PATHS.admin : PATHS.home;
  };

  useEffect(() => {
    const stateEmail = String(location.state?.prefillEmail || "").trim();

    if (!stateEmail) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      email: stateEmail,
    }));
  }, [location.state]);

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
            showLoginModal("Не вдалося увійти через Google", "Google не повернув дані для авторизації. Спробуйте ще раз.");
            return;
          }

          setSubmitting(true);

          const res = await authService.oauthGoogle({
            idToken: credential,
            username: null,
          });

          if (!res.ok) {
            const failureModal = getLoginFailureModal(res);
            showLoginModal(failureModal.title, failureModal.message);
            setSubmitting(false);
            return;
          }

          const token = res.data?.token || "";
          const refreshToken = res.data?.refreshToken || "";

          if (!token || !refreshToken) {
            showLoginModal("Не вдалося увійти", "Бекенд не повернув токени авторизації. Спробуйте ще раз трохи пізніше.");
            setSubmitting(false);
            return;
          }

          authStorage.setTokens(token, refreshToken, { clearUserScopedCaches: true, rotateUserCacheNamespace: true });
          setSubmitting(false);
          navigate(getSuccessPath(), { replace: true });
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

  const emailError = useMemo(() => validateEmail(form.email, { required: true }), [form.email]);

  const passwordError = useMemo(() => validatePassword(form.password, { required: true }), [form.password]);

  const isValid = !emailError && !passwordError;
  const canSubmit = isValid && !submitting;

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

    try {
      const res = await authService.login({
        email: form.email.trim(),
        password: form.password,
      });

      if (!res.ok) {
        const text = (res.error || "").toLowerCase();

        if (text.includes("email not verified")) {
          const unverifiedEmail = form.email.trim();

          if (unverifiedEmail) {
            localStorage.setItem("lumino_registered_email", unverifiedEmail);
          }

          setModal({
            open: true,
            title: "Підтвердіть email",
            message:
              "Ваш email ще не підтверджено. Перейдіть у свою пошту, відкрийте лист і підтвердьте адресу, а потім увійдіть знову.",
            primaryText: "До підтвердження",
            secondaryText: "Надіслати ще раз",
            onPrimary: () => {
              resetModal();

              if (unverifiedEmail) {
                navigate(`${PATHS.verifyEmail}?email=${encodeURIComponent(unverifiedEmail)}`);
                return;
              }
            },
            onSecondary: handleResendVerification,
          });
        } else {
          const failureModal = getLoginFailureModal(res);
          showLoginModal(failureModal.title, failureModal.message);
        }

        return;
      }

      const token = res.data?.token || "";
      const refreshToken = res.data?.refreshToken || "";

      if (!token || !refreshToken) {
        showLoginModal("Не вдалося увійти", "Бекенд не повернув токени авторизації. Спробуйте ще раз трохи пізніше.");
        return;
      }

      authStorage.setTokens(token, refreshToken, { clearUserScopedCaches: true, rotateUserCacheNamespace: true });
      navigate(getSuccessPath(), { replace: true });
    } catch {
      showLoginModal("Не вдалося увійти", "Сталася помилка під час входу. Спробуйте ще раз.");
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

    showLoginModal("Google ще завантажується", "Google кнопка ще завантажується. Спробуйте ще раз за мить.");
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
