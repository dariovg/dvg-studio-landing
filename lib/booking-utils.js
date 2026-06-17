/** Hora España en servidor UTC (Vercel). */
export function normalizeTimeSlot(timeStr) {
  const tm = String(timeStr || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);
  if (!tm) return null;
  const h = Number(tm[1]);
  const m = Number(tm[2]);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function tzOffsetMinutes(when = new Date()) {
  const env = process.env.BOOKING_TZ_OFFSET_MINUTES;
  if (env !== undefined && env !== "") return Number(env);
  const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    timeZoneName: "shortOffset",
  }).formatToParts(when);
  const name = parts.find((p) => p.type === "timeZoneName")?.value || "GMT+1";
  const m = name.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?/i);
  if (!m) return 60;
  const sign = m[1] === "+" ? 1 : -1;
  return sign * (Number(m[2]) * 60 + Number(m[3] || 0));
}

export function wallClockToDate(year, month, day, hour, minute) {
  const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0));
  const off = tzOffsetMinutes(anchor);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - off * 60 * 1000);
}

export function parseBookingDateTime(dateStr, timeStr) {
  const dm = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  const tm = timeStr?.match(/^(\d{1,2}):(\d{2})$/);
  if (!dm) return null;
  const day = Number(dm[1]);
  const month = Number(dm[2]);
  const year = Number(dm[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const hour = tm ? Number(tm[1]) : 0;
  const min = tm ? Number(tm[2]) : 0;
  if (tm && (hour > 23 || min > 59)) return null;

  const pad = (n) => String(n).padStart(2, "0");
  const ymd = `${year}${pad(month)}${pad(day)}`;
  const local = tm
    ? `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00`
    : `${year}-${pad(month)}-${pad(day)}T00:00:00`;

  return {
    day,
    month,
    year,
    hour,
    min,
    ymd,
    local,
    start: tm ? `${ymd}T${pad(hour)}${pad(min)}00` : `${ymd}T000000`,
    end: tm
      ? hour + 1 > 23
        ? `${ymd}T235900`
        : `${ymd}T${pad(hour + 1)}${pad(min)}00`
      : `${ymd}T235959`,
  };
}

export function slotDurationMinutes() {
  return Number(process.env.BOOKING_DURATION_MINUTES || 60);
}

export function businessHours() {
  return {
    start: Number(process.env.BOOKING_HOURS_START || 9),
    end: Number(process.env.BOOKING_HOURS_END || 18),
  };
}

export function formatTime(h, m = 0) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function listBusinessSlots() {
  const { start, end } = businessHours();
  const duration = slotDurationMinutes();
  const slots = [];
  for (let minutes = start * 60; minutes + duration <= end * 60; minutes += duration) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    slots.push(formatTime(h, m));
  }
  return slots;
}

export function slotToRange(dateStr, timeStr) {
  const p = parseBookingDateTime(dateStr, timeStr);
  if (!p) return null;
  const start = wallClockToDate(p.year, p.month, p.day, p.hour, p.min);
  const end = new Date(start.getTime() + slotDurationMinutes() * 60 * 1000);
  return { start, end, parsed: p };
}

export function isInPast(dateStr, timeStr) {
  const range = slotToRange(dateStr, timeStr);
  if (!range) return true;
  return range.start.getTime() < Date.now();
}

export function getSpainDateParts(when = new Date()) {
  const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(when);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

/** Día completo anterior a hoy (hora España). */
export function isDateBeforeToday(dateStr, when = new Date()) {
  const p = parseBookingDateTime(dateStr, "00:00");
  if (!p) return true;
  const today = getSpainDateParts(when);
  if (p.year < today.year) return true;
  if (p.year > today.year) return false;
  if (p.month < today.month) return true;
  if (p.month > today.month) return false;
  return p.day < today.day;
}

export function formatDateEs(dateStr) {
  const p = parseBookingDateTime(dateStr, "00:00");
  if (!p) return dateStr;
  return `${String(p.day).padStart(2, "0")}/${String(p.month).padStart(2, "0")}/${p.year}`;
}
