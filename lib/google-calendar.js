import { google } from "googleapis";

/** Cuenta Google de NEGOCIO (distinta del correo de avisos). OAuth refresh token de esa cuenta. */
export function calendarConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GOOGLE_CALENDAR_ID
  );
}

function parseDateTime(dateStr, timeStr) {
  const dm = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  const tm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const day = Number(dm[1]);
  const month = Number(dm[2]) - 1;
  const year = Number(dm[3]);
  const hour = Number(tm[1]);
  const min = Number(tm[2]);
  if (month < 0 || month > 11 || day < 1 || day > 31 || hour > 23 || min > 59) return null;
  const pad = (n) => String(n).padStart(2, "0");
  const startStr = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(min)}:00`;
  const endHour = hour + 1;
  const endStr =
    endHour > 23
      ? `${year}-${pad(month + 1)}-${pad(day)}T23:59:00`
      : `${year}-${pad(month + 1)}-${pad(day)}T${pad(endHour)}:${pad(min)}:00`;
  return { startStr, endStr };
}

export async function createBookingEvent({ name, email, phone, date, time, notes }) {
  const parsed = parseDateTime(date, time);
  if (!parsed) return { ok: false, error: "Fecha u hora no válida" };

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });

  const calendar = google.calendar({ version: "v3", auth });
  const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";

  const attendees = [{ email }];
  const calendarOwner = process.env.BOOKING_CALENDAR_EMAIL;
  if (calendarOwner && calendarOwner !== email) {
    attendees.push({ email: calendarOwner });
  }

  const meet = (process.env.BOOKING_MEET_URL || "").trim();
  const description = [
    `Cliente: ${name}`,
    `Email: ${email}`,
    `Teléfono: ${phone || "—"}`,
    notes ? `Notas: ${notes}` : "",
    meet ? `Google Meet: ${meet}` : "",
    "Reserva 1h desde chat web DVG Studio",
    "https://www.dvgsstudio.com",
  ]
    .filter(Boolean)
    .join("\n");

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    sendUpdates: "all",
    requestBody: {
      summary: `DVG Studio — ${name}`,
      description,
      location: meet || undefined,
      start: { dateTime: parsed.startStr, timeZone: tz },
      end: { dateTime: parsed.endStr, timeZone: tz },
      attendees,
    },
  });

  return {
    ok: true,
    provider: "google",
    eventId: event.data.id,
    htmlLink: event.data.htmlLink,
    calendarLabel: process.env.BOOKING_CALENDAR_EMAIL || "Google Calendar",
  };
}
