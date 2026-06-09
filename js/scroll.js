/* Scroll reveals, scrollytelling, stat counters */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && !prefersReduced) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("revealed"));
  }

  // Stat counters
  function animateStat(el) {
    const target = Number(el.dataset.count);
    if (!target) return;
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(target * eased);
      el.innerHTML = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  const statEls = document.querySelectorAll(".stat-number[data-count]");
  if (statEls.length && !prefersReduced) {
    const statIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateStat(e.target);
            statIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    statEls.forEach((el) => statIo.observe(el));
  } else {
    statEls.forEach((el) => {
      el.innerHTML =
        (el.dataset.prefix || "") + el.dataset.count + (el.dataset.suffix || "");
    });
  }

  const scrolly = document.querySelector(".scrolly");
  if (!scrolly || prefersReduced) return;

  const steps = [...scrolly.querySelectorAll(".scrolly-step")];
  const visual = scrolly.querySelector(".scrolly-visual-inner");
  const progress = document.querySelector(".scrolly-progress");
  if (!steps.length) return;

  const onScroll = () => {
    const rect = scrolly.getBoundingClientRect();
    const total = scrolly.offsetHeight - window.innerHeight;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    const pct = total > 0 ? scrolled / total : 0;

    if (progress) progress.style.width = `${pct * 100}%`;

    const stepIndex = Math.min(steps.length - 1, Math.floor(pct * steps.length));
    steps.forEach((s, i) => s.classList.toggle("active", i === stepIndex));
    if (visual) visual.dataset.step = String(stepIndex + 1);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const header = document.querySelector("header");
  if (header) {
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("scrolled", window.scrollY > 40),
      { passive: true }
    );
  }
})();
