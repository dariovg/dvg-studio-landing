import { logoUrl, surveyUrl } from "./site-config.js";

function qrImageUrl(link) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&color=0A0E27&bgcolor=FFFFFF&data=${encodeURIComponent(link)}`;
}

/** Infografía educativa: Chat LLM vs Agente + encuesta */
export function agentEducationInfographicHtml() {
  const link = surveyUrl();
  const qr = qrImageUrl(link);

  const row = (icon, title, color, items, highlight) => `
    <td class="email-compare-col email-stack" width="50%" style="padding:0;vertical-align:top;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${highlight ? "#fff8f3" : "#f8f9fc"};${highlight ? "border-left:3px solid #FF6B35;" : "border-right:1px solid #e8ecf2;"}">
        <tr><td style="padding:18px 16px;">
          <p style="margin:0 0 10px;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:${color};line-height:1.35;">${icon} ${title}</p>
          ${items
            .map(
              (item) =>
                `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:8px;">
                  <tr>
                    <td width="20" style="vertical-align:top;font-size:14px;color:${highlight ? "#FF6B35" : "#999"};">${highlight ? "→" : "·"}</td>
                    <td style="font-size:12px;line-height:1.5;color:${highlight ? "#333" : "#555"};">${item}</td>
                  </tr>
                </table>`
            )
            .join("")}
        </td></tr>
      </table>
    </td>`;

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 0;border-radius:16px;overflow:hidden;border:1px solid #e8ecf2;box-shadow:0 4px 24px rgba(10,14,39,.06);">
    <tr><td style="padding:20px 16px;text-align:center;background:linear-gradient(135deg,#0A0E27 0%,#1a2340 100%);">
      <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#F7931E;">Guía rápida</p>
      <p style="margin:0;font-size:18px;font-weight:800;color:#fff;line-height:1.3;">¿Chat con IA o <span style="color:#FF6B35;">Agente</span>?</p>
      <p style="margin:8px 0 0;font-size:12px;color:#aab4c8;line-height:1.45;">Lo que contratas en DVG Studio es un agente, no un chat genérico</p>
    </td></tr>
    <tr>
      ${row(
        "💬",
        "Chat LLM",
        "#6C757D",
        [
          "Responde preguntas puntuales",
          "No ejecuta acciones en tu negocio",
          "Sin memoria de tu empresa",
          "Genérico (ChatGPT, Copilot…)",
        ],
        false
      )}
      ${row(
        "🤖",
        "Agente DVG",
        "#FF6B35",
        [
          "<strong>Entiende</strong> tu negocio y tono",
          "<strong>Actúa</strong>: agenda, cotiza, avisa",
          "<strong>Conecta</strong> calendario, web, CRM",
          "<strong>24/7</strong> con supervisión humana",
        ],
        true
      )}
    </tr>
    <tr><td colspan="2" style="padding:20px 16px;background:#fff;text-align:center;border-top:1px solid #eee;">
      <p style="margin:0 0 6px;font-size:14px;font-weight:800;color:#0A0E27;">Prepara tu reunión en 3 minutos</p>
      <p style="margin:0 0 16px;font-size:12px;line-height:1.55;color:#666;max-width:380px;margin-left:auto;margin-right:auto;">Cuéntanos el punto tecnológico de tu empresa — nos llega al instante.</p>
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="margin:0 auto;max-width:360px;">
        <tr>
          <td class="email-qr-cell" style="padding:0 0 14px;vertical-align:middle;text-align:center;">
            <img src="${qr}" width="96" height="96" alt="QR encuesta" style="display:block;margin:0 auto;border-radius:12px;border:2px solid #f0f0f0;box-shadow:0 4px 12px rgba(0,0,0,.08);">
          </td>
        </tr>
        <tr>
          <td class="email-qr-cell email-qr-link" style="vertical-align:middle;text-align:center;">
            <a href="${link}" class="email-cta" style="display:inline-block;background:linear-gradient(135deg,#FF6B35 0%,#e85a28 100%);color:#fff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:800;font-size:14px;box-shadow:0 4px 14px rgba(255,107,53,.35);">Rellenar encuesta</a>
            <p style="margin:10px 0 0;font-size:10px;color:#999;word-break:break-all;line-height:1.45;">${link.replace(/^https:\/\//, "")}</p>
          </td>
        </tr>
      </table>
    </td></tr>
    <tr><td colspan="2" style="padding:18px 20px;background:linear-gradient(180deg,#0A0E27 0%,#121830 100%);text-align:center;">
      <img class="email-logo" src="${logoUrl()}" width="150" alt="DVG Studio" style="display:block;margin:0 auto 8px;max-width:150px;height:auto;">
      <p style="margin:0;color:#F7931E;font-size:13px;font-weight:700;">hac<span style="color:#FF6B35;">IA</span> lo imparable</p>
    </td></tr>
  </table>`;
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
