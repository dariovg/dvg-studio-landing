import { checkRateLimit } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
} from "../chat-security.js";
import { icloudConfigured, createBookingEvent as createIcloudEvent } from "../icloud-calendar.js";
import {
  calendarConfigured,
  createBookingEvent as createGoogleEvent,
} from "../google-calendar.js";
import { sendBookingEmails } from "../booking-notify.js";
import { assertSlotAvailable } from "../calendar-availability.js";
import { isInPast, isDateBeforeToday, normalizeTimeSlot } from "../booking-utils.js";
import { CONTACT_EMAIL } from "../site-config.js";
import { meetUrl } from "../booking-email-template.js";
import { syncBookingToCrm } from "../crm-ingest.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validBooking(b) {
  if (!b?.name || b.name.length < 2 || b.name.length > 80) return false;
  if (!b?.email || !EMAIL_RE.test(b.email) || b.email.length > 120) return false;
  const phone = String(b.phone || "").replace(/\s/g, "").trim();
  if (!phone || phone.length < 6 || phone.length > 20) return false;
  if (!b?.date || !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(b.date)) return false;
  if (!b?.time || !/^\d{1,2}:\d{2}$/.test(b.time)) return false;
  if (b.notes && b.notes.length > 300) return false;
  return true;
}

async function createCalendarBooking(booking) {
  let meetLink = null;
  let googleResult = null;
  let icloudResult = null;

  if (calendarConfigured()) {
    googleResult = await createGoogleEvent(booking, { generateMeet: true });
    if (googleResult?.ok && googleResult.meetUrl) {
      meetLink = googleResult.meetUrl;
    } else if (googleResult && !googleResult.ok) {
      console.error("Google Meet:", googleResult.error);
    }
  }

  if (icloudConfigured()) {
    icloudResult = await createIcloudEvent(booking, { meetUrl: meetLink });
  }

  const primary = icloudResult?.ok ? icloudResult : googleResult;
  if (!primary?.ok && !meetLink) return primary || null;

  return {
    ...(primary || { ok: false }),
    meetUrl: meetLink || primary?.meetUrl,
    google: googleResult?.ok ? googleResult : undefined,
    icloud: icloudResult?.ok ? icloudResult : undefined,
  };
}

function buildSuccessMessage(booking, calendarResult, emailResults) {
  const lines = [
    "✅ Cita reservada",
    "",
    `📅 ${booking.date} a las ${booking.time} (1h, hora España)`,
  ];

  const meet = meetUrl(calendarResult?.meetUrl);
  if (meet) lines.push(`🔗 Google Meet: ${meet}`);

  const googleInvite =
    calendarResult?.google?.ok &&
    process.env.BOOKING_GOOGLE_SEND_UPDATES !== "0";

  if (emailResults.customer.ok) {
    lines.push("", `📧 Confirmación enviada a ${booking.email} (revisa spam si no la ves).`);
    if (!emailResults.customer.fallback) {
      lines.push("📎 El correo incluye un archivo .ics para añadir la cita a tu calendario.");
    }
  } else if (googleInvite) {
    lines.push(
      "",
      `📧 Google Calendar te enviará la invitación a ${booking.email} (con el enlace Meet). Revisa spam.`
    );
  } else if (emailResults.internal.ok) {
    lines.push("", `📧 Te contactamos pronto en ${booking.email}.`);
  } else {
    lines.push("", `⚠️ No pudimos enviar el correo automático. Escríbenos a ${CONTACT_EMAIL}.`);
    if (emailResults.customer.reason === "ses_sandbox") {
      lines.push("   (El servidor de email está en modo prueba — solo correos verificados).");
    }
  }

  if (calendarResult?.ok) {
    lines.push("", `📆 Añadida al calendario del equipo (${calendarResult.calendarLabel}).`);
  } else if (icloudConfigured() || calendarConfigured()) {
    lines.push("", "📆 El calendario automático falló; el equipo recibirá un .ics por email para añadirla.");
  }

  return lines.join("\n");
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
      error: `Demasiadas solicitudes. Escríbenos a ${CONTACT_EMAIL}`,
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
    date: String(body.date || "").trim().replace(/-/g, "/"),
    time: normalizeTimeSlot(String(body.time || "").trim()) || "",
    notes: String(body.notes || "").trim(),
  };

  if (!validBooking(booking)) {
    return res.status(400).json({ error: "Datos incompletos o formato incorrecto" });
  }

  if (isDateBeforeToday(booking.date)) {
    return res.status(400).json({ error: "Esa fecha ya pasó. Elige hoy o un día futuro." });
  }

  if (isInPast(booking.date, booking.time)) {
    return res.status(400).json({ error: "Esa fecha u hora ya ha pasado. Elige un hueco futuro." });
  }

  try {
    if (icloudConfigured()) {
      const slot = await assertSlotAvailable(booking.date, booking.time);
      if (!slot.available && !slot.degraded) {
        const alts = slot.alternatives?.length
          ? slot.alternatives.join(", ")
          : "ninguno ese día";
        return res.status(409).json({
          ok: false,
          error: `Ese horario no está libre en tu calendario Apple (cita, quedada u otro compromiso). Alternativas: ${alts}`,
          alternatives: slot.alternatives || [],
          slots: slot.slots || [],
        });
      }
    }

    let calendarResult = null;

    if (icloudConfigured() || calendarConfigured()) {
      calendarResult = await createCalendarBooking(booking);
      if (calendarResult && !calendarResult.ok) {
        console.error("Calendar:", calendarResult.error);
      }
    }

    const emailResults = await sendBookingEmails(booking, calendarResult);

    const message = buildSuccessMessage(booking, calendarResult, emailResults);

    const crmResult = await syncBookingToCrm({
      ...booking,
      meetUrl: meetUrl(calendarResult?.meetUrl) || null,
    });
    if (!crmResult?.ok) {
      console.error("CRM booking sync failed:", crmResult?.error || crmResult?.skipped || "unknown");
    }

    return res.status(200).json({
      ok: true,
      message,
      crmSynced: !!crmResult?.ok,
      calendar: !!calendarResult?.ok,
      emailCustomer: !!emailResults.customer.ok,
      emailInternal: !!emailResults.internal.ok,
    });
  } catch (err) {
    console.error("Booking:", err.message);
    return res.status(500).json({
      error: `No pudimos procesar la cita. Escríbenos a ${CONTACT_EMAIL}`,
    });
  }
}
