/** Contacto y dominio — alinear con variables Vercel */
export const CONTACT_EMAIL =
  process.env.CONTACT_EMAIL ||
  process.env.BOOKING_NOTIFY_EMAIL ||
  "info@dvgsstudio.com";

export const SITE_URL =
  process.env.SITE_URL || "https://www.dvgsstudio.com";

export const CHAT_ORIGINS_DEFAULT =
  "https://dvgsstudio.com,https://www.dvgsstudio.com,https://dvgsstudio.es,https://www.dvgsstudio.es,https://dvg-studio-landing.vercel.app";

/** Encuesta de madurez digital (Google Forms, Typeform, etc.) */
export function surveyUrl() {
  return (process.env.DIGITALIZATION_SURVEY_URL || "").trim();
}

export function logoUrl() {
  return `${SITE_URL}/assets/logo-dvg-studio-footer.png`;
}
