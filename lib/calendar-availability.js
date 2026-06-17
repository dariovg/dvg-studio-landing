import { icloudConfigured, connectIcloud } from "./icloud-calendar.js";
import {
  parseBookingDateTime,
  listBusinessSlots,
  slotToRange,
  isInPast,
  slotDurationMinutes,
  wallClockToDate,
} from "./booking-utils.js";

/** Mismos calendarios ignorados que en icloud-calendar (cumpleaños/festivos bloqueaban el día entero). */
const SKIP_CALENDAR = /inbox|notification|tasks|archive|birthdays|birthday|holidays|holiday|recyclebin|suggestions|scheduled|reminders/i;

function unfoldIcs(text) {
  return String(text || "").replace(/\r?\n[ \t]/g, "");
}

function parseIcsInstant(value, { year, month, day } = {}) {
  if (!value) return null;
  const v = value.trim();

  if (/^\d{8}$/.test(v)) {
    const y = Number(v.slice(0, 4));
    const mo = Number(v.slice(4, 6));
    const d = Number(v.slice(6, 8));
    const start = wallClockToDate(y, mo, d, 0, 0);
    const end = wallClockToDate(y, mo, d, 23, 59);
    return { start, end, allDay: true };
  }

  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const hour = Number(m[4]);
  const min = Number(m[5]);

  if (m[7]) {
    const start = new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
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

    const startM = part.match(/DTSTART(?:;[^:\r\n]*)?:([^\r\n]+)/i);
    if (!startM) continue;

    const s = parseIcsInstant(startM[1]);
    if (!s) continue;

    const endM = part.match(/DTEND(?:;[^:\r\n]*)?:([^\r\n]+)/i);
    let end = s.end;
    if (endM) {
      const e = parseIcsInstant(endM[1]);
      if (e) end = e.start;
    }
    if (!end) {
      end = new Date(s.start.getTime() + slotDurationMinutes() * 60 * 1000);
    }
    if (s.allDay) {
      const summary = part.match(/SUMMARY:([^\r\n]+)/i)?.[1] || "";
      if (/cumple|birthday|aniversario/i.test(summary)) continue;
      end = new Date(s.end);
    }

    events.push({ start: s.start, end });
  }
  return events;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

async function fetchBusyForDay(client, calendars, dateStr) {
  const p = parseBookingDateTime(dateStr, "00:00");
  if (!p) return [];

  const timeRange = { start: `${p.ymd}T000000`, end: `${p.ymd}T235959` };
  const busy = [];

  const toScan = calendars.filter((c) => {
    const url = c.url || "";
    const label = `${c.displayName || ""} ${url}`.toLowerCase();
    return url && !SKIP_CALENDAR.test(url) && !SKIP_CALENDAR.test(label);
  });

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
  return busyEvents.some((ev) => overlaps(range.start, range.end, ev.start, ev.end));
}

export async function getAvailability({ date, time, maxAlternatives = 5 }) {
  if (!icloudConfigured()) {
    return { ok: false, reason: "sin_calendario", available: true, slots: [] };
  }

  const p = parseBookingDateTime(date, time || "00:00");
  if (!p) return { ok: false, reason: "fecha_invalida", available: false, slots: [] };

  if (time && isInPast(date, time)) {
    return { ok: true, available: false, reason: "pasado", slots: [], alternatives: [] };
  }

  const allowedSlots = listBusinessSlots();
  if (time && !allowedSlots.includes(time)) {
    const alternatives = allowedSlots.filter((t) => !isInPast(date, t)).slice(0, maxAlternatives);
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

  const freeSlots = listBusinessSlots().filter((t) => {
    if (isInPast(date, t)) return false;
    return !isSlotBusy(busy, date, t);
  });

  if (!time) {
    return { ok: true, available: freeSlots.length > 0, slots: freeSlots, busyCount: busy.length };
  }

  const available = !isSlotBusy(busy, date, time);
  const alternatives = available
    ? []
    : freeSlots.filter((t) => t !== time).slice(0, maxAlternatives);

  return {
    ok: true,
    available,
    slots: freeSlots,
    alternatives,
    busyCount: busy.length,
  };
}

export async function assertSlotAvailable(date, time) {
  const result = await getAvailability({ date, time });
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
