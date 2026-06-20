import { checkRateLimit } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
} from "../chat-security.js";
import { icloudConfigured, deleteBookingEvent as deleteIcloudEvent } from "../icloud-calendar.js";
import {
  calendarConfigured,
  deleteBookingEvent as deleteGoogleEvent,
  updateBookingEvent as updateGoogleEvent,
  createBookingEvent as createGoogleEvent,
} from "../google-calendar.js";
import { assertSlotAvailable } from "../calendar-availability.js";
import { isInPast, isDateBeforeToday, normalizeTimeSlot } from "../booking-utils.js";
import { CONTACT_EMAIL } from "../site-config.js";
import { meetUrl } from "../booking-email-template.js";
import { verifyBookingToken, createBookingToken } from "../booking-token.js";
import { syncBookingCancelToCrm, syncBookingUpdateToCrm } from "../crm-ingest.js";
import { sendBookingEmails } from "../booking-notify.js";
import { createBookingEvent as createIcloudEvent } from "../icloud-calendar.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizePhone(value) {
  const ph = String(value || "").replace(/\s/g, "").trim();
  return ph.length >= 6 && ph.length <= 20 ? ph : "";
}

function validBookingFields(b) {
  if (!b?.name || b.name.length < 2 || b.name.length > 80) return false;
  if (!b?.email || !EMAIL_RE.test(b.email) || b.email.length > 120) return false;
  if (!normalizePhone(b.phone)) return false;
  if (!b?.date || !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(b.date)) return false;
  if (!b?.time || !/^\d{1,2}:\d{2}$/.test(b.time)) return false;
  if (b.notes && b.notes.length > 300) return false;
  return true;
}

async function removeCalendarEvents(stored) {
  const results = [];
  if (stored.googleEventId && calendarConfigured()) {
    results.push(await deleteGoogleEvent(stored.googleEventId));
  }
  if (stored.icloudEventId && icloudConfigured()) {
    results.push(
      await deleteIcloudEvent(stored.icloudEventId, {
        calendarUrl: stored.icloudCalendarUrl,
      })
    );
  }
  return results;
}

async function createCalendarBooking(booking, { meetUrl: existingMeet } = {}) {
  let meetLink = existingMeet || null;
  let googleResult = null;
  let icloudResult = null;

  if (calendarConfigured()) {
    googleResult = await createGoogleEvent(booking, { generateMeet: !existingMeet });
    if (googleResult?.ok && googleResult.meetUrl) meetLink = googleResult.meetUrl;
  }

  if (icloudConfigured()) {
    icloudResult = await createIcloudEvent(booking, { meetUrl: meetLink });
  }

  const primary = icloudResult?.ok ? icloudResult : googleResult;
  return {
    ...(primary || { ok: false }),
    meetUrl: meetLink || primary?.meetUrl,
    google: googleResult?.ok ? googleResult : undefined,
    icloud: icloudResult?.ok ? icloudResult : undefined,
  };
}

