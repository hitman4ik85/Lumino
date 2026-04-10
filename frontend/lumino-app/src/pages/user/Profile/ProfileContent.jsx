import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { PATHS } from "../../../routes/paths.js";
import { validateChangePasswordForm, validatePassword, validateUsername } from "../../../utils/validation.js";
import { authStorage } from "../../../services/authStorage.js";
import { authService } from "../../../services/authService.js";
import { userService } from "../../../services/userService.js";
import { onboardingService } from "../../../services/onboardingService.js";
import { profileService } from "../../../services/profileService.js";
import { avatarsService } from "../../../services/avatarsService.js";
import GlassLoading from "../../../components/common/GlassLoading/GlassLoading.jsx";
import GlassModal from "../../../components/common/GlassModal/GlassModal.jsx";
import styles from "./ProfilePage.module.css";
import { getKyivDateKey, getKyivWeekDayIndex } from "../../../utils/kyivDate.js";

import HeaderCrystal from "../../../assets/home/header/crystal.svg";
import HeaderEnergy from "../../../assets/home/header/energy.svg";
import HeaderStreak from "../../../assets/home/header/streak.svg";
import FlagEn from "../../../assets/flags/flag-en.svg";
import FlagDe from "../../../assets/flags/flag-de.svg";
import FlagIt from "../../../assets/flags/flag-it.svg";
import FlagEs from "../../../assets/flags/flag-es.svg";
import FlagFr from "../../../assets/flags/flag-fr.svg";
import FlagPl from "../../../assets/flags/flag-pl.svg";
import FlagJa from "../../../assets/flags/flag-ja.svg";
import FlagKo from "../../../assets/flags/flag-ko.svg";
import FlagZh from "../../../assets/flags/flag-zn.svg";
import PointsIcon from "../../../assets/home/shared/points.svg";
import LightThemeIcon from "../../../assets/icons/theme/light_theme.svg";
import DarkThemeIcon from "../../../assets/icons/theme/dark_theme.svg";
import PencilIcon from "../../../assets/profile/pencil-icon.svg";

const FLAG_MAP = {
  en: FlagEn,
  de: FlagDe,
  it: FlagIt,
  es: FlagEs,
  fr: FlagFr,
  pl: FlagPl,
  ja: FlagJa,
  ko: FlagKo,
  zh: FlagZh,
};

const LANGUAGE_LABELS = {
  en: "Англійська",
  de: "Німецька",
  it: "Італійська",
  es: "Іспанська",
  fr: "Французька",
  pl: "Польська",
  ja: "Японська",
  ko: "Корейська",
  zh: "Китайська",
};

const SETTINGS_ITEMS = [
  { key: "parameters", label: "Параметри" },
  { key: "myData", label: "Мої дані" },
  { key: "changePassword", label: "Зміна пароля" },
  { key: "languages", label: "Мови" },
  { key: "linkedAccounts", label: "Зв'язані облікові записи" },
];

function normalizeCode(code) {
  return String(code || "").trim().toLowerCase();
}

function getFlagByCode(code) {
  return FLAG_MAP[normalizeCode(code)] || FlagEn;
}

function getLanguageLabel(code) {
  return LANGUAGE_LABELS[normalizeCode(code)] || String(code || "").toUpperCase();
}

function getLanguageDisplayText(item, fallbackCode) {
  if (item?.title) {
    return getLanguageLabel(item.code || fallbackCode || item.title);
  }

  return getLanguageLabel(fallbackCode || item?.code);
}

function formatRegistrationDate(value) {
  const iso = getKyivDateKey(value);

  if (!iso) {
    return "";
  }

  const [year, month, day] = iso.split("-");

  return `${day}.${month}.${year}`;
}

function formatProfileName(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "User";
  }

  return text
    .replace(/[_-]+/g, " ")
    .replace(/([a-zа-яіїєґ])([A-ZА-ЯІЇЄҐ])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
}

function getApiBaseUrl() {
  return String(import.meta.env.VITE_API_BASE_URL || "/api").trim();
}

