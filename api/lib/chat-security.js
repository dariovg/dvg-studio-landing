const lastMsgByIp = new Map();

export function clientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "unknown"
  );
}

export function validateOrigin(req) {
  const allowed = (process.env.CHAT_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!allowed.length) return true;

  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  return allowed.some((o) => origin.startsWith(o) || referer.startsWith(o));
}

export function validateSiteKey(body) {
  const expected = process.env.CHAT_SITE_KEY;
  if (!expected) return true;
  return body?._k === expected;
}

export function validateHoneypot(body) {
  return !body?._hp;
}

export function validateTiming(body) {
  const ts = Number(body?._ts);
  const boot = Number(body?._boot);
  if (!ts || !boot) return false;
  if (Math.abs(Date.now() - ts) > 300_000) return false;
  if (Date.now() - boot < 2_000) return false;
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
