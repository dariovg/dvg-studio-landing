/* Toggle mensual / anual — descuento en data-annual-discount del contenedor */
(function () {
  const container = document.querySelector(".pricing-container");
  const toggle = document.getElementById("pricingToggle");
  if (!toggle || !container) return;

  const discount = Number(container.dataset.annualDiscount || 15);
  const prices = document.querySelectorAll("[data-price-monthly]");
  const annualLabel = container.querySelector(".pricing-toggle-annual-label");

  function formatEuro(amount) {
    return "€" + Number(amount).toLocaleString("es-ES");
  }

  function annualPrice(monthly) {
    return Math.round(monthly * (1 - discount / 100));
  }

  function setPricing(annual) {
    toggle.classList.toggle("active", annual);
    toggle.setAttribute("aria-checked", String(annual));

    if (annualLabel) {
      annualLabel.textContent = `Anual (-${discount}%)`;
    }

    prices.forEach((el) => {
      const monthly = Number(el.dataset.priceMonthly);
      const annualMonthly = annualPrice(monthly);

      if (annual && annualMonthly < monthly) {
        el.innerHTML =
          '<span class="pricing-was" aria-hidden="true">' +
          formatEuro(monthly) +
          '</span><span class="pricing-now">' +
          formatEuro(annualMonthly) +
          "</span>";
      } else {
        el.textContent = formatEuro(monthly);
      }

      const saveEl = el.closest(".pricing-card")?.querySelector(".pricing-save");
      if (saveEl) {
        const saved = (monthly - annualMonthly) * 12;
        saveEl.textContent =
          annual && saved > 0 ? `Ahorras ${formatEuro(saved)}/año` : "";
      }
    });

    document.querySelectorAll(".pricing-period").forEach((p) => {
      p.textContent = annual
        ? `/mes · pago anual (${discount}% dto.)`
        : "/mes";
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
