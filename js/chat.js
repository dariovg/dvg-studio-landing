/* Chat web DVG Studio + agendamiento conversacional */
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
  const CONTACT = window.DVG_SITE?.contact || "info@dvgsstudio.com";
  const pageLoad = Date.now();

  let history = [];
  let busy = false;
  let lastSend = 0;
  let msgCount = 0;
  const MAX_MSGS = 10;
  const COOLDOWN_MS = 3000;

  const BOOK_STEPS = ["name", "email", "phone", "date", "time", "notes", "confirm"];
  const NLP = () => window.DVGNlp || {};
  const ND = () => window.DVGNaturalDate || {};

  let bookMode = false;
  let bookStep = 0;
  let bookData = {};
  let timeValidated = false;

  const welcome =
    "Hola, soy IGNITE. Pregúntame lo que quieras sobre DVG Studio.\n\nSi te apetece hablar con el equipo, dime algo como «podemos quedar mañana» o «me gustaría una demo».";

  function parseDateInput(text) {
    return NLP().parseDateExtended?.(text) || ND().parseDate?.(text) || null;
  }

  function parseTimeInput(text) {
    return NLP().parseTimeExtended?.(text) || ND().parseTime?.(text) || null;
  }

  function extractAll(text) {
    return NLP().extractBookingFields?.(text) || {};
  }

  function wantsBooking(text) {
    return ND().wantsBooking?.(text) || false;
  }

  function wantsAvailability(text) {
    return ND().wantsAvailability?.(text) || false;
  }

  function extractDateFromText(text) {
    return parseDateInput(text);
  }

  function extractTimeFromText(text) {
    return parseTimeInput(text);
  }

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
    div.textContent = "Un momento…";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    document.getElementById("chatTyping")?.remove();
  }

  function advanceBookStep() {
    while (bookStep < BOOK_STEPS.length) {
      const key = BOOK_STEPS[bookStep];
      if (key === "confirm") break;
      if (!bookData[key]) break;
      bookStep++;
    }
  }

  function showSummary() {
    bookStep = BOOK_STEPS.indexOf("confirm");
    const n = NLP().firstName?.(bookData.name) || bookData.name;
    const lines = [
      n ? `Resumen, ${n}:` : "Resumen:",
      `• ${bookData.name}`,
      `• ${bookData.email}`,
      `• ${bookData.phone}`,
      `• ${bookData.date} a las ${bookData.time} (1h, España)`,
      bookData.notes ? `• Notas: ${bookData.notes}` : "",
      "",
      "¿Te encaja? (sí / cancelar)",
    ].filter(Boolean);
    appendMsg(lines.join("\n"), "assistant");
  }

  function promptCurrentStep() {
    advanceBookStep();
    const step = BOOK_STEPS[bookStep];
    if (step === "confirm") {
      showSummary();
      return;
    }
    if (step) appendMsg(NLP().humanPrompt?.(step, bookData) || "", "assistant");
  }

  function startBooking(fromText = "") {
    bookMode = true;
    bookStep = 0;
    bookData = {};
    timeValidated = false;

    const ext = extractAll(fromText);
    Object.assign(bookData, Object.fromEntries(
      Object.entries(ext).filter(([, v]) => v)
    ));

    advanceBookStep();
    appendMsg(NLP().humanBookingIntro?.(bookData) || "Organicemos la reunión.", "assistant");

    if (bookData.name) {
      appendMsg(NLP().humanAck?.("name", bookData.name, bookData) || "", "assistant");
    }
    if (bookData.date || bookData.time) {
      const bits = [];
      if (bookData.date) bits.push(bookData.date);
      if (bookData.time) bits.push(bookData.time);
      appendMsg(`He pillado: ${bits.join(" · ")}`, "assistant");
    }

    if (bookData.date && bookData.time) {
      validateTimeAndContinue();
      return;
    }
    promptCurrentStep();
  }

  function cancelBooking() {
    bookMode = false;
    bookStep = 0;
    bookData = {};
    timeValidated = false;
    appendMsg("Sin problema, lo dejamos aquí. Si quieres retomarlo, dímelo cuando quieras.", "assistant");
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
      const date = extractDateFromText(text);
      const time = extractTimeFromText(text) || "";
      if (!date) {
        removeTyping();
        appendMsg(
          "¿Para qué día quieres que mire? Puedes decir mañana, el martes, 15 de junio…",
          "assistant"
        );
        return;
      }
      const data = await fetchAvailability(date, time, text);
      removeTyping();
      appendMsg(data.message || data.error || "Sin respuesta.", "assistant");
      if (!time && data.slots?.length) {
        appendMsg("Si alguno te va bien, dime «reservar a las 10» o similar.", "assistant");
      }
    } catch {
      removeTyping();
      appendMsg("No pude consultar el calendario ahora. Prueba en un rato.", "assistant");
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

  async function validateTimeAndContinue() {
    if (!bookData.date || !bookData.time) {
      promptCurrentStep();
      return;
    }

    busy = true;
    sendBtn.disabled = true;
    appendTyping();
    try {
      const check = await checkTimeSlot(bookData.date, bookData.time);
      removeTyping();
      if (!check.ok) {
        timeValidated = false;
        delete bookData.time;
        bookStep = BOOK_STEPS.indexOf("time");
        appendMsg(
          check.message || `Ese hueco no está libre. Alternativas: ${check.alts}`,
          "assistant"
        );
        appendMsg(NLP().humanPrompt?.("time", bookData) || "¿Otra hora?", "assistant");
        return;
      }
      timeValidated = true;
      appendMsg(NLP().humanAck?.("time", bookData.time, bookData) || "Perfecto.", "assistant");
      advanceBookStep();
      if (BOOK_STEPS[bookStep] === "notes") {
        appendMsg(NLP().humanPrompt?.("notes", bookData) || "", "assistant");
      } else if (BOOK_STEPS[bookStep] === "confirm") {
        showSummary();
      } else {
        promptCurrentStep();
      }
    } catch {
      removeTyping();
      appendMsg("No pude comprobar el calendario. ¿Repetimos la hora?", "assistant");
      bookStep = BOOK_STEPS.indexOf("time");
      delete bookData.time;
      timeValidated = false;
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  function resolveFieldValue(step, text, extracted) {
    const t = text.trim();
    if (step === "name") {
      return (
        extracted.name ||
        (t.length >= 2 && !extracted.email && !extracted.phone && !extracted.date && !extracted.time
          ? t.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
          : null)
      );
    }
    if (step === "email") return extracted.email || NLP().extractEmail?.(t) || null;
    if (step === "phone") return extracted.phone || NLP().extractPhone?.(t) || null;
    if (step === "date") return extracted.date || parseDateInput(t);
    if (step === "time") return extracted.time || parseTimeInput(t);
    return null;
  }

  function applyBulkFields(extracted, fromIndex) {
    const acked = [];
    for (let i = fromIndex; i < BOOK_STEPS.length; i++) {
      const key = BOOK_STEPS[i];
      if (key === "confirm" || key === "notes") continue;
      if (bookData[key] || !extracted[key]) continue;
      bookData[key] = extracted[key];
      if (key !== "date") {
        acked.push(NLP().humanAck?.(key, extracted[key], bookData));
      }
    }
    const unique = [...new Set(acked.filter(Boolean))];
    if (unique.length) appendMsg(unique.slice(0, 2).join(" "), "assistant");
    if (extracted.date && !unique.some((a) => a.includes(extracted.date))) {
      appendMsg(NLP().humanAck?.("date", extracted.date, bookData) || "", "assistant");
    }
  }

  async function submitBooking() {
    busy = true;
    sendBtn.disabled = true;
    appendTyping();
    let keepBooking = false;
    try {
      const { res, data } = await apiPost("/api/book", bookData);
      removeTyping();
      if (data.ok) {
        appendMsg(data.message, "assistant");
      } else if (res.status === 409 && data.alternatives?.length) {
        appendMsg(data.error, "assistant");
        appendMsg(`¿Te iría alguna de estas? ${data.alternatives.join(", ")}`, "assistant");
        bookStep = BOOK_STEPS.indexOf("time");
        delete bookData.time;
        timeValidated = false;
        keepBooking = true;
        appendMsg(NLP().humanPrompt?.("time", bookData) || "", "assistant");
      } else {
        appendMsg(data.error || `Ups, no pude reservar. Escríbenos a ${CONTACT}`, "assistant");
      }
    } catch {
      removeTyping();
      appendMsg(`Problema de conexión. Escríbenos a ${CONTACT}`, "assistant");
    } finally {
      if (!keepBooking) {
        bookMode = false;
        bookStep = 0;
        bookData = {};
        timeValidated = false;
      }
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function handleBookingInput(text) {
    const t = text.trim();
    if (NLP().wantsCancel?.(t)) {
      cancelBooking();
      return;
    }

    const correction = NLP().detectCorrection?.(t);
    if (correction) {
      const ext = extractAll(t);
      const val = resolveFieldValue(correction, t, ext);
      if (val) {
        bookData[correction] = val;
        if (correction === "time") timeValidated = false;
        appendMsg(NLP().humanAck?.(correction, val, bookData) || "Actualizado.", "assistant");
        bookStep = BOOK_STEPS.indexOf(correction);
        if (correction === "date" || correction === "time") {
          if (bookData.date && bookData.time) await validateTimeAndContinue();
          else promptCurrentStep();
        } else {
          advanceBookStep();
          promptCurrentStep();
        }
      } else {
        bookStep = BOOK_STEPS.indexOf(correction);
        appendMsg(NLP().humanPrompt?.(correction, bookData) || "", "assistant");
      }
      return;
    }

    const step = BOOK_STEPS[bookStep];

    if (step === "confirm") {
      if (NLP().isAffirmative?.(t)) {
        await submitBooking();
        return;
      }
      if (NLP().isNegative?.(t)) {
        cancelBooking();
        return;
      }
      appendMsg("¿Confirmamos? Dime «sí» o «cancelar».", "assistant");
      return;
    }

    if (step === "notes") {
      bookData.notes = NLP().isSkipNotes?.(t) ? "" : t;
      showSummary();
      return;
    }

    const extracted = extractAll(t);
    applyBulkFields(extracted, bookStep);

    const cur = BOOK_STEPS[bookStep];
    if (cur && cur !== "notes" && cur !== "confirm" && !bookData[cur]) {
      const val = resolveFieldValue(cur, t, extracted);
      if (val) {
        bookData[cur] = val;
        appendMsg(NLP().humanAck?.(cur, val, bookData) || "Perfecto.", "assistant");
      } else {
        appendMsg("No lo pillé del todo — ¿me lo dices de otra forma?", "assistant");
        appendMsg(NLP().humanPrompt?.(cur, bookData) || "", "assistant");
        return;
      }
    }

    advanceBookStep();

    if (bookData.date && bookData.time && !timeValidated) {
      await validateTimeAndContinue();
      return;
    }

    promptCurrentStep();
  }

  async function sendMessage(text) {
    if (busy || !text.trim()) return;

    if (bookMode) {
      appendMsg(text.trim(), "user");
      input.value = "";
      await handleBookingInput(text);
      return;
    }

    if (wantsAvailability(text) && extractDateFromText(text)) {
      appendMsg(text.trim(), "user");
      input.value = "";
      await queryAvailability(text);
      return;
    }

    if (wantsBooking(text)) {
      appendMsg(text.trim(), "user");
      input.value = "";
      startBooking(text);
      return;
    }

    if (msgCount >= MAX_MSGS) {
      appendMsg(`He llegado al límite de esta charla. Escríbenos a ${CONTACT}`, "assistant");
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

      if (wantsBooking(reply) || wantsBooking(text)) {
        /* no auto-start from assistant reply */
      }
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
