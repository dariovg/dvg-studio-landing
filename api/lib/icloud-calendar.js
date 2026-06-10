import { randomUUID } from "crypto";

const CALDAV_HOST = "https://caldav.icloud.com";

function credentials() {
  const email = (
    process.env.ICLOUD_CALENDAR_EMAIL || process.env.BOOKING_CALENDAR_EMAIL || ""
  ).trim();
  const password = (process.env.ICLOUD_APP_PASSWORD || "").replace(/\s+/g, "");
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
  const clean = href.replace(/&amp;/g, "&");
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("/")) return `${new URL(base).origin}${clean}`;
  return new URL(clean, base.endsWith("/") ? base : `${base}/`).href;
}

async function propfind(url, body, depth = "0") {
  const res = await fetch(url, {
    method: "PROPFIND",
    headers: {
      Authorization: authHeader(),
      Depth: depth,
      "Content-Type": "application/xml; charset=utf-8",
    },
    body,
  });
  const text = await res.text();
  // CalDAV usa 207 Multi-Status; 401/403 = credenciales mal
  if (res.status === 401 || res.status === 403) {
    throw new Error(`iCloud auth ${res.status} — revisa email y contraseña de app`);
  }
  if (res.status !== 207 && !res.ok) {
    throw new Error(`CalDAV PROPFIND ${res.status}`);
  }
  return text;
}

/** iCloud a veces devuelve tags sin prefijo (DAV por defecto). */
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
    if (!href.includes("/calendars/") || href.endsWith("/calendars/")) continue;
    const nameM = block.match(
      /<(?:[\w]+:)?displayname[^>]*>([^<]*)<\/(?:[\w]+:)?displayname>/i
    );
    const isCalendar =
      /<(?:[\w]+:)?calendar[\s/>]/i.test(block) ||
      /calendar\/?>/i.test(block);
    if (!isCalendar && !/\/home\/?$/i.test(href)) continue;
    calendars.push({ href, name: nameM ? nameM[1] : "" });
  }
  return calendars;
}

let cachedCalendarUrl = null;

async function getCalendarUrl() {
  if (process.env.ICLOUD_CALENDAR_URL) {
    const url = process.env.ICLOUD_CALENDAR_URL.trim();
    return url.endsWith("/") ? url : `${url}/`;
  }
  if (cachedCalendarUrl) return cachedCalendarUrl;

  const principalXml = await propfind(
    `${CALDAV_HOST}/`,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop><d:current-user-principal /></d:prop>
</d:propfind>`
  );

  const principalHref = extractHrefAfterTag(principalXml, "current-user-principal");
  if (!principalHref) {
    throw new Error("No se encontró principal iCloud (revisa ICLOUD_CALENDAR_EMAIL)");
  }

  const principalUrl = resolveHref(`${CALDAV_HOST}/`, principalHref);
  const homeXml = await propfind(
    principalUrl,
    `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop><cs:calendar-home-set /></d:prop>
</d:propfind>`
  );

  const homeHref = extractHrefAfterTag(homeXml, "calendar-home-set");
  if (!homeHref) {
    throw new Error("No se encontró carpeta de calendarios iCloud");
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
  const preferred =
    calendars.find((c) => /home|inicio|personal|calendario/i.test(c.name || "")) ||
    calendars.find((c) => /\/home\/?$/i.test(c.href)) ||
    calendars[0];

  if (!preferred) {
    throw new Error("No hay calendarios visibles en iCloud");
  }

  cachedCalendarUrl = resolveHref(homeUrl, preferred.href);
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

function buildIcs({ name, email, phone, notes }, parsed, tz) {
  const uid = `${randomUUID()}@dvgstudio.com`;
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  const organizer =
    process.env.ICLOUD_CALENDAR_EMAIL || process.env.BOOKING_CALENDAR_EMAIL || "";
  const description = [
    `Cliente: ${name}`,
    `Email: ${email}`,
    `Teléfono: ${phone || "—"}`,
    notes ? `Notas: ${notes}` : "",
    "Reserva 1h desde chat web DVG Studio",
  ].join("\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DVG Studio//Booking//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${tz}:${parsed.start}`,
    `DTEND;TZID=${tz}:${parsed.end}`,
    `SUMMARY:${icsEscape(`DVG Studio — ${name}`)}`,
    `DESCRIPTION:${icsEscape(description)}`,
  ];
  if (organizer) {
    lines.push(`ORGANIZER;CN=DVG Studio:mailto:${organizer}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");

  return { uid, body: lines.join("\r\n") };
}

export async function createBookingEvent(booking) {
  try {
    const parsed = parseDateTime(booking.date, booking.time);
    if (!parsed) return { ok: false, error: "Fecha u hora no válida" };

    const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";
    const calendarUrl = await getCalendarUrl();
    const { uid, body } = buildIcs(booking, parsed, tz);
    const eventUrl = `${calendarUrl}${uid}.ics`;

    const res = await fetch(eventUrl, {
      method: "PUT",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "text/calendar; charset=utf-8",
        "If-None-Match": "*",
      },
      body,
    });

    if (!(res.status === 201 || res.status === 204 || res.ok)) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `iCloud PUT ${res.status}: ${errText.slice(0, 160)}` };
    }

    const calendarEmail =
      process.env.ICLOUD_CALENDAR_EMAIL || process.env.BOOKING_CALENDAR_EMAIL;

    return {
      ok: true,
      provider: "icloud",
      eventId: uid,
      htmlLink: null,
      calendarLabel: `Calendario Apple (${calendarEmail})`,
    };
  } catch (err) {
    return { ok: false, error: err.message || "Error iCloud" };
  }
}
