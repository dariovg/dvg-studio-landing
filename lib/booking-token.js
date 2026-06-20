import { createHmac, timingSafeEqual } from "crypto";

function signingSecret() {
  return (
    process.env.BOOKING_TOKEN_SECRET ||
    process.env.CHAT_SITE_KEY ||
    process.env.CRM_INGEST_SECRET ||
    ""
  );
}

function sign(body) {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url");
}

/** Token firmado con datos de la cita — el cliente lo guarda en localStorage. */
export function createBookingToken(payload) {
  const secret = signingSecret();
  if (!secret) return null;

  const data = {
    email: String(payload.email || "").trim().toLowerCase(),
    phone: String(payload.phone || "").replace(/\s/g, "").trim(),
    name: String(payload.name || "").trim(),
    date: String(payload.date || "").trim(),
    time: String(payload.time || "").trim(),
    notes: String(payload.notes || "").trim(),
    meetUrl: payload.meetUrl || null,
    googleEventId: payload.googleEventId || null,
    icloudEventId: payload.icloudEventId || null,
    icloudCalendarUrl: payload.icloudCalendarUrl || null,
    iat: Date.now(),
    exp: Date.now() + 90 * 24 * 60 * 60 * 1000,
  };

  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifyBookingToken(token, { email, phone } = {}) {
  const secret = signingSecret();
  if (!secret || !token || typeof token !== "string") {
    return { ok: false, error: "Token no válido" };
  }

  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, error: "Token mal formado" };

  const [body, sig] = parts;
  const expected = sign(body);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, error: "Token no válido" };
    }
  } catch {
    return { ok: false, error: "Token no válido" };
  }

  let data;
  try {
    data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return { ok: false, error: "Token corrupto" };
  }

  if (!data.email || !data.date || !data.time) {
    return { ok: false, error: "Token incompleto" };
  }
  if (data.exp && Date.now() > data.exp) {
    return { ok: false, error: "Esta reserva ya no se puede gestionar desde el chat (caducó el enlace)." };
  }

  const reqEmail = String(email || "").trim().toLowerCase();
  const reqPhone = String(phone || "").replace(/\s/g, "").trim();
  const tokenEmail = String(data.email || "").trim().toLowerCase();
  const tokenPhone = String(data.phone || "").replace(/\s/g, "").trim();

  if (reqEmail && reqEmail !== tokenEmail) {
    return { ok: false, error: "El email no coincide con esta reserva." };
  }
  if (reqPhone && tokenPhone && reqPhone !== tokenPhone) {
    return { ok: false, error: "El teléfono no coincide con esta reserva." };
  }
  if (!reqEmail && !reqPhone) {
    return { ok: false, error: "Confirma tu email o teléfono para gestionar la cita." };
  }

  return { ok: true, booking: data };
}
