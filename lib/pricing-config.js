/** Precios públicos — única fuente de verdad (web, chat, emails). */
export const ANNUAL_DISCOUNT_PERCENT = 15;

export const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 349,
    badge: null,
    note: "Para empezar con 1 agente",
    agents: "1 agente IA",
    highlights: [
      "Todos los canales (WA, TG, email, web…)",
      "Auditoría gratuita",
      "Soporte 24/7 y mejoras",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 949,
    badge: "★ El más elegido",
    note: "Equipos en crecimiento",
    agents: "Hasta 5 agentes IA",
    highlights: [
      "Todos los canales",
      "Integración CRM/herramientas",
      "Mejoras web con IA",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 1749,
    badge: null,
    note: "Grandes equipos a medida",
    agents: "Hasta 10 agentes IA",
    highlights: [
      "Todos los canales",
      "Integración CRM/ERP",
      "Account manager + SLA",
    ],
  },
];

export function annualMonthlyPrice(monthly) {
  return Math.round(monthly * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
}

export function annualSavingsPerYear(monthly) {
  return (monthly - annualMonthlyPrice(monthly)) * 12;
}

export function formatEuro(amount) {
  return `€${Number(amount).toLocaleString("es-ES")}`;
}

export function planById(id) {
  return PLANS.find((p) => p.id === id);
}
