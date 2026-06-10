import {
  SESClient,
  SendEmailCommand,
  SendRawEmailCommand,
} from "@aws-sdk/client-ses";
import { CONTACT_EMAIL } from "./site-config.js";
import { buildBookingIcs } from "./booking-ics.js";
import {
  buildCustomerConfirmationEmail,
  fromEmail,
  meetUrl,
} from "./booking-email-template.js";

function sesClient() {
  const region = process.env.AWS_REGION || "us-east-1";
  return new SESClient({ region });
}

function sesReady() {
  return !!process.env.AWS_ACCESS_KEY_ID;
}

async function sendSimpleEmail({ to, subject, text, html }) {
  const from = fromEmail();
  const client = sesClient();
  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
        },
      },
    })
  );
}

async function sendEmailWithIcs({ to, subject, text, html, icsFilename, icsBody }) {
  const from = fromEmail();
  const boundary = `dvg-${Date.now()}`;
  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: multipart/alternative; boundary=\"alt\"",
    "",
    "--alt",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    text,
    "",
    "--alt",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: quoted-printable",
    "",
    html,
    "",
    "--alt--",
    "",
    `--${boundary}`,
    "Content-Type: text/calendar; charset=UTF-8; method=PUBLISH",
    "Content-Transfer-Encoding: 7bit",
    `Content-Disposition: attachment; filename="${icsFilename}"`,
    "",
    icsBody,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  await sesClient().send(
    new SendRawEmailCommand({
      Source: from,
      Destinations: [to],
      RawMessage: { Data: Buffer.from(raw) },
    })
  );
}

/** Aviso interno a info@ */
export async function notifyBookingByEmail(booking, calendarResult = null) {
  const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL;
  if (!sesReady()) return { ok: false, reason: "sin_aws" };

  const calendarLabel =
    calendarResult?.calendarLabel ||
    process.env.ICLOUD_CALENDAR_EMAIL ||
    "Calendario Apple personal";

  const calendarBlock = calendarResult?.ok
    ? [
        "",
        "✅ Cita creada en calendario",
        `Calendario: ${calendarLabel}`,
      ]
    : ["", "⚠️ Cita NO creada en calendario automático"];

  const text = [
    "Nueva cita (1h) — chat web DVG Studio",
    "",
    `Nombre: ${booking.name}`,
    `Email cliente: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    `Fecha: ${booking.date}`,
    `Hora: ${booking.time}`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    ...calendarBlock,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendSimpleEmail({
      to: notifyTo,
      subject: `[DVG] Nueva cita — ${booking.name} — ${booking.date} ${booking.time}`,
      text,
    });
    return { ok: true };
  } catch (err) {
    console.error("SES notify:", err.message);
    return { ok: false, reason: err.message || "ses_error" };
  }
}

/** Confirmación al cliente con logo, Meet y Google Calendar */
export async function sendCustomerConfirmationEmail(booking) {
  if (!sesReady()) return { ok: false, reason: "sin_aws" };
  if (!booking.email) return { ok: false, reason: "sin_email_cliente" };

  const { subject, html, text } = buildCustomerConfirmationEmail(booking);
  const ics = buildBookingIcs(booking, { meetUrl: meetUrl() });

  try {
    if (ics) {
      await sendEmailWithIcs({
        to: booking.email,
        subject,
        text,
        html,
        icsFilename: ics.filename,
        icsBody: ics.body,
      });
    } else {
      await sendSimpleEmail({ to: booking.email, subject, text, html });
    }
    return { ok: true };
  } catch (err) {
    console.error("SES customer:", err.message);
    return { ok: false, reason: err.message || "ses_error" };
  }
}

/** Aviso empresa + confirmación cliente */
export async function sendBookingEmails(booking, calendarResult = null) {
  const internal = await notifyBookingByEmail(booking, calendarResult);
  let customer = { ok: false, reason: "omitido" };

  if (calendarResult?.ok) {
    customer = await sendCustomerConfirmationEmail(booking);
    if (!customer.ok) console.error("Customer email:", customer.reason);
  }

  return { internal, customer };
}
