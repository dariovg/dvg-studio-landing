import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

export async function notifyBookingByEmail(booking) {
  const to = process.env.BOOKING_NOTIFY_EMAIL || "contact@dvgstudio.com";
  const from = process.env.BOOKING_FROM_EMAIL || to;
  const region = process.env.AWS_REGION || "us-east-1";

  if (!process.env.AWS_ACCESS_KEY_ID) {
    return { ok: false, reason: "sin_aws" };
  }

  const body = [
    "Nueva solicitud de cita (1h) desde el chat web",
    "",
    `Nombre: ${booking.name}`,
    `Email: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    `Fecha: ${booking.date}`,
    `Hora: ${booking.time}`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    "",
    "Añádela manualmente a tu calendario si Google Calendar no está configurado.",
  ].join("\n");

  const client = new SESClient({ region });
  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: `[DVG] Cita solicitada — ${booking.name}` },
        Body: { Text: { Data: body } },
      },
    })
  );
  return { ok: true };
}
