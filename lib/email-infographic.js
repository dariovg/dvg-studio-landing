import { CONTACT_EMAIL, SITE_URL, surveyUrl } from "./site-config.js";

/** Bloque HTML tipo infografía — compatible con clientes de correo (tablas). */
export function howWeWorkInfographicHtml() {
  const steps = [
    { n: "1", title: "Auditoría", desc: "Gratis — entendemos tu negocio y necesidades" },
    { n: "2", title: "Agentes IA", desc: "Implementación a medida (mín. 3 meses)" },
    { n: "3", title: "Canales", desc: "Web, WhatsApp, email… donde estén tus clientes" },
    { n: "4", title: "24/7", desc: "Soporte y mejora continua" },
  ];

  const cells = steps
    .map(
      (s) => `
    <td width="25%" style="padding:6px;vertical-align:top;text-align:center;">
      <div style="width:36px;height:36px;line-height:36px;border-radius:50%;background:#FF6B35;color:#fff;font-weight:800;font-size:16px;margin:0 auto 8px;">${s.n}</div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#0A0E27;">${s.title}</p>
      <p style="margin:0;font-size:11px;line-height:1.4;color:#5c6578;">${s.desc}</p>
    </td>`
    )
    .join("");

  return `
  <div style="margin:20px 0 8px;">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0A0E27;text-transform:uppercase;letter-spacing:.06em;">Cómo trabajamos</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#f8f9fc 0%,#eef2f8 100%);border-radius:14px;border:1px solid #e8ecf2;">
      <tr>${cells}</tr>
    </table>
  </div>`;
}

export function howWeWorkInfographicText() {
  return [
    "Cómo trabajamos:",
    "1. Auditoría gratis — entendemos tu negocio",
    "2. Implementación — agentes IA a medida (mín. 3 meses)",
    "3. Canales — web, WhatsApp, email…",
    "4. Soporte 24/7 — mejora continua",
  ].join("\n");
}

export function surveyBlockHtml({ beforeMeeting = false } = {}) {
  const url = surveyUrl();
  const intro = beforeMeeting
    ? "Antes de la reunión, nos ayuda mucho saber en qué punto de digitalización está tu empresa."
    : "¿Quieres saber en qué punto está tu empresa? Esta encuesta nos ayuda a prepararte algo útil.";

  const cta = url
    ? `<a href="${url}" style="display:inline-block;background:#004E89;color:#fff;text-decoration:none;padding:11px 20px;border-radius:999px;font-weight:600;font-size:14px;margin-top:10px;">Rellenar encuesta (3 min)</a>`
    : `<p style="margin:10px 0 0;font-size:13px;color:#555;">Te enviaremos la encuesta por correo antes de la reunión — son 3 minutos.</p>`;

  return `
  <div style="margin:20px 0 0;padding:16px 18px;background:#fff8f3;border-radius:12px;border-left:4px solid #F7931E;">
    <p style="margin:0 0 4px;font-weight:700;color:#0A0E27;font-size:14px;">📊 Madurez digital de tu empresa</p>
    <p style="margin:0;font-size:14px;line-height:1.55;color:#444;">${intro}</p>
    <div style="text-align:center;">${cta}</div>
  </div>`;
}

export function surveyBlockText({ beforeMeeting = false } = {}) {
  const url = surveyUrl();
  const lines = [
    "",
    "Encuesta de madurez digital:",
    beforeMeeting
      ? "Antes de la reunión nos gustaría conocer el punto de digitalización de tu empresa."
      : "Cuéntanos en qué punto de digitalización está tu empresa.",
  ];
  if (url) lines.push(`Enlace: ${url}`);
  else lines.push("Te enviaremos la encuesta por correo (3 min).");
  return lines.join("\n");
}

export function emailFooterHtml() {
  return `
  <p style="margin:24px 0 0;font-size:12px;color:#888;text-align:center;line-height:1.5;">
    DVG Studio · ${CONTACT_EMAIL}<br>
    <a href="${SITE_URL}" style="color:#FF6B35;text-decoration:none;">${SITE_URL.replace(/^https:\/\//, "")}</a>
  </p>`;
}
