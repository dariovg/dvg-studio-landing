(function () {
  const btn = document.getElementById("audioIntroBtn");
  const audio = document.getElementById("audioIntro");
  if (!btn || !audio) return;

  const icon = btn.querySelector(".audio-intro-icon");
  const hint = btn.querySelector(".audio-intro-hint");
  const idleHint = "Pulsa para escuchar";

  function setPlaying(playing) {
    btn.classList.toggle("is-playing", playing);
    btn.setAttribute("aria-pressed", playing ? "true" : "false");
    btn.setAttribute(
      "aria-label",
      playing
        ? "Pausar audio: ¿quieres saber quiénes somos?"
        : "Reproducir audio: ¿quieres saber quiénes somos?"
    );
    if (icon) icon.textContent = playing ? "❚❚" : "▶";
    if (hint) hint.textContent = playing ? "Reproduciendo…" : idleHint;
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
})();
