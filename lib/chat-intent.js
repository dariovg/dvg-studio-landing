/** Intención de lead / pricing — servidor y alineado con el cliente */

export function normalizeIntent(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function wantsPricingIntent(text) {
  const t = normalizeIntent(text);
  return /precio|cuesta|coste|cuanto|tarifa|planes|presupuesto|cotiz|cuanto sale|que cuesta|inversion|euros|iva|mensual|anual|starter|enterprise/.test(
    t
  );
}

export function wantsMeetingIntent(text) {
  const t = normalizeIntent(text);
  return /reunion|videollamada|demo|auditoria|quedar|agendar|reservar|llamada|hablar con/.test(t);
}
