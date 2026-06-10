import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { CONTACT_EMAIL } from "./site-config.js";

/**
 * BOOKING_NOTIFY_EMAIL      → correo de EMPRESA (avisos de nuevas citas)
 * BOOKING_FROM_EMAIL        → remitente verificado en AWS SES (correo empresa)
 * ICLOUD_CALENDAR_EMAIL     → Apple personal (donde se crean las reservas)
 */
export async function notifyBookingByEmail(booking, calendarResult = null) {
  const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL;

  const from = process.env.BOOKING_FROM_EMAIL || notifyTo;
  const calendarLabel =
    calendarResult?.calendarLabel ||
    process.env.ICLOUD_CALENDAR_EMAIL ||
    process.env.BOOKING_CALENDAR_EMAIL ||
    "Calendario Apple personal";
  const region = process.env.AWS_REGION || "us-east-1";

  if (!process.env.AWS_ACCESS_KEY_ID) {
    return { ok: false, reason: "sin_aws" };
  }

  const calendarBlock = calendarResult?.ok
    ? [
        "",
        "✅ Cita creada en tu calendario personal (Apple/iCloud)",
        `Calendario: ${calendarLabel}`,
        "Ábrelo en la app Calendario de tu Mac o iPhone.",
      ]
    : [
        "",
        "⚠️ Cita NO creada en calendario automático",
        "Revisa ICLOUD_CALENDAR_EMAIL + ICLOUD_APP_PASSWORD en Vercel.",
      ];

  const body = [
    "Nueva cita (1h) — chat web DVG Studio",
    "",
    `Nombre: ${booking.name}`,
    `Email cliente: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    `Fecha: ${booking.date}`,
    `Hora: ${booking.time} (duración 1h)`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    ...calendarBlock,
    "",
    `Aviso enviado a (empresa): ${notifyTo}`,
    `Reserva agendada en (personal): ${calendarLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new SESClient({ region });
    await client.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [notifyTo] },
        Message: {
          Subject: { Data: `[DVG] Nueva cita — ${booking.name} — ${booking.date} ${booking.time}` },
          Body: { Text: { Data: body } },
        },
      })
    );
    return { ok: true };
  } catch (err) {
    console.error("SES:", err.message);
    return { ok: false, reason: err.message || "ses_error" };
  }
}