async function updateCalendarBooking(stored, booking) {
  let meetLink = meetUrl(stored.meetUrl) || null;
  let googleResult = null;
  let icloudResult = null;

  if (stored.googleEventId && calendarConfigured()) {
    googleResult = await updateGoogleEvent(stored.googleEventId, booking, {
      generateMeet: !meetLink,
    });
    if (googleResult?.ok && googleResult.meetUrl) meetLink = googleResult.meetUrl;
    if (googleResult?.ok && googleResult.eventId && googleResult.eventId !== stored.googleEventId) {
      stored.googleEventId = googleResult.eventId;
    }
  }

  if (stored.icloudEventId && icloudConfigured()) {
    await deleteIcloudEvent(stored.icloudEventId, {
      calendarUrl: stored.icloudCalendarUrl,
    });
    icloudResult = await createIcloudEvent(booking, { meetUrl: meetLink });
    if (icloudResult?.ok) {
      stored.icloudEventId = icloudResult.eventId;
      stored.icloudCalendarUrl = icloudResult.calendarUrl || stored.icloudCalendarUrl;
    }
  } else if (icloudConfigured() && !stored.googleEventId) {
    icloudResult = await createIcloudEvent(booking, { meetUrl: meetLink });
  }

  if (!stored.googleEventId && !stored.icloudEventId) {
    return createCalendarBooking(booking, { meetUrl: meetLink });
  }

  const primary = icloudResult?.ok ? icloudResult : googleResult;
  return {
    ...(primary || { ok: false }),
    meetUrl: meetLink || primary?.meetUrl,
    google: googleResult?.ok ? googleResult : undefined,
    icloud: icloudResult?.ok ? icloudResult : undefined,
  };
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
  const limit = checkRateLimit(ip, { perHour: 8, perDay: 15, prefix: "manage:" });
  if (!limit.ok) {
    return res.status(429).json({
      error: `Demasiadas solicitudes. Escríbenos a ${CONTACT_EMAIL}`,
    });
  }

  const body = req.body || {};
  if (!validateSiteKey(body) || !validateHoneypot(body) || !validateTiming(body)) {
    return res.status(403).json({ error: "Solicitud no válida" });
  }

  const action = String(body.action || "").trim().toLowerCase();
  const token = String(body.token || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = normalizePhone(body.phone);

  const verified = verifyBookingToken(token, { email, phone });
  if (!verified.ok) {
    return res.status(403).json({ error: verified.error });
  }

  const stored = verified.booking;

  try {
    if (action === "cancel") {
      await removeCalendarEvents(stored);
      await syncBookingCancelToCrm({
        email: stored.email,
        phone: stored.phone,
        date: stored.date,
        time: stored.time,
      });

      return res.status(200).json({
        ok: true,
        action: "cancel",
        message: `Cita cancelada: ${stored.date} a las ${stored.time}. Si quieres otra reunión, dímelo cuando quieras.`,
      });
    }

    if (action === "reschedule") {
      const booking = {
        name: stored.name,
        email: stored.email,
        phone: stored.phone,
        date: String(body.date || stored.date).trim().replace(/-/g, "/"),
        time: normalizeTimeSlot(String(body.time || stored.time).trim()) || "",
        notes: String(body.notes != null ? body.notes : stored.notes || "").trim(),
      };

      if (!validBookingFields(booking)) {
        return res.status(400).json({ error: "Datos incompletos o formato incorrecto" });
      }
      if (isDateBeforeToday(booking.date) || isInPast(booking.date, booking.time)) {
        return res.status(400).json({ error: "Esa fecha u hora ya pasó. Elige un hueco futuro." });
      }

      if (icloudConfigured()) {
        const slot = await assertSlotAvailable(booking.date, booking.time);
        if (!slot.available && !slot.degraded) {
          return res.status(409).json({
            ok: false,
            error: `Ese horario no está libre. Alternativas: ${(slot.alternatives || []).join(", ") || "ninguna"}`,
            alternatives: slot.alternatives || [],
          });
        }
      }

      const calendarResult = await updateCalendarBooking(stored, booking);
      const emailResults = await sendBookingEmails(booking, calendarResult);

      await syncBookingCancelToCrm({
        email: stored.email,
        phone: stored.phone,
        date: stored.date,
        time: stored.time,
      });
      await syncBookingUpdateToCrm({
        ...booking,
        meetUrl: meetUrl(calendarResult?.meetUrl) || stored.meetUrl || null,
        previousDate: stored.date,
        previousTime: stored.time,
      });

      const newToken = createBookingToken({
        ...booking,
        meetUrl: meetUrl(calendarResult?.meetUrl) || stored.meetUrl,
        googleEventId: stored.googleEventId || calendarResult?.google?.eventId || null,
        icloudEventId: stored.icloudEventId || calendarResult?.icloud?.eventId || null,
        icloudCalendarUrl: stored.icloudCalendarUrl || calendarResult?.icloud?.calendarUrl || null,
      });

      const lines = [
        "✅ Cita actualizada",
        "",
        `📅 ${booking.date} a las ${booking.time} (1h, hora España)`,
      ];
      const meet = meetUrl(calendarResult?.meetUrl);
      if (meet) lines.push(`🔗 Google Meet: ${meet}`);
      if (emailResults.customer.ok) {
        lines.push("", `📧 Confirmación enviada a ${booking.email}.`);
      }

      return res.status(200).json({
        ok: true,
        action: "reschedule",
        message: lines.join("\n"),
        token: newToken,
        booking: {
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          date: booking.date,
          time: booking.time,
          notes: booking.notes,
          meetUrl: meet || stored.meetUrl || null,
        },
      });
    }

    if (action === "update") {
      const booking = {
        name: String(body.name || stored.name).trim(),
        email: String(body.email || stored.email).trim().toLowerCase(),
        phone: normalizePhone(body.phone || stored.phone),
        date: stored.date,
        time: stored.time,
        notes: String(body.notes != null ? body.notes : stored.notes || "").trim(),
      };

      if (!validBookingFields(booking)) {
        return res.status(400).json({ error: "Datos incompletos o formato incorrecto" });
      }

      const calendarResult = await updateCalendarBooking(stored, booking);
      await syncBookingUpdateToCrm({
        ...booking,
        meetUrl: meetUrl(calendarResult?.meetUrl) || stored.meetUrl || null,
      });

      const newToken = createBookingToken({
        ...booking,
        meetUrl: meetUrl(calendarResult?.meetUrl) || stored.meetUrl,
        googleEventId: stored.googleEventId || calendarResult?.google?.eventId || null,
        icloudEventId: stored.icloudEventId || calendarResult?.icloud?.eventId || null,
        icloudCalendarUrl: stored.icloudCalendarUrl || calendarResult?.icloud?.calendarUrl || null,
      });

      return res.status(200).json({
        ok: true,
        action: "update",
        message: `Datos actualizados para tu cita del ${booking.date} a las ${booking.time}.`,
        token: newToken,
        booking: {
          name: booking.name,
          email: booking.email,
          phone: booking.phone,
          date: booking.date,
          time: booking.time,
          notes: booking.notes,
          meetUrl: meetUrl(calendarResult?.meetUrl) || stored.meetUrl || null,
        },
      });
    }

    return res.status(400).json({ error: "Acción no válida. Usa cancel, reschedule o update." });
  } catch (err) {
    console.error("Manage booking:", err.message);
    return res.status(500).json({
      error: `No pudimos gestionar la cita. Escríbenos a ${CONTACT_EMAIL}`,
    });
  }
}
