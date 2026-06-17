(function () {
  const form = document.getElementById("surveyForm");
  if (!form) return;

  const siteKey = document.body.dataset.siteKey || "";
  const hp = document.getElementById("surveyHp");
  const msg = document.getElementById("surveyMsg");
  const btn = document.getElementById("surveySubmit");
  const pageLoad = Date.now();

  function checkedValues(name) {
    return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
  }

  function radioValue(name) {
    const el = form.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : "";
  }

  function showMessage(text, ok) {
    msg.textContent = text;
    msg.className = "survey-msg " + (ok ? "ok" : "err");
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    msg.className = "survey-msg";

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Revisa nombre y email.", false);
      return;
    }

    const channels = checkedValues("q1_channels");
    if (!channels.length) {
      showMessage("Marca al menos un canal en la pregunta 1.", false);
      return;
    }

    const payload = {
      name,
      email,
      company: form.company.value.trim(),
      q1_channels: channels,
      q2_repetitive_task: form.q2_repetitive_task.value.trim(),
      q3_quote_time: radioValue("q3_quote_time"),
      q4_calendar: radioValue("q4_calendar"),
      q5_ai_maturity: radioValue("q5_ai_maturity"),
      q6_lost_hours: radioValue("q6_lost_hours"),
      q7_tools: form.q7_tools.value.trim(),
      q8_first_delegate: form.q8_first_delegate.value.trim(),
      q9_priority_area: radioValue("q9_priority_area"),
      q10_investment: radioValue("q10_investment"),
      _k: siteKey,
      _hp: hp?.value || "",
      _ts: Date.now(),
      _boot: pageLoad,
    };

    if (!payload.q3_quote_time || !payload.q4_calendar || !payload.q5_ai_maturity) {
      showMessage("Completa las preguntas obligatorias (marcadas con *).", false);
      return;
    }
    if (!payload.q6_lost_hours || !payload.q9_priority_area || !payload.q10_investment) {
      showMessage("Completa las preguntas obligatorias (marcadas con *).", false);
      return;
    }

    btn.disabled = true;
    btn.textContent = "Enviando…";

    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-DVG-Chat": "1" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showMessage(data.error || "No pudimos enviar la encuesta. Inténtalo de nuevo.", false);
        btn.disabled = false;
        btn.textContent = "Enviar encuesta";
        return;
      }
      showMessage(data.message || "Encuesta enviada. Gracias.", true);
      form.querySelectorAll("input, textarea, button").forEach((el) => {
        el.disabled = true;
      });
      btn.textContent = "Enviado";
    } catch {
      showMessage("Error de conexión. Comprueba tu red e inténtalo de nuevo.", false);
      btn.disabled = false;
      btn.textContent = "Enviar encuesta";
    }
  });
})();
