/** Extracción conversacional y respuestas humanizadas — sincronizar con js/natural-language.js */
import {
  parseNaturalDate,
  parseNaturalTime,
  wantsBooking,
  wantsAvailability,
} from "./natural-date.js";

export { wantsBooking, wantsAvailability, parseNaturalDate, parseNaturalTime };

const MONTHS = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

export function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const NAME_STOP =
  /^(me|te|yo|un|una|el|la|los|las|quiero|quisiera|gustaria|gustaría|podemos|nos|para|con|por|reunion|reunión|cita|demo|agendar|reservar|organicemos|perfecto|si|sí|ok|vale|yes|yep|claro|genial|dale|confirmo|adelante|listo|hecho|nada|nop|no)$/i;

export function isBookingIntentText(text) {
  const t = normalize(text);
  return (
    /\b(quedar|reunion|reunión|cita|demo|agendar|reservar|concertar|gustaria|gustaría|encuentro|llamada|videollamada|hablar|reunirnos|podemos|organicemos)\b/.test(
      t
    ) || /^(me gustaria|me gustaría|quisiera|quiero)\b/.test(t)
  );
}

export function looksLikePersonName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length || parts[0].length < 2) return false;
  if (parts.some((p) => NAME_STOP.test(p))) return false;
  return true;
}

export function firstName(name) {
  const n = String(name || "").trim().split(/\s+/)[0];
  if (!n || n.length < 2 || NAME_STOP.test(n)) return "";
  return n.charAt(0).toUpperCase() + n.slice(1).toLowerCase();
}

export function extractEmail(text) {
  const m = String(text || "").match(
    /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i
  );
  return m ? m[0].toLowerCase() : null;
}

export function extractPhone(text) {
  const raw = String(text || "");
  const labeled = raw.match(
    /(?:movil|móvil|tel[eé]fono|tfno|whatsapp|wasap|wsp|llamar|contacto)[:\s]*([+\d][\d\s().-]{7,})/i
  );
  const candidate = labeled ? labeled[1] : raw;
  const digits = candidate.replace(/[^\d+]/g, "");
  if (digits.length < 9) return null;

  if (digits.startsWith("+")) return digits.replace(/\s/g, "");
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.length === 9 && /^[6789]/.test(digits)) return "+34" + digits;
  if (digits.length === 11 && digits.startsWith("34")) return "+" + digits;
  if (digits.length >= 9) return digits;
  return null;
}

export function extractName(text) {
  const raw = String(text || "").trim();
  if (!raw || isBookingIntentText(raw) || isConfirmationReply(raw)) return null;
  const t = normalize(raw);

  const patterns = [
    /(?:me llamo|soy|mi nombre es|nombre:?)\s+([a-záéíóúñ][a-záéíóúñ\s'.-]{1,60})/i,
    /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})$/,
  ];

  for (const re of patterns) {
    const m = raw.match(re);
    if (m) {
      let name = m[1].trim().replace(/[,.]$/, "");
      name = name.replace(/\s+(y|mi|correo|email|mail|telefono|teléfono|movil|móvil)\b.*/i, "");
      if (name.length >= 2 && name.length <= 80 && !/@/.test(name) && looksLikePersonName(name)) {
        return name
          .split(/\s+/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ");
      }
    }
  }

  if (
    /^[a-záéíóúñ]{2,}(?:\s+[a-záéíóúñ]{2,}){0,3}$/i.test(t) &&
    !extractEmail(raw) &&
    !extractPhone(raw) &&
    looksLikePersonName(raw)
  ) {
    return raw
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  return null;
}

function parseDayMonth(text, refYear) {
  const t = normalize(text);
  const y = refYear || new Date().getFullYear();

  let m = t.match(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\b/);
  if (m) {
    const day = Number(m[1]);
    const month = MONTHS[m[2]];
    const year = m[3] ? Number(m[3]) : y;
    return formatParts(day, month, year);
  }

  m = t.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{1,2})(?:\s+de\s+(\d{4}))?\b/);
  if (m) {
    const month = MONTHS[m[1]];
    const day = Number(m[2]);
    const year = m[3] ? Number(m[3]) : y;
    return formatParts(day, month, year);
  }

  m = t.match(/\bel\s+d[ií]a\s+(\d{1,2})\b/);
  if (m) {
    const now = new Date();
    return formatParts(Number(m[1]), now.getMonth() + 1, now.getFullYear());
  }

  return null;
}

function formatParts(day, month, year) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
}

export function parseDateExtended(text) {
  return parseNaturalDate(text) || parseDayMonth(text);
}

