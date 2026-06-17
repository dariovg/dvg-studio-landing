(function () {
  const btn = document.getElementById("audioIntroBtn");
  const audio = document.getElementById("audioIntro");
  if (!btn || !audio) return;

  const icon = btn.querySelector(".audio-intro-icon");
  const hint = btn.querySelector(".audio-intro-hint");

  function setPlaying(playing) {
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      playing ? "Pausar audio: quiénes somos" : "Reproducir audio: quiénes somos"
    );
    if (icon) icon.textContent = playing ? "❚❚" : "▶";
    if (hint) hint.textContent = playing ? "Reproduciendo…" : "Escucha en un minuto";
  }

  btn.addEventListener("click", () => {
    if (audio.paused) {
      audio.play().catch(() => {
        if (hint) hint.textContent = "Toca de nuevo para reproducir";
      });
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => setPlaying(true));
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("ended", () => setPlaying(false));

  audio.addEventListener("loadedmetadata", () => {
    if (!hint || !audio.duration || Number.isNaN(audio.duration)) return;
    const secs = Math.round(audio.duration);
    if (secs > 0 && !btn.classList.contains("is-playing")) {
      hint.textContent =
        secs < 60 ? `Escucha en ${secs} segundos` : `Escucha en ${Math.ceil(secs / 60)} min`;
    }
  });
})();
