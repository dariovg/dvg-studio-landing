import { randomUUID } from "crypto";
import { createDAVClient } from "tsdav";
import { parseBookingDateTime } from "./booking-utils.js";

const SKIP_CALENDAR = /inbox|notification|tasks|archive|birthdays|holidays|recyclebin/i;
const DEPRIORITIZE = /quedada|meetup|social/i;

function password() {
  return (process.env.ICLOUD_APP_PASSWORD || "").trim().replace(/\s+/g, "");
}

function candidateEmails() {
  const primary = (
    process.env.ICLOUD_CALENDAR_EMAIL || process.env.BOOKING_CALENDAR_EMAIL || ""
  )
    .trim()
    .toLowerCase();
  const extra = (process.env.ICLOUD_ALT_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const list = [primary, ...extra].filter(Boolean);
  const local = primary.match(/^([^@+]+)@/);
  if (local && primary.endsWith("@gmail.com")) {
    list.push(`${local[1]}@icloud.com`, `${local[1]}@me.com`);
  }
  return [...new Set(list)];
}

export function icloudConfigured() {
  return candidateEmails().length > 0 && !!password();
}

function parseDateTime(dateStr, timeStr) {
  const p = parseBookingDateTime(dateStr, timeStr);
  if (!p) return null;
  return { start: p.start, end: p.end };
}

function icsEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildIcs(booking, parsed) {
  const uid = `${randomUUID()}@dvgsstudio.com`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z?$/, "Z");
  const description = [
    `Cliente: ${booking.name}`,
    `Email: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    "Reserva 1h — chat web DVG Studio",
  ].join("\\n");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DVG Studio//Booking//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${parsed.start}`,
    `DTEND:${parsed.end}`,
    `SUMMARY:${icsEscape(`DVG Studio — ${booking.name}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return { uid, body };
}

function calendarLabel(c) {
  return c.displayName || c.url?.split("/").filter(Boolean).pop() || "Calendario";
}

export function pickCalendar(calendars) {
  const valid = calendars.filter((c) => c.url && !SKIP_CALENDAR.test(c.url || ""));
  if (!valid.length) return null;

  const preferredUrl = (process.env.ICLOUD_CALENDAR_URL || "").trim();
  if (preferredUrl) {
    const hit = valid.find(
      (c) => c.url === preferredUrl || c.url?.includes(preferredUrl.replace(/\/$/, ""))
    );
    if (hit) return hit;
  }

  const preferredName = (process.env.ICLOUD_CALENDAR_NAME || "DVG Studio").trim();
  if (preferredName) {
    const escaped = preferredName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    const byName = valid.find((c) => re.test(calendarLabel(c)));
    if (byName) return byName;
  }

  const scored = [...valid].sort((a, b) => scoreCalendar(b) - scoreCalendar(a));
  return scored[0];
}

function scoreCalendar(c) {
  const label = calendarLabel(c).toLowerCase();
  const url = (c.url || "").toLowerCase();
  let s = 0;
  if (/dvg\s*studio|dvgstudio/i.test(label)) s += 30;
  if (/trabajo|work|negocio|business|empresa/i.test(label)) s += 12;
  if (/home|inicio|personal/i.test(label)) s += 8;
  if (/\/home\/?$/i.test(url)) s += 5;
  if (DEPRIORITIZE.test(label)) s -= 25;
  return s;
}

export async function connectIcloud() {
  const pass = password();
  if (!pass) throw new Error("Falta ICLOUD_APP_PASSWORD");

  const emails = candidateEmails();
  const errors = [];

  for (const username of emails) {
    try {
      const client = await createDAVClient({
        serverUrl: "https://caldav.icloud.com",
        credentials: { username, password: pass },
        authMethod: "Basic",
        defaultAccountType: "caldav",
      });
      const calendars = await client.fetchCalendars();
      const calendar = pickCalendar(calendars);
      if (!calendar?.url) {
        const names = calendars.map((c) => calendarLabel(c)).join(", ");
        throw new Error(
          `No se encontró calendario "${process.env.ICLOUD_CALENDAR_NAME || "DVG Studio"}". Disponibles: ${names}`
        );
      }
      return { client, calendar, calendars, username };
    } catch (err) {
      errors.push(`${username}: ${err.message}`);
    }
  }

  throw new Error(
    errors.join(" | ") || "No se pudo conectar a iCloud — revisa contraseña de app y Calendario activo"
  );
}

export async function createBookingEvent(booking) {
  try {
    const parsed = parseDateTime(booking.date, booking.time);
    if (!parsed) return { ok: false, error: "Fecha u hora no válida" };

    const { client, calendar, username } = await connectIcloud();
    const { uid, body } = buildIcs(booking, parsed);
    const filename = `dvg-${uid.replace(/[^a-zA-Z0-9-]/g, "")}.ics`;

    const res = await client.createCalendarObject({
      calendar,
      filename,
      iCalString: body,
    });

    if (!res.ok && res.status !== 201 && res.status !== 204) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `iCloud PUT ${res.status}: ${errText.slice(0, 160)}` };
    }

    const name = calendarLabel(calendar);

    return {
      ok: true,
      provider: "icloud",
      eventId: uid,
      htmlLink: null,
      calendarLabel: `Calendario Apple (${name})`,
      calendarUrl: calendar.url,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Error iCloud" };
  }
}

export async function listIcloudCalendars() {
  const { calendars, username } = await connectIcloud();
  return {
    username,
    selected: calendarLabel(pickCalendar(calendars)),
    calendars: calendars
      .filter((c) => c.url && !SKIP_CALENDAR.test(c.url || ""))
      .map((c) => ({ name: calendarLabel(c), url: c.url })),
  };
}

export async function diagnoseIcloud() {
  const steps = [];
  const emails = candidateEmails();
  steps.push({
    step: "emails_a_probar",
    ok: emails.length > 0,
    detail: emails.join(", "),
  });

  try {
    const { calendar, calendars, username } = await connectIcloud();
    steps.push({ step: "conexion", ok: true, detail: `OK con ${username}` });
    steps.push({
      step: "calendario_elegido",
      ok: true,
      detail: `${calendarLabel(calendar)} → ${calendar.url}`,
    });
    steps.push({
      step: "todos_los_calendarios",
      ok: true,
      detail: calendars.map((c) => calendarLabel(c)).join(" | "),
    });
    return { ok: true, steps, workingEmail: username };
  } catch (err) {
    steps.push({ step: "conexion", ok: false, detail: err.message });
    return { ok: false, steps };
  }
}
