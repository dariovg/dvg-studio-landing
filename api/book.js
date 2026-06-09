import { checkRateLimit } from "./lib/rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
} from "./lib/chat-security.js";
import { calendarConfigured, createBookingEvent } from "./lib/google-calendar.js";
import { notifyBookingByEmail } from "./lib/booking-notify.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validBooking(b) {
  if (!b?.name || b.name.length < 2 || b.name.length > 80) return false;
  if (!b?.email || !EMAIL_RE.test(b.email) || b.email.length > 120) return false;
  if (b.phone && (b.phone.length < 6 || b.phone.length > 20)) return false;
  if (!b?.date || !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(b.date)) return false;
  if (!b?.time || !/^\d{1,2}:\d{2}$/.test(b.time)) return false;
  if (b.notes && b.notes.length > 300) return false;
  return true;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-DVG-Chat");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!validateOrigin(req) || !validateUserAgent(req)) {
    return res.status(403).json({ error: "No permitido" });
  }

  const ip = clientIp(req);
  const limit = checkRateLimit(ip, { perHour: 3, perDay: 5, prefix: "book:" });
  if (!limit.ok) {
    return res.status(429).json({
      error: "Demasiadas solicitudes. Escríbenos a contact@dvgstudio.com",
    });
  }

  const body = req.body || {};
  if (!validateSiteKey(body) || !validateHoneypot(body) || !validateTiming(body)) {
    return res.status(403).json({ error: "Solicitud no válida" });
  }

  const booking = {
    name: String(body.name || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    phone: String(body.phone || "").trim(),
    date: String(body.date || "").trim(),
    time: String(body.time || "").trim(),
    notes: String(body.notes || "").trim(),
  };

  if (!validBooking(booking)) {
    return res.status(400).json({ error: "Datos incompletos o formato incorrecto" });
  }

  try {
    let calendarLink = null;

    if (calendarConfigured()) {
      const created = await createBookingEvent(booking);
      if (created.ok) {
        calendarLink = created.htmlLink;
      }
    }

    try {
      await notifyBookingByEmail(booking);
    } catch (e) {
      console.error("SES notify:", e.message);
    }

    if (calendarLink) {
      return res.status(200).json({
        ok: true,
        message: `Cita reservada el ${booking.date} a las ${booking.time} (1h). Te llegará confirmación a ${booking.email}.`,
        calendar: true,
      });
    }

    return res.status(200).json({
      ok: true,
      message: `Solicitud recibida para el ${booking.date} a las ${booking.time}. Te confirmamos por email en breve.`,
      calendar: false,
    });
  } catch (err) {
    console.error("Booking:", err.message);
    return res.status(500).json({
      error: "No pudimos procesar la cita. Escríbenos a contact@dvgstudio.com",
    });
  }
}
