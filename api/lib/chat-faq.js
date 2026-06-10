import { CONTACT_EMAIL } from "./site-config.js";

/** Respuestas gratis — alineado con knowledge/empresa.md (sin claims legales) */
const FAQ = [
  {
    keys: ["precio", "cuesta", "coste", "cuanto", "cuánto", "tarifa", "planes", "euros"],
    reply:
      "Planes: Starter 199 €/mes, Pro 499 €/mes, Enterprise 2.499 €/mes. Anual -20%. Primera reunión gratis.",
  },
  {
    keys: ["starter", "basico", "básico", "empezar"],
    reply: "Starter: 199 €/mes, 1 agente, chat web + 1 canal, 10.000 interacciones/mes.",
  },
  {
    keys: ["plan pro", "elegir pro"],
    reply: "Pro: 499 €/mes, 5 agentes, todos los canales, 100.000 interacciones/mes.",
  },
  {
    keys: ["enterprise", "empresarial"],
    reply: "Enterprise: 2.499 €/mes, 20 agentes, integraciones a medida. Consultar en reunión.",
  },
  {
    keys: ["anual", "descuento", "20%"],
    reply: "Anual -20%: Starter 159 €/mes, Pro 399 €/mes, Enterprise 1.999 €/mes.",
  },
  {
    keys: ["interaccion", "interacción", "interacciones"],
    reply: "1 interacción = 1 mensaje del cliente. Límites según plan.",
  },
  {
    keys: ["agendar", "cita", "reunion", "reunión", "reservar", "videollamada", "llamada"],
    reply: "Escribe «agendar cita» y te pediré tus datos. Compruebo huecos en todos tus calendarios (1h).",
  },
  {
    keys: ["hueco", "huecos", "disponib", "horarios", "libre"],
    reply: "Pregunta: «disponibilidad DD/MM/AAAA» o «¿hay hueco el 15/06/2026 a las 10:00?»",
  },
  {
    keys: ["auditoria", "auditoría", "gratis", "prueba", "probar"],
    reply: `Primera reunión de 1h gratuita sin compromiso. Escribe «agendar cita» o ${CONTACT_EMAIL}`,
  },
  {
    keys: ["app", "apps", "web", "pagina", "página", "desarrollo", "crear web"],
    reply: "Sí: apps y webs con IA integrada (chat y automatizaciones desde el primer día).",
  },
  {
    keys: ["contacto", "email", "escribir", "instagram"],
    reply: `${CONTACT_EMAIL} · @dvgsstudio · o «agendar cita» en este chat.`,
  },
  {
    keys: ["chatgpt", "chatbot", "diferencia", "openai"],
    reply: "No somos ChatGPT genérico ni chatbot de botones. Agentes configurados con tu negocio.",
  },
  {
    keys: ["whatsapp", "telegram", "canal", "instagram", "multicanal"],
    reply: "WhatsApp, Telegram, email, web e Instagram desde un solo agente.",
  },
  {
    keys: ["catalogo", "catálogo", "stock", "shopify", "woocommerce"],
    reply: "Catálogo conectado: CSV, Shopify o WooCommerce para stock, precios y variantes.",
  },
  {
    keys: ["empleado digital", "que es un", "qué es un", "como funciona", "cómo funciona"],
    reply: "Agente IA que atiende, cotiza y agenda con la info de tu negocio.",
  },
  {
    keys: ["tecnico", "técnico", "conocimientos"],
    reply: "No necesitas conocimientos técnicos. DVG Studio configura todo.",
  },
  {
    keys: ["idioma", "ingles", "inglés"],
    reply: "Español por defecto. Otros idiomas según proyecto.",
  },
  {
    keys: ["legal", "rgpd", "gdpr", "privacidad", "garantia", "garantía", "responsabilidad"],
    reply: `Eso lo trata el equipo directamente. Escríbenos a ${CONTACT_EMAIL}`,
  },
  {
    keys: ["slogan", "imparable"],
    reply: "hacIA lo imparable — IA aplicada para tu PYME.",
  },
  {
    keys: ["hola", "buenas", "hey"],
    reply: "Hola. Soy IGNITE. Pregúntame servicios o escribe «agendar cita» para una reunión de 1h.",
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
