import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { useStageScale } from "../../../hooks/useStageScale.js";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import { authService } from "../../../services/authService.js";
import styles from "./VerifyEmailPage.module.css";

import BgLeft from "../../../assets/backgrounds/bg2-left.webp";
import BgRight from "../../../assets/backgrounds/bg2-right.webp";
import ArrowPrev from "../../../assets/icons/arrow-previous.svg";

const VERIFY_SYNC_STORAGE_KEY = "lumino_verify_email_sync";
const VERIFY_SYNC_CHANNEL_NAME = "lumino-verify-email-sync";
const VERIFY_SYNC_MAX_AGE_MS = 5 * 60 * 1000;

function normalizeSyncEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function createVerifySyncPayload(email) {
  return {
    type: "email-verified",
    email: normalizeSyncEmail(email),
    at: Date.now(),
  };
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

function notifyAboutVerifiedEmail(email) {
  const payload = createVerifySyncPayload(email);

  try {
    window.localStorage.setItem(VERIFY_SYNC_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors
  }

  try {
    if (typeof window.BroadcastChannel === "function") {
      const channel = new window.BroadcastChannel(VERIFY_SYNC_CHANNEL_NAME);
      channel.postMessage(payload);
      channel.close();
    }
  } catch {
    // ignore channel errors
  }
}

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const stageRef = useRef(null);
  const autoVerifyStartedRef = useRef(false);

  useStageScale(stageRef, { mode: "absolute" });

  const token = params.get("token") || "";
  const emailFromQuery = params.get("email") || "";
  const storedEmail = localStorage.getItem("lumino_registered_email") || "";
  const email = String(emailFromQuery || storedEmail || "").trim();
  const normalizedEmail = useMemo(() => normalizeSyncEmail(email), [email]);

  const [status, setStatus] = useState(() => ({
    type: token.trim() ? "idle" : "info",
    message: token.trim()
      ? "Ми готові підтвердити вашу електронну адресу."
      : "Ми підготували сторінку підтвердження. Перевірте пошту або надішліть лист ще раз.",
  }));
  const [resending, setResending] = useState(false);

  const canVerify = useMemo(() => token.trim().length > 0, [token]);
  const canResend = useMemo(() => email.length > 0 && !resending, [email, resending]);

  useEffect(() => {
    if (!emailFromQuery.trim()) {
      return;
    }

    localStorage.setItem("lumino_registered_email", emailFromQuery.trim());
  }, [emailFromQuery]);

  const mapVerifyError = (errorText) => {
    const text = String(errorText || "").toLowerCase();

    if (text.includes("invalid token")) {
      return "Посилання для підтвердження недійсне або вже застаріло.";
    }

    if (text.includes("token expired")) {
      return "Термін дії посилання вже минув. Надішліть лист ще раз.";
    }

    if (text.includes("token already used")) {
      return "Це посилання вже було використане. Якщо потрібно, надішліть лист повторно.";
    }

    if (text.includes("already verified")) {
      return "Цю електронну адресу вже підтверджено. Можете увійти у профіль.";
    }

    return errorText || "Не вдалося підтвердити пошту.";
  };

  const applyVerifiedState = () => {
    localStorage.removeItem("lumino_registered_email");
    setStatus({
      type: "success",
      message: "Пошту успішно підтверджено. Тепер ви можете увійти до свого профілю.",
    });
  };

  const shouldApplyVerifiedSync = (payload) => {
    if (!isFreshVerifySyncPayload(payload)) {
      return false;
    }

    if (!payload.email) {
      return true;
    }

    if (!normalizedEmail) {
      return true;
    }

    return payload.email === normalizedEmail;
  };

  const handleVerify = async () => {
    if (!canVerify) {
      setStatus({
        type: "info",
        message: email
          ? "Ми чекаємо, коли ви відкриєте лист із підтвердженням. За потреби можна надіслати його ще раз."
          : "Посилання для підтвердження не знайдено або воно вже неактуальне.",
      });
      return;
    }

    setStatus({ type: "loading", message: "Підтверджуємо вашу електронну адресу..." });

    const res = await authService.verifyEmail({ token: token.trim() });

    if (res.ok) {
      notifyAboutVerifiedEmail(email);
      applyVerifiedState();
      return;
    }

    setStatus({
      type: "error",
      message: mapVerifyError(res.error),
    });
  };

  const handleResend = async () => {
    if (!canResend) {
      return;
    }

    setResending(true);

    try {
      const res = await authService.resendVerification({ email });

      setStatus({
        type: res.ok ? "success" : "error",
        message: res.ok
          ? "Ми знову надіслали лист для підтвердження на вашу електронну адресу. Перевірте пошту."
          : (res.error || "Не вдалося надіслати лист повторно. Спробуйте трохи пізніше."),
      });
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!canVerify || autoVerifyStartedRef.current) {
      return;
    }

    autoVerifyStartedRef.current = true;
    handleVerify();
  }, [canVerify]);

  useEffect(() => {
    const applySyncPayload = (payload) => {
      if (!shouldApplyVerifiedSync(payload)) {
        return;
      }

      applyVerifiedState();
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
          const payload = event?.data;

          if (!isFreshVerifySyncPayload(payload)) {
            return;
          }

          applySyncPayload(payload);
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
  }, [normalizedEmail]);

  const primaryButtonText = status.type === "success" ? "ДО ВХОДУ" : "ПІДТВЕРДИТИ";
  const showCompactActions = !email;

  return (
    <div className={styles.viewport}>
      <GlassLoading open={status.type === "loading" || resending} text={resending ? "Надсилаємо лист..." : "Підтверджуємо пошту..."} />

      <div ref={stageRef} className={styles.stage}>
        <img className={styles.bgLeft} src={BgLeft} alt="" />
        <img className={styles.bgRight} src={BgRight} alt="" />

        <button className={styles.backBtn} type="button" onClick={() => navigate(PATHS.login)}>
          <img className={styles.backIcon} src={ArrowPrev} alt="back" />
        </button>

        <button className={styles.loginLink} type="button" onClick={() => navigate(PATHS.login)}>
          УВІЙТИ
        </button>

        <div className={styles.formWrap}>
          <h1 className={styles.title}>Підтвердження пошти</h1>
          <p className={styles.subtitle}>
            Завершіть підтвердження електронної адреси,
            <br />
            щоб увійти до вашого профілю.
          </p>

          {email ? (
            <div className={styles.emailBox}>
              <div className={styles.emailLabel}>Електронна адреса</div>
              <div className={styles.emailValue}>{email}</div>
            </div>
          ) : null}

          <div className={`${styles.statusBox} ${status.type === "success" ? styles.statusSuccess : ""} ${status.type === "error" ? styles.statusError : ""}`}>
            {status.message}
          </div>

          <div className={`${styles.actions} ${showCompactActions ? styles.actionsCompact : ""}`}>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={() => {
                if (status.type === "success") {
                  navigate(PATHS.login);
                  return;
                }

                handleVerify();
              }}
              disabled={status.type === "loading" || !canVerify}
            >
              {primaryButtonText}
            </button>

            <button
              className={styles.secondaryBtn}
              type="button"
              onClick={handleResend}
              disabled={!canResend}
            >
              НАДІСЛАТИ ЩЕ РАЗ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
