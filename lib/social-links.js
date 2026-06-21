/** Perfiles públicos DVG Studio — actualizar aquí y en index.html (footer + JSON-LD). */
export const SOCIAL_HANDLE = "dvgsstudio";

export const SOCIAL_LINKS = [
  {
    id: "instagram",
    label: "Instagram",
    handle: "@dvgsstudio",
    url:
      process.env.SOCIAL_INSTAGRAM_URL ||
      "https://www.instagram.com/dvgsstudio/",
  },
  {
    id: "tiktok",
    label: "TikTok",
    handle: "@dvgsstudio",
    url: process.env.SOCIAL_TIKTOK_URL || "https://www.tiktok.com/@dvgsstudio",
  },
  {
    id: "x",
    label: "X",
    handle: "@dvgsstudio",
    url: process.env.SOCIAL_X_URL || "https://x.com/dvgsstudio",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "DVG Studio",
    url:
      process.env.SOCIAL_LINKEDIN_URL ||
      "https://www.linkedin.com/company/dvgsstudio",
  },
  {
    id: "youtube",
    label: "YouTube",
    handle: "@dvgsstudio",
    url:
      process.env.SOCIAL_YOUTUBE_URL ||
      "https://www.youtube.com/@dvgsstudio",
  },
];

export function socialUrls() {
  return SOCIAL_LINKS.map((s) => s.url);
}

export function socialById(id) {
  return SOCIAL_LINKS.find((s) => s.id === id) || null;
}

export function socialLinksForSiteConfig() {
  return Object.fromEntries(SOCIAL_LINKS.map((s) => [s.id, s.url]));
}
