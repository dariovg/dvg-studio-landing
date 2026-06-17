import { randomUUID } from "crypto";
import { google } from "googleapis";

/** Cuenta Google de NEGOCIO. OAuth refresh token de esa cuenta. */
export function calendarConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GOOGLE_CALENDAR_ID
  );
}

export function googleMeetConfigured() {
  return calendarConfigured();
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

function getCalendarClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth });
}

export function extractMeetLink(eventData) {
  if (!eventData) return "";
  const direct = (eventData.hangoutLink || "").trim();
  if (direct) return direct;
  const entry = eventData.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === "video"
  );
  return (entry?.uri || "").trim();
}

function buildDescription(booking, meet) {
  return [
    `Cliente: ${booking.name}`,
    `Email: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    meet ? `Google Meet: ${meet}` : "",
    "Reserva 1h desde chat web DVG Studio",
    "https://www.dvgsstudio.com",
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Crea evento en Google Calendar. Si generateMeet=true, genera un enlace Meet único por cita.
 */
export async function createBookingEvent(booking, { generateMeet = true } = {}) {
  const parsed = parseDateTime(booking.date, booking.time);
  if (!parsed) return { ok: false, error: "Fecha u hora no válida" };

  const calendar = getCalendarClient();
  const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";

  const attendees = [{ email: booking.email }];
  const calendarOwner = process.env.BOOKING_CALENDAR_EMAIL;
  if (calendarOwner && calendarOwner !== booking.email) {
    attendees.push({ email: calendarOwner });
  }

  const staticMeet = (process.env.BOOKING_MEET_URL || "").trim();
  const shouldGenerateMeet = generateMeet && !staticMeet;

  const requestBody = {
    summary: `DVG Studio — ${booking.name}`,
    description: buildDescription(booking, shouldGenerateMeet ? "" : staticMeet),
    start: { dateTime: parsed.startStr, timeZone: tz },
    end: { dateTime: parsed.endStr, timeZone: tz },
    attendees,
  };

  const insertParams = {
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    // Por defecto Google envía invitación al cliente (Workspace). Pon BOOKING_GOOGLE_SEND_UPDATES=0 para desactivar.
    sendUpdates: process.env.BOOKING_GOOGLE_SEND_UPDATES === "0" ? "none" : "all",
    requestBody,
  };

  if (shouldGenerateMeet) {
    insertParams.conferenceDataVersion = 1;
    requestBody.conferenceData = {
      createRequest: {
        requestId: randomUUID(),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  } else if (staticMeet) {
    requestBody.location = staticMeet;
    requestBody.description = buildDescription(booking, staticMeet);
  }

  try {
    const event = await calendar.events.insert(insertParams);
    const meetUrl = shouldGenerateMeet
      ? extractMeetLink(event.data)
      : staticMeet;

    if (shouldGenerateMeet && !meetUrl) {
      return { ok: false, error: "Google no devolvió enlace Meet — revisa OAuth y Calendar API" };
    }

    return {
      ok: true,
      provider: "google",
      eventId: event.data.id,
      htmlLink: event.data.htmlLink,
      meetUrl: meetUrl || undefined,
      calendarLabel: process.env.BOOKING_CALENDAR_EMAIL || "Google Calendar",
    };
  } catch (err) {
    return { ok: false, error: err.message || "Error Google Calendar" };
  }
}
