import { CONTACT_EMAIL, SITE_URL, logoUrl } from "./site-config.js";
import {
  howWeWorkInfographicHtml,
  howWeWorkInfographicText,
  pricingPlansInfographicHtml,
  pricingPlansInfographicText,
  emailFooterHtml,
} from "./email-infographic.js";
import {
  agentEducationInfographicHtml,
  agentEducationInfographicText,
} from "./email-education.js";
import { surveyUrl } from "./site-config.js";
import { ANNUAL_DISCOUNT_PERCENT, planById } from "./pricing-config.js";
import { emailResponsiveHeadHtml } from "./email-responsive-styles.js";

const PLAN_INTRO =
  "Producto principal: agentes de IA. Complemento: webs y apps con IA. Auditoría gratuita · implementación aparte · mínimo 3 meses · soporte 24/7.";
const TIMELINES =
  "Plazos: agentes base 1–2 semanas · integraciones 2–6 semanas · webs/apps según alcance (presupuesto tras auditoría).";

function packFromInterest(interest) {
  const id = String(interest || "").replace(/^pack_/, "");
  return planById(id) || null;
}

function packHighlightHtml(lead) {
  const plan = packFromInterest(lead.interest);
  if (!plan) return "";
  return `<p style="margin:0 0 16px;padding:12px 14px;background:#fff8f3;border-radius:12px;border:1px solid #ffe0cc;font-size:14px;color:#333;line-height:1.55;">
    Has pedido información del <strong>plan ${plan.name}</strong> — ${plan.note}. Abajo tienes el detalle de precios de los tres niveles.
  </p>`;
}

function packHighlightText(lead) {
  const plan = packFromInterest(lead.interest);
  if (!plan) return "";
  return `Plan solicitado: ${plan.name} — ${plan.note}.\n`;
}

export function buildPricingGuideEmail(lead) {
  const name = (lead.name || "").split(" ")[0] || lead.name || "Hola";
  const logo = logoUrl();
  const company = lead.company ? ` (${lead.company})` : "";

  const text = [
    `Hola ${name},`,
    "",
    "Gracias por tu interés en DVG Studio. Creamos empleados digitales (agentes IA) para PYMEs: atienden, cualifican leads y agendan citas 24/7.",
    "",
    packHighlightText(lead),
    PLAN_INTRO,
    "",
    howWeWorkInfographicText(),
    pricingPlansInfographicText(),
    agentEducationInfographicText(),
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
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${emailResponsiveHeadHtml()}</head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-outer-pad" style="background:#F5F7FA;padding:28px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(10,14,39,.1);">
        <tr><td class="email-header-pad" style="padding:32px 28px 16px;text-align:center;background:linear-gradient(180deg,#0A0E27 0%,#121830 100%);">
          <img class="email-logo" src="${logo}" width="200" alt="DVG Studio" style="max-width:200px;height:auto;display:block;margin:0 auto 12px;">
          <p style="margin:0;color:#F7931E;font-size:14px;font-weight:700;">hac<span style="color:#FF6B35;">IA</span> lo imparable</p>
          <p style="margin:10px 0 0;font-size:13px;color:#aab4c8;">Tu guía de planes y agentes IA</p>
        </td></tr>
        <tr><td class="email-inner-pad" style="padding:28px 24px;color:#1a2332;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 12px;">Hola <strong>${name}</strong>${company},</p>
          <p style="margin:0 0 16px;color:#444;">Nuestro <strong>producto principal son los agentes de IA</strong>. El fee mensual cubre mantenimiento y soporte; la <strong>implementación</strong> se cotiza aparte en la auditoría.</p>
          ${packHighlightHtml(lead)}
          <table role="presentation" class="email-bullets" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
            <tr><td style="font-size:13px;color:#444;background:#f8f9fc;padding:12px 16px;border-radius:12px;border:1px solid #e8ecf2;line-height:1.55;">
              ✓ Auditoría <strong>gratuita</strong><br>
              ✓ Mín. <strong>3 meses</strong><br>
              ✓ Todos los canales<br>
              ✓ Soporte <strong>24/7</strong>
            </td></tr>
          </table>
          ${howWeWorkInfographicHtml()}
          ${pricingPlansInfographicHtml()}
          ${agentEducationInfographicHtml()}
          <p style="font-size:12px;color:#888;margin:0 0 20px;text-align:center;line-height:1.5;">${TIMELINES}<br>Facturación anual con <strong>${ANNUAL_DISCOUNT_PERCENT}% de descuento</strong> sobre el fee mensual.</p>
          <p style="text-align:center;margin:0;">
            <a href="${SITE_URL}#pricing" class="email-cta" style="display:inline-block;background:linear-gradient(135deg,#FF6B35 0%,#e85a28 100%);color:#fff;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:800;font-size:15px;box-shadow:0 6px 20px rgba(255,107,53,.3);">Ver planes y reservar auditoría</a>
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