export function parseTimeExtended(text) {
  const t = normalize(text);
  const base = parseNaturalTime(text);
  if (base) return base;

  if (/^\d{1,2}$/.test(t)) {
    const h = Number(t);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, "0")}:00`;
  }
  if (/^\d{1,2}:\d{2}$/.test(t)) {
    const [hh, mm] = t.split(":");
    return `${String(Number(hh)).padStart(2, "0")}:${mm}`;
  }

  const lasHour = t.match(/\b(?:a las|las|sobre las|mejor a las|prefiero las|quiero las)\s+(\d{1,2})(?:\s*y\s+media)?\b/);
  if (lasHour) {
    const h = Number(lasHour[1]);
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, "0")}${/\by\s+media\b/.test(t) ? ":30" : ":00"}`;
    }
  }

  if (/\b(esta tarde|por la tarde|a ultima hora)\b/.test(t)) return "16:00";
  if (/\b(esta manana|por la manana|temprano)\b/.test(t) && !/\b\d/.test(t)) return "10:00";
  if (/\b(antes del mediodia|media manana)\b/.test(t)) return "11:00";
  if (/\b(despues de comer|tras comer)\b/.test(t)) return "15:00";

  const andHalf = t.match(/\b(\d{1,2})\s+y\s+media\b/);
  if (andHalf) {
    const h = Number(andHalf[1]);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, "0")}:30`;
  }

  const enPunto = t.match(/\b(\d{1,2})\s+en\s+punto\b/);
  if (enPunto) {
    const h = Number(enPunto[1]);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, "0")}:00`;
  }

  return null;
}

export function wantsTimeChange(text) {
  const t = normalize(text);
  if (parseTimeExtended(text)) return true;
  return (
    /\b(otra hora|cambiar hora|cambiar la hora|diferente hora|distinta hora|no esa hora|no a esa hora|no a las|mejor otro|otro horario)\b/.test(t) ||
    (/\bno\b/.test(t) && /\b(las|hora|a las)\b/.test(t))
  );
}

