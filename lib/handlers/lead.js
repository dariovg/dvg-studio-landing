import { checkRateLimit } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateTiming,
  validateUserAgent,
} from "../chat-security.js";
import { CONTACT_EMAIL } from "../site-config.js";
import { buildPricingGuideEmail, buildLeadNotifyEmail } from "../pricing-guide-email.js";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { fromEmail } from "../booking-email-template.js";

function sesReady() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

async function sendEmail({ to, subject, text, html }) {
  const client = new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
  await client.send(
    new SendEmailCommand({
      Source: fromEmail(),
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
    })
  );
}

function sesUserMessage(err) {
  const msg = String(err?.message || err || "");
  if (/Email address is not verified|MessageRejected|sandbox/i.test(msg)) {
    return `No pudimos enviarte la guía automáticamente (email no verificado en el servidor). Ya tenemos tus datos — te la enviamos pronto desde ${CONTACT_EMAIL}.`;
  }
  return `No pude enviar el email ahora. Escríbenos a ${CONTACT_EMAIL} y te la mandamos enseguida.`;
}

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
    return res.status(403).json({ error: "Origen no autorizado para enviar la guía." });
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
  if (!validateTiming(body)) {
    return res.status(403).json({
      error: "Espera un segundo y vuelve a pulsar «Enviarme la guía».",
    });
  }

  const lead = validLead(body);
  if (!lead) {
    return res.status(400).json({ error: "Nombre y email válidos requeridos" });
  }

  if (!sesReady()) {
    return res.status(503).json({
      ok: false,
      emailed: false,
      error: `El envío por email no está configurado aún. Escríbenos a ${CONTACT_EMAIL} y te enviamos la guía.`,
    });
  }

  try {
    const guide = buildPricingGuideEmail(lead);
    const notify = buildLeadNotifyEmail(lead);
    const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL;

    try {
      await sendEmail({
        to: notifyTo,
        subject: notify.subject,
        text: notify.text,
        html: notify.html,
      });
    } catch (err) {
      console.error("Lead notify:", err.message);
    }

    try {
      await sendEmail({
        to: lead.email,
        subject: guide.subject,
        text: guide.text,
        html: guide.html,
      });
    } catch (err) {
      console.error("Lead guide:", err.message);
      return res.status(502).json({
        ok: false,
        emailed: false,
        received: true,
        error: sesUserMessage(err),
      });
    }

    return res.status(200).json({
      ok: true,
      emailed: true,
      message: `Perfecto, ${lead.name.split(" ")[0]}. Te he enviado la guía a ${lead.email} — revisa spam si no la ves en 2 min.`,
    });
  } catch (err) {
    console.error("Lead:", err.message);
    return res.status(500).json({
      error: sesUserMessage(err),
    });
  }
}
