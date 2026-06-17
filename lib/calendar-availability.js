import { icloudConfigured, connectIcloud } from "./icloud-calendar.js";
import {
  parseBookingDateTime,
  listBusinessSlots,
  slotToRange,
  isInPast,
  slotDurationMinutes,
  wallClockToDate,
  normalizeTimeSlot,
} from "./booking-utils.js";

/** Calendarios que no reflejan tu agenda real (no bloquean huecos). */
const SKIP_CALENDAR =
  /inbox|notification|tasks|archive|birthdays|birthday|holidays|holiday|recyclebin|suggestions|scheduled|reminders|subscription|subscribed|weather|stocks|analytics/i;

const SKIP_ALL_DAY_SUMMARY =
  /cumple|birthday|aniversario|festivo|holiday|santos?|constitucion|navidad|nochevieja|reyes|trabajo|laborable/i;

function unfoldIcs(text) {
  return String(text || "").replace(/\r?\n[ \t]/g, "");
}

function parseIcsProperty(part, prop) {
  const re = new RegExp(`${prop}([^:]*):([^\\r\\n]+)`, "i");
  const m = part.match(re);
  if (!m) return null;
  const params = m[1] || "";
  const value = m[2].trim();
  const isDateOnly = /VALUE=DATE(?!-)/i.test(params);
  return { params, value, isDateOnly };
}

function parseIcsInstant(value, { isDateOnly = false } = {}) {
  if (!value) return null;
  const v = value.trim();

  if (isDateOnly || /^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const mo = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    return {
      start: wallClockToDate(y, mo, d, 0, 0),
      end: wallClockToDate(y, mo, d, 23, 59),
      allDay: true,
    };
  }

  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hour = Number(m[4]);
  const min = Number(m[5]);

  if (m[7]) {
    const start = new Date(
      Date.UTC(y, mo - 1, d, hour, min, Number(m[6]))
    );
    return { start, end: null, allDay: false };
  }

  const start = wallClockToDate(y, mo, d, hour, min);
  return { start, end: null, allDay: false };
}

function parseIcsEvents(icsText) {
  if (!icsText) return [];
  const events = [];
  const unfolded = unfoldIcs(icsText);
  const parts = unfolded.split(/BEGIN:VEVENT/i).slice(1);

  for (const part of parts) {
    if (/STATUS:\s*CANCELLED/i.test(part)) continue;

    const transp = part.match(/TRANSP:\s*([A-Z]+)/i)?.[1]?.toUpperCase();
    if (transp === "TRANSPARENT") continue;

    const startProp = parseIcsProperty(part, "DTSTART");
    if (!startProp) continue;

    const s = parseIcsInstant(startProp.value, { isDateOnly: startProp.isDateOnly });
    if (!s) continue;

    const summary = part.match(/SUMMARY:([^\r\n]+)/i)?.[1] || "";

    if (s.allDay) {
      if (SKIP_ALL_DAY_SUMMARY.test(summary)) continue;
      // Los eventos de día completo (vacaciones, etc.) no bloquean huecos horarios.
      continue;
    }

    const endProp = parseIcsProperty(part, "DTEND");
    let end = s.end;
    if (endProp) {
      const e = parseIcsInstant(endProp.value, { isDateOnly: endProp.isDateOnly });
      if (e) {
        end = e.allDay ? e.end : e.start;
      }
    }
    if (!end) {
      end = new Date(s.start.getTime() + slotDurationMinutes() * 60 * 1000);
    }
    if (end <= s.start) continue;

    events.push({ start: s.start, end, summary });
  }
  return events;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function addDaysYmd(ymd, delta) {
  const y = Number(ymd.slice(0, 4));
  const mo = Number(ymd.slice(4, 6));
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, mo - 1, d + delta));
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`;
}

function calendarsForBusyCheck(calendars) {
  const only = (process.env.ICLOUD_BUSY_CALENDARS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return calendars.filter((c) => {
    const url = c.url || "";
    const label = `${c.displayName || ""} ${url}`.toLowerCase();
    if (!url || SKIP_CALENDAR.test(url) || SKIP_CALENDAR.test(label)) return false;
    if (only.length) {
      return only.some((name) => label.includes(name));
    }
    return true;
  });
}

async function fetchBusyForDay(client, calendars, dateStr) {
  const p = parseBookingDateTime(dateStr, "00:00");
  if (!p) return [];

  const rangeStart = addDaysYmd(p.ymd, -1);
  const rangeEnd = addDaysYmd(p.ymd, 1);
  const timeRange = { start: `${rangeStart}T000000`, end: `${rangeEnd}T235959` };
  const busy = [];

  const toScan = calendarsForBusyCheck(calendars);
  for (const cal of toScan) {
    try {
      const objects = await client.fetchCalendarObjects({ calendar: cal, timeRange });
      for (const obj of objects) {
        const events = parseIcsEvents(obj.data);
        for (const ev of events) {
          busy.push(ev);
        }
      }
    } catch (err) {
      console.error("fetchCalendarObjects:", cal.url, err.message);
    }
  }
  return busy;
}

function isSlotBusy(busyEvents, dateStr, timeStr) {
  const range = slotToRange(dateStr, timeStr);
  if (!range) return true;
  return busyEvents.some((ev) =>
    overlaps(range.start, range.end, ev.start, ev.end)
  );
}

export async function getAvailability({ date, time, maxAlternatives = 5 }) {
  if (!icloudConfigured()) {
    return { ok: false, reason: "sin_calendario", available: true, slots: [] };
  }

  const normalizedTime = time ? normalizeTimeSlot(time) : null;
  if (time && !normalizedTime) {
    return { ok: false, reason: "hora_invalida", available: false, slots: [] };
  }

  const p = parseBookingDateTime(date, normalizedTime || "00:00");
  if (!p) return { ok: false, reason: "fecha_invalida", available: false, slots: [] };

  if (normalizedTime && isInPast(date, normalizedTime)) {
    return { ok: true, available: false, reason: "pasado", slots: [], alternatives: [] };
  }

  const allowedSlots = listBusinessSlots();
  if (normalizedTime && !allowedSlots.includes(normalizedTime)) {
    const alternatives = allowedSlots
      .filter((t) => !isInPast(date, t))
      .slice(0, maxAlternatives);
    return {
      ok: true,
      available: false,
      reason: "fuera_horario",
      slots: allowedSlots.filter((t) => !isInPast(date, t)),
      alternatives,
    };
  }

  const { client, calendars } = await connectIcloud();
  const busy = await fetchBusyForDay(client, calendars, date);

  const freeSlots = allowedSlots.filter((t) => {
    if (isInPast(date, t)) return false;
    return !isSlotBusy(busy, date, t);
  });

  if (!normalizedTime) {
    return { ok: true, available: freeSlots.length > 0, slots: freeSlots, busyCount: busy.length };
  }

  const available = !isSlotBusy(busy, date, normalizedTime);
  const alternatives = available
    ? []
    : freeSlots.filter((t) => t !== normalizedTime).slice(0, maxAlternatives);

  return {
    ok: true,
    available,
    time: normalizedTime,
    slots: freeSlots,
    alternatives,
    busyCount: busy.length,
  };
}

export async function assertSlotAvailable(date, time) {
  const normalized = normalizeTimeSlot(time) || time;
  const result = await getAvailability({ date, time: normalized });
  if (!result.ok && result.reason === "sin_calendario") {
    return { available: true, alternatives: [] };
  }
  if (!result.ok) {
    return { available: false, alternatives: [], error: result.reason };
  }
  return {
    available: result.available,
    alternatives: result.alternatives || [],
    slots: result.slots || [],
  };
}
