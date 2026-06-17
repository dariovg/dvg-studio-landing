import { logoUrl, surveyUrl, SITE_URL } from "./site-config.js";

function qrImageUrl(link) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=168x168&margin=8&color=0A0E27&bgcolor=FFFFFF&data=${encodeURIComponent(link)}`;
}

/** Infografía educativa: chat LLM vs agente + CTA encuesta con QR */
export function agentEducationInfographicHtml() {
  const link = surveyUrl();
  const qr = qrImageUrl(link);

  return `
  <div style="margin:24px 0 0;padding:0;border-radius:14px;overflow:hidden;border:1px solid #e8ecf2;">
    <div style="background:linear-gradient(135deg,#0A0E27 0%,#121830 100%);padding:18px 20px;text-align:center;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#F7931E;">Guía rápida</p>
      <p style="margin:0;font-size:17px;font-weight:800;color:#fff;">¿Chat con IA o <span style="color:#FF6B35;">Agente</span>?</p>
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8f9fc;">
      <tr>
        <td width="50%" style="padding:16px 14px;vertical-align:top;border-right:1px solid #e8ecf2;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#6C757D;">💬 Chat LLM</p>
          <ul style="margin:0;padding:0 0 0 16px;font-size:12px;line-height:1.55;color:#444;">
            <li>Responde preguntas</li>
            <li>No ejecuta acciones</li>
            <li>Sin memoria de negocio</li>
            <li>Genérico (ChatGPT…)</li>
          </ul>
        </td>
        <td width="50%" style="padding:16px 14px;vertical-align:top;background:#fff8f3;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:800;color:#FF6B35;">🤖 Agente DVG</p>
          <ul style="margin:0;padding:0 0 0 16px;font-size:12px;line-height:1.55;color:#333;">
            <li><strong>Entiende</strong> tu negocio</li>
            <li><strong>Actúa</strong>: agenda, cotiza, avisa</li>
            <li><strong>Conecta</strong> calendario, web, CRM</li>
            <li><strong>24/7</strong> con supervisión humana</li>
          </ul>
        </td>
      </tr>
    </table>
    <div style="padding:18px 20px;background:#fff;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0A0E27;">Prepara tu reunión en 3 minutos</p>
      <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:#555;">Cuéntanos el punto tecnológico de tu empresa — nos llega al instante y personalizamos la auditoría.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
        <tr>
          <td style="padding-right:16px;vertical-align:middle;">
            <img src="${qr}" width="84" height="84" alt="QR encuesta madurez digital" style="display:block;border-radius:8px;border:1px solid #eee;">
          </td>
          <td style="vertical-align:middle;text-align:left;">
            <a href="${link}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;">Rellenar encuesta</a>
            <p style="margin:8px 0 0;font-size:11px;color:#888;word-break:break-all;">${link.replace(/^https:\/\//, "")}</p>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding:16px 20px;background:linear-gradient(180deg,#0A0E27 0%,#121830 100%);text-align:center;">
      <img src="${logoUrl()}" width="160" alt="DVG Studio" style="display:block;margin:0 auto 8px;max-width:160px;height:auto;">
      <p style="margin:0;color:#F7931E;font-size:13px;font-weight:700;">hac<span style="color:#FF6B35;">IA</span> lo imparable</p>
    </div>
  </div>`;
}

export function agentEducationInfographicText() {
  const link = surveyUrl();
  return [
    "",
    "¿Chat LLM o Agente?",
    "· Chat LLM: responde, no ejecuta acciones, genérico.",
    "· Agente DVG: entiende tu negocio, agenda, cotiza, conecta herramientas, 24/7.",
    "",
    `Encuesta madurez digital (3 min): ${link}`,
  ].join("\n");
}
