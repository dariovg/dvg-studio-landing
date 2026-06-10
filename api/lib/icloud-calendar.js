import { randomUUID } from "crypto";
import { createDAVClient } from "tsdav";

const SKIP_CALENDAR = /inbox|notification|tasks|archive|birthdays|holidays|recyclebin/i;

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
  const dm = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  const tm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const day = Number(dm[1]);
  const month = Number(dm[2]);
  const year = Number(dm[3]);
  const hour = Number(tm[1]);
  const min = Number(tm[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || min > 59) {
    return null;
  }
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(min)}00`;
  const endHour = hour + 1;
  const end =
    endHour > 23
      ? `${year}${pad(month)}${pad(day)}T235900`
      : `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(min)}00`;
  return { start, end };
}

function icsEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function buildIcs(booking, parsed) {
  const uid = `${randomUUID()}@dvgstudio.com`;
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

function pickCalendar(calendars) {
  const sorted = [...calendars].sort((a, b) => {
    const score = (c) => {
      const label = `${c.displayName || ""} ${c.url || ""}`.toLowerCase();
      let s = 0;
      if (/home|inicio|personal|calendario/i.test(label)) s += 10;
      if (/\/home\/?$/i.test(c.url || "")) s += 8;
      if (SKIP_CALENDAR.test(c.url || "")) s -= 20;
      return s;
    };
    return score(b) - score(a);
  });
  return sorted.find((c) => c.url && !SKIP_CALENDAR.test(c.url)) || sorted[0];
}

async function connectIcloud() {
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
        throw new Error("Sin calendarios escribibles");
      }
      return { client, calendar, username };
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

    return {
      ok: true,
      provider: "icloud",
      eventId: uid,
      htmlLink: null,
      calendarLabel: `Calendario Apple (${username})`,
      calendarUrl: calendar.url,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Error iCloud" };
  }
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
    const { calendar, username } = await connectIcloud();
    steps.push({ step: "conexion", ok: true, detail: `OK con ${username}` });
    steps.push({ step: "calendario", ok: true, detail: `${calendar.displayName || "Principal"} → ${calendar.url}` });
    return { ok: true, steps, workingEmail: username };
  } catch (err) {
    steps.push({ step: "conexion", ok: false, detail: err.message });
    return { ok: false, steps };
  }
}
