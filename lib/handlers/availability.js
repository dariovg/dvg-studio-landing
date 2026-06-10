import { checkRateLimit } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
} from "../chat-security.js";
import { getAvailability } from "../calendar-availability.js";
import { parseBookingDateTime } from "../booking-utils.js";
import { parseNaturalDate, parseNaturalTime } from "../natural-date.js";

function extractDate(text) {
  const raw = String(text || "");
  const m = raw.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
  if (m) return m[1].replace(/-/g, "/");
  return parseNaturalDate(raw);
}

function extractTime(text) {
  const raw = String(text || "");
  const m = raw.match(/(\d{1,2}:\d{2})/);
  if (m) return m[1];
  return parseNaturalTime(raw);
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
  const limit = checkRateLimit(ip, { perHour: 20, perDay: 60, prefix: "avail:" });
  if (!limit.ok) {
    return res.status(429).json({ error: "Demasiadas consultas. Inténtalo en unos minutos." });
  }

  const body = req.body || {};
  if (!validateSiteKey(body) || !validateHoneypot(body) || !validateTiming(body)) {
    return res.status(403).json({ error: "Solicitud no válida" });
  }

  let date = String(body.date || "").trim() || extractDate(body.query || "");
  let time = String(body.time || "").trim() || extractTime(body.query || "");

  if (!date || !parseBookingDateTime(date, "00:00")) {
    return res.status(400).json({
      error: "Indica la fecha (DD/MM/AAAA, «mañana», «el martes», «la semana que viene el jueves»…)",
    });
  }

  date = date.replace(/-/g, "/");

  try {
    const result = await getAvailability({ date, time: time || undefined });

    if (!result.ok && result.reason === "sin_calendario") {
      return res.status(200).json({
        ok: true,
        configured: false,
        message: "Calendario no configurado — no puedo comprobar huecos automáticamente.",
      });
    }

    if (!time) {
      const slots = result.slots || [];
      return res.status(200).json({
        ok: true,
        configured: true,
        date,
        slots,
        message: slots.length
          ? `Huecos libres el ${date} (1h): ${slots.join(", ")}`
          : `No hay huecos libres el ${date} en horario laboral.`,
      });
    }

    if (result.available) {
      return res.status(200).json({
        ok: true,
        configured: true,
        date,
        time,
        available: true,
        message: `Sí, ${date} a las ${time} está libre (1h). Escribe «agendar cita» para reservar.`,
      });
    }

    const alts = result.alternatives?.length
      ? result.alternatives
      : (result.slots || []).slice(0, 5);

    return res.status(200).json({
      ok: true,
      configured: true,
      date,
      time,
      available: false,
      alternatives: alts,
      slots: result.slots || [],
      message:
        alts.length > 0
          ? `No hay hueco el ${date} a las ${time} (tienes otra cita). Alternativas: ${alts.join(", ")}`
          : `No hay hueco el ${date} a las ${time}. Prueba otro día.`,
    });
  } catch (err) {
    console.error("Availability:", err.message);
    return res.status(500).json({ error: "No pude consultar el calendario." });
  }
}
