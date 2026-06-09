/** Respuestas gratis (sin Bedrock) — mantener alineado con knowledge/empresa.md */
const FAQ = [
  {
    keys: ["precio", "cuesta", "coste", "cuanto", "cuánto", "tarifa", "plan", "planes", "euros"],
    reply:
      "Planes: Starter 199 €/mes, Pro 499 €/mes, Enterprise 2.499 €/mes. Descuento 20% en facturación anual. Auditoría gratis sin compromiso.",
  },
  {
    keys: ["starter", "basico", "básico", "empezar"],
    reply:
      "Starter: 199 €/mes, 1 agente, chat web + 1 canal extra, hasta 10.000 interacciones/mes.",
  },
  {
    keys: ["pro", "profesional"],
    reply:
      "Pro: 499 €/mes, 5 agentes, todos los canales, 100.000 interacciones/mes, soporte prioritario 24/7.",
  },
  {
    keys: ["enterprise", "empresarial", "crm", "erp", "integracion", "integración"],
    reply:
      "Enterprise: 2.499 €/mes, 20 agentes, integraciones CRM/ERP custom, account manager y SLA.",
  },
  {
    keys: ["anual", "descuento", "20%"],
    reply:
      "Facturación anual con 20% dto.: Starter 159 €/mes, Pro 399 €/mes, Enterprise 1.999 €/mes.",
  },
  {
    keys: ["auditoria", "auditoría", "gratis", "prueba", "probar", "demo"],
    reply:
      "Auditoría gratuita 30–45 min: revisamos procesos, qué automatizar y ROI estimado. Sin compromiso. contact@dvgstudio.com",
  },
  {
    keys: ["contacto", "email", "escribir", "hablar", "llamar", "instagram"],
    reply: "contact@dvgstudio.com · Instagram @dvgstudio · Auditoría gratis desde la web.",
  },
  {
    keys: ["plazo", "tarda", "cuando", "cuándo", "semanas", "tiempo", "marcha"],
    reply: "Primer agente en 2–4 semanas. Calibración recomendada 3 meses para medir ROI.",
  },
  {
    keys: ["chatbot", "diferencia", "chatgpt", "openai", "gemini"],
    reply:
      "No somos un chatbot de botones ni ChatGPT genérico. Agentes con tu info, tu tono y tus canales reales.",
  },
  {
    keys: ["rgpd", "datos", "seguridad", "privacidad", "gdpr"],
    reply: "RGPD, cifrado en tránsito, no vendemos datos. Contrato de tratamiento disponible.",
  },
  {
    keys: ["whatsapp", "telegram", "canal", "instagram", "multicanal"],
    reply: "WhatsApp, Telegram, email, web e Instagram desde un solo agente, 24/7.",
  },
  {
    keys: ["clinica", "clínica", "dental", "salud", "belleza", "peluqueria", "peluquería"],
    reply: "En salud/belleza: agenda 24/7, recordatorios y FAQs. Patrón habitual +20 citas/mes.",
  },
  {
    keys: ["ecommerce", "tienda", "retail", "online"],
    reply: "E-commerce: respuesta instantánea a stock y envíos, menos abandono por dudas.",
  },
  {
    keys: ["b2b", "cotizacion", "cotización", "presupuesto"],
    reply: "B2B: cotizaciones de días a minutos. El comercial solo valida casos complejos.",
  },
  {
    keys: ["empleado digital", "agente", "que es", "qué es", "como funciona", "cómo funciona"],
    reply:
      "Un empleado digital es un agente IA que atiende clientes, cotiza y agenda 24/7 con el tono e info de tu negocio.",
  },
  {
    keys: ["contratar", "contratacion", "contratación", "proceso", "pasos"],
    reply:
      "Proceso: auditoría gratis → propuesta → configuración 2–4 sem → calibración 3 meses → revisión ROI.",
  },
  {
    keys: ["soporte", "ayuda", "incidencia"],
    reply: "Starter: email L–V 9–18h. Pro: 24/7 prioritario. Enterprise: account manager dedicado.",
  },
  {
    keys: ["cancelar", "permanencia", "baja", "contrato"],
    reply: "Mínimo recomendado 3 meses de calibración. Sin permanencia obligatoria tras el periodo acordado.",
  },
  {
    keys: ["tecnico", "técnico", "conocimientos", "instalar"],
    reply: "No necesitas conocimientos técnicos. DVG Studio configura e integra todo.",
  },
  {
    keys: ["hola", "buenas", "hey", "buenos"],
    reply:
      "Hola. Soy el asistente de DVG Studio — hacIA lo imparable. Pregúntame sobre precios, servicios o empleados digitales.",
  },
  {
    keys: ["slogan", "imparable", "hacia", "hacia lo", "marca"],
    reply: "Nuestro slogan es hacIA lo imparable: IA aplicada para que tu PYME sea imparable.",
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
