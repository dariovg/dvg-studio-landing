import { checkRateLimit } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateUserAgent,
} from "../chat-security.js";
import { CONTACT_EMAIL } from "../site-config.js";
import { buildPricingGuideEmail, buildLeadNotifyEmail } from "../pricing-guide-email.js";
import {
  sendTransactionalEmail,
  emailConfigured,
  emailFailureMessage,
} from "../transactional-email.js";

function validLead(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  if (name.length < 2 || name.length > 80) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return {
    name,
    email,
    company: String(body.company || "").trim().slice(0, 120),
    phone: String(body.phone || "").trim().slice(0, 30),
    interest: String(body.interest || "pricing").slice(0, 40),
    message: String(body.message || "").trim().slice(0, 500),
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

  if (!validateOrigin(req)) {
    return res.status(403).json({ error: "Origen no autorizado. Recarga la página e inténtalo de nuevo." });
  }
  if (!validateUserAgent(req)) {
    return res.status(403).json({ error: "No permitido" });
  }

  const ip = clientIp(req);
  const limit = checkRateLimit(ip, { perHour: 8, perDay: 25, prefix: "lead:" });
  if (!limit.ok) {
    return res.status(429).json({ error: "Demasiados envíos. Inténtalo más tarde." });
  }

  const body = req.body || {};
  if (!validateSiteKey(body)) {
    return res.status(403).json({
      error: "Clave del chat incorrecta. Recarga la página e inténtalo de nuevo.",
    });
  }
  if (!validateHoneypot(body)) {
    return res.status(403).json({ error: "Solicitud no válida" });
  }

  const lead = validLead(body);
  if (!lead) {
    return res.status(400).json({ error: "Nombre y email válidos requeridos" });
  }

  if (!emailConfigured()) {
    return res.status(503).json({
      ok: false,
      emailed: false,
      error: `El envío automático no está configurado. Escríbenos a ${CONTACT_EMAIL} y te enviamos la guía al momento.`,
    });
  }

  try {
    const guide = buildPricingGuideEmail(lead);
    const notify = buildLeadNotifyEmail(lead);
    const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL;

    await sendTransactionalEmail({
      to: notifyTo,
      subject: notify.subject,
      text: notify.text,
      html: notify.html,
    }).catch((err) => console.error("Lead notify:", err.message));

    const sent = await sendTransactionalEmail({
      to: lead.email,
      subject: guide.subject,
      text: guide.text,
      html: guide.html,
    });

    if (!sent.ok) {
      console.error("Lead guide:", sent.reason);
      return res.status(502).json({
        ok: false,
        emailed: false,
        received: true,
        error: emailFailureMessage(sent.reason),
      });
    }

    const first = lead.name.split(" ")[0];
    return res.status(200).json({
      ok: true,
      emailed: true,
      channel: sent.channel,
      message: `Perfecto, ${first}. Te he enviado la guía a ${lead.email} con nuestros planes y cómo trabajamos — revisa spam si no la ves en 2 min.`,
    });
  } catch (err) {
    console.error("Lead:", err.message);
    return res.status(500).json({
      error: emailFailureMessage(err.message),
    });
  }
}
