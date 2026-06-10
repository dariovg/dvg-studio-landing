/** Fechas y horas en lenguaje natural (España / Europe-Madrid) */

const WEEKDAYS = {
  domingo: 7,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  miércoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  sábado: 6,
};

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function getSpainToday(when = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(when);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value || 0);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

export function formatDateParts({ year, month, day }) {
  return `${pad2(day)}/${pad2(month)}/${year}`;
}

function toDateObj({ year, month, day }) {
  return new Date(year, month - 1, day);
}

function fromDateObj(d) {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

function addDays(ref, days) {
  const d = toDateObj(ref);
  d.setDate(d.getDate() + days);
  return fromDateObj(d);
}

function isoWeekday(ref) {
  const d = toDateObj(ref);
  const js = d.getDay();
  return js === 0 ? 7 : js;
}

function weekdayInNextCalendarWeek(ref, isoWd) {
  const current = isoWeekday(ref);
  const daysToNextMonday = current === 1 ? 7 : (8 - current) % 7 || 7;
  const monday = addDays(ref, daysToNextMonday);
  return addDays(monday, isoWd - 1);
}

function nextWeekday(ref, isoWd, forceNext = false) {
  const current = isoWeekday(ref);
  let delta = (isoWd - current + 7) % 7;
  if (forceNext && delta === 0) delta = 7;
  return addDays(ref, delta);
}

function matchWeekday(text) {
  const m = text.match(
    /\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/
  );
  return m ? WEEKDAYS[m[1]] : null;
}

export function parseNaturalDate(text, ref = getSpainToday()) {
  const t = normalize(text);
  if (!t) return null;

  const explicit = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (explicit) {
    return `${pad2(Number(explicit[1]))}/${pad2(Number(explicit[2]))}/${explicit[3]}`;
  }

  if (/\bpasado\s+manana\b/.test(t)) return formatDateParts(addDays(ref, 2));
  if (/\bmanana\b/.test(t) && !/\bpor la manana\b/.test(t)) {
    return formatDateParts(addDays(ref, 1));
  }
  if (/\bhoy\b/.test(t)) return formatDateParts(ref);

  const inDays = t.match(/\ben\s+(\d{1,2})\s+dias?\b/);
  if (inDays) return formatDateParts(addDays(ref, Number(inDays[1])));

  const wd = matchWeekday(t);
  if (wd) {
    if (/\bsemana\s+que\s+viene\b/.test(t)) {
      return formatDateParts(weekdayInNextCalendarWeek(ref, wd));
    }
    if (/\b(proximo|siguiente)\b/.test(t)) {
      return formatDateParts(nextWeekday(ref, wd, true));
    }
    if (/\beste\b/.test(t)) {
      return formatDateParts(nextWeekday(ref, wd, false));
    }
    return formatDateParts(nextWeekday(ref, wd, false));
  }

  return null;
}

export function parseNaturalTime(text) {
  const t = normalize(text);
  if (!t) return null;

  const hhmm = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (hhmm) {
    const h = Number(hhmm[1]);
    const m = Number(hhmm[2]);
    if (h <= 23 && m <= 59) return `${pad2(h)}:${pad2(m)}`;
  }

  const atHour = t.match(/\b(?:a las|las|sobre las)\s+(\d{1,2})(?:\s*h(?:oras?)?)?\b/);
  if (atHour) {
    const h = Number(atHour[1]);
    if (h >= 0 && h <= 23) return `${pad2(h)}:00`;
  }

  const hourH = t.match(/\b(\d{1,2})\s*h(?:oras?)?\b/);
  if (hourH) {
    const h = Number(hourH[1]);
    if (h >= 0 && h <= 23) return `${pad2(h)}:00`;
  }

  if (/\b(ultima hora|fin de tarde)\b/.test(t)) return "17:00";
  if (/\b(por la tarde|tarde)\b/.test(t)) return "16:00";
  if (/\b(media manana)\b/.test(t)) return "11:30";
  if (/\b(por la manana|manana temprano|primera hora)\b/.test(t) && !/\bmanana\b.*\b\d/.test(t)) {
    return "10:00";
  }
  if (/\b(mediodia|almuerzo)\b/.test(t)) return "12:00";

  return null;
}

export function wantsBooking(text) {
  const t = normalize(text);
  if (!t) return false;

  if (
    /agendar|cita|reunion|videollamada|llamada|auditoria|reservar|calendar|concertar|programar|apuntar|solicitar|demo|presentacion|asesoria|consulta/.test(
      t
    )
  ) {
    return true;
  }

  if (/\b(quedar|quedamos|nos vemos|vernos|concertamos|quedaria|quedemos)\b/.test(t)) {
    return true;
  }

  if (/\b(podemos|quiero|podria|te viene|nos podemos|cuando|gustaria|me gustaria)\b/.test(t) && /\b(ver|hablar|llamar|quedar|conocer|charlar|explicar|enseñar|mostrar)\b/.test(t)) {
    return true;
  }

  if (/\b(reservar|apuntar|sacar|pedir|organizar|coordinar)\b.*\b(cita|hora|reunion|videollamada|sesion|llamada)\b/.test(t)) {
    return true;
  }

  if (/\b(cita|reunion|videollamada|sesion|llamada)\b.*\b(reservar|agendar|concertar|organizar)\b/.test(t)) {
    return true;
  }

  if (/\b(tener|hacer|montar)\b.*\b(reunion|videollamada|sesion|llamada)\b/.test(t)) {
    return true;
  }

  if (/\b(me interesa|estoy interesad|cuentame mas|cuéntame más)\b/.test(t) && /\b(reunion|llamada|hablar|vernos)\b/.test(t)) {
    return true;
  }

  return false;
}

export function wantsAvailability(text) {
  const t = normalize(text);
  if (!t) return false;
  return /hueco|huecos|disponib|libre|horarios|disponibilidad|hay sitio|esta libre|cuando podeis|cuando podéis|cuando tengais|cuando tengáis|que dias|qué días/.test(t);
}

export function extractDateTimeFromText(text) {
  return {
    date: parseNaturalDate(text),
    time: parseNaturalTime(text),
  };
}
