/* IGNITE — chatbot IA 24/7 */
(function () {
  const widget = document.getElementById("igniteChat");
  if (!widget) return;

  const toggle = document.getElementById("chatToggle");
  const panel = document.getElementById("chatPanel");
  const closeBtn = document.getElementById("chatClose");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const messages = document.getElementById("chatMessages");
  const sendBtn = document.getElementById("chatSend");

  let history = [];
  let busy = false;

  const welcome = {
    role: "assistant",
    content:
      "Hola, soy IGNITE 🔥 Asistente IA de DVG Studio. Pregúntame sobre empleados digitales, precios, plazos o cómo automatizar tu negocio. Estoy aquí 24/7.",
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
    div.textContent = "IGNITE está escribiendo…";
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    document.getElementById("chatTyping")?.remove();
  }

  async function sendMessage(text) {
    if (busy || !text.trim()) return;
    busy = true;
    sendBtn.disabled = true;
    appendMsg(text.trim(), "user");
    history.push({ role: "user", content: text.trim() });
    input.value = "";
    appendTyping();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });
      const data = await res.json();
      removeTyping();
      const reply = data.reply || data.error || "Sin respuesta.";
      appendMsg(reply, "assistant");
      history.push({ role: "assistant", content: reply });
      if (history.length > 20) history = history.slice(-20);
    } catch {
      removeTyping();
      appendMsg(
        "No pude conectar con el asistente. Escríbenos por WhatsApp o solicita auditoría gratis.",
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
