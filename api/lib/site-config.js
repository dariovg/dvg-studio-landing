/** Contacto y dominio — alinear con variables Vercel */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ||
  process.env.BOOKING_NOTIFY_EMAIL ||
  "contact@dvgsstudio.com";

export const SITE_URL =
  process.env.SITE_URL || "https://www.dvgsstudio.com";

export const CHAT_ORIGINS_DEFAULT =
  "https://dvgsstudio.com,https://www.dvgsstudio.com,https://dvgsstudio.es,https://www.dvgsstudio.es,https://dvg-studio-landing.vercel.app";
