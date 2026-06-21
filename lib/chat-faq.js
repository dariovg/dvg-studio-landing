import { CONTACT_EMAIL, SITE_URL } from "./site-config.js";
import { SOCIAL_LINKS } from "./social-links.js";

const SOCIAL_SUMMARY = SOCIAL_LINKS.map((s) => `${s.label}: ${s.handle}`).join(" · ");
import { ANNUAL_DISCOUNT_PERCENT, FIRST_MONTH_IA_DISCOUNT_PERCENT } from "./pricing-config.js";

/** Respuestas gratis — alineado con knowledge/empresa.md */
const FAQ = [
  {
    keys: ["ignite", "quien eres", "quién eres", "quien sos", "asistente"],
    reply:
      "Soy IGNITE Demo, el asistente de demostración en la web de DVG Studio. Puedo explicarte empleados digitales, planes o agendar una reunión de 1h gratis. (No soy el IGNITE personal de Telegram.)",
  },
  {
    keys: ["precio", "cuesta", "coste", "cuanto", "cuánto", "tarifa", "planes", "euros"],
    reply:
      "Tenemos planes desde 349 €/mes + IVA (mantenimiento y soporte). Promo confianza mutua: −40% en el mantenimiento del mes 1 para nuevos clientes IA (facturación mensual). La implementación se cotiza aparte. Te envío la guía por email si rellenas el formulario — sin compromiso.",
  },
  {
    keys: ["starter", "basico", "básico", "empezar"],
    reply: "Starter: 1 agente IA desde 349 €/mes + IVA, todos los canales, auditoría gratis, soporte 24/7, mínimo 3 meses. Implementación aparte. Te envío la guía por email.",
  },
  {
    keys: ["pro", "plan pro", "elegir pro", "recomendais", "recomendáis"],
    reply: "Pro: hasta 5 agentes IA, todos los canales, integración con tus herramientas y mejoras web con IA. 949 €/mes + IVA. Mín. 3 meses. Te envío la guía por email.",
  },
  {
    keys: ["enterprise", "empresarial"],
    reply:
      "Enterprise: hasta 10 agentes IA, todos los canales, integración CRM/ERP, account manager y SLA. 1.749 €/mes + IVA. Mín. 3 meses. ¿Te envío la guía o prefieres una reunión?",
  },
  {
    keys: ["contrato", "permanencia", "3 meses", "tres meses", "minimo", "mínimo"],
    reply:
      "Todos los planes tienen un mínimo de 3 meses. La auditoría inicial es gratis; la implementación empieza cuando asumís el coste.",
  },
  {
    keys: ["crm", "erp", "integracion", "integración"],
    reply:
      "Integramos IA con el CRM o ERP que ya uséis — no creamos uno nuevo. También mejoras de web y apps con IA como complemento.",
  },
  {
    keys: ["encuesta", "formulario", "madurez"],
    reply:
      "Puedes completar la encuesta de madurez digital en nuestra web (/encuesta) — 3 minutos. Nos llega al instante y preparamos mejor la reunión.",
  },
  {
    keys: ["plazo", "plazos", "semanas", "cuanto tarda", "cuánto tarda"],
    reply:
      "Agentes IA: 1–2 semanas. Integraciones con tus herramientas: 2–6 semanas. Webs y apps: según alcance, presupuesto tras auditoría gratis.",
  },
  {
    keys: ["anual", "descuento", "pago anual"],
    reply: `Facturación anual: pago único 12 meses con −${ANNUAL_DISCOUNT_PERCENT}% en la tarifa mensual; el mes 1 lleva −${FIRST_MONTH_IA_DISCOUNT_PERCENT}% adicional sobre esa tarifa (ej. Starter: pago único ~€3.445 + IVA). Te lo detallo en la guía por email — indícame abajo tu correo.`,
  },
  {
    keys: ["interaccion", "interacción", "interacciones", "limite", "límite", "mensajes"],
    reply:
      "No usamos límites rígidos de interacciones en los planes. El volumen se ajusta a tu negocio — lo definimos en la auditoría gratis.",
  },
  {
    keys: [
      "agendar",
      "cita",
      "reunion",
      "reunión",
      "reservar",
      "videollamada",
      "llamada",
      "quedar",
      "quedamos",
      "podemos ver",
      "nos vemos",
    ],
    reply:
      "Háblame con naturalidad: «podemos quedar», «me gustaría una demo» o «soy Laura, mañana a las 10». Entiendo fechas, horas y datos mezclados en un solo mensaje. Confirmación por email con Meet y .ics.",
  },
  {
    keys: ["confirmacion", "confirmación", "correo", "email cita", "recibire"],
    reply:
      "Tras reservar, te llega un email con la fecha, enlace Google Meet (si aplica) y un .ics para añadir la cita a tu calendario. Revisa spam si no lo ves.",
  },
  {
    keys: ["meet", "google meet", "zoom"],
    reply:
      "La reunión es por videollamada. Si hay enlace Meet configurado, lo recibirás en el email de confirmación.",
  },
  {
    keys: ["hueco", "huecos", "disponib", "horarios", "libre"],
    reply:
      "Pregunta «¿hay hueco mañana?», «disponibilidad el martes» o con fecha DD/MM/AAAA. Horario 9–18h España.",
  },
  {
    keys: ["auditoria", "auditoría", "gratis", "prueba", "probar"],
    reply: `Primera reunión de 1h gratuita sin compromiso. Di «podemos quedar» o escribe a ${CONTACT_EMAIL}`,
  },
  {
    keys: ["implantacion", "implantación", "proceso", "como empezar", "cómo empezar"],
    reply: "Auditoría gratis siempre (reunión 1h). Después, implementación cuando asumís coste. Mínimo 3 meses. Soporte 24/7.",
  },
  {
    keys: ["app", "apps", "web", "pagina", "página", "desarrollo", "crear web"],
    reply: "Sí: como complemento mejoramos tu web o creamos apps con IA, conectadas a las herramientas que ya usáis.",
  },
  {
    keys: ["contacto", "email", "escribir"],
    reply: `${CONTACT_EMAIL} · ${SOCIAL_SUMMARY} · o «podemos quedar» en este chat.`,
  },
  {
    keys: ["instagram", "tiktok", "linkedin", "youtube", "twitter", "red social", "redes"],
    reply: `Redes DVG Studio: ${SOCIAL_SUMMARY}. Enlaces en ${SITE_URL}`,
  },
  {
    keys: ["chatgpt", "chatbot", "diferencia", "openai"],
    reply: "No somos ChatGPT genérico ni chatbot de botones. Agentes configurados con tu negocio y canales.",
  },
  {
    keys: ["whatsapp", "telegram", "canal", "multicanal"],
    reply: "WhatsApp, Telegram, email, web, Instagram, TikTok, X, LinkedIn y YouTube desde un solo agente.",
  },
  {
    keys: ["catalogo", "catálogo", "stock", "shopify", "woocommerce"],
    reply: "Catálogo conectado: CSV, Shopify o WooCommerce para stock, precios y variantes.",
  },
  {
    keys: ["empleado digital", "que es un", "qué es un", "como funciona", "cómo funciona"],
    reply: "Agente IA 24/7 que atiende, cotiza y agenda con la info de tu negocio. No es un chatbot de botones.",
  },
  {
    keys: ["humano vs", "comparativa", "sustituir", "empleado humano"],
    reply: "El empleado digital complementa al equipo: 24/7, respuesta en segundos, desde 349 €/mes + IVA (mantenimiento) vs nómina. La puesta en marcha se cotiza aparte.",
  },
  {
    keys: ["casos", "ejemplo", "sectores", "pyme"],
    reply: "PYMEs de e-commerce, servicios B2B, salud/belleza, asesorías… Leads 24/7, cotizaciones y citas automáticas.",
  },
  {
    keys: ["tecnico", "técnico", "conocimientos"],
    reply: "No necesitas conocimientos técnicos. DVG Studio configura e integra todo.",
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
    reply: "hacIA lo imparable — empleados digitales con IA para tu PYME.",
  },
  {
    keys: ["hola", "buenas", "hey", "que tal", "qué tal", "buenos dias", "buenas tardes"],
    reply:
      "Hola, encantado. Soy IGNITE Demo de DVG Studio — la versión pública de esta web. Cuéntame qué buscas: precios, cómo funciona un empleado digital o si prefieres reunión gratis.",
  },
  {
    keys: ["servicio", "servicios", "que hace", "qué hace", "que ofrece", "ofreceis", "ofrecéis", "haceis", "hacéis"],
    reply:
      "Producto principal: agentes de IA 24/7. Complemento: webs y apps con IA. Integramos con tus herramientas (no creamos CRM/ERP). ¿Precios o reunión gratis?",
  },
  {
    keys: ["ayuda", "help", "no entiendo", "que puedo", "qué puedo", "opciones"],
    reply:
      "Puedo explicarte qué es un empleado digital, planes (desde 349 €/mes + IVA), el proceso de implantación o agendar una reunión. ¿Por dónde empezamos?",
  },
  {
    keys: ["guia", "guía", "enviar guia", "mandar guia", "guia por email"],
    reply:
      "Te envío la guía de planes por email en 30 segundos — déjame tu nombre y correo en el formulario del chat.",
  },
  {
    keys: ["gracias", "thank", "perfecto", "genial"],
    reply: "De nada. Si te surge otra duda o quieres quedar con el equipo, aquí estoy.",
  },
];

