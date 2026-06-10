/* Scrollytelling, scroll-driven reveals, progress */
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileMq = window.matchMedia("(max-width: 900px)");

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
  const dotsRoot = document.getElementById("scrollyDots");
  const hint = document.getElementById("scrollyHint");
  const visualWrap = document.getElementById("scrollyVisual");
  if (!steps.length) return;

  let activeIndex = 0;

  const setStep = (index, { scroll = false } = {}) => {
    const next = Math.max(0, Math.min(steps.length - 1, index));
    activeIndex = next;
    steps.forEach((s, i) => {
      const on = i === next;
      s.classList.toggle("active", on);
      if (on) s.setAttribute("aria-current", "step");
      else s.removeAttribute("aria-current");
    });
    if (visual) visual.dataset.step = String(next + 1);
    if (progress) progress.style.width = `${((next + 1) / steps.length) * 100}%`;
    dotsRoot?.querySelectorAll(".scrolly-dot").forEach((dot, i) => {
      dot.classList.toggle("active", i === next);
      dot.setAttribute("aria-selected", i === next ? "true" : "false");
    });
    if (scroll) {
      steps[next].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    hint?.classList.add("is-hidden");
  };

  const buildDots = () => {
    if (!dotsRoot) return;
    dotsRoot.innerHTML = "";
    steps.forEach((step, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = `scrolly-dot${i === 0 ? " active" : ""}`;
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", step.querySelector("h3")?.textContent || `Paso ${i + 1}`);
      dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
      dot.addEventListener("click", () => setStep(i, { scroll: true }));
      dotsRoot.appendChild(dot);
    });
  };

  const initMobileScrolly = () => {
    buildDots();
    setStep(0);

    const stepIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const idx = steps.indexOf(e.target);
          if (idx >= 0) setStep(idx);
        });
      },
      { threshold: 0.5, rootMargin: "-32% 0px -32% 0px" }
    );
    steps.forEach((s) => stepIo.observe(s));

    if (!visualWrap) return;
    let touchX = 0;
    let touchY = 0;
    visualWrap.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.changedTouches[0].clientX;
        touchY = e.changedTouches[0].clientY;
      },
      { passive: true }
    );
    visualWrap.addEventListener(
      "touchend",
      (e) => {
        const dx = e.changedTouches[0].clientX - touchX;
        const dy = e.changedTouches[0].clientY - touchY;
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
        setStep(activeIndex + (dx < 0 ? 1 : -1), { scroll: true });
      },
      { passive: true }
    );
  };

  const initDesktopScrolly = () => {
    dotsRoot?.replaceChildren();
    hint?.classList.add("is-hidden");

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
  };

  const bootScrolly = () => {
    if (mobileMq.matches) initMobileScrolly();
    else initDesktopScrolly();
  };

  bootScrolly();
  mobileMq.addEventListener("change", () => window.location.reload());

  const header = document.querySelector("header");
  if (header) {
    window.addEventListener(
      "scroll",
      () => header.classList.toggle("scrolled", window.scrollY > 40),
      { passive: true }
    );
  }
})();
