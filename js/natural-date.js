/* Parser de fechas/horas naturales — sincronizado con lib/natural-date.js */
(function () {
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

  var MONTHS = {
    enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
    julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10,
    noviembre: 11, diciembre: 12,
  };

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getSpainToday(when) {
    when = when || new Date();
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(when);
    const get = function (type) {
      return Number(parts.find(function (p) { return p.type === type; })?.value || 0);
    };
    return { year: get("year"), month: get("month"), day: get("day") };
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function formatDateParts(ref) {
    return pad2(ref.day) + "/" + pad2(ref.month) + "/" + ref.year;
  }

  function toDateObj(ref) {
    return new Date(ref.year, ref.month - 1, ref.day);
  }

  function fromDateObj(d) {
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  function addDays(ref, days) {
    var d = toDateObj(ref);
    d.setDate(d.getDate() + days);
    return fromDateObj(d);
  }

  function isoWeekday(ref) {
    var d = toDateObj(ref);
    var js = d.getDay();
    return js === 0 ? 7 : js;
  }

  function weekdayInNextCalendarWeek(ref, isoWd) {
    var current = isoWeekday(ref);
    var daysToNextMonday = current === 1 ? 7 : (8 - current) % 7 || 7;
    var monday = addDays(ref, daysToNextMonday);
    return addDays(monday, isoWd - 1);
  }

  function getSpainHour() {
    try {
      var parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Madrid",
        hour: "numeric",
        hour12: false,
      }).formatToParts(new Date());
      return Number(parts.find(function (p) { return p.type === "hour"; })?.value || 12);
    } catch (e) {
      return new Date().getHours();
    }
  }

  function nextWeekday(ref, isoWd, forceNext) {
    var current = isoWeekday(ref);
    var delta = (isoWd - current + 7) % 7;
    if (forceNext && delta === 0) delta = 7;
    if (!forceNext && delta === 0 && getSpainHour() >= 17) delta = 7;
    return addDays(ref, delta);
  }

  function matchWeekday(text) {
    var m = text.match(/\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/);
    return m ? WEEKDAYS[m[1]] : null;
  }

  /** «el jueves 18», «jueves 18 de junio» */
  function parseWeekdayWithDay(text, ref) {
    var m = text.match(
      /\b(?:el\s+)?(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\s+(\d{1,2})(?:\s+de\s+([a-z]+))?(?:\s+de\s+(\d{4}))?\b/
    );
    if (!m) return null;
    var isoWd = WEEKDAYS[m[1]];
    var day = Number(m[2]);
    var month = m[3] ? MONTHS[m[3]] : ref.month;
    var year = m[4] ? Number(m[4]) : ref.year;
    if (m[3] && !month) return null;
    if (!m[3]) {
      month = ref.month;
      year = ref.year;
      if (day < ref.day) {
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
      }
    }
    var candidate = { year: year, month: month, day: day };
    if (isoWeekday(candidate) !== isoWd) return null;
    return formatDateParts(candidate);
  }

  function parseNaturalDate(text, ref) {
    ref = ref || getSpainToday();
    var t = normalize(text);
    if (!t) return null;

    var explicit = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (explicit) {
      return pad2(Number(explicit[1])) + "/" + pad2(Number(explicit[2])) + "/" + explicit[3];
    }

    var wdDay = parseWeekdayWithDay(t, ref);
    if (wdDay) return wdDay;

    if (/\bpasado\s+manana\b/.test(t)) return formatDateParts(addDays(ref, 2));
    if (/\bmanana\b/.test(t) && !/\bmanana\s+temprano\b/.test(t) && !/\bpor la manana\b/.test(t)) {
      return formatDateParts(addDays(ref, 1));
    }
    if (/\bhoy\b/.test(t)) return formatDateParts(ref);

    var inDays = t.match(/\ben\s+(\d{1,2})\s+dias?\b/);
    if (inDays) return formatDateParts(addDays(ref, Number(inDays[1])));

    var wd = matchWeekday(t);
    if (wd) {
      if (/\bsemana\s+que\s+viene\b/.test(t)) {
        return formatDateParts(weekdayInNextCalendarWeek(ref, wd));
      }
      if (/\b(proximo|siguiente)\b/.test(t)) {
        return formatDateParts(nextWeekday(ref, wd, true));
      }
      return formatDateParts(nextWeekday(ref, wd, false));
    }

    return null;
  }

  function parseNaturalTime(text) {
    var t = normalize(text);
    if (!t) return null;

    var hhmm = t.match(/\b(\d{1,2}):(\d{2})\b/);
    if (hhmm) {
      var h = Number(hhmm[1]);
      var m = Number(hhmm[2]);
      if (h <= 23 && m <= 59) return pad2(h) + ":" + pad2(m);
    }

    var atHour = t.match(/\b(?:a las|las|sobre las)\s+(\d{1,2})(?:\s*h(?:oras?)?)?\b/);
    if (atHour) {
      h = Number(atHour[1]);
      if (h >= 0 && h <= 23) return pad2(h) + ":00";
    }

    var hourH = t.match(/\b(\d{1,2})\s*h(?:oras?)?\b/);
    if (hourH) {
      h = Number(hourH[1]);
      if (h >= 0 && h <= 23) return pad2(h) + ":00";
    }

    if (/\b(ultima hora|fin de tarde)\b/.test(t)) return "17:00";
    if (/\b(por la tarde|tarde)\b/.test(t)) return "16:00";
    if (/\b(media manana)\b/.test(t)) return "11:30";
    if (/\b(por la manana|manana temprano|primera hora)\b/.test(t)) return "10:00";
    if (/\b(mediodia|almuerzo)\b/.test(t)) return "12:00";

    return null;
  }

  function wantsBooking(text) {
    var t = normalize(text);
    if (!t) return false;

    if (/agendar|cita|reunion|videollamada|llamada|auditoria|reservar|calendar|concertar|programar|apuntar|solicitar|demo|presentacion|asesoria|consulta/.test(t)) {
      return true;
    }
    if (/\b(quedar|quedamos|nos vemos|vernos|concertamos|quedaria|quedemos)\b/.test(t)) return true;
    if (/\b(podemos|quiero|podria|te viene|nos podemos|cuando|gustaria|me gustaria)\b/.test(t) && /\b(ver|hablar|llamar|quedar|conocer|charlar|explicar|enseñar|mostrar)\b/.test(t)) {
      return true;
    }
    if (/\b(reservar|apuntar|sacar|pedir|organizar|coordinar)\b.*\b(cita|hora|reunion|videollamada|sesion|llamada)\b/.test(t)) return true;
    if (/\b(cita|reunion|videollamada|sesion|llamada)\b.*\b(reservar|agendar|concertar|organizar)\b/.test(t)) return true;
    if (/\b(tener|hacer|montar)\b.*\b(reunion|videollamada|sesion|llamada)\b/.test(t)) return true;
    if (/\b(me interesa|estoy interesad|cuentame mas)\b/.test(t) && /\b(reunion|llamada|hablar|vernos)\b/.test(t)) return true;
    return false;
  }

  function wantsAvailability(text) {
    var t = normalize(text);
    if (!t) return false;
    return /hueco|huecos|disponib|libre|horarios|disponibilidad|hay sitio|esta libre|cuando podeis|cuando podéis|cuando tengais|que dias|qué días/.test(t);
  }

  window.DVGNaturalDate = {
    parseDate: parseNaturalDate,
    parseTime: parseNaturalTime,
    wantsBooking: wantsBooking,
    wantsAvailability: wantsAvailability,
    formatHint: "Puedes decir «mañana», «el martes» o «la semana que viene el jueves».",
  };
})();
