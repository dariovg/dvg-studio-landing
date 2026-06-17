import { CONTACT_EMAIL, SITE_URL } from "./site-config.js";
import { formatSurveyAnswers } from "./survey-labels.js";

export function buildSurveyNotifyEmail(survey) {
  const lines = formatSurveyAnswers(survey);
  const text = [
    "Nueva encuesta de madurez digital — chat / formulario web",
    "",
    `Nombre: ${survey.name}`,
    `Email: ${survey.email}`,
    survey.company ? `Empresa: ${survey.company}` : "",
    "",
    "--- Respuestas ---",
    ...lines,
    "",
    `Origen: ${SITE_URL}/encuesta`,
    "",
    "Preparar reunión con estos datos.",
  ].filter(Boolean);

  const htmlRows = lines
    .map((l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">${escapeHtml(l)}</td></tr>`)
    .join("");

  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;font-family:system-ui,sans-serif;background:#f5f7fa;padding:24px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #eee">
    <h2 style="margin:0 0 8px;color:#0A0E27;font-size:18px;">📊 Encuesta madurez digital</h2>
    <p style="margin:0 0 16px;color:#555;font-size:14px;"><strong>${escapeHtml(survey.name)}</strong> · ${escapeHtml(survey.email)}${survey.company ? ` · ${escapeHtml(survey.company)}` : ""}</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${htmlRows}</table>
    <p style="margin:16px 0 0;font-size:12px;color:#888">${CONTACT_EMAIL}</p>
  </div></body></html>`;

  return {
    subject: `[DVG Encuesta] ${survey.name}${survey.company ? ` — ${survey.company}` : ""}`,
    text: text.join("\n"),
    html,
  };
}

export function buildSurveyThanksEmail(survey) {
  const name = survey.name.split(" ")[0] || survey.name;
  const text = [
    `Hola ${name},`,
    "",
    "Gracias por completar la encuesta de madurez digital.",
    "Con tus respuestas prepararemos la reunión para que sea útil desde el primer minuto.",
    "",
    `Si quieres adelantar algo: ${CONTACT_EMAIL}`,
    SITE_URL,
  ].join("\n");

  const html = `<!DOCTYPE html><html lang="es"><body style="font-family:system-ui,sans-serif;padding:24px;color:#333">
  <p>Hola <strong>${escapeHtml(name)}</strong>,</p>
  <p>Gracias por completar la encuesta. Usaremos tus respuestas para preparar la reunión contigo.</p>
  <p style="color:#666;font-size:14px;">DVG Studio · ${CONTACT_EMAIL}</p>
  </body></html>`;

  return {
    subject: "Encuesta recibida — DVG Studio",
    text,
    html,
  };
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
