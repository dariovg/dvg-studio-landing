/* Parallax scroll, mouse depth, counters — inspired by Awwwards parallax patterns (lightweight) */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  if (reduced) return;

  const hero = document.getElementById("hero");
  const parallaxEls = [...document.querySelectorAll("[data-parallax]")];
  const orbs = hero ? [...hero.querySelectorAll(".hero-orb")] : [];
  const mercado = document.getElementById("mercado");

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let ticking = false;

  const onMouseMove = (e) => {
    if (mobile || !hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    targetX = (e.clientX - rect.left) / rect.width - 0.5;
    targetY = (e.clientY - rect.top) / rect.height - 0.5;
  };

  const applyFrame = () => {
    ticking = false;
    mouseX += (targetX - mouseX) * 0.08;
    mouseY += (targetY - mouseY) * 0.08;

    const scrollY = window.scrollY;

    parallaxEls.forEach((el) => {
      const speed = parseFloat(el.dataset.parallax || "0");
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const viewCenter = window.innerHeight / 2;
      const offset = (center - viewCenter) * speed;
      el.style.transform = `translate3d(0, ${offset.toFixed(2)}px, 0)`;
    });

    if (!mobile && hero && orbs.length) {
      orbs.forEach((orb, i) => {
        const depth = (i + 1) * 14;
        const mx = mouseX * depth;
        const my = mouseY * depth;
        const scrollFactor = parseFloat(orb.dataset.parallax || 0) * scrollY * 0.15;
        orb.style.transform = `translate3d(${mx.toFixed(1)}px, ${(my + scrollFactor).toFixed(1)}px, 0)`;
      });
    }

    if (mercado) {
      const rect = mercado.getBoundingClientRect();
      const progress = 1 - Math.min(Math.max((rect.top + rect.height * 0.5) / window.innerHeight, 0), 1);
      mercado.style.setProperty("--section-glow", (0.25 + progress * 0.45).toFixed(2));
    }
  };

  const requestTick = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(applyFrame);
    }
  };

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
  if (!mobile) {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
  }
  requestTick();

  /* Count-up on insight stats (scroll-triggered) */
  const counters = document.querySelectorAll(".insight-stat[data-count]");
  if (counters.length) {
    const animateCounter = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const duration = 1200;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => io.observe(el));
  }
})();
