/* Chat web DVG Studio */
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
  const MAX_MSGS = 8;
  const COOLDOWN_MS = 5000;

  const welcome = {
    role: "assistant",
    content:
      "Hola. Soy el asistente de DVG Studio. Pregúntame sobre precios, servicios o cómo funciona un empleado digital. Solo uso información oficial de la empresa.",
  };

  function openChat() {
    panel.classList.add("open");
    toggle.setAttribute("aria-expanded", "true");
    if (!messages.dataset.init) {
      appendMsg(welcome.content, "assistant");
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

  async function sendMessage(text) {
    if (busy || !text.trim()) return;
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
        headers: {
          "Content-Type": "application/json",
          "X-DVG-Chat": "1",
        },
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
      appendMsg(
        "No pude conectar. Escríbenos a contact@dvgstudio.com o solicita auditoría gratis.",
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
