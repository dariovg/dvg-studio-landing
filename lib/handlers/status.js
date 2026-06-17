import { icloudConfigured } from "../icloud-calendar.js";
import { calendarConfigured, googleMeetConfigured } from "../google-calendar.js";
import { meetUrl, fromEmail } from "../booking-email-template.js";
import { CONTACT_EMAIL } from "../site-config.js";
import { emailConfigured, gmailSendConfigured } from "../transactional-email.js";

function sesReady() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const key = String(req.query?.key || req.headers["x-dvg-status"] || "");
  const expected = process.env.DIAGNOSTIC_KEY || "";
  if (expected && key !== expected) {
    return res.status(403).json({ ok: false, error: "Clave de diagnóstico incorrecta" });
  }

  const from = fromEmail();
  const staticMeet = meetUrl();
  const meetMode = googleMeetConfigured()
    ? "per_event"
    : staticMeet
      ? "static"
      : "none";

  const checks = {
    awsCredentials: sesReady(),
    bedrockModel: !!(process.env.BEDROCK_MODEL_ID || "amazon.nova-lite-v1:0"),
    sesFromEmail: !!from,
    gmailSend: gmailSendConfigured(),
    transactionalEmail: emailConfigured(),
    bookingNotifyEmail: !!(process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL),
    meetMode,
    googleMeet: googleMeetConfigured(),
    staticMeetUrl: !!staticMeet,
    icloudCalendar: icloudConfigured(),
    googleCalendar: calendarConfigured(),
    chatSiteKey: !!process.env.CHAT_SITE_KEY,
  };

  const readyForBooking =
    checks.awsCredentials &&
    checks.sesFromEmail &&
    checks.bookingNotifyEmail &&
    (checks.icloudCalendar || checks.googleCalendar);

  const readyForLeads = checks.transactionalEmail && checks.sesFromEmail;

  const hints = [];
  if (!checks.awsCredentials) {
    hints.push("Añade AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY (IAM con Bedrock + SES).");
  }
  if (meetMode === "none") {
    hints.push(
      "Configura Google Calendar (GOOGLE_*) para generar un Meet único por cita, o BOOKING_MEET_URL como enlace fijo."
    );
  }
  if (!checks.icloudCalendar && !checks.googleCalendar) {
    hints.push("Configura iCloud (ICLOUD_CALENDAR_EMAIL + ICLOUD_APP_PASSWORD) o Google Calendar.");
  }
  if (!checks.chatSiteKey) {
    hints.push("Añade CHAT_SITE_KEY=dvg-studio-chat-2026 (igual que index.html).");
  }
  if (!checks.transactionalEmail) {
    hints.push("Configura AWS SES o Google OAuth con permiso gmail.send para enviar la guía a leads.");
  }
  if (!checks.sesFromEmail) {
    hints.push("Verifica BOOKING_FROM_EMAIL en AWS SES (identidad verificada).");
  }
  if (checks.googleCalendar && process.env.BOOKING_GOOGLE_SEND_UPDATES !== "0") {
    hints.push("Google Calendar envía invitación al cliente por defecto (sendUpdates=all).");
  } else if (checks.googleCalendar) {
    hints.push("BOOKING_GOOGLE_SEND_UPDATES=0 desactiva invitaciones de Google al cliente.");
  }

  return res.status(200).json({
    ok: true,
    readyForBooking,
    readyForLeads,
    readyForChat: checks.awsCredentials && checks.chatSiteKey,
    checks,
    timezone: process.env.BOOKING_TIMEZONE || "Europe/Madrid",
    region: process.env.AWS_REGION || "us-east-1",
    hints,
    testUrls: {
      book: "/api/book",
      lead: "/api/lead",
      chat: "/api/chat",
    },
  });
}
