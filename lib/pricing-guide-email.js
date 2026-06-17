import { CONTACT_EMAIL, SITE_URL, logoUrl } from "./site-config.js";
import {
  howWeWorkInfographicHtml,
  howWeWorkInfographicText,
  surveyBlockHtml,
  surveyBlockText,
  emailFooterHtml,
} from "./email-infographic.js";

export function buildPricingGuideEmail(lead) {
  const name = (lead.name || "").split(" ")[0] || lead.name || "Hola";
  const logo = logoUrl();
  const company = lead.company ? ` (${lead.company})` : "";

  const text = [
    `Hola ${name},`,
    "",
    "Gracias por tu interés en DVG Studio. Somos especialistas en empleados digitales con IA para PYMEs: agentes que atienden clientes, cualifican leads y agendan citas 24/7.",
    "",
    howWeWorkInfographicText(),
    "",
    "PLANES (precios sin IVA):",
    "",
    "STARTER — 199 €/mes",
    "· 1 agente · chat web + 1 canal · 10.000 interacciones/mes",
    "",
    "PRO — 499 €/mes (el más elegido)",
    "· 5 agentes · todos los canales · 100.000 interacciones/mes",
    "",
    "ENTERPRISE — 2.499 €/mes",
    "· 20 agentes · integraciones CRM/ERP a medida",
    "",
    "Anual -20%: Starter 159 € · Pro 399 € · Enterprise 1.999 €/mes (+ IVA)",
    "1 interacción = 1 mensaje del cliente.",
    "",
    surveyBlockText({ beforeMeeting: false }),
    "",
    "Primera reunión de 1h gratuita y sin compromiso.",
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
          <p style="margin:0 0 16px;color:#444;">Gracias por pedir la guía. En DVG Studio creamos <strong>empleados digitales con IA</strong> para PYMEs: atienden clientes, responden dudas, cualifican leads y agendan citas <strong>24 horas al día</strong>.</p>
          ${howWeWorkInfographicHtml()}
          <p style="margin:16px 0 10px;font-size:13px;font-weight:700;color:#0A0E27;text-transform:uppercase;letter-spacing:.05em;">Planes (sin IVA)</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;color:#333;line-height:1.55;">
            <tr><td style="padding:12px 14px;background:#f8f9fc;border-radius:10px 10px 0 0;border:1px solid #eee;border-bottom:none;">
              <strong style="color:#FF6B35;">Starter</strong> — 199 €/mes<br>
              <span style="color:#666;">1 agente · web + 1 canal · 10k interacciones</span>
            </td></tr>
            <tr><td style="padding:12px 14px;background:#fff5f0;border-left:3px solid #FF6B35;border-right:1px solid #eee;">
              <strong style="color:#FF6B35;">Pro ★</strong> — 499 €/mes<br>
              <span style="color:#666;">5 agentes · multicanal · 100k interacciones</span>
            </td></tr>
            <tr><td style="padding:12px 14px;background:#f8f9fc;border-radius:0 0 10px 10px;border:1px solid #eee;border-top:none;">
              <strong style="color:#FF6B35;">Enterprise</strong> — 2.499 €/mes<br>
              <span style="color:#666;">20 agentes · CRM/ERP a medida</span>
            </td></tr>
          </table>
          <p style="font-size:13px;color:#666;margin:14px 0 0;">Facturación anual <strong>-20%</strong>. Primera reunión de 1h <strong>gratis</strong>.</p>
          ${surveyBlockHtml({ beforeMeeting: false })}
          <p style="text-align:center;margin:24px 0 0;">
            <a href="${SITE_URL}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:13px 26px;border-radius:999px;font-weight:700;">Reservar reunión gratis</a>
          </p>
          ${emailFooterHtml()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return {
    subject: "Tu guía DVG Studio — planes y cómo trabajamos",
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
