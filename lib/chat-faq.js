import { CONTACT_EMAIL, SITE_URL } from "./site-config.js";

/** Respuestas gratis — alineado con knowledge/empresa.md */
const FAQ = [
  {
    keys: ["ignite", "quien eres", "quién eres", "quien sos", "asistente"],
    reply:
      "Soy IGNITE, el asistente de DVG Studio. Puedo explicarte empleados digitales, planes o agendar una reunión de 1h gratis.",
  },
  {
    keys: ["precio", "cuesta", "coste", "cuanto", "cuánto", "tarifa", "planes", "euros"],
    reply:
      "Planes sin IVA: Starter 199 €/mes, Pro 499 €/mes, Enterprise 2.499 €/mes. Anual -20%. Primera reunión gratis.",
  },
  {
    keys: ["starter", "basico", "básico", "empezar"],
    reply: "Starter: 199 €/mes + IVA, 1 agente, chat web + 1 canal, 10.000 interacciones/mes.",
  },
  {
    keys: ["pro", "plan pro", "elegir pro", "recomendais", "recomendáis"],
    reply: "Pro: 499 €/mes + IVA, 5 agentes, todos los canales, 100.000 interacciones/mes. Es el más elegido para crecer.",
  },
  {
    keys: ["enterprise", "empresarial"],
    reply: "Enterprise: 2.499 €/mes + IVA, 20 agentes, integraciones a medida. Consultar en reunión.",
  },
  {
    keys: ["anual", "descuento", "20%"],
    reply: "Anual -20%: Starter 159 €/mes + IVA, Pro 399 €/mes + IVA, Enterprise 1.999 €/mes + IVA.",
  },
  {
    keys: ["interaccion", "interacción", "interacciones"],
    reply: "1 interacción = 1 mensaje del cliente. Límites según plan.",
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
    reply: "Auditoría gratis → configuración 1–2 semanas → lanzamiento y mejora continua con supervisión humana.",
  },
  {
    keys: ["app", "apps", "web", "pagina", "página", "desarrollo", "crear web"],
    reply: "Sí: apps y webs con IA integrada (chat IGNITE y automatizaciones desde el primer día).",
  },
  {
    keys: ["contacto", "email", "escribir"],
    reply: `${CONTACT_EMAIL} · Instagram @dvgsstudio · o «podemos quedar» en este chat.`,
  },
  {
    keys: ["instagram", "red social"],
    reply: `Instagram: @dvgsstudio — ${SITE_URL}`,
  },
  {
    keys: ["chatgpt", "chatbot", "diferencia", "openai"],
    reply: "No somos ChatGPT genérico ni chatbot de botones. Agentes configurados con tu negocio y canales.",
  },
  {
    keys: ["whatsapp", "telegram", "canal", "multicanal"],
    reply: "WhatsApp, Telegram, email, web e Instagram desde un solo agente.",
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
    reply: "El empleado digital complementa al equipo: 24/7, respuesta en segundos, desde 199 €/mes + IVA vs nómina.",
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
      "Hola, encantado. Soy IGNITE de DVG Studio. Cuéntame qué buscas — precios, cómo funciona un empleado digital o si prefieres que quedemos para una reunión gratis.",
  },
  {
    keys: ["servicio", "servicios", "que hace", "qué hace", "que ofrece", "ofreceis", "ofrecéis", "haceis", "hacéis"],
    reply:
      "Creamos empleados digitales con IA: atienden 24/7, cotizan, agendan citas y conectan catálogo/CRM. También webs y apps con IA. ¿Te interesan precios o una reunión de 1h gratis?",
  },
  {
    keys: ["ayuda", "help", "no entiendo", "que puedo", "qué puedo", "opciones"],
    reply:
      "Puedo explicarte qué es un empleado digital, planes (desde 199 €/mes + IVA), el proceso de implantación o agendar una reunión. ¿Por dónde empezamos?",
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
    return "Puedo contarte sobre empleados digitales, precios (desde 199 €/mes + IVA), implantación o agendar una reunión gratis. ¿Qué te interesa más?";
  }
  if (/\b(servicio|servicios|que hace|qué hace|que ofrece|ofreceis|ofrecéis)\b/.test(q)) {
    return "DVG Studio monta empleados digitales con IA para tu negocio: atención, citas, cotizaciones y catálogo. ¿Quieres precios o una reunión de 1h sin compromiso?";
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
