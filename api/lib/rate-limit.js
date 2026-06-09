/** Límite en memoria (best-effort en serverless). Para producción fuerte: Vercel Firewall o Upstash. */
const buckets = new Map();

function prune() {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (now - v.windowStart > 86_400_000) buckets.delete(k);
  }
}

export function checkRateLimit(ip, { perHour = 8, perDay = 25 } = {}) {
  prune();
  const now = Date.now();
  const key = ip || "unknown";
  let b = buckets.get(key);

  if (!b) {
    b = { windowStart: now, hourStart: now, hourCount: 0, dayCount: 0 };
    buckets.set(key, b);
  }

  if (now - b.hourStart > 3_600_000) {
    b.hourStart = now;
    b.hourCount = 0;
  }

  if (now - b.windowStart > 86_400_000) {
    b.windowStart = now;
    b.dayCount = 0;
  }

  if (b.hourCount >= perHour || b.dayCount >= perDay) {
    return { ok: false, retryAfter: 3600 };
  }

  b.hourCount += 1;
  b.dayCount += 1;
  return { ok: true };
}

let bedrockCallsToday = 0;
let bedrockDay = new Date().toDateString();

export function canCallBedrock(maxDaily = 200) {
  const today = new Date().toDateString();
  if (today !== bedrockDay) {
    bedrockDay = today;
    bedrockCallsToday = 0;
  }
  return bedrockCallsToday < maxDaily;
}

export function recordBedrockCall() {
  bedrockCallsToday += 1;
}
