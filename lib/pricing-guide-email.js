import { CONTACT_EMAIL, SITE_URL, logoUrl } from "./site-config.js";
import {
  howWeWorkInfographicHtml,
  howWeWorkInfographicText,
  emailFooterHtml,
} from "./email-infographic.js";
import {
  agentEducationInfographicHtml,
  agentEducationInfographicText,
} from "./email-education.js";
import { surveyUrl } from "./site-config.js";

const PLAN_INTRO =
  "Producto principal: agentes de IA. Complemento: webs y apps con IA. Auditoría gratuita · implementación con coste · mínimo 3 meses · soporte 24/7.";
const TIMELINES =
  "Plazos: agentes base 1–2 semanas · integraciones 2–6 semanas · webs/apps según alcance (presupuesto tras auditoría).";

export function buildPricingGuideEmail(lead) {
  const name = (lead.name || "").split(" ")[0] || lead.name || "Hola";
  const logo = logoUrl();
  const company = lead.company ? ` (${lead.company})` : "";

  const text = [
    `Hola ${name},`,
    "",
    "Gracias por tu interés en DVG Studio. Creamos empleados digitales (agentes IA) para PYMEs: atienden, cualifican leads y agendan citas 24/7.",
    "",
    PLAN_INTRO,
    "",
    howWeWorkInfographicText(),
    agentEducationInfographicText(),
    "",
    TIMELINES,
    "",
    "PLANES (precios sin IVA, mínimo 3 meses):",
    "",
    "STARTER — 199 €/mes",
    "· 1 agente IA · chat web + 1 canal",
    "· Auditoría gratis · soporte 24/7",
    "",
    "PRO — 499 €/mes (el más elegido)",
    "· Hasta 5 agentes IA · todos los canales",
    "· Integración con tu CRM/herramientas · mejoras web con IA",
    "· Auditoría gratis · soporte 24/7",
    "",
    "ENTERPRISE — 2.499 €/mes",
    "· Hasta 10 agentes IA a medida",
    "· Integración IA con tu CRM/ERP existente · account manager + SLA",
    "· Auditoría gratis · soporte 24/7",
    "",
    "COMPLEMENTO — Webs y apps con IA",
    "· Mejora de tu web o creación nueva con chat y automatizaciones",
    "· Conectado a las herramientas que ya usáis",
    "",
    "Anual -20%: Starter 159 € · Pro 399 € · Enterprise 1.999 €/mes (+ IVA)",
    "",
    TIMELINES,
    "",
    `Encuesta madurez digital (3 min): ${surveyUrl()}`,
    "",
    "Primera reunión de 1h gratuita (auditoría) sin compromiso.",
    `Reserva en ${SITE_URL} o escríbenos: ${CONTACT_EMAIL}`,
    SITE_URL,
  ].join("\n");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FA;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,14,39,.08);">
        <tr><td style="padding:28px 28px 12px;text-align:center;background:linear-gradient(180deg,#0A0E27 0%,#121830 100%);">
          <img src="${logo}" width="200" alt="DVG Studio" style="max-width:200px;height:auto;display:block;margin:0 auto 10px;">
          <p style="margin:0;color:#F7931E;font-size:14px;font-weight:700;">hac<span style="color:#FF6B35;">IA</span> lo imparable</p>
        </td></tr>
        <tr><td style="padding:28px;color:#1a2332;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">Hola <strong>${name}</strong>${company},</p>
          <p style="margin:0 0 12px;color:#444;">Nuestro <strong>producto principal son los agentes de IA</strong>. Como complemento: <strong>webs y apps con IA</strong> integrada.</p>
          <p style="margin:0 0 16px;font-size:14px;color:#555;background:#f8f9fc;padding:12px 14px;border-radius:10px;">✓ Auditoría <strong>gratuita</strong> siempre &nbsp;·&nbsp; Implementación cuando asumís coste &nbsp;·&nbsp; Mín. <strong>3 meses</strong> &nbsp;·&nbsp; Soporte <strong>24/7</strong></p>
          ${howWeWorkInfographicHtml()}
          ${agentEducationInfographicHtml()}
          <p style="font-size:12px;color:#888;margin:0 0 16px;text-align:center;">${TIMELINES}</p>
          <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#0A0E27;text-transform:uppercase;letter-spacing:.05em;">Planes (sin IVA · mín. 3 meses)</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#333;line-height:1.55;">
            <tr><td style="padding:12px 14px;background:#f8f9fc;border-radius:10px 10px 0 0;border:1px solid #eee;border-bottom:none;">
              <strong style="color:#FF6B35;">Starter</strong> — 199 €/mes<br>
              <span style="color:#666;">1 agente IA · web + 1 canal · auditoría gratis · 24/7</span>
            </td></tr>
            <tr><td style="padding:12px 14px;background:#fff5f0;border-left:3px solid #FF6B35;border-right:1px solid #eee;">
              <strong style="color:#FF6B35;">Pro ★</strong> — 499 €/mes<br>
              <span style="color:#666;">Hasta 5 agentes · multicanal · integración CRM/herramientas · mejoras web con IA · 24/7</span>
            </td></tr>
            <tr><td style="padding:12px 14px;background:#f8f9fc;border:1px solid #eee;border-top:none;">
              <strong style="color:#FF6B35;">Enterprise</strong> — 2.499 €/mes<br>
              <span style="color:#666;">Hasta 10 agentes · integración con tu CRM/ERP existente · account manager + SLA</span>
            </td></tr>
            <tr><td style="padding:12px 14px;background:#fff;border-radius:0 0 10px 10px;border:1px solid #eee;border-top:none;">
              <strong style="color:#004E89;">Complemento</strong> — Webs y apps con IA<br>
              <span style="color:#666;">Mejora o creación de web/app conectada a tus herramientas (no creamos CRM/ERP desde cero)</span>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#666;margin:14px 0 0;">Facturación anual <strong>-20%</strong>. Primera reunión de auditoría <strong>gratis</strong>.</p>
          <p style="text-align:center;margin:24px 0 0;">
            <a href="${SITE_URL}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:700;">Reservar auditoría gratis</a>
          </p>
          ${emailFooterHtml()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: "Tu guía DVG Studio — agentes IA, planes y cómo trabajamos",
    text,
    html,
  };
}

export function buildLeadNotifyEmail(lead) {
  const lines = [
    "Nuevo lead desde el chat web",
    "",
    `Nombre: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.company ? `Empresa: ${lead.company}` : "",
    lead.phone ? `Teléfono: ${lead.phone}` : "",
    `Interés: ${lead.interest || "pricing"}`,
    lead.message ? `Mensaje: ${lead.message}` : "",
    "",
    `Origen: ${SITE_URL}`,
    "",
    "Acción: confirmar que recibió la guía por email.",
  ].filter(Boolean);

  return {
    subject: `[DVG Lead] ${lead.name} — guía solicitada`,
    text: lines.join("\n"),
    html: `<pre style="font-family:system-ui,sans-serif;font-size:14px;white-space:pre-wrap">${lines.join("\n")}</pre>`,
  };
}
