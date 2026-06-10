import { randomUUID } from "crypto";
import { parseBookingDateTime, slotToRange } from "./booking-utils.js";
import { CONTACT_EMAIL } from "./site-config.js";

function icsEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

const MADRID_VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Madrid",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export function buildBookingIcs(booking, { meetUrl, organizerEmail } = {}) {
  const range = slotToRange(booking.date, booking.time);
  if (!range) return null;

  const p = parseBookingDateTime(booking.date, booking.time);
  if (!p) return null;

  const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";
  const uid = `${randomUUID()}@dvgsstudio.com`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z?$/, "Z");
  const organizer = organizerEmail || CONTACT_EMAIL;

  const description = [
    "Reunión con DVG Studio (1h)",
    `Cliente: ${booking.name}`,
    booking.email ? `Email: ${booking.email}` : "",
    booking.phone ? `Teléfono: ${booking.phone}` : "",
    meetUrl ? `Google Meet: ${meetUrl}` : "",
    booking.notes ? `Notas: ${booking.notes}` : "",
    "hacIA lo imparable — https://www.dvgsstudio.com",
  ]
    .filter(Boolean)
    .join("\n");

  const eventLines = [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${tz}:${p.start}`,
    `DTEND;TZID=${tz}:${p.end}`,
    `SUMMARY:${icsEscape(`DVG Studio — reunión con ${booking.name}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    `ORGANIZER;CN=DVG Studio:mailto:${organizer}`,
  ];

  if (booking.email) {
    eventLines.push(
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${icsEscape(booking.name)}:mailto:${booking.email}`
    );
  }

  if (meetUrl) {
    eventLines.push(`LOCATION:${icsEscape(meetUrl)}`);
    eventLines.push(`URL:${icsEscape(meetUrl)}`);
  }

  eventLines.push("END:VEVENT");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DVG Studio//Booking//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    MADRID_VTIMEZONE,
    ...eventLines,
    "END:VCALENDAR",
  ].join("\r\n");

  return { uid, body, filename: `dvg-cita-${uid.slice(0, 8)}.ics` };
}
