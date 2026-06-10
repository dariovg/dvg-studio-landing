/* Chat web DVG Studio + agendamiento de citas */
(function () {
  const widget = document.getElementById("igniteChat");
  if (!widget) return;

  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const hp = document.getElementById("chatHp");
  const messages = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("chatSend");

  const siteKey = widget.dataset.siteKey || "";
  const CONTACT = window.DVG_SITE?.contact || "contact@dvgsstudio.com";
  const pageLoad = Date.now();

  let history = [];
  let busy = false;
  let lastSend = 0;
  let msgCount = 0;
  const MAX_MSGS = 10;
  const COOLDOWN_MS = 3000;

  const BOOK_STEPS = ["name", "email", "phone", "date", "time", "notes", "confirm"];
  const BOOK_PROMPTS = {
    name: "¿Tu nombre completo?",
    email: "¿Tu correo electrónico?",
    phone: "¿Tu teléfono? (con prefijo, ej. +34 600 000 000)",
    date: "¿Qué día prefieres? Formato: DD/MM/AAAA (ej. 15/06/2026)",
    time: "¿A qué hora? Formato: HH:MM en hora de España (ej. 10:00). La reunión dura 1 hora.",
    notes: "¿Algo que debamos saber? (opcional — escribe «no» si nada)",
    confirm: null,
  };

  let bookMode = false;
  let bookStep = 0;
  let bookData = {};

  const welcome =
    "Hola. Soy IGNITE de DVG Studio. Pregúntame precios, servicios o empleados digitales.\n\nReunión 1h: «agendar cita»\nHuecos libres: «disponibilidad 12/06/2026»";

  const BOOK_TRIGGERS =
    /agendar|cita|reunion|reunión|videollamada|llamada|auditor[ií]a|reservar|calendar/i;

  const AVAIL_TRIGGERS =
    /hueco|huecos|disponib|libre|horarios|tienes.*cita|hay.*cita|tengo.*cita/i;

  const DATE_RE = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/;
  const TIME_RE = /(\d{1,2}:\d{2})/;

  function openChat() {
    panel.classList.add("open");
    document.body.classList.add("chat-open");
    toggle.setAttribute("aria-expanded", "true");
    if (!messages.dataset.init) {
      appendMsg(welcome, "assistant");
      messages.dataset.init = "1";
    }
    input.focus();
  }

  function closeChat() {
    panel.classList.remove("open");
    document.body.classList.remove("chat-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function appendMsg(text, role) {
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function appendTyping() {
    const div = document.createElement("div");
    div.className = "chat-msg assistant typing";
    div.id = "chatTyping";
    div.textContent = "Escribiendo…";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    document.getElementById("chatTyping")?.remove();
  }

  function startBooking() {
    bookMode = true;
    bookStep = 0;
    bookData = {};
    appendMsg(
      "Perfecto. Te pido unos datos para una reunión de 1 hora. Puedes escribir «cancelar» en cualquier momento.",
      "assistant"
    );
    appendMsg(BOOK_PROMPTS.name, "assistant");
  }

  function cancelBooking() {
    bookMode = false;
    bookStep = 0;
    bookData = {};
    appendMsg("Agendamiento cancelado. ¿En qué más puedo ayudarte?", "assistant");
  }

  async function apiPost(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-DVG-Chat": "1" },
      body: JSON.stringify({
        ...payload,
        _k: siteKey,
        _hp: hp?.value || "",
        _ts: Date.now(),
        _boot: pageLoad,
      }),
    });
    return { res, data: await res.json() };
  }

  async function fetchAvailability(date, time, query) {
    const { data } = await apiPost("/api/availability", { date, time, query });
    return data;
  }

  async function queryAvailability(text) {
    busy = true;
    sendBtn.disabled = true;
    appendTyping();
    try {
      const dateM = text.match(DATE_RE);
      const timeM = text.match(TIME_RE);
      if (!dateM) {
        removeTyping();
        appendMsg(
          "Indica la fecha en formato DD/MM/AAAA. Ejemplo: «disponibilidad 15/06/2026» o «¿hay hueco el 15/06/2026 a las 10:00?»",
          "assistant"
        );
        return;
      }
      const date = dateM[1].replace(/-/g, "/");
      const time = timeM ? timeM[1] : "";
      const data = await fetchAvailability(date, time, text);
      removeTyping();
      appendMsg(data.message || data.error || "Sin respuesta.", "assistant");
      if (!time && data.slots?.length) {
        appendMsg("Escribe «agendar cita» y elige uno de esos horarios.", "assistant");
      }
    } catch {
      removeTyping();
      appendMsg("No pude consultar el calendario. Prueba más tarde.", "assistant");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function checkTimeSlot(date, time) {
    const data = await fetchAvailability(date, time);
    if (data.configured === false) return { ok: true };
    if (data.available) return { ok: true };
    const alts =
      data.alternatives?.join(", ") ||
      data.slots?.slice(0, 5).join(", ") ||
      "ninguno ese día";
    return { ok: false, message: data.message, alts };
  }

  function validateBookField(step, text) {
    const t = text.trim();
    if (step === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return false;
    if (step === "date" && !/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/.test(t)) return false;
    if (step === "time" && !/^\d{1,2}:\d{2}$/.test(t)) return false;
    if (step === "phone" && t.length < 6) return false;
    if (step === "name" && t.length < 2) return false;
    return true;
  }

  async function submitBooking() {
    busy = true;
    sendBtn.disabled = true;
    appendTyping();
    try {
      const { res, data } = await apiPost("/api/book", bookData);
      removeTyping();
      if (data.ok) {
        appendMsg(data.message, "assistant");
      } else if (res.status === 409 && data.alternatives?.length) {
        appendMsg(data.error, "assistant");
        appendMsg(
          `Elige otra hora (HH:MM) o escribe «agendar cita» de nuevo.\nAlternativas: ${data.alternatives.join(", ")}`,
          "assistant"
        );
      } else {
        appendMsg(data.error || `Error al agendar. ${CONTACT}`, "assistant");
      }
    } catch {
      removeTyping();
      appendMsg(`Error de conexión. Escríbenos a ${CONTACT}`, "assistant");
    } finally {
      bookMode = false;
      bookStep = 0;
      bookData = {};
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function handleBookingInput(text) {
    const t = text.trim();
    if (/^cancelar$/i.test(t)) {
      cancelBooking();
      return true;
    }

    const step = BOOK_STEPS[bookStep];

    if (step === "confirm") {
      if (/^(si|sí|ok|confirmo|vale|yes)$/i.test(t)) {
        submitBooking();
        return true;
      }
      if (/^(no|cancelar)$/i.test(t)) {
        cancelBooking();
        return true;
      }
      appendMsg("Responde «sí» para confirmar o «cancelar».", "assistant");
      return true;
    }

    if (step === "notes") {
      bookData.notes = /^(no|nada|-)$/i.test(t) ? "" : t;
      bookStep++;
      const summary = `Resumen:\n• ${bookData.name}\n• ${bookData.email}\n• ${bookData.phone}\n• ${bookData.date} ${bookData.time} (1h)${bookData.notes ? "\n• " + bookData.notes : ""}\n\n¿Confirmas? (sí / cancelar)`;
      appendMsg(summary, "assistant");
      return true;
    }

    if (!validateBookField(step, t)) {
      appendMsg(`Dato no válido. ${BOOK_PROMPTS[step]}`, "assistant");
      return true;
    }

    if (step === "time") {
      bookData.time = t;
      busy = true;
      sendBtn.disabled = true;
      appendTyping();
      try {
        const check = await checkTimeSlot(bookData.date, t);
        removeTyping();
        if (!check.ok) {
          appendMsg(
            check.message ||
              `No hay hueco a las ${t}. Alternativas: ${check.alts}`,
            "assistant"
          );
          appendMsg("Indica otra hora (HH:MM) o «cancelar».", "assistant");
          return true;
        }
        bookStep++;
        appendMsg(BOOK_PROMPTS.notes, "assistant");
      } catch {
        removeTyping();
        appendMsg("No pude comprobar el calendario. Prueba otra vez.", "assistant");
      } finally {
        busy = false;
        sendBtn.disabled = false;
      }
      return true;
    }

    bookData[step] = t;
    bookStep++;
    const next = BOOK_STEPS[bookStep];
    if (next && BOOK_PROMPTS[next]) {
      appendMsg(BOOK_PROMPTS[next], "assistant");
    }
    return true;
  }

  async function sendMessage(text) {
    if (busy || !text.trim()) return;

    if (bookMode) {
      appendMsg(text.trim(), "user");
      input.value = "";
      await handleBookingInput(text);
      return;
    }

    if (AVAIL_TRIGGERS.test(text) && DATE_RE.test(text)) {
      appendMsg(text.trim(), "user");
      input.value = "";
      await queryAvailability(text);
      return;
    }

    if (BOOK_TRIGGERS.test(text) && !bookMode) {
      appendMsg(text.trim(), "user");
      input.value = "";
      startBooking();
      return;
    }

    if (msgCount >= MAX_MSGS) {
      appendMsg(`Límite de esta sesión. Escríbenos a ${CONTACT}`, "assistant");
      return;
    }
    const now = Date.now();
    if (now - lastSend < COOLDOWN_MS) return;
    if (now - pageLoad < 3000) return;

    lastSend = now;
    msgCount += 1;
    busy = true;
    sendBtn.disabled = true;
    appendMsg(text.trim(), "user");
    history.push({ role: "user", content: text.trim() });
    input.value = "";
    appendTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-DVG-Chat": "1" },
        body: JSON.stringify({
          message: text.trim(),
          history,
          _k: siteKey,
          _hp: hp?.value || "",
          _ts: Date.now(),
          _boot: pageLoad,
        }),
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || data.error || "Sin respuesta.";
      appendMsg(reply, "assistant");
      history.push({ role: "assistant", content: reply });
      if (history.length > 12) history = history.slice(-12);
    } catch {
      removeTyping();
      appendMsg(`No pude conectar. ${CONTACT}`, "assistant");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  toggle.addEventListener("click", () =>
    panel.classList.contains("open") ? closeChat() : openChat()
  );
  closeBtn?.addEventListener("click", closeChat);
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  document.querySelectorAll("[data-open-chat]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openChat();
    })
  );
})();
