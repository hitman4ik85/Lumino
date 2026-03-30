const KYIV_TIME_ZONE = "Europe/Kyiv";

function formatParts(value = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KYIV_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(value);
  const year = Number(parts.find((item) => item.type === "year")?.value || 0);
  const month = Number(parts.find((item) => item.type === "month")?.value || 0);
  const day = Number(parts.find((item) => item.type === "day")?.value || 0);

  return { year, month, day };
}


function formatDateTimeParts(value = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: KYIV_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(value);
  const year = Number(parts.find((item) => item.type === "year")?.value || 0);
  const month = Number(parts.find((item) => item.type === "month")?.value || 0);
  const day = Number(parts.find((item) => item.type === "day")?.value || 0);
  const hour = Number(parts.find((item) => item.type === "hour")?.value || 0);
  const minute = Number(parts.find((item) => item.type === "minute")?.value || 0);

  return { year, month, day, hour, minute };
}

export function getKyivDateKey(value = new Date()) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const { year, month, day } = formatParts(date);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getKyivCurrentMonth() {
  const { year, month } = formatParts(new Date());
  return { year, month };
}

export function getKyivTodayIso() {
  return getKyivDateKey(new Date());
}

export function getKyivDaysBetween(startValue, endValue = new Date()) {
  const startIso = getKyivDateKey(startValue);
  const endIso = getKyivDateKey(endValue);

  if (!startIso || !endIso) {
    return 0;
  }

  const start = new Date(`${startIso}T00:00:00Z`);
  const end = new Date(`${endIso}T00:00:00Z`);
  const diff = Math.floor((end.getTime() - start.getTime()) / 86400000);

  return diff >= 0 ? diff + 1 : 0;
}

export function getKyivMonthLabel(year, month, locale = "uk-UA") {
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, 1, 12, 0, 0));

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, {
    timeZone: KYIV_TIME_ZONE,
    month: "long",
  }).format(date);
}

export function getKyivWeekDayIndex(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 0;
  }

  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: KYIV_TIME_ZONE,
    weekday: "short",
  }).format(date);

  const map = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 0,
  };

  return map[label] ?? 0;
}


export function formatKyivDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const { year, month, day, hour, minute } = formatDateTimeParts(date);

  return `${String(day).padStart(2, "0")}.${String(month).padStart(2, "0")}.${year} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function getKyivDayDifference(fromValue, toValue = new Date()) {
  const fromIso = getKyivDateKey(fromValue);
  const toIso = getKyivDateKey(toValue);

  if (!fromIso || !toIso) {
    return 0;
  }

  const from = new Date(`${fromIso}T00:00:00Z`);
  const to = new Date(`${toIso}T00:00:00Z`);

  return Math.round((to.getTime() - from.getTime()) / 86400000);
}
