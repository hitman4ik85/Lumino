const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[\p{L}\p{M}\d](?:[\p{L}\p{M}\d ._-]*[\p{L}\p{M}\d])?$/u;

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 32;
const EMAIL_MIN_LENGTH = 5;
const EMAIL_MAX_LENGTH = 256;
const LEGACY_PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;

function hasLetter(value) {
  return /\p{L}/u.test(String(value || ""));
}

function hasDigit(value) {
  return /\d/.test(String(value || ""));
}

export function isValidEmailFormat(value) {
  const email = String(value || "").trim();

  if (!email) {
    return false;
  }

  return EMAIL_RE.test(email);
}

export function validateUsername(value, options = {}) {
  const text = String(value || "").trim();
  const required = Boolean(options.required);

  if (!text) {
    return required ? "Введіть ім'я користувача." : "";
  }

  if (text.length < USERNAME_MIN_LENGTH || text.length > USERNAME_MAX_LENGTH) {
    return `Ім'я користувача має містити від ${USERNAME_MIN_LENGTH} до ${USERNAME_MAX_LENGTH} символів.`;
  }

  if (!hasLetter(text)) {
    return "Ім'я користувача має містити хоча б одну літеру.";
  }

  if (!USERNAME_RE.test(text)) {
    return "Ім'я користувача може містити лише літери, цифри, пробіли, крапки, підкреслення та дефіси.";
  }

  if (text.includes("  ")) {
    return "В імені користувача не може бути кількох пробілів підряд.";
  }

  return "";
}

export function validateEmail(value, options = {}) {
  const email = String(value || "").trim();
  const required = options.required !== false;

  if (!email) {
    return required ? "Введіть електронну адресу." : "";
  }

  if (email.length < EMAIL_MIN_LENGTH || email.length > EMAIL_MAX_LENGTH) {
    return `Електронна адреса має містити від ${EMAIL_MIN_LENGTH} до ${EMAIL_MAX_LENGTH} символів.`;
  }

  if (!isValidEmailFormat(email)) {
    return "Введіть коректну електронну адресу.";
  }

  return "";
}

export function validatePassword(value, options = {}) {
  const password = String(value || "");
  const required = Boolean(options.required);
  const emptyMessage = options.emptyMessage || "Введіть пароль.";

  if (!password.trim()) {
    return required ? emptyMessage : "";
  }

  if (password.length < LEGACY_PASSWORD_MIN_LENGTH) {
    return `Пароль має містити щонайменше ${LEGACY_PASSWORD_MIN_LENGTH} символів.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Пароль має містити не більше ${PASSWORD_MAX_LENGTH} символів.`;
  }

  return "";
}

export function validateNewPassword(value, options = {}) {
  const password = String(value || "");
  const required = Boolean(options.required);
  const emptyMessage = options.emptyMessage || "Введіть пароль.";

  if (!password.trim()) {
    return required ? emptyMessage : "";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Пароль має містити щонайменше ${PASSWORD_MIN_LENGTH} символів.`;
  }

  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Пароль має містити не більше ${PASSWORD_MAX_LENGTH} символів.`;
  }

  if (!hasLetter(password)) {
    return "Пароль має містити хоча б одну літеру.";
  }

  if (!hasDigit(password)) {
    return "Пароль має містити хоча б одну цифру.";
  }

  return "";
}

export function validateNonNegativeInteger(value, label) {
  const text = String(value ?? "").trim();

  if (!text) {
    return "";
  }

  if (!/^\d+$/.test(text)) {
    return `${label} має бути цілим невід'ємним числом.`;
  }

  return "";
}

