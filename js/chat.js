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
  let lastSuggestedAlts = "";
  let rejectedTimes = new Set();
  let leadCardShown = { pricing: false, actions: false, meeting: false };
  let bookingBarEl = null;

  const BUSINESS_SLOTS = [
    "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00",
  ];

  function normalizeTime(time) {
    const raw = String(time || "").trim();
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = m[2];
    if (h > 23) return null;
    return `${String(h).padStart(2, "0")}:${min}`;
  }

  const welcome =
    "Hola, soy IGNITE. Cuéntame qué buscas y te ayudo.\n\nSi prefieres ir al grano: guía de planes por email o reunión gratis de 1h.";

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
      setTimeout(() => appendActionCard(), 600);
    }
    input.focus();
  }

  function closeChat() {
    panel.classList.remove("open");
    document.body.classList.remove("chat-open");
    toggle.setAttribute("aria-expanded", "false");
  }

  function wantsPricing(text) {
    const t = String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{M}/gu, "");
    return /precio|cuesta|coste|cuanto|tarifa|planes|presupuesto|cotiz|inversion|euros|mensual|starter|enterprise|cuanto sale|que cuesta/.test(
      t
    );
  }

  function scrollChat() {
    messages.scrollTop = messages.scrollHeight;
  }

  function appendMsg(text, role) {
    const div = document.createElement("div");
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    scrollChat();
  }

  function showBookingBar() {
    removeBookingBar();
    bookingBarEl = document.createElement("div");
    bookingBarEl.className = "chat-booking-bar";
    bookingBarEl.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 5; i++) {
      const s = document.createElement("span");
      bookingBarEl.appendChild(s);
    }
    messages.appendChild(bookingBarEl);
    updateBookingBar();
    scrollChat();
  }

  function updateBookingBar() {
    if (!bookingBarEl) return;
    const steps = ["name", "email", "phone", "date", "time"];
    const idx = steps.indexOf(BOOK_STEPS[bookStep]);
    bookingBarEl.querySelectorAll("span").forEach((el, i) => {
      el.classList.toggle("on", i <= idx && bookStep < BOOK_STEPS.indexOf("confirm"));
    });
  }

  function removeBookingBar() {
    bookingBarEl?.remove();
    bookingBarEl = null;
  }

  function appendLeadCard(interest = "pricing") {
    if (leadCardShown[interest]) return;
    leadCardShown[interest] = true;

    const card = document.createElement("div");
    card.className = "chat-card chat-card-lead";
    card.innerHTML = `
      <p class="chat-card-title">${interest === "pricing" ? "Guía de planes" : "Te mantenemos al día"}</p>
      <p class="chat-card-desc">Nombre y email — te envío el detalle en 1 min. Sin spam.</p>
      <div class="chat-card-fields">
        <input type="text" name="leadName" placeholder="Tu nombre" maxlength="80" autocomplete="name">
        <input type="email" name="leadEmail" placeholder="Tu email" maxlength="120" autocomplete="email">
        <input type="text" name="leadCompany" placeholder="Empresa (opcional)" maxlength="120" autocomplete="organization">
      </div>
      <button type="button" class="chat-card-submit">Enviarme la guía</button>
      <p class="chat-card-note">Solo usamos tus datos para responderte.</p>
    `;

    const btn = card.querySelector(".chat-card-submit");
    btn.addEventListener("click", () => submitLeadCard(card, interest));
    card.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          submitLeadCard(card, interest);
        }
      });
    });

    messages.appendChild(card);
    scrollChat();
    card.querySelector('input[name="leadName"]')?.focus();
  }

  function appendActionCard() {
    if (leadCardShown.actions || bookMode) return;
    leadCardShown.actions = true;

    const card = document.createElement("div");
    card.className = "chat-card chat-card-actions-wrap";
    card.innerHTML = `
      <p class="chat-card-desc" style="margin-bottom:.5rem">¿Seguimos por aquí?</p>
      <div class="chat-card-actions">
        <button type="button" class="chat-card-btn" data-act="pricing">Guía por email</button>
        <button type="button" class="chat-card-btn primary" data-act="meeting">Reunión 1h gratis</button>
      </div>
    `;

    card.querySelector('[data-act="pricing"]').addEventListener("click", () => {
      appendMsg("Quiero la guía de planes", "user");
      appendMsg("Perfecto — déjame tus datos y te la envío al momento.", "assistant");
      appendLeadCard("pricing");
    });
    card.querySelector('[data-act="meeting"]').addEventListener("click", () => {
      appendMsg("Me gustaría una reunión", "user");
      startBooking("me gustaría una reunión");
    });

    messages.appendChild(card);
    scrollChat();
  }

  async function submitLeadCard(card, interest) {
    if (busy) return;
    const name = card.querySelector('[name="leadName"]')?.value.trim();
    const email = card.querySelector('[name="leadEmail"]')?.value.trim();
    const company = card.querySelector('[name="leadCompany"]')?.value.trim();
    const btn = card.querySelector(".chat-card-submit");

    if (!name || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      appendMsg("Revisa nombre y email en el formulario — deben ser válidos.", "assistant");
      return;
    }

    const elapsed = Date.now() - pageLoad;
    if (elapsed < 500) {
      await wait(500 - elapsed);
    }

    busy = true;
    btn.disabled = true;
    const endTyping = await showTypingFor(450);

    async function postLead() {
      return apiPost("/api/lead", {
        name,
        email,
        company,
        interest,
      });
    }

    try {
      let { res, data } = await postLead();
      const retry403 =
        res.status === 403 &&
        /espera un segundo|clave del chat|origen no autorizado/i.test(String(data.error || ""));
      if (retry403) {
        await wait(800);
        ({ res, data } = await postLead());
      }
      await endTyping();

      if (!res.ok || data.error) {
        appendMsg(data.error || `No pude enviarlo ahora. Escríbenos a ${CONTACT}`, "assistant");
        if (data.received) {
          card.querySelector(".chat-card-fields")?.remove();
          btn.remove();
          const ok = document.createElement("p");
          ok.className = "chat-card-note";
          ok.textContent = "Datos recibidos. Te contactamos en breve.";
          card.appendChild(ok);
        } else {
          btn.disabled = false;
        }
        return;
      }

      card.querySelector(".chat-card-fields")?.remove();
      btn.remove();
      card.querySelector(".chat-card-note")?.remove();
      const ok = document.createElement("p");
      ok.className = data.emailed === false ? "chat-card-note" : "chat-card-success";
      ok.textContent =
        data.message ||
        (data.emailed === false
          ? `Recibido. Te contactamos en ${email} o escríbenos a ${CONTACT}.`
          : "Guía enviada. Revisa tu email (y la carpeta spam).");
      card.appendChild(ok);

      if (!leadCardShown.meeting) {
        setTimeout(() => {
          appendMsg("Si quieres, también podemos quedar 1h sin compromiso.", "assistant");
          appendActionCard();
          leadCardShown.actions = false;
          leadCardShown.meeting = true;
        }, 800);
      }
    } catch {
      await endTyping();
      appendMsg(`No pude enviarlo ahora. Escríbenos a ${CONTACT}`, "assistant");
      btn.disabled = false;
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function handlePricingInterest(text) {
    appendMsg(text.trim(), "user");
    input.value = "";
    const endTyping = await showTypingFor(500);
    await endTyping();
    appendMsg(
      "Trabajamos con planes flexibles desde 199 €/mes + IVA. Te envío la guía completa por email — son 30 segundos.",
      "assistant"
    );
    appendLeadCard("pricing");
  }

  function appendTyping() {
    removeTyping();
    const div = document.createElement("div");
    div.className = "chat-msg assistant typing";
    div.id = "chatTyping";
    div.setAttribute("aria-live", "polite");
    div.innerHTML =
      '<span class="typing-dots" aria-hidden="true"><span></span><span></span><span></span></span>';
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    document.getElementById("chatTyping")?.remove();
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function showTypingFor(minMs = 550) {
    const started = Date.now();
    appendTyping();
    return async function endTyping() {
      const elapsed = Date.now() - started;
      if (elapsed < minMs) await wait(minMs - elapsed);
      removeTyping();
    };
  }

  function ensureReply(text) {
    const t = String(text || "").trim();
    if (t && t !== "Sin respuesta.") return t;
    return `Sigo aquí contigo. Pregúntame por precios, servicios o di «podemos quedar» para una reunión. También: ${CONTACT}`;
  }

  function advanceBookStep() {
    while (bookStep < BOOK_STEPS.length) {
      const key = BOOK_STEPS[bookStep];
      if (key === "confirm") break;
      if (!bookData[key]) break;
      bookStep++;
    }
  }

  function mergeExtractedFields(extracted) {
    for (let i = 0; i < BOOK_STEPS.length; i++) {
      const key = BOOK_STEPS[i];
      if (key === "confirm" || key === "notes") continue;
      if (!bookData[key] && extracted[key]) {
        bookData[key] = key === "time" ? normalizeTime(extracted[key]) || extracted[key] : extracted[key];
      }
    }
  }

  function normalizeBookingForSubmit() {
    const payload = { ...bookData };
    const d = parseDateInput(payload.date) || payload.date;
    const tm = parseTimeInput(payload.time) || payload.time;
    if (d) payload.date = String(d).replace(/-/g, "/");
    if (tm) payload.time = normalizeTime(tm) || tm;
    const ph = NLP().extractPhone?.(payload.phone || "");
    if (ph) payload.phone = ph;
    if (payload.notes == null) payload.notes = "";
    return payload;
  }

  function bookingReadyForSummary() {
    return !!(bookData.name && bookData.email && bookData.date && bookData.time);
  }

  function showSummary() {
    if (!bookingReadyForSummary()) {
      bookStep = !bookData.date
        ? BOOK_STEPS.indexOf("date")
        : !bookData.time
          ? BOOK_STEPS.indexOf("time")
          : BOOK_STEPS.indexOf("name");
      appendMsg("Me falta un dato para confirmar la cita.", "assistant");
      promptCurrentStep();
      return;
    }
    bookStep = BOOK_STEPS.indexOf("confirm");
    const n = NLP().firstName?.(bookData.name) || bookData.name;
    const lines = [
      n ? `Resumen, ${n}:` : "Resumen:",
      `• ${bookData.name}`,
      `• ${bookData.email}`,
      `• ${bookData.phone || "—"}`,
      `• ${bookData.date} a las ${bookData.time} (1h, España)`,
      bookData.notes ? `• Notas: ${bookData.notes}` : "",
      "",
      "¿Te encaja? (sí / cancelar)",
    ].filter(Boolean);
    appendMsg(lines.join("\n"), "assistant");
  }

  function promptCurrentStep() {
    advanceBookStep();
    updateBookingBar();
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
    lastSuggestedAlts = "";
    rejectedTimes = new Set();
    showBookingBar();

    const ext = extractAll(fromText);
    if (wantsBooking(fromText)) {
      delete ext.name;
    }
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
    lastSuggestedAlts = "";
    rejectedTimes = new Set();
    removeBookingBar();
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
    const endTyping = await showTypingFor(400);
    try {
      const date = extractDateFromText(text);
      const time = extractTimeFromText(text) || "";
      if (!date) {
        await endTyping();
        appendMsg(
          "¿Para qué día quieres que mire? Puedes decir mañana, el martes, 15 de junio…",
          "assistant"
        );
        return;
      }
      const data = await fetchAvailability(date, time, text);
      await endTyping();
      appendMsg(data.message || data.error || "Sin respuesta.", "assistant");
      if (!time && data.slots?.length) {
        appendMsg("Si alguno te va bien, dime «reservar a las 10» o similar.", "assistant");
      }
    } catch {
      await endTyping();
      appendMsg("No pude consultar el calendario ahora. Prueba en un rato o escríbenos.", "assistant");
    } finally {
      busy = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  async function fetchAvailability(date, time, query) {
    const slot = time ? normalizeTime(time) || time : "";
    const { res, data } = await apiPost("/api/availability", { date, time: slot, query });
    if (!res.ok) return { configured: false, error: data.error || "No disponible" };
    return data;
  }

  function filterAlts(altStr) {
    if (!altStr) return "";
    return altStr
      .split(",")
      .map((s) => s.trim())
      .filter((t) => t && !rejectedTimes.has(t))
      .join(", ");
  }

  function isBusinessTime(time) {
    const t = normalizeTime(time);
    return t ? BUSINESS_SLOTS.includes(t) : false;
  }

  async function checkTimeSlot(date, time) {
    const slot = normalizeTime(time);
    if (!slot) {
      return { ok: false, message: "No entendí la hora — prueba con «11:00» o «a las 11».", alts: "" };
    }
    const data = await fetchAvailability(date, slot);
    if (data.error && data.configured === false) return { ok: true };
    if (data.configured === false) return { ok: true };
    if (data.available === true) return { ok: true };
    const alts = filterAlts(
      data.alternatives?.length
        ? data.alternatives.join(", ")
        : data.slots?.slice(0, 5).join(", ") || ""
    );
    let message = data.message;
    if (!message) {
      if (data.reason === "fuera_horario") {
        message = `Esa hora (${slot}) está fuera del horario laboral (9:00–18:00, citas de 1h).`;
      } else {
        message = `El ${date} a las ${slot} no está libre en tu calendario.`;
      }
    }
    return { ok: false, message, alts, reason: data.reason };
  }

  async function validateTimeAndContinue() {
    if (!bookData.date || !bookData.time) {
      promptCurrentStep();
      return;
    }

    if (!isBusinessTime(bookData.time)) {
      const bad = bookData.time;
      delete bookData.time;
      timeValidated = false;
      bookStep = BOOK_STEPS.indexOf("time");
      appendMsg(
        `La hora ${bad} no encaja con nuestro horario (9:00–18:00, citas de 1h). La última hora posible es las 17:00.`,
        "assistant"
      );
      appendMsg("¿Qué otra hora te iría bien?", "assistant");
      return;
    }

    busy = true;
    sendBtn.disabled = true;
    const endTyping = await showTypingFor(450);
    try {
      const check = await checkTimeSlot(bookData.date, bookData.time);
      await endTyping();
      if (!check.ok) {
        timeValidated = false;
        const rejectedTime = normalizeTime(bookData.time) || bookData.time;
        rejectedTimes.add(rejectedTime);
        delete bookData.time;
        bookStep = BOOK_STEPS.indexOf("time");
        appendMsg(
          check.message ||
            `El ${bookData.date} a las ${rejectedTime} no está libre (calendario ocupado).`,
          "assistant"
        );
        const altKey = check.alts || "";
        if (altKey && altKey !== lastSuggestedAlts) {
          appendMsg(`Huecos libres ese día: ${altKey}`, "assistant");
          lastSuggestedAlts = altKey;
        } else if (check.reason !== "fuera_horario") {
          appendMsg("Dime otra hora que te venga bien (por ejemplo: 11:00 o «a las 11»).", "assistant");
        } else {
          appendMsg("¿Qué otra hora te iría bien?", "assistant");
        }
        return;
      }
      timeValidated = true;
      lastSuggestedAlts = "";
      appendMsg(
        `Perfecto — ${bookData.date} a las ${bookData.time} (1h, hora España).`,
        "assistant"
      );
      advanceBookStep();
      if (BOOK_STEPS[bookStep] === "notes") {
        appendMsg(NLP().humanPrompt?.("notes", bookData) || "", "assistant");
      } else if (BOOK_STEPS[bookStep] === "confirm") {
        showSummary();
      } else {
        promptCurrentStep();
      }
    } catch {
      await endTyping();
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
      if (NLP().isBookingIntentText?.(t)) return null;
      const candidate =
        extracted.name ||
        (t.length >= 2 && !extracted.email && !extracted.phone && !extracted.date && !extracted.time
          ? t.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
          : null);
      return candidate && NLP().looksLikePersonName?.(candidate) ? candidate : null;
    }
    if (step === "email") return extracted.email || NLP().extractEmail?.(t) || null;
    if (step === "phone") return extracted.phone || NLP().extractPhone?.(t) || null;
    if (step === "date") return extracted.date || parseDateInput(t);
    if (step === "time") return extracted.time || parseTimeInput(t);
    return null;
  }

  function applyBulkFields(extracted, fromIndex) {
    mergeExtractedFields(extracted);
    const willValidateSlot = extracted.date && extracted.time;
    const acked = [];
    for (let i = fromIndex; i < BOOK_STEPS.length; i++) {
      const key = BOOK_STEPS[i];
      if (key === "confirm" || key === "notes") continue;
      if (!extracted[key]) continue;
      if (willValidateSlot && (key === "date" || key === "time")) continue;
      if (key !== "date" && bookData[key] === extracted[key]) {
        acked.push(NLP().humanAck?.(key, extracted[key], bookData));
      }
    }
    const unique = [...new Set(acked.filter(Boolean))];
    if (unique.length) appendMsg(unique.slice(0, 2).join(" "), "assistant");
    if (extracted.date && !willValidateSlot && bookData.date === extracted.date) {
      const ack = NLP().humanAck?.("date", extracted.date, bookData);
      if (ack && !unique.some((a) => a.includes(extracted.date))) {
        appendMsg(ack, "assistant");
      }
    }
  }

  async function submitBooking() {
    busy = true;
    sendBtn.disabled = true;
    const endTyping = await showTypingFor(500);
    let keepBooking = false;
    try {
      const { res, data } = await apiPost("/api/book", normalizeBookingForSubmit());
      await endTyping();
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
      } else if (res.status === 400) {
        appendMsg(
          data.error ||
            "Faltan datos o el formato no es válido. Revisemos fecha y hora.",
          "assistant"
        );
        keepBooking = true;
        timeValidated = false;
        if (!bookData.date) bookStep = BOOK_STEPS.indexOf("date");
        else if (!bookData.time) bookStep = BOOK_STEPS.indexOf("time");
        else bookStep = BOOK_STEPS.indexOf("confirm");
        promptCurrentStep();
      } else {
        appendMsg(data.error || `Ups, no pude reservar. Escríbenos a ${CONTACT}`, "assistant");
      }
    } catch {
      await endTyping();
      appendMsg(`Problema de conexión. Escríbenos a ${CONTACT} — seguimos contigo.`, "assistant");
    } finally {
      if (!keepBooking) {
        bookMode = false;
        bookStep = 0;
        bookData = {};
        timeValidated = false;
        removeBookingBar();
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

    const extracted = extractAll(t);
    mergeExtractedFields(extracted);

    if (extracted.date && extracted.time) {
      timeValidated = false;
      await validateTimeAndContinue();
      return;
    }

    const correction = NLP().detectCorrection?.(t);
    if (correction) {
      const ext = extractAll(t);
      const val = resolveFieldValue(correction, t, ext);
      if (correction === "time") {
        timeValidated = false;
        bookStep = BOOK_STEPS.indexOf("time");
        if (val) {
          bookData.time = normalizeTime(val) || val;
          appendMsg(NLP().humanAck?.("time", val, bookData) || "Entendido.", "assistant");
          if (bookData.date) {
            await validateTimeAndContinue();
          } else {
            appendMsg(NLP().humanPrompt?.("date", bookData) || "", "assistant");
          }
        } else {
          delete bookData.time;
          appendMsg("¿Qué hora prefieres? (ej. 11:00, a las 11, por la tarde)", "assistant");
        }
        return;
      }
      if (val) {
        bookData[correction] =
          correction === "time" ? normalizeTime(val) || val : val;
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

    if (step === "time" && NLP().isNegative?.(t) && !parseTimeInput(t)) {
      delete bookData.time;
      timeValidated = false;
      appendMsg("¿Qué hora te vendría mejor?", "assistant");
      return;
    }

    if (step === "confirm") {
      if (NLP().isAffirmative?.(t)) {
        if (!bookingReadyForSummary()) {
          appendMsg("Falta la fecha u hora de la reunión. Vamos a completarlo.", "assistant");
          promptCurrentStep();
          return;
        }
        await submitBooking();
        return;
      }
      if (NLP().wantsCancel?.(t)) {
        cancelBooking();
        return;
      }
      if (NLP().wantsTimeChange?.(t)) {
        const ext = extractAll(t);
        const newTime = resolveFieldValue("time", t, ext);
        timeValidated = false;
        bookStep = BOOK_STEPS.indexOf("time");
        if (newTime) {
          bookData.time = normalizeTime(newTime) || newTime;
          await validateTimeAndContinue();
        } else {
          delete bookData.time;
          appendMsg("Vale — ¿qué hora te iría mejor?", "assistant");
        }
        return;
      }
      if (NLP().isNegative?.(t)) {
        timeValidated = false;
        delete bookData.time;
        bookStep = BOOK_STEPS.indexOf("time");
        appendMsg("Sin problema — probemos otra hora. ¿Cuál prefieres?", "assistant");
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

    const extractedStep = extractAll(t);
    mergeExtractedFields(extractedStep);
    applyBulkFields(extractedStep, bookStep);

    const cur = BOOK_STEPS[bookStep];
    const willValidateSlot = bookData.date && bookData.time && !timeValidated;
    if (cur && cur !== "notes" && cur !== "confirm" && !bookData[cur]) {
      const val = resolveFieldValue(cur, t, extractedStep);
      if (val) {
        bookData[cur] = cur === "time" ? normalizeTime(val) || val : val;
        if (!(willValidateSlot && (cur === "date" || cur === "time"))) {
          appendMsg(NLP().humanAck?.(cur, val, bookData) || "Perfecto.", "assistant");
        }
      } else {
        appendMsg("No lo pillé del todo — ¿me lo dices de otra forma?", "assistant");
        appendMsg(NLP().humanPrompt?.(cur, bookData) || "", "assistant");
        return;
      }
    }

    advanceBookStep();
    updateBookingBar();

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

    if (wantsPricing(text)) {
      await handlePricingInterest(text);
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
    if (now - lastSend < COOLDOWN_MS) {
      appendMsg("Dame un segundo — ya te respondo.", "assistant");
      return;
    }
    if (now - pageLoad < 3000) {
      appendMsg("Un momento, ya estoy listo para ayudarte.", "assistant");
      return;
    }

    lastSend = now;
    msgCount += 1;
    busy = true;
    sendBtn.disabled = true;
    appendMsg(text.trim(), "user");
    history.push({ role: "user", content: text.trim() });
    input.value = "";
    const endTyping = await showTypingFor(600);

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
      let data = {};
      try {
        data = await res.json();
      } catch {
        data = {};
      }
      await endTyping();
      const reply = ensureReply(data.reply || data.error);
      appendMsg(reply, "assistant");
      history.push({ role: "assistant", content: reply });
      if (history.length > 12) history = history.slice(-12);

      if (data.suggestLead === "pricing" || wantsPricing(text)) {
        appendLeadCard("pricing");
      } else if (msgCount >= 3 && !leadCardShown.actions && !leadCardShown.pricing) {
        appendActionCard();
      }
    } catch {
      await endTyping();
      appendMsg(
        `Tuve un fallo de conexión, pero sigo aquí. Prueba otra vez o escríbenos a ${CONTACT}.`,
        "assistant"
      );
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
