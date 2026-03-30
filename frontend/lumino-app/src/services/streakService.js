import { apiClient } from "./apiClient.js";
import { getKyivDateKey } from "../utils/kyivDate.js";

function normalizeStreak(data) {
  if (!data) {
    return null;
  }

  return {
    ...data,
    currentStreakDays: Number(data.currentStreakDays ?? data.current ?? 0),
    bestStreakDays: Number(data.bestStreakDays ?? data.best ?? 0),
  };
}

function normalizeDateValue(value) {
  const raw = String(value || "").trim();

  if (!raw) {
    return "";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const parsed = new Date(raw);

  if (!Number.isNaN(parsed.getTime())) {
    return getKyivDateKey(parsed);
  }

  return raw.slice(0, 10);
}

function normalizeCalendar(data) {
  if (!data) {
    return null;
  }

  const days = Array.isArray(data.days)
    ? data.days.map((item) => ({
        ...item,
        date: normalizeDateValue(item?.date || item?.dateUtc || item?.day || item?.dayUtc || ""),
        active: Boolean(item?.active ?? item?.isActive ?? item?.isCompleted ?? item?.completed),
        isRegistrationDay: Boolean(item?.isRegistrationDay),
      }))
    : [];

  return {
    ...data,
    days,
    daysSinceJoined: Number(data.daysSinceJoined ?? 0),
    registeredAtUtc: data.registeredAtUtc || null,
    currentKyivDateTimeText: String(data.currentKyivDateTimeText || "").trim(),
  };
}

export const streakService = {
  async getMyStreak() {
    const res = await apiClient.get("/streak/me");

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? normalizeStreak(res.data || null) : null,
      error: res.error || "",
    };
  },

  async getMyCalendarMonth(year, month) {
    if (!year || !month) {
      return { ok: false, data: null, error: "Year and month are required" };
    }

    const res = await apiClient.get(`/streak/calendar?year=${Number(year)}&month=${Number(month)}`);

    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? normalizeCalendar(res.data || null) : null,
      error: res.error || "",
    };
  },
};
