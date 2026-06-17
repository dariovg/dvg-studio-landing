import { CHAT_ORIGINS_DEFAULT } from "./site-config.js";

const lastMsgByIp = new Map();

function normalizeHostname(host) {
  return String(host || "").toLowerCase().replace(/^www\./, "");
}

export function parseAllowedOrigins() {
  const defaults = CHAT_ORIGINS_DEFAULT.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const fromEnv = (process.env.CHAT_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const extras = [];
  try {
    if (process.env.SITE_URL) extras.push(new URL(process.env.SITE_URL).origin);
  } catch {
    /* ignore */
  }
  if (process.env.VERCEL_URL) extras.push(`https://${process.env.VERCEL_URL}`);
  return [...new Set([...defaults, ...fromEnv, ...extras])];
}

function originAllowed(source, allowedList) {
  if (!source) return false;
  let url;
  try {
    url = source.includes("://") ? new URL(source) : new URL(`https://${source}`);
  } catch {
    return allowedList.some((allowed) => source.startsWith(allowed));
  }

  for (const allowed of allowedList) {
    let allowUrl;
    try {
      allowUrl = new URL(allowed);
    } catch {
      if (source.startsWith(allowed)) return true;
      continue;
    }
    if (url.origin === allowUrl.origin) return true;
    if (
      normalizeHostname(url.hostname) === normalizeHostname(allowUrl.hostname) &&
      url.protocol === allowUrl.protocol
    ) {
      return true;
    }
    if (url.hostname.endsWith(".vercel.app") && allowUrl.hostname.endsWith(".vercel.app")) {
      return true;
    }
  }
  return false;
}

export function clientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "unknown"
  );
}

export function validateOrigin(req) {
  const allowed = parseAllowedOrigins();
  const sources = [req.headers.origin, req.headers.referer].filter(Boolean);
  if (req.headers.host) sources.push(`https://${req.headers.host}`);
  return sources.some((source) => originAllowed(source, allowed));
}

export function validateSiteKey(body) {
  const expected = process.env.CHAT_SITE_KEY;
  if (!expected) return true;
  const got = String(body?._k || "").trim();
  return got === expected;
}

export function validateHoneypot(body) {
  return !body?._hp;
}

export function validateTiming(body) {
  const ts = Number(body?._ts);
  const boot = Number(body?._boot);
  if (!ts || !boot) return false;
  if (Math.abs(Date.now() - ts) > 600_000) return false;
  if (Date.now() - boot < 400) return false;
  if (ts < boot) return false;
  return true;
}

const BOT_UA = /curl|wget|python-requests|scrapy|httpclient|go-http|java\/|libwww|postman/i;

export function validateUserAgent(req) {
  const ua = req.headers["user-agent"] || "";
  if (!ua || ua.length < 10) return false;
  if (BOT_UA.test(ua)) return false;
  return true;
}

const SPAM_PATTERNS = [
  /(.)\1{8,}/,
  /https?:\/\/[^\s]+.*https?:\/\//i,
  /(viagra|casino|crypto airdrop|free money)/i,
];

export function validateMessage(message) {
  if (!message || message.length < 2) return false;
  if ((message.match(/https?:\/\//gi) || []).length > 1) return false;
  for (const p of SPAM_PATTERNS) {
    if (p.test(message)) return false;
  }
  return true;
}

export function isRepeatedMessage(ip, message) {
  const key = ip || "unknown";
  const prev = lastMsgByIp.get(key);
  lastMsgByIp.set(key, message);
  return prev === message;
}

export function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && (m.role === "user" || m.role === "assistant"))
    .slice(-4)
    .map((m) => ({
      role: m.role,
      content: String(m.content).slice(0, 300),
    }));
}
