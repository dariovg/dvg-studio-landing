import { CONTACT_EMAIL, SITE_URL } from "./site-config.js";

export function buildPricingGuideEmail(lead) {
  const name = (lead.name || "").split(" ")[0] || lead.name || "Hola";
  const logo = `${SITE_URL}/assets/logo-dvg-studio-footer.png`;

  const text = [
    `Hola ${name},`,
    "",
    "Gracias por tu interés en DVG Studio. Esta es la guía de planes (precios sin IVA):",
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
    "Primera reunión de 1h gratuita y sin compromiso.",
    `Reserva o escríbenos: ${CONTACT_EMAIL}`,
    SITE_URL,
  ].join("\n");

  const html = `<!DOCTYPE html><html lang="es"><body style="margin:0;font-family:system-ui,sans-serif;background:#f5f7fa;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;padding:28px;border:1px solid #eee">
    <img src="${logo}" width="200" alt="DVG Studio" style="display:block;margin:0 auto 12px">
    <p style="text-align:center;color:#F7931E;font-weight:700;margin:0 0 20px">hac<span style="color:#FF6B35">IA</span> lo imparable</p>
    <p style="color:#333">Hola <strong>${name}</strong>,</p>
    <p style="color:#555;font-size:15px">Aquí tienes la guía de planes de DVG Studio (sin IVA):</p>
    <div style="background:#f8f9fc;border-radius:12px;padding:16px;margin:16px 0;font-size:14px;color:#333;line-height:1.55">
      <p style="margin:0 0 12px"><strong style="color:#FF6B35">Starter</strong> — 199 €/mes<br>1 agente · web + 1 canal · 10k interacciones</p>
      <p style="margin:0 0 12px"><strong style="color:#FF6B35">Pro</strong> — 499 €/mes<br>5 agentes · multicanal · 100k interacciones</p>
      <p style="margin:0"><strong style="color:#FF6B35">Enterprise</strong> — 2.499 €/mes<br>20 agentes · integraciones a medida</p>
    </div>
    <p style="font-size:13px;color:#666">Facturación anual <strong>-20%</strong>. Primera reunión de 1h <strong>gratis</strong>.</p>
    <p style="text-align:center;margin-top:24px">
      <a href="${SITE_URL}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:700">Ver web</a>
    </p>
    <p style="font-size:12px;color:#999;text-align:center;margin-top:20px">${CONTACT_EMAIL}</p>
  </div></body></html>`;

  return {
    subject: "Tu guía de planes — DVG Studio",
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
  ].filter(Boolean);

  return {
    subject: `[DVG Lead] ${lead.name} — ${lead.interest || "pricing"}`,
    text: lines.join("\n"),
    html: `<pre style="font-family:system-ui,sans-serif;font-size:14px">${lines.join("\n")}</pre>`,
  };
}
