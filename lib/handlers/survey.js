import { checkRateLimit } from "../rate-limit.js";
import {
  clientIp,
  validateOrigin,
  validateSiteKey,
  validateHoneypot,
  validateUserAgent,
} from "../chat-security.js";
import { CONTACT_EMAIL } from "../site-config.js";
import { validSurvey } from "../survey-labels.js";
import { buildSurveyNotifyEmail, buildSurveyThanksEmail } from "../survey-email.js";
import {
  sendTransactionalEmail,
  emailConfigured,
  emailFailureMessage,
} from "../transactional-email.js";

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
    return res.status(403).json({ error: "Origen no autorizado." });
  }
  if (!validateUserAgent(req)) {
    return res.status(403).json({ error: "No permitido" });
  }

  const ip = clientIp(req);
  const limit = checkRateLimit(ip, { perHour: 5, perDay: 15, prefix: "survey:" });
  if (!limit.ok) {
    return res.status(429).json({ error: "Demasiados envíos. Inténtalo más tarde." });
  }

  const body = req.body || {};
  if (!validateSiteKey(body) || !validateHoneypot(body)) {
    return res.status(403).json({ error: "Solicitud no válida" });
  }

  const survey = validSurvey(body);
  if (!survey) {
    return res.status(400).json({ error: "Nombre y email válidos requeridos" });
  }

  if (!survey.q1_channels?.length) {
    return res.status(400).json({ error: "Marca al menos un canal en la pregunta 1." });
  }
  if (!survey.q3_quote_time || !survey.q4_calendar || !survey.q5_ai_maturity) {
    return res.status(400).json({ error: "Completa las preguntas obligatorias marcadas con *." });
  }
  if (!survey.q6_lost_hours || !survey.q9_priority_area || !survey.q10_investment) {
    return res.status(400).json({ error: "Completa las preguntas obligatorias marcadas con *." });
  }

  if (!emailConfigured()) {
    return res.status(503).json({
      error: `No pudimos registrar la encuesta por email. Escríbenos a ${CONTACT_EMAIL}`,
    });
  }

  try {
    const notify = buildSurveyNotifyEmail(survey);
    const thanks = buildSurveyThanksEmail(survey);
    const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL;

    const internal = await sendTransactionalEmail({
      to: notifyTo,
      subject: notify.subject,
      text: notify.text,
      html: notify.html,
    });

    if (!internal.ok) {
      console.error("Survey notify:", internal.reason);
      return res.status(502).json({
        error: emailFailureMessage(internal.reason),
      });
    }

    await sendTransactionalEmail({
      to: survey.email,
      subject: thanks.subject,
      text: thanks.text,
      html: thanks.html,
    }).catch((err) => console.error("Survey thanks:", err.message));

    const first = survey.name.split(" ")[0];
    return res.status(200).json({
      ok: true,
      message: `Gracias, ${first}. Hemos recibido tu encuesta — la usaremos para preparar la reunión.`,
    });
  } catch (err) {
    console.error("Survey:", err.message);
    return res.status(500).json({ error: emailFailureMessage(err.message) });
  }
}
