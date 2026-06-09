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
    "Hola. Soy IGNITE de DVG Studio. Pregúntame precios, servicios o empleados digitales.\n\nSi quieres una reunión de 1h, escribe: agendar cita";

  const BOOK_TRIGGERS =
    /agendar|cita|reunion|reunión|videollamada|llamada|auditor[ií]a|reservar|calendar/i;

  function openChat() {
    panel.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    if (!messages.dataset.init) {
      appendMsg(welcome, "assistant");
      messages.dataset.init = "1";
    }
    input.focus();
  }

  function closeChat() {
    panel.classList.remove("open");
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
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-DVG-Chat": "1" },
        body: JSON.stringify({
          ...bookData,
          _k: siteKey,
          _hp: hp?.value || "",
          _ts: Date.now(),
          _boot: pageLoad,
        }),
      });
      const data = await res.json();
      removeTyping();
      if (data.ok) {
        appendMsg(data.message, "assistant");
      } else {
        appendMsg(data.error || "Error al agendar. contact@dvgstudio.com", "assistant");
      }
    } catch {
      removeTyping();
      appendMsg("Error de conexión. Escríbenos a contact@dvgstudio.com", "assistant");
    } finally {
      bookMode = false;
      bookStep = 0;
      bookData = {};
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function handleBookingInput(text) {
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
      handleBookingInput(text);
      return;
    }

    if (BOOK_TRIGGERS.test(text) && !bookMode) {
      appendMsg(text.trim(), "user");
      input.value = "";
      startBooking();
      return;
    }

    if (msgCount >= MAX_MSGS) {
      appendMsg("Límite de esta sesión. Escríbenos a contact@dvgstudio.com", "assistant");
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
      appendMsg("No pude conectar. contact@dvgstudio.com", "assistant");
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