function getApiOrigin() {
  const apiBaseUrl = getApiBaseUrl();

  if (apiBaseUrl.startsWith("http://") || apiBaseUrl.startsWith("https://")) {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
}

function appendAvatarVersion(url) {
  if (!url || !/\/avatars\//i.test(url)) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}v=20260316`;
}

function resolveAssetUrl(url) {
  if (!url) return "";

  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return appendAvatarVersion(url);
  }

  const apiOrigin = getApiOrigin();

  if (url.startsWith("/")) {
    return appendAvatarVersion(`${apiOrigin}${url}`);
  }

  if (url.startsWith("api/") || url.startsWith("uploads/") || url.startsWith("files/") || url.startsWith("avatars/")) {
    return appendAvatarVersion(`${apiOrigin}/${url.replace(/^\//, "")}`);
  }

  return url;
}

function getAvatarValue(item) {
  if (!item) return "";

  if (typeof item === "string") {
    return item;
  }

  return item.avatarUrl || item.url || item.imageUrl || item.src || "";
}

function getChartMax(values) {
  const max = Math.max(...values, 0);

  if (max <= 750) return 750;

  return Math.ceil(max / 250) * 250;
}

function buildChartSeries(week, previousWeek) {
  const weekMap = new Map((Array.isArray(week) ? week : []).map((item) => [getKyivDateKey(item?.dateUtc), Number(item?.points || 0)]));
  const prevMap = new Map((Array.isArray(previousWeek) ? previousWeek : []).map((item) => [getKyivDateKey(item?.dateUtc), Number(item?.points || 0)]));
  const todayIso = getKyivDateKey(new Date());
  const [todayYear, todayMonth, todayDay] = todayIso.split("-").map(Number);
  const day = getKyivWeekDayIndex(new Date());
  const mondayShift = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay + mondayShift, 12, 0, 0));
  const current = [];
  const previous = [];

  for (let i = 0; i < 7; i += 1) {
    const currentDate = new Date(monday.getTime() + (i * 86400000));
    const prevDate = new Date(monday.getTime() + ((i - 7) * 86400000));
    current.push(weekMap.get(getKyivDateKey(currentDate)) || 0);
    previous.push(prevMap.get(getKyivDateKey(prevDate)) || 0);
  }

  return { current, previous };
}

