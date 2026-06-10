import { randomUUID } from "crypto";

const CALDAV_HOST = "https://caldav.icloud.com";
const SKIP_CALENDAR = /\/(inbox|notification|tasks|archive|birthdays|holidays|recyclebin)\//i;

function credentials() {
  const email = (
    process.env.ICLOUD_CALENDAR_EMAIL || process.env.BOOKING_CALENDAR_EMAIL || ""
  )
    .trim()
    .toLowerCase();
  const raw = (process.env.ICLOUD_APP_PASSWORD || "").trim();
  // Apple da 16 caracteres a veces con guiones: aceptamos ambos formatos
  const password = raw.replace(/\s+/g, "");
  return { email, password };
}

export function icloudConfigured() {
  const { email, password } = credentials();
  return !!(email && password);
}

function authHeader() {
  const { email, password } = credentials();
  return "Basic " + Buffer.from(`${email}:${password}`, "utf8").toString("base64");
}

function resolveHref(base, href) {
  if (!href) return null;
  const clean = decodeURIComponent(href.replace(/&amp;/g, "&").trim());
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${new URL(base).origin}${clean}`;
  return new URL(clean, base.endsWith("/") ? base : `${base}/`).href;
}

async function davRequest(url, method, body = null, depth = "0") {
  const headers = {
    Authorization: authHeader(),
    Depth: depth,
  };
  if (body) headers["Content-Type"] = "application/xml; charset=utf-8";

  const res = await fetch(url, { method, headers, body: body || undefined });
  const text = await res.text().catch(() => "");

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `iCloud auth ${res.status} — revisa ICLOUD_CALENDAR_EMAIL y ICLOUD_APP_PASSWORD`
    );
  }
  return { status: res.status, text, ok: res.ok };
}

async function propfind(url, body, depth = "0") {
  const res = await davRequest(url, "PROPFIND", body, depth);
  if (res.status !== 207 && !res.ok) {
    throw new Error(`CalDAV PROPFIND ${res.status} en ${url}`);
  }
  return res.text;
}

function extractHrefAfterTag(xml, tagName) {
  const blockRe = new RegExp(
    `<(?:[\\w]+:)?${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:[\\w]+:)?${tagName}>`,
    "i"
  );
  const block = xml.match(blockRe);
  if (!block) return null;
  const hrefM = block[1].match(/<(?:[\w]+:)?href[^>]*>([^<]+)<\/(?:[\w]+:)?href>/i);
  return hrefM ? hrefM[1].trim() : null;
}

function parseCalendars(xml) {
  const blocks = xml.split(/<(?:[\w]+:)?response\b/i).slice(1);
  const calendars = [];
  for (const block of blocks) {
    const hrefM = block.match(/<(?:[\w]+:)?href[^>]*>([^<]+)<\/(?:[\w]+:)?href>/i);
    if (!hrefM) continue;
    const href = hrefM[1].trim();
    if (!href.includes("/calendars/")) continue;
    if (href.endsWith("/calendars/") || href.endsWith("/calendars")) continue;
    if (SKIP_CALENDAR.test(href)) continue;
    if (/\.ics$/i.test(href)) continue;

    const nameM = block.match(
      /<(?:[\w]+:)?displayname[^>]*>([^<]*)<\/(?:[\w]+:)?displayname>/i
    );
    const hasCollection = /<(?:[\w]+:)?collection[\s/>]/i.test(block);
    const hasCalendar = /<(?:[\w]+:)?calendar[\s/>]/i.test(block);
    const isHomePath = /\/home\/?$/i.test(href);

    if (!hasCollection && !hasCalendar && !isHomePath) continue;

    calendars.push({
      href,
      name: nameM ? nameM[1].trim() : "",
      score: 0,
    });
  }

  for (const cal of calendars) {
    const label = `${cal.name} ${cal.href}`.toLowerCase();
    if (/inicio|home|personal|calendario|calendar/i.test(label)) cal.score += 10;
    if (/\/home\/?$/i.test(cal.href)) cal.score += 8;
    if (cal.name && !/suscrito|subscribed|festivo|holiday/i.test(label)) cal.score += 2;
  }

  calendars.sort((a, b) => b.score - a.score);
  return calendars;
}

let cachedCalendarUrl = null;

async function discoverPrincipalUrl() {
  // iCloud redirige .well-known → principal del usuario
  try {
    const res = await fetch(`${CALDAV_HOST}/.well-known/caldav`, {
      method: "GET",
      headers: { Authorization: authHeader() },
      redirect: "follow",
    });
    if (res.ok && res.url && res.url.includes("caldav.icloud.com")) {
      const u = res.url.endsWith("/") ? res.url : `${res.url}/`;
      return u;
    }
  } catch {
    /* fallback abajo */
  }

  const principalXml = await propfind(
    `${CALDAV_HOST}/`,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal /></d:prop>
</d:propfind>`
  );

  const principalHref = extractHrefAfterTag(principalXml, "current-user-principal");
  if (!principalHref) {
    throw new Error("No se encontró tu cuenta iCloud — revisa el email de Apple ID");
  }
  return resolveHref(`${CALDAV_HOST}/`, principalHref);
}

