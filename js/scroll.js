/* Scrollytelling, scroll-driven reveals, progress */
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
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("revealed"));
  }

  const revealScale = document.querySelectorAll(".reveal-scale");
  revealScale.forEach((el) => {
    if (prefersReduced) {
      el.classList.add("revealed");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    io.observe(el);
  });

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
