/** Respuestas gratis — alineado con knowledge/empresa.md */
const FAQ = [
  {
    keys: ["precio", "cuesta", "coste", "cuanto", "cuánto", "tarifa", "planes", "euros", "inversion"],
    reply:
      "Planes: Starter 199 €/mes, Pro 499 €/mes, Enterprise 2.499 €/mes. Anual -20%: 159 / 399 / 1.999 €/mes. Auditoría gratis.",
  },
  {
    keys: ["starter", "basico", "básico", "empezar"],
    reply: "Starter: 199 €/mes, 1 agente, chat web + 1 canal, 10.000 interacciones/mes.",
  },
  {
    keys: ["plan pro", "elegir pro", "pro "],
    reply: "Pro: 499 €/mes, 5 agentes, todos los canales, 100.000 interacciones/mes, soporte 24/7.",
  },
  {
    keys: ["enterprise", "empresarial"],
    reply: "Enterprise: 2.499 €/mes, 20 agentes, CRM/ERP custom, account manager y SLA.",
  },
  {
    keys: ["anual", "descuento", "20%"],
    reply: "Anual -20%: Starter 159 €/mes, Pro 399 €/mes, Enterprise 1.999 €/mes.",
  },
  {
    keys: ["interaccion", "interacción", "interacciones", "limite", "límite", "10k", "100k"],
    reply: "1 interacción = 1 mensaje del cliente. Starter 10K/mes, Pro 100K/mes. Si te pasas, te avisamos y proponemos upgrade.",
  },
  {
    keys: ["auditoria", "auditoría", "gratis", "prueba", "probar", "demo"],
    reply: "Auditoría gratis 30-45 min, sin compromiso. contact@dvgstudio.com o botón en la web.",
  },
  {
    keys: ["contacto", "email", "escribir", "hablar", "llamar", "instagram"],
    reply: "contact@dvgstudio.com · @dvgstudio · Auditoría gratis en la web.",
  },
  {
    keys: ["plazo", "tarda", "cuando", "cuándo", "semanas", "marcha"],
    reply: "Primer agente en 2-4 semanas. Calibración 3 meses para medir ROI.",
  },
  {
    keys: ["chatgpt", "chatbot", "diferencia", "openai", "gemini"],
    reply: "No somos ChatGPT genérico ni chatbot de botones. Agentes con tu info, tono y canales reales.",
  },
  {
    keys: ["rgpd", "datos", "seguridad", "privacidad", "gdpr"],
    reply: "RGPD, cifrado TLS, no vendemos datos. Contrato de tratamiento disponible.",
  },
  {
    keys: ["whatsapp", "telegram", "canal", "instagram", "multicanal"],
    reply: "WhatsApp, Telegram, email, web e Instagram desde un solo agente, 24/7.",
  },
  {
    keys: ["catalogo", "catálogo", "stock", "shopify", "woocommerce", "producto"],
    reply: "Conectamos catálogo CSV, Shopify o WooCommerce: el agente responde stock, precios y variantes en tiempo real.",
  },
  {
    keys: ["clinica", "clínica", "dental", "salud", "belleza"],
    reply: "En salud/belleza: agenda 24/7, recordatorios y FAQs. Patrón +20 citas/mes fuera de horario.",
  },
  {
    keys: ["ecommerce", "tienda", "retail"],
    reply: "E-commerce: respuesta instantánea a stock y envíos, menos abandono por dudas.",
  },
  {
    keys: ["cotizacion", "cotización", "presupuesto", "b2b"],
    reply: "B2B: cotizaciones de días a minutos. El comercial valida casos complejos.",
  },
  {
    keys: ["empleado digital", "que es un", "qué es un", "como funciona", "cómo funciona"],
    reply: "Agente IA que atiende, cotiza y agenda 24/7 con la info y tono de tu negocio.",
  },
  {
    keys: ["contratar", "contratacion", "contratación", "proceso", "pasos"],
    reply: "Auditoría → propuesta → configuración 2-4 sem → calibración 3 meses → revisión ROI.",
  },
  {
    keys: ["soporte", "ayuda", "incidencia"],
    reply: "Starter: email L-V 9-18h. Pro: 24/7. Enterprise: account manager.",
  },
  {
    keys: ["cancelar", "permanencia", "baja"],
    reply: "3 meses recomendados de calibración. Sin permanencia obligatoria tras periodo acordado.",
  },
  {
    keys: ["equivoca", "error", "falla", "equivoc"],
    reply: "Calibración continua y supervisión humana. El agente no firma contratos ni decisiones críticas solo.",
  },
  {
    keys: ["idioma", "ingles", "inglés", "otro idioma"],
    reply: "Español por defecto. Inglés y otros idiomas según necesidad.",
  },
  {
    keys: ["crm", "hubspot", "holded", "zoho", "integra"],
    reply: "Pro: integraciones estándar. Enterprise: CRM/ERP custom (HubSpot, Holded, Zoho — consultar caso).",
  },
  {
    keys: ["tecnico", "técnico", "conocimientos", "instalar"],
    reply: "No necesitas conocimientos técnicos. DVG Studio configura todo.",
  },
  {
    keys: ["cambiar plan", "cambio de plan", "escalar"],
    reply: "Tras el periodo mínimo puedes escalar o bajar de plan sin penalización.",
  },
  {
    keys: ["slogan", "imparable", "hacia"],
    reply: "Nuestro slogan: hacIA lo imparable — IA aplicada para que tu PYME no pare.",
  },
  {
    keys: ["hola", "buenas", "hey", "buenos"],
    reply: "Hola. Soy IGNITE de DVG Studio — hacIA lo imparable. Pregúntame precios, servicios o empleados digitales.",
  },
];

export function matchFaq(message) {
  const q = message.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  let best = null;
  let bestScore = 0;

  for (const item of FAQ) {
    let score = 0;
    for (const key of item.keys) {
      if (q.includes(key)) score += key.length > 5 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  return bestScore >= 1 ? best.reply : null;
}
