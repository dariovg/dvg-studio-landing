import { slotToRange, slotDurationMinutes } from "./booking-utils.js";
import { CONTACT_EMAIL, SITE_URL, logoUrl } from "./site-config.js";
import {
  howWeWorkInfographicHtml,
  howWeWorkInfographicText,
  surveyBlockHtml,
  surveyBlockText,
  emailFooterHtml,
} from "./email-infographic.js";

export function meetUrl(override) {
  const fromBooking = (override || "").trim();
  if (fromBooking) return fromBooking;
  return (process.env.BOOKING_MEET_URL || "").trim();
}

export function fromEmail() {
  return process.env.BOOKING_FROM_EMAIL || CONTACT_EMAIL;
}

export function googleCalendarAddUrl(booking, meetOverride) {
  const range = slotToRange(booking.date, booking.time);
  if (!range) return null;

  const p = range.parsed;
  const pad = (n) => String(n).padStart(2, "0");
  const start = `${p.ymd}T${pad(p.hour)}${pad(p.min)}00`;

  const endTotal = p.hour * 60 + p.min + slotDurationMinutes();
  const endH = Math.floor(endTotal / 60) % 24;
  const endM = endTotal % 60;
  const end = `${p.ymd}T${pad(endH)}${pad(endM)}00`;

  const meet = meetUrl(meetOverride);
  const tz = process.env.BOOKING_TIMEZONE || "Europe/Madrid";
  const details = [
    "Reunión de 1h con DVG Studio.",
    meet ? `Google Meet: ${meet}` : "",
    "Gracias por confiar en nosotros.",
    SITE_URL,
  ]
    .filter(Boolean)
    .join("\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: "DVG Studio — reunión",
    dates: `${start}/${end}`,
    ctz: tz,
    details,
  });
  if (meet) params.set("location", meet);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildCustomerConfirmationEmail(booking, meetOverride) {
  const meet = meetUrl(meetOverride);
  const gcal = googleCalendarAddUrl(booking, meetOverride);
  const logo = logoUrl();
  const name = booking.name.split(" ")[0] || booking.name;

  const text = [
    `Hola ${name},`,
    "",
    "Gracias por confiar en DVG Studio.",
    "",
    `Tu reunión está confirmada:`,
    `📅 ${booking.date} a las ${booking.time} (hora España, 1h)`,
    meet ? `🔗 Google Meet: ${meet}` : "",
    gcal ? `📆 Añadir a Google Calendar: ${gcal}` : "",
    "",
    howWeWorkInfographicText(),
    surveyBlockText({ beforeMeeting: true }),
    "",
    "hacIA lo imparable",
    CONTACT_EMAIL,
    SITE_URL,
  ]
    .filter(Boolean)
    .join("\n");

  const meetBtn = meet
    ? `<a href="${meet}" style="display:inline-block;background:#004E89;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;margin:8px 6px 8px 0;">Unirse a Google Meet</a>`
    : "";

  const gcalBtn = gcal
    ? `<a href="${gcal}" style="display:inline-block;background:#FF6B35;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600;margin:8px 6px 8px 0;">Añadir a Google Calendar</a>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F5F7FA;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,14,39,.08);">
        <tr><td style="padding:28px 28px 12px;text-align:center;background:linear-gradient(180deg,#0A0E27 0%,#121830 100%);">
          <img src="${logo}" width="220" alt="DVG Studio" style="max-width:220px;height:auto;display:block;margin:0 auto 10px;">
          <p style="margin:0;color:#F7931E;font-size:14px;font-weight:700;letter-spacing:.04em;">hac<span style="color:#FF6B35;">IA</span> lo imparable</p>
        </td></tr>
        <tr><td style="padding:28px;color:#1a2332;font-size:15px;line-height:1.6;">
          <p style="margin:0 0 16px;">Hola <strong>${name}</strong>,</p>
          <p style="margin:0 0 16px;">Gracias por confiar en nosotros. Tu reunión con DVG Studio está confirmada.</p>
          <div style="background:#F5F7FA;border-radius:12px;padding:16px 18px;margin:0 0 20px;border-left:4px solid #FF6B35;">
            <p style="margin:0 0 6px;font-weight:700;color:#0A0E27;">Detalles</p>
            <p style="margin:0;">📅 <strong>${booking.date}</strong> a las <strong>${booking.time}</strong> (España)</p>
            <p style="margin:6px 0 0;">⏱ Duración: 1 hora</p>
            ${meet ? `<p style="margin:8px 0 0;word-break:break-all;">🔗 Meet: <a href="${meet}" style="color:#004E89;">${meet}</a></p>` : ""}
          </div>
          <p style="margin:0 0 8px;">Te esperamos online. Si necesitas cambiar la cita, responde a este correo.</p>
          <div style="margin-top:8px;">${meetBtn}${gcalBtn}</div>
          ${howWeWorkInfographicHtml()}
          ${surveyBlockHtml({ beforeMeeting: true })}
        </td></tr>
        <tr><td style="padding:16px 28px 24px;text-align:center;color:#6C757D;font-size:12px;border-top:1px solid #eee;">
          ${emailFooterHtml()}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return {
    subject: `Tu reunión con DVG Studio — ${booking.date} ${booking.time}`,
    html,
    text,
  };
}
