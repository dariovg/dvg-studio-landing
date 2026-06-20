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
  sendCustomerEmail,
  emailConfigured,
  emailFailureMessage,
} from "../transactional-email.js";
import { saveLead, leadsDatabaseConfigured } from "../leads-store.js";
import { syncLeadToCrm } from "../crm-ingest.js";

function validLead(body) {
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  if (name.length < 2 || name.length > 80) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  const phone = String(body.phone || "").replace(/\s/g, "").trim();
  if (phone && (phone.length < 6 || phone.length > 20)) return null;
  return {
    name,
    email,
    company: String(body.company || "").trim().slice(0, 120),
    phone: phone || "",
    interest: String(body.interest || "pricing").slice(0, 40),
    message: String(body.message || "").trim().slice(0, 500),
  };
}

async function persistLead(lead, { emailed = false } = {}) {
  const crmResult = await syncLeadToCrm(lead, { emailed });
  const dbResult = await saveLead(lead, { emailed });
  return {
    crmSynced: !!crmResult?.ok,
    stored: !!dbResult?.ok,
    crmError: crmResult?.error || (crmResult?.skipped ? "crm_not_configured" : null),
    dbError: dbResult?.reason || null,
  };
}

function leadSuccessResponse(lead, { emailed, crmSynced, stored, channel }) {
  const first = lead.name.split(" ")[0];
  if (emailed) {
    return {
      ok: true,
      emailed: true,
      crmSynced,
      stored,
      channel,
      message: `Perfecto, ${first}. Te he enviado la guía a ${lead.email} con planes, infografía «Agente vs Chat» y enlace a la encuesta (3 min) — revisa spam si no la ves en 2 min.`,
    };
  }
  return {
    ok: true,
    emailed: false,
    crmSynced,
    stored,
    message: `Gracias, ${first}. Hemos recibido tus datos${crmSynced ? "" : ""}. Te contactamos pronto en ${lead.email}.`,
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
    const saved = await persistLead(lead, { emailed: false });
    if (saved.crmSynced || saved.stored) {
      return res.status(200).json(leadSuccessResponse(lead, { emailed: false, ...saved }));
    }
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

    const sent = await sendCustomerEmail({
      to: lead.email,
      subject: guide.subject,
      text: guide.text,
      html: guide.html,
    });

    if (!sent.ok) {
      console.error("Lead guide:", sent.reason);
      const saved = await persistLead(lead, { emailed: false });
      if (saved.crmSynced || saved.stored) {
        return res.status(200).json({
          ...leadSuccessResponse(lead, { emailed: false, ...saved }),
          received: true,
        });
      }
      return res.status(502).json({
        ok: false,
        emailed: false,
        error: emailFailureMessage(sent.reason, sent),
      });
    }

    const saved = await persistLead(lead, { emailed: true });
    if (!saved.stored && leadsDatabaseConfigured()) {
      console.error("Lead DB save failed:", saved.dbError);
    }
    if (!saved.crmSynced) {
      console.error("Lead CRM sync failed:", saved.crmError);
    }

    return res.status(200).json(
      leadSuccessResponse(lead, {
        emailed: true,
        channel: sent.channel,
        ...saved,
      })
    );
  } catch (err) {
    console.error("Lead:", err.message);
    return res.status(500).json({
      error: emailFailureMessage(err.message),
    });
  }
}
