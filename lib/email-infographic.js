import { CONTACT_EMAIL, SITE_URL, surveyUrl } from "./site-config.js";
import {
  PLANS,
  ANNUAL_DISCOUNT_PERCENT,
  FIRST_MONTH_IA_DISCOUNT_PERCENT,
  annualMonthlyPrice,
  firstMonthIaPrice,
  annualUpfrontIaTotal,
  formatEuro,
} from "./pricing-config.js";

const BRAND = {
  navy: "#0A0E27",
  navyMid: "#121830",
  orange: "#FF6B35",
  gold: "#F7931E",
  blue: "#004E89",
  gray: "#5c6578",
  light: "#f8f9fc",
};

/** Infografía proceso — 4 pasos con tarjetas */
export function howWeWorkInfographicHtml() {
  const steps = [
    { n: "1", icon: "🔍", title: "Auditoría", desc: "Gratis · mapeamos tu negocio", color: "#e8f4fd" },
    { n: "2", icon: "⚙️", title: "Implementación", desc: "Agentes a medida · mín. 3 meses", color: "#fff5f0" },
    { n: "3", icon: "📱", title: "Canales", desc: "WA, web, email, Telegram…", color: "#f0fdf4" },
    { n: "4", icon: "🛡️", title: "24/7", desc: "Soporte y mejora continua", color: "#fef9e7" },
  ];

  const cells = steps
    .map(
      (s) => `
    <td class="email-stack email-stack-pad" width="25%" style="padding:5px;vertical-align:top;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${s.color};border-radius:12px;border:1px solid #e8ecf2;">
        <tr><td style="padding:14px 10px;text-align:center;">
          <div style="font-size:22px;line-height:1;margin-bottom:6px;">${s.icon}</div>
          <div style="width:28px;height:28px;line-height:28px;border-radius:50%;background:${BRAND.orange};color:#fff;font-weight:800;font-size:13px;margin:0 auto 8px;">${s.n}</div>
          <p style="margin:0 0 4px;font-size:12px;font-weight:800;color:${BRAND.navy};">${s.title}</p>
          <p style="margin:0;font-size:10px;line-height:1.45;color:${BRAND.gray};">${s.desc}</p>
        </td></tr>
      </table>
    </td>`
    )
    .join("");

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border-radius:16px;overflow:hidden;border:1px solid #e8ecf2;">
    <tr><td style="padding:14px 16px;background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyMid} 100%);text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.gold};">Cómo trabajamos</p>
    </td></tr>
    <tr><td style="padding:12px 8px;background:${BRAND.light};">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${cells}</tr></table>
    </td></tr>
  </table>`;
}

export function howWeWorkInfographicText() {
  return [
    "Cómo trabajamos:",
    "1. Auditoría gratis — entendemos tu negocio",
    "2. Implementación — agentes IA a medida (mín. 3 meses)",
    "3. Canales — WA, web, email, Telegram…",
    "4. Soporte 24/7 — mejora continua",
  ].join("\n");
}

/** Infografía planes con precios actualizados */
export function pricingPlansInfographicHtml() {
  const promoCallout = `
    <tr><td style="padding:12px 16px;background:linear-gradient(135deg,#fff8f3 0%,#fff 100%);border-bottom:1px solid #fde8d4;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:800;color:${BRAND.navy};">🤝 Promo confianza mutua — nuevos clientes IA</p>
      <p style="margin:0;font-size:12px;line-height:1.55;color:#444;">
        <strong>−${FIRST_MONTH_IA_DISCOUNT_PERCENT}%</strong> en el mantenimiento del <strong>mes 1</strong> (Starter, Pro, Enterprise).
        Solo fee mensual de agentes IA — no aplica a implementación, web ni consultoría. Mín. 3 meses.
        Facturación anual: pago único 12 meses — 11 meses a −${ANNUAL_DISCOUNT_PERCENT}%, mes 1 con −${FIRST_MONTH_IA_DISCOUNT_PERCENT}% adicional sobre esa tarifa.
      </p>
    </td></tr>`;

  const rows = PLANS.map((plan, i) => {
    const annual = annualMonthlyPrice(plan.monthly);
    const mes1 = firstMonthIaPrice(plan.monthly);
    const mes1Annual = firstMonthIaPrice(annual);
    const upfront = annualUpfrontIaTotal(plan.monthly);
    const isPro = plan.id === "pro";
    const bg = isPro ? "#fff8f3" : "#fff";
    const border = isPro ? `border-left:4px solid ${BRAND.orange};` : "";
    const badge = plan.badge
      ? `<span class="email-plan-badge" style="display:inline-block;background:${BRAND.orange};color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:999px;margin-left:6px;">${plan.badge}</span>`
      : "";
    const highlights = plan.highlights
      .map((h) => `<span style="display:block;font-size:11px;color:${BRAND.gray};line-height:1.5;">✓ ${h}</span>`)
      .join("");

    return `
    <tr>
      <td style="padding:14px 16px;background:${bg};${border}${i < PLANS.length - 1 ? "border-bottom:1px solid #eee;" : ""}">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td class="email-plan-info" style="vertical-align:top;width:58%;">
              <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:${isPro ? BRAND.orange : BRAND.navy};line-height:1.35;">${plan.name}${badge}</p>
              <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:#333;">${plan.agents}</p>
              ${highlights}
            </td>
            <td class="email-plan-price" style="vertical-align:top;text-align:right;width:42%;">
              <p style="margin:0;font-size:22px;font-weight:900;color:${BRAND.navy};line-height:1.1;">${formatEuro(plan.monthly)}</p>
              <p style="margin:4px 0 0;font-size:11px;color:${BRAND.gray};">/mes + IVA</p>
              <p style="margin:6px 0 0;font-size:11px;color:${BRAND.orange};font-weight:700;background:#fff5f0;padding:5px 8px;border-radius:8px;display:inline-block;line-height:1.45;">
                Mes 1: ${formatEuro(mes1)}/mes<br>
                <span style="font-weight:600;color:${BRAND.gray};">(−${FIRST_MONTH_IA_DISCOUNT_PERCENT}% mant.)</span>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:${BRAND.blue};font-weight:700;background:#eef6fc;padding:6px 8px;border-radius:8px;display:inline-block;line-height:1.45;">
                Anual: ${formatEuro(annual)}/mes (−${ANNUAL_DISCOUNT_PERCENT}%)<br>
                Mes 1: ${formatEuro(mes1Annual)} · Pago único 12 meses: ${formatEuro(upfront)}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;border-radius:16px;overflow:hidden;border:1px solid #e8ecf2;">
    <tr><td style="padding:14px 16px;background:linear-gradient(135deg,${BRAND.navy} 0%,${BRAND.navyMid} 100%);text-align:center;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${BRAND.gold};">Planes de inversión</p>
      <p style="margin:0;font-size:13px;color:#ccc;line-height:1.45;">Mín. 3 meses · implementación aparte · promo mes 1 IA</p>
    </td></tr>
    ${promoCallout}
    ${rows}
    <tr><td style="padding:10px 16px;background:${BRAND.light};text-align:center;font-size:11px;color:${BRAND.gray};line-height:1.5;">
      Todos los planes incluyen todos los canales · auditoría gratis · soporte 24/7
    </td></tr>
  </table>`;
}

export function pricingPlansInfographicText() {
  const lines = [
    "PLANES (sin IVA, mín. 3 meses):",
    "",
    `PROMO CONFIANZA MUTUA: −${FIRST_MONTH_IA_DISCOUNT_PERCENT}% mantenimiento mes 1 (packs IA, facturación mensual). No aplica a web, consultoría ni implementación.`,
    "",
  ];
  for (const plan of PLANS) {
    const annual = annualMonthlyPrice(plan.monthly);
    const mes1 = firstMonthIaPrice(plan.monthly);
    const upfront = annualUpfrontIaTotal(plan.monthly);
    lines.push(
      `${plan.name.toUpperCase()} — ${formatEuro(plan.monthly)}/mes`,
      `· Mes 1 mantenimiento (mensual): ${formatEuro(mes1)}/mes (−${FIRST_MONTH_IA_DISCOUNT_PERCENT}%)`,
      `· ${plan.agents} · ${plan.highlights.join(" · ")}`,
      `· Anual ${formatEuro(annual)}/mes (−${ANNUAL_DISCOUNT_PERCENT}%), mes 1 ${formatEuro(firstMonthIaPrice(annual))}, pago único 12 meses ${formatEuro(upfront)}`,
      ""
    );
  }
  lines.push("Implementación inicial: presupuesto aparte tras auditoría.");
  return lines.join("\n");
}

export function surveyBlockHtml({ beforeMeeting = false } = {}) {
  const url = surveyUrl();
  const intro = beforeMeeting
    ? "Antes de la reunión, nos ayuda mucho saber en qué punto de digitalización está tu empresa."
    : "Cuéntanos el punto tecnológico de tu empresa — personalizamos la auditoría.";

  const cta = url
    ? `<a href="${url}" class="email-cta" style="display:inline-block;background:${BRAND.blue};color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:700;font-size:13px;margin-top:12px;">Rellenar encuesta (3 min)</a>`
    : `<p style="margin:10px 0 0;font-size:13px;color:#555;">Te enviaremos la encuesta por correo — 3 minutos.</p>`;

  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 0;border-radius:14px;overflow:hidden;border:1px solid #fde8d4;">
    <tr><td style="padding:18px 20px;background:linear-gradient(135deg,#fff8f3 0%,#fff 100%);text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:800;color:${BRAND.navy};">📊 Madurez digital</p>
      <p style="margin:0;font-size:13px;line-height:1.55;color:#444;max-width:400px;margin-left:auto;margin-right:auto;">${intro}</p>
      ${cta}
    </td></tr>
  </table>`;
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
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;">
    <tr><td style="text-align:center;padding-top:16px;border-top:1px solid #eee;">
      <p style="margin:0;font-size:12px;color:#888;line-height:1.6;">
        DVG Studio · ${CONTACT_EMAIL}<br>
        <a href="${SITE_URL}" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">${SITE_URL.replace(/^https:\/\//, "")}</a>
      </p>
    </td></tr>
  </table>`;
}