export function validateAdminUserUniqueness(form, users = [], options = {}) {
  const ignoreUserId = Number(options.ignoreUserId || 0);
  const email = String(form?.email || "").trim().toLowerCase();
  const username = String(form?.username || "").trim().toLowerCase();

  if (!email && !username) {
    return "";
  }

  const normalizedUsers = Array.isArray(users) ? users : [];

  const duplicatedByEmail = normalizedUsers.find((item) => {
    if (Number(item?.id || 0) === ignoreUserId) {
      return false;
    }

    return String(item?.email || "").trim().toLowerCase() === email;
  });

  if (duplicatedByEmail) {
    return "Користувач з таким email уже існує.";
  }

  if (!username) {
    return "";
  }

  const duplicatedByUsername = normalizedUsers.find((item) => {
    if (Number(item?.id || 0) === ignoreUserId) {
      return false;
    }

    return String(item?.username || "").trim().toLowerCase() === username;
  });

  if (duplicatedByUsername) {
    return "Користувач з таким username уже існує.";
  }

  return "";
}

export function validateAdminUserForm(form, options = {}) {
  const isEditMode = Boolean(options.isEditMode);
  const currentUsername = String(options.currentUsername || "").trim();
  const nextUsername = String(form?.username || "").trim();
  const shouldValidateUsername = !isEditMode || nextUsername !== currentUsername;
  const isAdminRole = String(form?.role || "User").trim().toLowerCase() === "admin";
  const usernameError = shouldValidateUsername
    ? validateUsername(form?.username, { required: false })
    : "";

  if (usernameError) {
    return usernameError;
  }

  const emailError = validateEmail(form?.email, { required: true });

  if (emailError) {
    return emailError;
  }

  const uniqueUserError = validateAdminUserUniqueness(form, options.users, {
    ignoreUserId: options.ignoreUserId,
  });

  if (uniqueUserError) {
    return uniqueUserError;
  }

  const passwordError = validateNewPassword(form?.password, {
    required: !isEditMode,
    emptyMessage: "Вкажіть пароль для нового користувача.",
  });

  if (passwordError) {
    return passwordError;
  }

  const pointsError = validateNonNegativeInteger(form?.points, "Бали");

  if (pointsError) {
    return pointsError;
  }

  const crystalsError = validateNonNegativeInteger(form?.crystals, "Кристали");

  if (crystalsError) {
    return crystalsError;
  }

  const heartsError = validateNonNegativeInteger(form?.hearts, "Енергія");

  if (heartsError) {
    return heartsError;
  }

  if (!isAdminRole) {
    const nativeLanguageCode = String(form?.nativeLanguageCode || "").trim();
    const targetLanguageCode = String(form?.targetLanguageCode || "").trim();

    if (nativeLanguageCode && targetLanguageCode && nativeLanguageCode === targetLanguageCode) {
      return "Рідна мова та мова вивчення мають відрізнятися.";
    }

    const selectedCourseIds = Array.isArray(form?.courseIds)
      ? form.courseIds.map((item) => Number(item)).filter(Boolean)
      : [];
    const activeCourseId = form?.activeCourseId ? Number(form.activeCourseId) : 0;

    if (activeCourseId > 0 && !selectedCourseIds.includes(activeCourseId)) {
      return "Активний курс має входити до списку курсів користувача.";
    }
  }

  if (Boolean(form?.isBlocked) && String(form?.blockPreset || "1d") === "custom") {
    const blockedUntilLocal = String(form?.blockedUntilLocal || "").trim();

    if (!blockedUntilLocal) {
      return "Оберіть дату розблокування користувача.";
    }

    const blockedDate = new Date(blockedUntilLocal);

    if (Number.isNaN(blockedDate.getTime()) || blockedDate.getTime() <= Date.now()) {
      return "Дата розблокування має бути пізніше поточного часу.";
    }
  }

  return "";
}

export function validateChangePasswordForm(form) {
  if (!String(form?.oldPassword || "").trim()) {
    return "Введіть поточний пароль.";
  }

  const newPasswordError = validateNewPassword(form?.newPassword, {
    required: true,
    emptyMessage: "Введіть новий пароль.",
  });

  if (newPasswordError) {
    return newPasswordError;
  }

  if (!String(form?.confirmPassword || "").trim()) {
    return "Підтвердіть новий пароль.";
  }

  if (String(form.oldPassword) === String(form.newPassword)) {
    return "Новий пароль має відрізнятися від поточного.";
  }

  if (String(form.newPassword) !== String(form.confirmPassword)) {
    return "Паролі не співпадають.";
  }

  return "";
}