async function getCalendarUrl() {
  if (process.env.ICLOUD_CALENDAR_URL) {
    const url = process.env.ICLOUD_CALENDAR_URL.trim();
    return url.endsWith("/") ? url : `${url}/`;
  }
  if (cachedCalendarUrl) return cachedCalendarUrl;

  const principalUrl = await discoverPrincipalUrl();

  const homeXml = await propfind(
    principalUrl,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop><cs:calendar-home-set /></d:prop>
</d:propfind>`
  );

  const homeHref = extractHrefAfterTag(homeXml, "calendar-home-set");
  if (!homeHref) {
    throw new Error("No se encontró la carpeta de calendarios en iCloud");
  }

  const homeUrl = resolveHref(principalUrl, homeHref);
  const listXml = await propfind(
    homeUrl,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:displayname />
    <d:resourcetype />
  </d:prop>
</d:propfind>`,
    "1"
  );

  const calendars = parseCalendars(listXml);
  if (!calendars.length) {
    throw new Error(
      "No hay calendarios escribibles — prueba añadir ICLOUD_CALENDAR_URL en Vercel"
    );
  }

  cachedCalendarUrl = resolveHref(homeUrl, calendars[0].href);
  if (!cachedCalendarUrl.endsWith("/")) cachedCalendarUrl += "/";
  return cachedCalendarUrl;
}

function parseDateTime(dateStr, timeStr) {
  const dm = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  const tm = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!dm || !tm) return null;
  const day = Number(dm[1]);
  const month = Number(dm[2]);
  const year = Number(dm[3]);
  const hour = Number(tm[1]);
  const min = Number(tm[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || min > 59) {
    return null;
  }
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(min)}00`;
  const endHour = hour + 1;
  const end =
    endHour > 23
      ? `${year}${pad(month)}${pad(day)}T235900`
      : `${year}${pad(month)}${pad(day)}T${pad(endHour)}${pad(min)}00`;
  return { start, end };
}

function icsEscape(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/** Hora local flotante (sin TZID) — iCloud la interpreta en tu zona. */
function buildIcs(booking, parsed) {
  const uid = `${randomUUID()}@dvgstudio.com`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z?$/, "Z");
  const description = [
    `Cliente: ${booking.name}`,
    `Email: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    "Reserva 1h — chat web DVG Studio",
  ].join("\\n");

  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DVG Studio//Booking//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${parsed.start}`,
    `DTEND:${parsed.end}`,
    `SUMMARY:${icsEscape(`DVG Studio — ${booking.name}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return { uid, body };
}

async function putEvent(calendarUrl, filename, body) {
  const eventUrl = `${calendarUrl}${filename}`;
  const res = await fetch(eventUrl, {
    method: "PUT",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "text/calendar; charset=utf-8",
      "If-None-Match": "*",
    },
    body,
  });
  return { status: res.status, ok: res.status === 201 || res.status === 204 || res.ok, text: await res.text().catch(() => "") };
}

export async function createBookingEvent(booking) {
  try {
    const parsed = parseDateTime(booking.date, booking.time);
    if (!parsed) return { ok: false, error: "Fecha u hora no válida" };

    const calendarUrl = await getCalendarUrl();
    const { uid, body } = buildIcs(booking, parsed);
    const filename = `dvg-${uid.replace(/[^a-zA-Z0-9-]/g, "")}.ics`;

    const put = await putEvent(calendarUrl, filename, body);
    if (!put.ok) {
      return {
        ok: false,
        error: `iCloud PUT ${put.status}: ${put.text.slice(0, 200) || "sin detalle"}`,
      };
    }

    const calendarEmail =
      process.env.ICLOUD_CALENDAR_EMAIL || process.env.BOOKING_CALENDAR_EMAIL;

    return {
      ok: true,
      provider: "icloud",
      eventId: uid,
      htmlLink: null,
      calendarLabel: `Calendario Apple (${calendarEmail})`,
      calendarUrl,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Error iCloud" };
  }
}

/** Para scripts de diagnóstico. */
export async function diagnoseIcloud() {
  const steps = [];
  try {
    const { email } = credentials();
    steps.push({ step: "credenciales", ok: true, detail: email });

    const principalUrl = await discoverPrincipalUrl();
    steps.push({ step: "principal", ok: true, detail: principalUrl });

    const homeXml = await propfind(
      principalUrl,
      `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop><cs:calendar-home-set /></d:prop>
</d:propfind>`
    );
    const homeHref = extractHrefAfterTag(homeXml, "calendar-home-set");
    const homeUrl = resolveHref(principalUrl, homeHref);
    steps.push({ step: "calendar-home", ok: !!homeHref, detail: homeUrl });

    const listXml = await propfind(
      homeUrl,
      `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop><d:displayname /><d:resourcetype /></d:prop>
</d:propfind>`,
      "1"
    );
    const calendars = parseCalendars(listXml);
    steps.push({
      step: "calendarios",
      ok: calendars.length > 0,
      detail: calendars.map((c) => `${c.name || "(sin nombre)"} → ${c.href}`).join(" | "),
    });

    const calendarUrl = await getCalendarUrl();
    steps.push({ step: "calendario_elegido", ok: true, detail: calendarUrl });

    return { ok: true, steps };
  } catch (err) {
    steps.push({ step: "error", ok: false, detail: err.message });
    return { ok: false, steps };
  }
}
