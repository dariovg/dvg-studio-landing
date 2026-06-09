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
    });

    document.querySelectorAll(".pricing-period").forEach((p) => {
      p.textContent = annual ? "/mes (facturación anual)" : "/mes";
    });
  }

  toggle.addEventListener("click", () => {
    setPricing(!toggle.classList.contains("active"));
  });

  toggle.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setPricing(!toggle.classList.contains("active"));
    }
  });

  const annualLabel = toggle.parentElement?.querySelector("span:last-child");
  annualLabel?.addEventListener("click", () => setPricing(true));
  toggle.parentElement?.querySelector("span:first-child")?.addEventListener("click", () => setPricing(false));
})();