function normalizeQ(message) {
  return message.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
}

export function fallbackReply(message) {
  const q = normalizeQ(message);

  if (/\b(ayuda|help|no entiendo|que puedo|qué puedo)\b/.test(q)) {
    return "Puedo contarte sobre empleados digitales, planes (desde 349 €/mes + IVA), implantación o agendar una reunión gratis. ¿Qué te interesa más?";
  }
  if (/\b(servicio|servicios|que hace|qué hace|que ofrece|ofreceis|ofrecéis)\b/.test(q)) {
    return "DVG Studio monta empleados digitales con IA para tu negocio. ¿Te envío la guía de planes por email o prefieres una reunión de 1h?";
  }
  if (/\b(quien|quién|que es dvg|qué es dvg)\b/.test(q)) {
    return `DVG Studio — hacIA lo imparable. Agentes IA para PYMEs. Primera reunión gratis: di «podemos quedar» o escribe a ${CONTACT_EMAIL}`;
  }

  return `No tengo ese detalle aquí, pero el equipo en ${CONTACT_EMAIL} te responde encantado. Mientras tanto, pregúntame por planes, cómo empezar o di «podemos quedar» para una reunión.`;
}

export function matchFaq(message) {
  const q = normalizeQ(message);
  let best = null;
  let bestScore = 0;

  for (const item of FAQ) {
    let score = 0;
    for (const key of item.keys) {
      if (q.includes(key)) {
        score += key.length > 5 ? 2 : 1;
        continue;
      }
      const words = key.split(/\s+/).filter((w) => w.length > 3);
      for (const w of words) {
        if (q.includes(w)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  if (bestScore >= 1) return best.reply;

  const tokens = q.split(/\s+/).filter((w) => w.length > 4);
  for (const item of FAQ) {
    for (const key of item.keys) {
      if (key.length > 4 && tokens.some((t) => key.includes(t) || t.includes(key))) {
        return item.reply;
      }
    }
  }

  return null;
}
