/* Toggle mensual / anual (-20%) */
(function () {
  const toggle = document.getElementById("pricingToggle");
  if (!toggle) return;

  const prices = document.querySelectorAll("[data-price-monthly]");

  function formatEuro(amount) {
    return "€" + amount.toLocaleString("es-ES");
  }

  function setPricing(annual) {
    toggle.classList.toggle("active", annual);
    toggle.setAttribute("aria-checked", String(annual));

    prices.forEach((el) => {
      const monthly = Number(el.dataset.priceMonthly);
      const annualPrice = Number(el.dataset.priceAnnual);
      el.textContent = formatEuro(annual ? annualPrice : monthly);

      const saveEl = el.closest(".pricing-card")?.querySelector(".pricing-save");
      if (saveEl) {
        const saved = (monthly - annualPrice) * 12;
        saveEl.textContent = annual && saved > 0 ? `Ahorras ${formatEuro(saved)}/año` : "";
      }
    });

    document.querySelectorAll(".pricing-period").forEach((p) => {
      p.textContent = annual ? "/mes (facturación anual)" : "/mes";
    });
  }

  toggle.addEventListener("click", () => setPricing(!toggle.classList.contains("active")));
  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPricing(!toggle.classList.contains("active"));
    }
  });

  const wrap = toggle.parentElement;
  wrap?.querySelector("span:first-child")?.addEventListener("click", () => setPricing(false));
  wrap?.querySelector("span:last-child")?.addEventListener("click", () => setPricing(true));
})();