function Chart({ currentWeek, previousWeek }) {
  const width = 735;
  const height = 248;
  const left = 70;
  const right = 20;
  const top = 12;
  const bottom = 24;
  const innerWidth = width - left - right;
  const innerHeight = height - top - bottom;
  const maxValue = getChartMax([...currentWeek, ...previousWeek]);
  const steps = [0, 1, 2, 3].map((index) => Math.round((maxValue / 3) * index)).reverse();
  const xStep = innerWidth / 6;

  const getX = (index) => left + index * xStep;
  const getY = (value) => top + innerHeight - (Number(value || 0) / maxValue) * innerHeight;
  const buildLine = (items) => items.map((item, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getY(item)}`).join(" ");

  return (
    <svg className={styles.chartSvg} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Прогрес за тиждень">
      {steps.map((item, index) => (
        <g key={item}>
          <text x="18" y={top + index * (innerHeight / 3) + 8} className={styles.chartAxisLabel}>{item}</text>
          <line x1={left} y1={top + index * (innerHeight / 3)} x2={width - right} y2={top + index * (innerHeight / 3)} className={styles.chartGrid} />
        </g>
      ))}

      <path d={buildLine(previousWeek)} className={styles.chartLinePrevious} />
      {previousWeek.map((item, index) => (
        <circle key={`prev-${index}`} cx={getX(index)} cy={getY(item)} r="7.5" className={styles.chartPointPrevious} />
      ))}

      <path d={buildLine(currentWeek)} className={styles.chartLineCurrent} />
      {currentWeek.map((item, index) => (
        <circle key={`cur-${index}`} cx={getX(index)} cy={getY(item)} r="8.5" className={styles.chartPointCurrent} />
      ))}
    </svg>
  );
}


function PasswordEyeIcon({ opened = false }) {
  return (
    <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M1.66699 10.5003C3.05643 7.24622 6.28685 5.00033 10.0003 5.00033C13.7138 5.00033 16.9442 7.24622 18.3337 10.5003C16.9442 13.7544 13.7138 16.0003 10.0003 16.0003C6.28685 16.0003 3.05643 13.7544 1.66699 10.5003Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10.0003" cy="10.5003" r="3.16667" stroke="currentColor" strokeWidth="1.5"/>
      {!opened ? <path d="M2.5 18.0003L17.5 3.00033" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/> : null}
    </svg>
  );
}

export default function ProfileContent({ onProfileChange = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [modal, setModal] = useState({ open: false });
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [languages, setLanguages] = useState([]);
  const [activeTargetLanguageCode, setActiveTargetLanguageCode] = useState("");
  const [weeklyProgress, setWeeklyProgress] = useState({ currentWeek: [], previousWeek: [], totalPoints: 0 });
  const [externalLogins, setExternalLogins] = useState([]);
  const [avatars, setAvatars] = useState([]);
  const [activePanel, setActivePanel] = useState("");
  const [myDataForm, setMyDataForm] = useState({ username: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ oldPassword: false, newPassword: false, confirmPassword: false });
  const [deletePassword, setDeletePassword] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const nameInputRef = useRef(null);
  const [stageNode, setStageNode] = useState(null);

  const theme = useMemo(() => {
    if (profile?.theme === "dark") {
      return "dark";
    }

    if (profile?.theme === "light") {
      return "light";
    }

    if (typeof window !== "undefined") {
      const savedTheme = String(localStorage.getItem("lumino_theme") || "").trim().toLowerCase();

      if (savedTheme === "dark" || savedTheme === "light") {
        return savedTheme;
      }

      const bodyTheme = String(document.body?.dataset?.luminoTheme || document.documentElement?.dataset?.luminoTheme || "").trim().toLowerCase();

      if (bodyTheme === "dark" || bodyTheme === "light") {
        return bodyTheme;
      }
    }

    return "light";
  }, [profile?.theme]);
  const profileName = formatProfileName(profile?.username || "User");
  const activeAvatarUrl = useMemo(() => {
    const profileAvatarValue = getAvatarValue(profile?.avatarUrl || profile?.avatar || profile?.selectedAvatarUrl);

    if (profileAvatarValue) {
      return profileAvatarValue;
    }

    if (Array.isArray(avatars) && avatars.length > 0) {
      return getAvatarValue(avatars[0]);
    }

    return "";
  }, [avatars, profile]);
  const isLanguageWarningModal = modal.open && modal.variant === "languageWarning";
  const isDeleteAccountModal = modal.open && (modal.variant === "deleteAccount" || modal.variant === "deleteAccountGoogle");

  useEffect(() => {
    document.documentElement.dataset.luminoTheme = theme;
    document.body.dataset.luminoTheme = theme;
    localStorage.setItem("lumino_theme", theme);
  }, [theme]);

  useEffect(() => {
    setStageNode(document.getElementById("lumino-home-stage"));
  }, []);

  const closeModal = useCallback(() => {
    setDeletePassword("");
    setModal({ open: false });
  }, []);

  useEffect(() => {
    if (!isLanguageWarningModal && !isDeleteAccountModal && !avatarModalOpen) {
      return undefined;
    }

    const handleModalEscape = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (avatarModalOpen) {
        setAvatarModalOpen(false);
        return;
      }

      closeModal();
    };

    window.addEventListener("keydown", handleModalEscape);

    return () => {
      window.removeEventListener("keydown", handleModalEscape);
    };
  }, [avatarModalOpen, closeModal, isDeleteAccountModal, isLanguageWarningModal]);

  const showInfo = useCallback((title, message) => {
    setModal({
      open: true,
      title,
      message,
      primaryText: "Добре",
      secondaryText: "",
      onPrimary: null,
      onSecondary: null,
      variant: "default",
      illustrationSrc: "",
    });
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);

    try {
      const [meRes, languagesRes, weeklyRes, externalLoginsRes, avatarsRes] = await Promise.all([
        userService.getMe(),
        onboardingService.getMyLanguages(),
        profileService.getWeeklyProgress(),
        userService.getExternalLogins(),
        avatarsService.getAll(),
      ]);

      if (!meRes.ok) {
        showInfo("Помилка", meRes.error || "Не вдалося завантажити профіль.");
        return;
      }

      const nextProfile = meRes.data || null;
      setProfile(nextProfile);
      if (typeof onProfileChange === "function") {
        onProfileChange(nextProfile);
      }
      setMyDataForm({ username: nextProfile?.username || "", email: nextProfile?.email || "" });

      if (languagesRes.ok) {
        setLanguages(Array.isArray(languagesRes.learningLanguages) ? languagesRes.learningLanguages : []);
        setActiveTargetLanguageCode(languagesRes.activeTargetLanguageCode || nextProfile?.targetLanguageCode || "");
      } else {
        setLanguages([]);
        setActiveTargetLanguageCode(nextProfile?.targetLanguageCode || "");
      }

      if (weeklyRes?.ok) {
        setWeeklyProgress(weeklyRes.data || { currentWeek: [], previousWeek: [], totalPoints: 0 });
      } else {
        setWeeklyProgress({ currentWeek: [], previousWeek: [], totalPoints: 0 });
      }

      if (externalLoginsRes?.ok) {
        setExternalLogins(Array.isArray(externalLoginsRes.data) ? externalLoginsRes.data : []);
      } else {
        setExternalLogins([]);
      }

      if (avatarsRes?.ok) {
        setAvatars(Array.isArray(avatarsRes.items) ? avatarsRes.items : []);
      } else {
        setAvatars([]);
      }
    } finally {
      setLoading(false);
    }
  }, [showInfo]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const chartSeries = useMemo(() => buildChartSeries(weeklyProgress.currentWeek, weeklyProgress.previousWeek), [weeklyProgress]);
  const activeLanguageItem = useMemo(
    () => languages.find((item) => normalizeCode(item?.code) === normalizeCode(activeTargetLanguageCode)) || null,
    [activeTargetLanguageCode, languages]
  );
  const activeLanguageText = getLanguageDisplayText(activeLanguageItem, activeTargetLanguageCode || profile?.targetLanguageCode);
  const canChangePassword = Boolean(profile?.hasPassword);
  const settingsItems = useMemo(() => SETTINGS_ITEMS.filter((item) => item.key !== "changePassword" || canChangePassword), [canChangePassword]);
  const displayLanguages = useMemo(() => {
    if (Array.isArray(languages) && languages.length > 0) {
      return languages;
    }

    const fallbackCode = activeTargetLanguageCode || profile?.targetLanguageCode || "";

    if (!fallbackCode) {
      return [];
    }

    return [{
      code: fallbackCode,
      title: getLanguageLabel(fallbackCode),
    }];
  }, [activeTargetLanguageCode, languages, profile?.targetLanguageCode]);

  useEffect(() => {
    if (activePanel === "changePassword" && !canChangePassword) {
      setActivePanel("");
    }
  }, [activePanel, canChangePassword]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    setNameDraft(myDataForm.username || "");
  }, [myDataForm.username]);

  const handleStartEditName = useCallback(() => {
    setNameDraft(myDataForm.username || "");
    setEditingName(true);
  }, [myDataForm.username]);

  const handleCancelEditName = useCallback(() => {
    setNameDraft(myDataForm.username || "");
    setEditingName(false);
  }, [myDataForm.username]);

  const handleSaveName = useCallback(async () => {
    if (savingName) {
      return;
    }

    const nextName = String(nameDraft || "").trim();

    const usernameError = validateUsername(nextName, { required: true });

    if (usernameError) {
      showInfo("Увага", usernameError);
      return;
    }

    if (nextName === (myDataForm.username || "")) {
      setEditingName(false);
      return;
    }

    setSavingName(true);

    try {
      const res = await userService.updateProfile({ username: nextName });

      if (!res.ok) {
        showInfo("Помилка", res.error || "Не вдалося змінити ім'я.");
        return;
      }

      const nextProfile = res.data || null;
      setProfile(nextProfile);
      if (typeof onProfileChange === "function") {
        onProfileChange(nextProfile);
      }
      setMyDataForm((prev) => ({ ...prev, username: nextProfile?.username || nextName }));
      setNameDraft(nextProfile?.username || nextName);
      setEditingName(false);
    } finally {
      setSavingName(false);
    }
  }, [myDataForm.username, nameDraft, savingName, showInfo]);

  const handleThemeToggle = useCallback(async () => {
    if (!profile || savingTheme) {
      return;
    }

    const nextTheme = theme === "dark" ? "light" : "dark";
    setSavingTheme(true);

    try {
      const res = await userService.updateProfile({ theme: nextTheme });

      if (!res.ok) {
        showInfo("Помилка", res.error || "Не вдалося змінити тему.");
        return;
      }

      const nextProfile = res.data || { ...profile, theme: nextTheme };
      setProfile(nextProfile);
      if (typeof onProfileChange === "function") {
        onProfileChange(nextProfile);
      }
    } finally {
      setSavingTheme(false);
    }
  }, [profile, savingTheme, showInfo, theme]);

  const handleAvatarSelect = useCallback(async (avatarUrl) => {
    if (!avatarUrl || savingAvatar) {
      return;
    }

    setSavingAvatar(true);

    try {
      const res = await userService.updateProfile({ avatarUrl });

      if (!res.ok) {
        showInfo("Помилка", res.error || "Не вдалося змінити аватар.");
        return;
      }

      const nextProfile = res.data || { ...profile, avatarUrl };
      setProfile(nextProfile);
      if (typeof onProfileChange === "function") {
        onProfileChange(nextProfile);
      }
      setAvatarModalOpen(false);
    } finally {
      setSavingAvatar(false);
    }
  }, [profile, savingAvatar, showInfo]);

  const handleLogout = useCallback(async () => {
    const refreshToken = authStorage.getRefreshToken();

    if (refreshToken) {
      await authService.logout({ refreshToken });
    }

    authStorage.clearTokens();
    navigate(PATHS.login, { replace: true });
  }, [navigate]);

  const handleDeleteAccount = useCallback(() => {
    const isGoogleAccount = Boolean(profile?.isGoogleAccount);
    const hasPassword = Boolean(profile?.hasPassword);
    const requiresDeletePassword = !isGoogleAccount && hasPassword;

    setDeletePassword("");
    setModal({
      open: true,
      title: requiresDeletePassword ? "ВИДАЛИТИ АКАУНТ" : "ВИДАЛИТИ АКАУНТ?",
      message: requiresDeletePassword
        ? "Для підтвердження введіть пароль від вашого акаунту."
        : "Ви дійсно бажаєте видалити акаунт?",
      primaryText: "Видалити",
      secondaryText: "Скасувати",
      onPrimary: null,
      onSecondary: closeModal,
      variant: requiresDeletePassword ? "deleteAccount" : "deleteAccountGoogle",
      illustrationSrc: "",
    });
  }, [closeModal, profile?.hasPassword, profile?.isGoogleAccount]);

  const handleDeleteAccountConfirm = useCallback(async () => {
    const isGoogleAccount = Boolean(profile?.isGoogleAccount);
    const hasPassword = Boolean(profile?.hasPassword);
    const requiresDeletePassword = !isGoogleAccount && hasPassword;

    if (requiresDeletePassword) {
      const deletePasswordError = validatePassword(deletePassword, { required: true, emptyMessage: "Введіть пароль, щоб видалити акаунт." });

      if (deletePasswordError) {
        showInfo("Увага", deletePasswordError);
        return;
      }
    }

    setDeletingAccount(true);

    try {
      const res = await userService.deleteAccount({ password: requiresDeletePassword ? deletePassword : "" });

      if (!res.ok) {
        showInfo("Помилка", res.error || "Не вдалося видалити акаунт.");
        return;
      }

      authStorage.clearTokens();
      navigate(PATHS.start, { replace: true });
    } finally {
      setDeletingAccount(false);
    }
  }, [deletePassword, navigate, profile?.hasPassword, profile?.isGoogleAccount, showInfo]);

  const handleChangePassword = useCallback(async () => {
    const passwordError = validateChangePasswordForm(passwordForm);

    if (passwordError) {
      showInfo("Увага", passwordError);
      return;
    }

    setSavingPassword(true);

    try {
      const res = await userService.changePassword(passwordForm);

      if (!res.ok) {
        showInfo("Помилка", res.error || "Не вдалося змінити пароль.");
        return;
      }

      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      showInfo("Готово", "Пароль успішно змінено.");
    } finally {
      setSavingPassword(false);
    }
  }, [passwordForm, showInfo]);

  const handleRemoveLanguage = useCallback((item) => {
    setModal({
      open: true,
      title: "Хочете закінчити\nвивчати цю мову?",
      message: "",
      primaryText: "Так",
      secondaryText: "Ні",
      onPrimary: async () => {
        setModal({ open: false });
        const res = await onboardingService.removeMyLanguage(item.code);

        if (!res.ok) {
          const isLastLanguageError = res.status === 400 && String(res.error || "").includes("останню мову навчання");

          showInfo(
            isLastLanguageError ? "Увага" : "Помилка",
            res.error || "Не вдалося завершити вивчення мови."
          );
          return;
        }

        localStorage.removeItem("targetLanguage");

        await loadProfile();
      },
      onSecondary: () => setModal({ open: false }),
      variant: "languageWarning",
      illustrationSrc: "",
    });
  }, [loadProfile, showInfo]);

  const renderPanelContent = () => {
    if (activePanel === "parameters") {
      return (
        <div className={styles.panelContent}>
          <div className={styles.panelHeaderRow}>
            <div className={styles.panelTitle}>УРОКИ</div>
            <button type="button" className={styles.panelClose} onClick={() => setActivePanel("")} aria-label="Закрити" />
          </div>

          <div className={styles.parameterRow}>
            <div className={styles.parameterLabel}>Тема</div>
            <button type="button" className={`${styles.themeSwitch} ${theme === "dark" ? styles.themeSwitchDark : ""}`} onClick={handleThemeToggle} disabled={savingTheme}>
              <img className={`${styles.themeIcon} ${styles.themeIconSun}`} src={LightThemeIcon} alt="Світла тема" />
              <span className={`${styles.themeThumb} ${theme === "dark" ? styles.themeThumbDark : ""}`} />
              <img className={`${styles.themeIcon} ${styles.themeIconMoon}`} src={DarkThemeIcon} alt="Темна тема" />
            </button>
          </div>

          <div className={styles.parameterRow}>
            <div className={styles.parameterLabel}>Аватар</div>
            <button type="button" className={styles.changeButton} onClick={() => setAvatarModalOpen(true)}>ЗМІНИТИ</button>
          </div>
        </div>
      );
    }

    if (activePanel === "myData") {
      return (
        <div className={styles.myDataPanel}>
          <div className={`${styles.panelHeaderRow} ${styles.myDataHeaderRow}`}>
            <div className={styles.panelTitle}>МОЇ ДАНІ</div>
            <button type="button" className={`${styles.panelClose} ${styles.myDataClose}`} onClick={() => setActivePanel("")} aria-label="Закрити" />
          </div>

          <div className={styles.myDataLabel}>ІМ'Я</div>
          <div className={`${styles.myDataField} ${styles.myDataFieldWithAction} ${editingName ? styles.myDataFieldEditing : ""}`}>
            {editingName ? (
              <input
                ref={nameInputRef}
                type="text"
                className={styles.myDataFieldInput}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveName();
                  }

                  if (e.key === "Escape") {
                    e.preventDefault();
                    handleCancelEditName();
                  }
                }}
                disabled={savingName}
                maxLength={32}
              />
            ) : (
              <span className={styles.myDataFieldValue}>{formatProfileName(myDataForm.username) || "—"}</span>
            )}

            <button
              type="button"
              className={styles.myDataActionButton}
              aria-label={editingName ? "Зберегти ім'я" : "Редагувати ім'я"}
              onMouseDown={(e) => e.preventDefault()}
              onClick={editingName ? handleSaveName : handleStartEditName}
              disabled={savingName}
            >
              <img className={styles.myDataActionIcon} src={PencilIcon} alt="" aria-hidden="true" />
            </button>
          </div>

          <div className={`${styles.myDataLabel} ${styles.myDataEmailLabel}`}>ЕЛЕКТРОННА ПОШТА</div>
          <div className={styles.myDataField}>
            <span className={styles.myDataFieldValue}>{myDataForm.email || "—"}</span>
          </div>

          <div className={styles.myDataDivider} />

          <button type="button" className={styles.myDataDeleteButton} onClick={handleDeleteAccount} disabled={deletingAccount}>ВИДАЛИТИ АКАУНТ</button>
        </div>
      );
    }

    if (activePanel === "changePassword") {
      return (
        <div className={styles.changePasswordPanel}>
          <div className={`${styles.panelHeaderRow} ${styles.changePasswordHeaderRow}`}>
            <div className={styles.panelTitle}>ЗМІНА ПАРОЛЯ</div>
            <button type="button" className={`${styles.panelClose} ${styles.changePasswordClose}`} onClick={() => setActivePanel("")} aria-label="Закрити" />
          </div>

          <div className={styles.changePasswordLabel}>СТАРИЙ ПАРОЛЬ</div>
          <div className={styles.changePasswordFieldWrap}>
            <input
              className={styles.changePasswordField}
              type={showPassword.oldPassword ? "text" : "password"}
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
            />
            <button
              type="button"
              className={styles.changePasswordToggleButton}
              onClick={() => setShowPassword((prev) => ({ ...prev, oldPassword: !prev.oldPassword }))}
              aria-label={showPassword.oldPassword ? "Сховати старий пароль" : "Показати старий пароль"}
            >
              <PasswordEyeIcon opened={showPassword.oldPassword} />
            </button>
          </div>

          <div className={`${styles.changePasswordLabel} ${styles.changePasswordNextLabel}`}>НОВИЙ ПАРОЛЬ</div>
          <div className={styles.changePasswordFieldWrap}>
            <input
              className={styles.changePasswordField}
              type={showPassword.newPassword ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
            <button
              type="button"
              className={styles.changePasswordToggleButton}
              onClick={() => setShowPassword((prev) => ({ ...prev, newPassword: !prev.newPassword }))}
              aria-label={showPassword.newPassword ? "Сховати новий пароль" : "Показати новий пароль"}
            >
              <PasswordEyeIcon opened={showPassword.newPassword} />
            </button>
          </div>

          <div className={`${styles.changePasswordLabel} ${styles.changePasswordNextLabel}`}>ПІДТВЕРДЬТЕ ПАРОЛЬ</div>
          <div className={styles.changePasswordFieldWrap}>
            <input
              className={styles.changePasswordField}
              type={showPassword.confirmPassword ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            />
            <button
              type="button"
              className={styles.changePasswordToggleButton}
              onClick={() => setShowPassword((prev) => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
              aria-label={showPassword.confirmPassword ? "Сховати підтвердження пароля" : "Показати підтвердження пароля"}
            >
              <PasswordEyeIcon opened={showPassword.confirmPassword} />
            </button>
          </div>

          <div className={styles.changePasswordDivider} />
          <button type="button" className={styles.changePasswordSaveButton} onClick={handleChangePassword} disabled={savingPassword}>ЗБЕРЕГТИ</button>
        </div>
      );
    }

    if (activePanel === "languages") {
      return (
        <div className={styles.panelContent}>
          <div className={styles.panelHeaderRow}>
            <div className={styles.panelTitle}>МОВИ</div>
            <button type="button" className={styles.panelClose} onClick={() => setActivePanel("")} aria-label="Закрити" />
          </div>

          <div className={styles.languageList}>
            {displayLanguages.map((item) => {
              const languageTitle = getLanguageDisplayText(item, item.code);

              return (
                <div key={item.code} className={styles.languageRow}>
                  <div className={styles.languageRowLeft}>
                    <div className={styles.languageRowFlagWrap}>
                      <img className={styles.languageRowFlag} src={getFlagByCode(item.code)} alt="" aria-hidden="true" />
                    </div>
                    <span className={styles.languageRowTitle}>{languageTitle}</span>
                  </div>
                  <button type="button" className={styles.languageDelete} onClick={() => handleRemoveLanguage(item)} aria-label={`Прибрати ${languageTitle}`} />
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (activePanel === "linkedAccounts") {
      const hasGoogle = externalLogins.some((item) => normalizeCode(item?.provider) === "google");

      return (
        <div className={styles.panelContent}>
          <div className={styles.panelHeaderRow}>
            <div className={styles.panelTitle}>ЗВ'ЯЗАНІ ОБЛІКОВІ ЗАПИСИ</div>
            <button type="button" className={styles.panelClose} onClick={() => setActivePanel("")} aria-label="Закрити" />
          </div>

          <div className={styles.linkedAccountRow}>
            <div className={styles.linkedAccountLeft}>
              <div className={styles.googleBadge}>G</div>
              <div className={styles.linkedAccountTitle}>Google</div>
            </div>
            <div className={`${styles.linkedAccountState} ${hasGoogle ? styles.linkedAccountStateActive : ""}`}>
              <span className={`${styles.linkedAccountThumb} ${hasGoogle ? styles.linkedAccountThumbActive : ""}`} aria-hidden="true">
                {hasGoogle ? "✓" : ""}
              </span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={styles.accountActions}>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>ВИЙТИ З ОБЛІКОВОГО ЗАПИСУ</button>
      </div>
    );
  };

  return (
    <div className={`${styles.embeddedViewport} ${theme === "dark" ? styles.viewportDark : ""}`}>
      <GlassLoading open={loading || savingTheme || savingAvatar} text={loading ? "Завантажуємо профіль..." : "Зберігаємо зміни..."} stageTargetId="lumino-home-stage" />
      {!isLanguageWarningModal && !isDeleteAccountModal ? (
        <GlassModal
          open={modal.open}
          title={modal.title}
          message={modal.message}
          onClose={closeModal}
          primaryText={modal.primaryText}
          secondaryText={modal.secondaryText}
          onPrimary={modal.onPrimary}
          onSecondary={modal.onSecondary}
          variant={modal.variant || "default"}
          illustrationSrc={modal.illustrationSrc}
          stageTargetId="lumino-home-stage"
        />
      ) : null}

      {isDeleteAccountModal && stageNode ? createPortal(
        <div className={styles.profileWarningOverlay}>
          <div className={styles.profileWarningBackdrop} role="presentation" />
          <div className={styles.deleteAccountModal} role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.deleteAccountClose} onClick={closeModal} aria-label="Закрити" />

            <div className={styles.deleteAccountContent}>
              <h2 id="delete-account-title" className={styles.deleteAccountTitle}>{modal.title}</h2>
              {modal.message ? <div className={styles.deleteAccountText}>{modal.message}</div> : null}

              {modal.variant === "deleteAccount" ? (
                <input
                  className={styles.deleteAccountInput}
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Введіть пароль"
                />
              ) : null}
            </div>

            <div className={styles.deleteAccountActions}>
              <button type="button" className={`${styles.deleteAccountButton} ${styles.deleteAccountButtonLight}`} onClick={closeModal} disabled={deletingAccount}>
                {String(modal.secondaryText || "Скасувати").toUpperCase()}
              </button>
              <button type="button" className={`${styles.deleteAccountButton} ${styles.deleteAccountButtonDark}`} onClick={handleDeleteAccountConfirm} disabled={deletingAccount}>
                {deletingAccount ? "ВИДАЛЕННЯ..." : String(modal.primaryText || "Видалити").toUpperCase()}
              </button>
            </div>
          </div>
        </div>,
        stageNode
      ) : null}

      {isLanguageWarningModal && stageNode ? createPortal(
        <div className={styles.profileWarningOverlay}>
          <div className={styles.profileWarningBackdrop} role="presentation" />
          <div className={styles.profileWarningModal} role="dialog" aria-modal="true" aria-labelledby="profile-warning-title" onClick={(e) => e.stopPropagation()}>
            <button type="button" className={styles.profileWarningClose} onClick={closeModal} aria-label="Закрити" />

            <div className={styles.profileWarningContentBox}>
              <h2 id="profile-warning-title" className={styles.profileWarningTitle}>{modal.title}</h2>
            </div>

            <div className={styles.profileWarningActions}>
              <button type="button" className={`${styles.profileWarningButton} ${styles.profileWarningButtonLight}`} onClick={modal.onPrimary || closeModal}>
                {String(modal.primaryText || "").toUpperCase()}
              </button>

              {modal.secondaryText ? (
                <button type="button" className={`${styles.profileWarningButton} ${styles.profileWarningButtonDark}`} onClick={modal.onSecondary || closeModal}>
                  {String(modal.secondaryText || "").toUpperCase()}
                </button>
              ) : null}
            </div>
          </div>
        </div>,
        stageNode
      ) : null}

      {avatarModalOpen ? (
        <div className={styles.avatarOverlay}>
          <div className={styles.avatarDialog}>
            <div className={styles.avatarDialogHeader}>
              <div className={styles.avatarDialogTitle}>ОБЕРІТЬ АВАТАР</div>
              <button type="button" className={styles.panelClose} onClick={() => setAvatarModalOpen(false)} aria-label="Закрити" />
            </div>

            <div className={styles.avatarGrid}>
              {avatars.map((item, index) => {
                const avatarValue = getAvatarValue(item);

                return (
                <button
                  key={avatarValue || index}
                  type="button"
                  className={`${styles.avatarOption} ${activeAvatarUrl === avatarValue ? styles.avatarOptionActive : ""}`}
                  onClick={() => handleAvatarSelect(avatarValue)}
                >
                  <img src={resolveAssetUrl(avatarValue)} alt="Аватар" />
                </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <div className={styles.embeddedContent}>
        <section className={styles.profileColumn}>
          <div className={styles.heroCard}>
            <div className={styles.heroName}>{profileName}</div>
            {activeAvatarUrl ? <img className={styles.heroAvatar} src={resolveAssetUrl(activeAvatarUrl)} alt="Аватар користувача" /> : null}
          </div>

          <div className={styles.profileMeta}>@{(profile?.email || "").split("@")[0].toUpperCase()} РЕЄСТРАЦІЯ: {formatRegistrationDate(profile?.createdAt)}</div>
          <div className={styles.topDivider} />

          <div className={styles.statsRow}>
            <div className={`${styles.statCard} ${styles.statCardLanguage}`}>
              <img className={styles.statIconFlag} src={getFlagByCode(activeTargetLanguageCode || profile?.targetLanguageCode)} alt="" aria-hidden="true" />
              <span>{activeLanguageText}</span>
            </div>

            <div className={`${styles.statCard} ${styles.statCardStreak}`}>
              <img className={styles.statIcon} src={HeaderStreak} alt="" aria-hidden="true" />
              <span>{profile?.currentStreakDays || 0} день</span>
            </div>

            <div className={`${styles.statCard} ${styles.statCardPoints}`}>
              <img className={styles.statIcon} src={PointsIcon} alt="" aria-hidden="true" />
              <span>{weeklyProgress.totalPoints || 0} балів</span>
            </div>

            <div className={`${styles.statCard} ${styles.statCardCrystals}`}>
              <img className={styles.statIcon} src={HeaderCrystal} alt="" aria-hidden="true" />
              <span>{profile?.crystals || 0}</span>
            </div>

            <div className={`${styles.statCard} ${styles.statCardEnergy}`}>
              <img className={styles.statIcon} src={HeaderEnergy} alt="" aria-hidden="true" />
              <span>{profile?.hearts || 0}</span>
            </div>
          </div>

          <div className={styles.sectionTitle}>ПРОГРЕС ЗА ТИЖДЕНЬ</div>
          <div className={styles.chartWrap}>
            <Chart currentWeek={chartSeries.current} previousWeek={chartSeries.previous} />
          </div>
          <div className={styles.bottomDivider} />

          <div className={styles.legend}>
            <div className={styles.legendRow}>
              <span className={`${styles.legendDot} ${styles.legendDotPrevious}`} />
              <span className={styles.legendLabel}>Минулий</span>
              <span className={styles.legendValue}>{chartSeries.previous.reduce((sum, item) => sum + item, 0)} балів</span>
            </div>
            <div className={styles.legendRow}>
              <span className={`${styles.legendDot} ${styles.legendDotCurrent}`} />
              <span className={styles.legendLabel}>Цей</span>
              <span className={styles.legendValue}>{chartSeries.current.reduce((sum, item) => sum + item, 0)} балів</span>
            </div>
          </div>
        </section>

        <div className={styles.contentDivider} />

        <aside className={styles.settingsColumn}>
          <div className={styles.settingsTitle}>Налаштування</div>
          <div className={styles.accountTitle}>ОБЛІКОВИЙ ЗАПИС</div>

          <div className={styles.settingsNav}>
            {settingsItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`${styles.settingsButton} ${activePanel === item.key ? styles.settingsButtonActive : ""}`}
                onClick={() => setActivePanel(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.settingsDivider} />
          {renderPanelContent()}
        </aside>
      </div>
    </div>
  );
}