export function extractBookingFields(text) {
  const email = extractEmail(text);
  const phone = extractPhone(text);
  const date = parseDateExtended(text);
  const time = parseTimeExtended(text);
  let name = extractName(text);

  if (!name && email) {
    const local = email.split("@")[0].replace(/[._-]/g, " ");
    if (/^[a-z]{2,}$/i.test(local.replace(/\s/g, ""))) {
      name = local
        .split(/\s+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    }
  }

  return { name, email, phone, date, time };
}

export function isAffirmative(text) {
  const t = normalize(text);
  return /^(si|sí|ok|vale|perfecto|confirmo|adelante|dale|de acuerdo|correcto|exacto|claro|genial|listo|hecho|yes|yep|afirmativo|por supuesto|venga|marchando)$/.test(
    t
  ) || /\b(me parece bien|esta bien|está bien|sin problema|sin problemas|adelante con|confirmado)\b/.test(t);
}

export function isNegative(text) {
  const t = normalize(text);
  return /^(no|nop|cancelar|anular|mejor no|para nada)$/.test(t) || /\b(no confirmo|no quiero|dejalo|déjalo)\b/.test(t);
}

export function isSkipNotes(text) {
  const t = normalize(text);
  return /^(no|nada|ninguna?|ninguno|na|nop|todo bien|sin notas|no hay|n\/a|-|no gracias)$/.test(t)
    || /\b(nada especial|sin comentarios|no tengo nada|no es necesario)\b/.test(t);
}

export function isConfirmationReply(text) {
  return isAffirmative(text) || isNegative(text) || isSkipNotes(text);
}

export function wantsCancel(text) {
  const t = normalize(text);
  return /^(cancelar|anular|parar|salir|dejalo|déjalo|mejor no)$/.test(t)
    || /\b(cancelar cita|no quiero seguir|olvidalo|olvídalo)\b/.test(t);
}

export function detectCorrection(text) {
  const edit = detectFieldEdit(text);
  if (edit) return edit;

  const date = parseDateExtended(text);
  const time = parseTimeExtended(text);
  if (date && time) return null;
  if (date) return "date";
  if (time || wantsTimeChange(text)) return "time";
  const t = normalize(text);
  const fields = {
    name: /\b(cambiar|corregir|modificar|editar)\s+(el\s+)?nombre\b|\bmi nombre es\b/,
    email: /\b(cambiar|corregir|modificar|editar)\s+(el\s+)?(correo|email|mail)\b|\bmi (correo|email|mail)\b/,
    phone: /\b(cambiar|corregir|modificar|editar)\s+(el\s+)?(telefono|teléfono|movil|móvil|phone)\b|\bmi (telefono|teléfono|movil|móvil)\b/,
    date: /\b(cambiar|corregir|modificar|editar)\s+(el\s+)?(dia|día|fecha)\b|\botro dia\b|\botro día\b/,
  };
  for (const [field, re] of Object.entries(fields)) {
    if (re.test(t)) return field;
  }
  return null;
}

/** Edición explícita antes de confirmar: «editar teléfono», «volver atrás», etc. */
export function detectFieldEdit(text) {
  const t = normalize(text);
  if (/^(volver|atras|atrás|anterior|atrasar|back)$/.test(t) || /\bvolver atras\b|\bvolver atrás\b/.test(t)) {
    return "back";
  }
  if (/^(editar|modificar|corregir|cambiar)\s+(nombre|mail|email|correo|telefono|teléfono|movil|móvil|fecha|dia|día|hora)$/.test(t)) {
    const m = t.match(/^(editar|modificar|corregir|cambiar)\s+(\w+)/);
    const word = m?.[2] || "";
    if (/nombre/.test(word)) return "name";
    if (/mail|email|correo/.test(word)) return "email";
    if (/telefono|teléfono|movil|móvil|phone/.test(word)) return "phone";
    if (/fecha|dia|día/.test(word)) return "date";
    if (/hora/.test(word)) return "time";
  }
  if (/^(nombre|email|correo|telefono|teléfono|movil|móvil|fecha|hora)$/.test(t)) {
    if (/nombre/.test(t)) return "name";
    if (/mail|email|correo/.test(t)) return "email";
    if (/telefono|teléfono|movil|móvil/.test(t)) return "phone";
    if (/fecha|dia|día/.test(t)) return "date";
    if (/hora/.test(t)) return "time";
  }
  return null;
}

export function wantsManageBooking(text) {
  const t = normalize(text);
  return (
    /\b(cancelar|anular)\b.*\b(cita|reunion|reunión|reserva)\b/.test(t) ||
    /\b(cancelar cita|cancelar reunion|cancelar reunión|cancelar mi cita)\b/.test(t) ||
    /\b(modificar|cambiar|mover|reprogramar|aplazar)\b.*\b(cita|reunion|reunión|fecha|hora|reserva)\b/.test(t) ||
    /\b(editar mis datos|editar datos|actualizar mis datos)\b/.test(t) ||
    /\b(mi cita|mi reunion|mi reunión|gestionar cita)\b/.test(t)
  );
}

export function wantsNewMeeting(text) {
  const t = normalize(text);
  if (wantsManageBooking(text)) return false;
  return (
    /\b(nueva reunion|nueva reunión|otra reunion|otra reunión|otra cita|segunda reunion|segunda reunión)\b/.test(t) ||
    (/\b(otra|nueva|segunda)\b/.test(t) && /\b(reunion|reunión|cita)\b/.test(t))
  );
}

export function previousBookField(current) {
  const order = ["name", "email", "phone", "date", "time", "notes"];
  const idx = order.indexOf(current);
  return idx > 0 ? order[idx - 1] : null;
}

const ACK = {
  name: ["Encantado, {n}.", "Perfecto, {n}.", "Genial, {n}."],
  email: ["Apuntado.", "Recibido, te escribiremos ahí.", "Perfecto, lo tengo."],
  phone: ["Gracias.", "Anotado.", "Perfecto."],
  date: ["Vale, el {v}.", "Perfecto, {v}.", "Apuntado: {v}."],
  time: ["A las {v}, entendido.", "Perfecto, {v}.", "Genial, {v}."],
};

export function humanAck(field, value, bookData = {}) {
  const pool = ACK[field] || ["Perfecto."];
  const line = pool[Math.floor(Math.random() * pool.length)];
  const n = firstName(bookData.name);
  return line.replace("{n}", n).replace("{v}", value || "");
}

export function humanPrompt(field, bookData = {}) {
  const n = firstName(bookData.name);
  const prompts = {
    name: "¿Cómo te llamas?",
    email: n ? `${n}, ¿cuál es tu correo?` : "¿Tu correo electrónico?",
    phone: n ? `¿Un teléfono por si acaso, ${n}?` : "¿Tu móvil o teléfono?",
    date: "¿Qué día te viene bien? Puedes decirlo como quieras: mañana, el martes, 15 de junio…",
    time: "¿A qué hora? Por ejemplo: a las 10, por la tarde, 10 y media…",
    notes: "¿Algo que debamos saber antes de la reunión? Si no, dime «nada».",
  };
  return prompts[field] || "";
}

export function humanBookingIntro(prefill = {}) {
  const bits = [];
  if (prefill.date) bits.push(`el ${prefill.date}`);
  if (prefill.time) bits.push(`a las ${prefill.time}`);
  if (bits.length) {
    return `¡Claro! Veo que te iría bien ${bits.join(" ")}. Te pido unos datos rápidos para la reunión de 1h — puedes hablarme con naturalidad. Si cambias de idea, «cancelar».`;
  }
  return "¡Perfecto! Organicemos una reunión de 1h. Cuéntame con naturalidad; si quieres salir, «cancelar».";
}
