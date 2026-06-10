import { randomUUID } from "crypto";
import { parseBookingDateTime, slotToRange } from "./booking-utils.js";

function icsEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

export function buildBookingIcs(booking, { meetUrl } = {}) {
  const range = slotToRange(booking.date, booking.time);
  if (!range) return null;

  const p = parseBookingDateTime(booking.date, booking.time);
  if (!p) return null;

  const uid = `${randomUUID()}@dvgsstudio.com`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z?$/, "Z");

  const description = [
    `Reunión con DVG Studio (1h)`,
    `Cliente: ${booking.name}`,
    meetUrl ? `Google Meet: ${meetUrl}` : "",
    booking.notes ? `Notas: ${booking.notes}` : "",
    "hacIA lo imparable — https://www.dvgsstudio.com",
  ]
    .filter(Boolean)
    .join("\n");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DVG Studio//Booking//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${p.start}`,
    `DTEND:${p.end}`,
    `SUMMARY:${icsEscape(`DVG Studio — reunión con ${booking.name}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    meetUrl ? `LOCATION:${icsEscape(meetUrl)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return { uid, body, filename: `dvg-cita-${uid.slice(0, 8)}.ics` };
}
