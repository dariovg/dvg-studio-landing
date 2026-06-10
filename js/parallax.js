/* Parallax de alto impacto — capas, tilt 3D, scroll depth (sin WebGL) */
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = window.matchMedia("(max-width: 900px)").matches;
  if (reduced) return;

  const hero = document.getElementById("hero");
  const heroContent = hero?.querySelector(".hero-content");
  const heroParallax = hero?.querySelector(".hero-parallax");
  const orbs = hero ? [...hero.querySelectorAll(".hero-orb")] : [];
  const floats = hero ? [...hero.querySelectorAll(".hero-float")] : [];
  const heroGrid = hero?.querySelector(".hero-grid");
  const mercado = document.getElementById("mercado");

  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let ticking = false;
  let t0 = performance.now();

  const depth = (d) => (mobile ? d * 0.35 : d);

  const onMouseMove = (e) => {
    if (!hero) return;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    targetX = (e.clientX - rect.left) / rect.width - 0.5;
    targetY = (e.clientY - rect.top) / rect.height - 0.5;
  };

  const applyFrame = (now) => {
    ticking = false;
    mouseX += (targetX - mouseX) * 0.1;
    mouseY += (targetY - mouseY) * 0.1;
    const time = (now - t0) / 1000;
    const scrollY = window.scrollY;

    if (hero && heroContent) {
      const heroH = hero.offsetHeight;
      const p = Math.min(Math.max(scrollY / heroH, 0), 1);
      const scrollLift = scrollY * 0.45;
      const scale = 1 - p * 0.12;
      const opacity = 1 - p * 0.55;
      const tiltX = mobile ? 0 : mouseY * -7;
      const tiltY = mobile ? 0 : mouseX * 9;

      heroContent.style.transform = `translate3d(0, ${scrollLift}px, 0) scale(${scale}) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      heroContent.style.opacity = String(opacity);
    }

    orbs.forEach((orb) => {
      const d = parseFloat(orb.dataset.depth || "1");
      const floatX = Math.sin(time * 0.7 + d * 2) * depth(28);
      const floatY = Math.cos(time * 0.55 + d) * depth(22);
      const mx = mouseX * depth(55 * d);
      const my = mouseY * depth(45 * d);
      const sy = scrollY * 0.08 * d;
      orb.style.transform = `translate3d(${floatX + mx}px, ${floatY + my + sy}px, 0) scale(${1 + Math.sin(time + d) * 0.06})`;
    });

    floats.forEach((el) => {
      const d = parseFloat(el.style.getPropertyValue("--d") || "1");
      const mx = mouseX * depth(35 * d);
      const my = mouseY * depth(30 * d);
      const fy = Math.sin(time * 0.9 + d * 3) * depth(16);
      el.style.transform = `translate3d(${mx}px, ${my + fy}px, 0) rotate(${mouseX * depth(8)}deg)`;
    });

    if (heroGrid) {
      const gx = mouseX * depth(25);
      const gy = mouseY * depth(18) + scrollY * 0.04;
      heroGrid.style.transform = `perspective(900px) rotateX(62deg) translate3d(${gx}px, ${-6 + gy * 0.1}%, 0)`;
    }

    if (mercado) {
      const rect = mercado.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = 1 - Math.min(Math.max((rect.top + rect.height * 0.35) / vh, 0), 1);
      mercado.style.setProperty("--section-glow", (0.35 + progress * 0.65).toFixed(2));
      const warm = Math.round(progress * 18);
      mercado.style.background = `linear-gradient(180deg, rgb(${232 - warm}, ${236 - warm}, ${245 - warm}) 0%, #fff 30%, #eef1f8 70%, var(--light) 100%)`;
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
    document.addEventListener("mousemove", onMouseMove, { passive: true });
  }
  requestAnimationFrame(applyFrame);

  /* Contadores */
  const counters = document.querySelectorAll(".insight-stat[data-count]");
  if (counters.length) {
    const animateCounter = (el) => {
      const target = Number(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      const duration = 1400;
      const start = performance.now();
      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
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
      { threshold: 0.4 }
    );
    counters.forEach((el) => io.observe(el));
  }
})();
