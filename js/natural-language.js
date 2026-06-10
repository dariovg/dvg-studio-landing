/* Lenguaje natural conversacional — sincronizado con lib/natural-language.js */
(function () {
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
      .replace(/[¿¡]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function firstName(name) {
    var n = String(name || "").trim().split(/\s+/)[0];
    return n || "";
  }

  function extractEmail(text) {
    var m = String(text || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i);
    return m ? m[0].toLowerCase() : null;
  }

  function extractPhone(text) {
    var raw = String(text || "");
    var labeled = raw.match(
      /(?:movil|móvil|tel[eé]fono|tfno|whatsapp|wasap|wsp|llamar|contacto)[:\s]*([+\d][\d\s().-]{7,})/i
    );
    var candidate = labeled ? labeled[1] : raw;
    var digits = candidate.replace(/[^\d+]/g, "");
    if (digits.length < 9) return null;
    if (digits.startsWith("+")) return digits;
    if (digits.startsWith("00")) return "+" + digits.slice(2);
    if (digits.length === 9 && /^[6789]/.test(digits)) return "+34" + digits;
    if (digits.length === 11 && digits.startsWith("34")) return "+" + digits;
    if (digits.length >= 9) return digits;
    return null;
  }

  function extractName(text) {
    var raw = String(text || "").trim();
    var t = normalize(raw);
    var patterns = [
      /(?:me llamo|soy|mi nombre es|nombre:?)\s+([a-záéíóúñ][a-záéíóúñ\s'.-]{1,60})/i,
      /^([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,3})$/,
    ];
    var i, m, name;
    for (i = 0; i < patterns.length; i++) {
      m = raw.match(patterns[i]);
      if (m) {
        name = m[1].trim().replace(/[,.]$/, "");
        name = name.replace(/\s+(y|mi|correo|email|mail|telefono|teléfono|movil|móvil)\b.*/i, "");
        if (name.length >= 2 && name.length <= 80 && !/@/.test(name)) {
          return name.split(/\s+/).map(function (w) {
            return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
          }).join(" ");
        }
      }
    }
    if (/^[a-záéíóúñ]{2,}(?:\s+[a-záéíóúñ]{2,}){0,3}$/i.test(t) && !extractEmail(raw) && !extractPhone(raw)) {
      return raw.split(/\s+/).map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
      }).join(" ");
    }
    return null;
  }

  function formatParts(day, month, year) {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return String(day).padStart(2, "0") + "/" + String(month).padStart(2, "0") + "/" + year;
  }

  function parseDayMonth(text) {
    var t = normalize(text);
    var y = new Date().getFullYear();
    var m = t.match(/\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)(?:\s+de\s+(\d{4}))?\b/);
    if (m) return formatParts(Number(m[1]), MONTHS[m[2]], m[3] ? Number(m[3]) : y);
    m = t.match(/\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{1,2})(?:\s+de\s+(\d{4}))?\b/);
    if (m) return formatParts(Number(m[2]), MONTHS[m[1]], m[3] ? Number(m[3]) : y);
    m = t.match(/\bel\s+d[ií]a\s+(\d{1,2})\b/);
    if (m) {
      var now = new Date();
      return formatParts(Number(m[1]), now.getMonth() + 1, now.getFullYear());
    }
    return null;
  }

  function parseDateExtended(text) {
    var ND = window.DVGNaturalDate;
    return (ND && ND.parseDate(text)) || parseDayMonth(text);
  }

  function parseTimeExtended(text) {
    var ND = window.DVGNaturalDate;
    var t = normalize(text);
    var base = ND && ND.parseTime(text);
    if (base) return base;
    if (/\b(esta tarde|por la tarde)\b/.test(t)) return "16:00";
    if (/\b(esta manana|por la manana|temprano)\b/.test(t)) return "10:00";
    if (/\b(antes del mediodia|media manana)\b/.test(t)) return "11:00";
    if (/\b(despues de comer|tras comer)\b/.test(t)) return "15:00";
    var andHalf = t.match(/\b(\d{1,2})\s+y\s+media\b/);
    if (andHalf) return String(Number(andHalf[1])).padStart(2, "0") + ":30";
    var enPunto = t.match(/\b(\d{1,2})\s+en\s+punto\b/);
    if (enPunto) return String(Number(enPunto[1])).padStart(2, "0") + ":00";
    return null;
  }

  function extractBookingFields(text) {
    var email = extractEmail(text);
    var phone = extractPhone(text);
    var date = parseDateExtended(text);
    var time = parseTimeExtended(text);
    var name = extractName(text);
    if (!name && email) {
      var local = email.split("@")[0].replace(/[._-]/g, " ");
      if (/^[a-z]{2,}$/i.test(local.replace(/\s/g, ""))) {
        name = local.split(/\s+/).map(function (w) {
          return w.charAt(0).toUpperCase() + w.slice(1);
        }).join(" ");
      }
    }
    return { name: name, email: email, phone: phone, date: date, time: time };
  }

  function isAffirmative(text) {
    var t = normalize(text);
    return /^(si|sí|ok|vale|perfecto|confirmo|adelante|dale|de acuerdo|correcto|exacto|claro|genial|listo|hecho|yes|yep|afirmativo|por supuesto|venga|marchando)$/.test(t)
      || /\b(me parece bien|esta bien|está bien|sin problema|confirmado)\b/.test(t);
  }

  function isNegative(text) {
    var t = normalize(text);
    return /^(no|nop|cancelar|anular|mejor no)$/.test(t) || /\b(no confirmo|dejalo|déjalo)\b/.test(t);
  }

  function isSkipNotes(text) {
    var t = normalize(text);
    return /^(no|nada|ninguna?|ninguno|na|todo bien|sin notas|no hay|n\/a|-|no gracias)$/.test(t)
      || /\b(nada especial|sin comentarios)\b/.test(t);
  }

  function wantsCancel(text) {
    var t = normalize(text);
    return /^(cancelar|anular|parar|salir|dejalo|déjalo|mejor no)$/.test(t)
      || /\b(cancelar cita|olvidalo|olvídalo)\b/.test(t);
  }

  function detectCorrection(text) {
    var t = normalize(text);
    if (/\b(cambiar|corregir|modificar)\s+(el\s+)?nombre\b|\bmi nombre es\b/.test(t)) return "name";
    if (/\b(cambiar|corregir|modificar)\s+(el\s+)?(correo|email|mail)\b|\bmi (correo|email|mail)\b/.test(t)) return "email";
    if (/\b(cambiar|corregir|modificar)\s+(el\s+)?(telefono|teléfono|movil|móvil)\b/.test(t)) return "phone";
    if (/\b(cambiar|corregir|modificar)\s+(el\s+)?(dia|día|fecha)\b|\botro dia\b/.test(t)) return "date";
    if (/\b(cambiar|corregir|modificar)\s+(la\s+)?hora\b|\botra hora\b/.test(t)) return "time";
    return null;
  }

  var ACK = {
    name: ["Encantado, {n}.", "Perfecto, {n}.", "Genial, {n}."],
    email: ["Apuntado.", "Recibido, te escribiremos ahí.", "Perfecto, lo tengo."],
    phone: ["Gracias.", "Anotado.", "Perfecto."],
    date: ["Vale, el {v}.", "Perfecto, {v}.", "Apuntado: {v}."],
    time: ["A las {v}, entendido.", "Perfecto, {v}.", "Genial, {v}."],
  };

  function humanAck(field, value, bookData) {
    bookData = bookData || {};
    var pool = ACK[field] || ["Perfecto."];
    var line = pool[Math.floor(Math.random() * pool.length)];
    return line.replace("{n}", firstName(bookData.name)).replace("{v}", value || "");
  }

  function humanPrompt(field, bookData) {
    bookData = bookData || {};
    var n = firstName(bookData.name);
    var prompts = {
      name: "¿Cómo te llamas?",
      email: n ? n + ", ¿cuál es tu correo?" : "¿Tu correo electrónico?",
      phone: n ? "¿Un teléfono por si acaso, " + n + "?" : "¿Tu móvil o teléfono?",
      date: "¿Qué día te viene bien? Dímelo como quieras: mañana, el martes, 15 de junio…",
      time: "¿A qué hora? Por ejemplo: a las 10, por la tarde, 10 y media…",
      notes: "¿Algo que debamos saber? Si no, «nada».",
    };
    return prompts[field] || "";
  }

  function humanBookingIntro(prefill) {
    prefill = prefill || {};
    var bits = [];
    if (prefill.date) bits.push("el " + prefill.date);
    if (prefill.time) bits.push("a las " + prefill.time);
    if (bits.length) {
      return "¡Claro! Veo que te iría bien " + bits.join(" ") + ". Te pido unos datos rápidos — habla con naturalidad. «Cancelar» para salir.";
    }
    return "¡Perfecto! Organicemos una reunión de 1h. Cuéntame con naturalidad; «cancelar» si cambias de idea.";
  }

  window.DVGNlp = {
    extractEmail: extractEmail,
    extractPhone: extractPhone,
    extractName: extractName,
    extractBookingFields: extractBookingFields,
    parseDateExtended: parseDateExtended,
    parseTimeExtended: parseTimeExtended,
    isAffirmative: isAffirmative,
    isNegative: isNegative,
    isSkipNotes: isSkipNotes,
    wantsCancel: wantsCancel,
    detectCorrection: detectCorrection,
    humanAck: humanAck,
    humanPrompt: humanPrompt,
    humanBookingIntro: humanBookingIntro,
    firstName: firstName,
  };
})();
