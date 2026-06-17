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
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
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
    'Content-Type: multipart/alternative; boundary="alt"',
    "",
    "--alt",
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    "--alt",
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 8bit",
    "",
    html || text,
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

function buildIcsPack(booking, meetOverride) {
  return buildBookingIcs(booking, {
    meetUrl: meetUrl(meetOverride),
    organizerEmail: fromEmail(),
  });
}

/** Aviso interno a info@ — incluye .ics para añadir al calendario */
export async function notifyBookingByEmail(booking, calendarResult = null) {
  const notifyTo = process.env.BOOKING_NOTIFY_EMAIL || CONTACT_EMAIL;
  if (!sesReady()) return { ok: false, reason: "sin_aws" };
  if (!fromEmail()) return { ok: false, reason: "sin_remitente" };

  const bookingMeet = calendarResult?.meetUrl;
  const calendarLabel =
    calendarResult?.calendarLabel ||
    process.env.ICLOUD_CALENDAR_EMAIL ||
    "Calendario";

  const meet = meetUrl(bookingMeet);
  const calendarBlock = calendarResult?.ok
    ? ["", "✅ Cita creada en calendario", `Calendario: ${calendarLabel}`]
    : [
        "",
        "⚠️ Cita NO creada en calendario automático",
        calendarResult?.error ? `Motivo: ${calendarResult.error}` : "",
        "Adjuntamos .ics para que la añadas manualmente.",
      ];

  const text = [
    "Nueva cita (1h) — chat web DVG Studio",
    "",
    `Nombre: ${booking.name}`,
    `Email cliente: ${booking.email}`,
    `Teléfono: ${booking.phone || "—"}`,
    `Fecha: ${booking.date}`,
    `Hora: ${booking.time}`,
    booking.notes ? `Notas: ${booking.notes}` : "",
    meet ? `Google Meet: ${meet}` : "",
    ...calendarBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const subject = `[DVG] Nueva cita — ${booking.name} — ${booking.date} ${booking.time}`;
  const ics = buildIcsPack(booking, bookingMeet);

  try {
    if (ics) {
      await sendEmailWithIcs({
        to: notifyTo,
        subject,
        text,
        html: null,
        icsFilename: ics.filename,
        icsBody: ics.body,
      });
    } else {
      await sendSimpleEmail({ to: notifyTo, subject, text });
    }
    return { ok: true };
  } catch (err) {
    console.error("SES notify:", err.message);
    return { ok: false, reason: err.message || "ses_error" };
  }
}

/** Confirmación al cliente con logo, Meet y .ics */
export async function sendCustomerConfirmationEmail(booking, meetOverride) {
  if (!sesReady()) return { ok: false, reason: "sin_aws" };
  if (!booking.email) return { ok: false, reason: "sin_email_cliente" };
  if (!fromEmail()) return { ok: false, reason: "sin_remitente" };

  const { subject, html, text } = buildCustomerConfirmationEmail(booking, meetOverride);
  const ics = buildIcsPack(booking, meetOverride);

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

/** Aviso empresa + confirmación cliente (siempre intenta ambos) */
export async function sendBookingEmails(booking, calendarResult = null) {
  const bookingMeet = calendarResult?.meetUrl;
  const internal = await notifyBookingByEmail(booking, calendarResult);
  const customer = await sendCustomerConfirmationEmail(booking, bookingMeet);

  if (!internal.ok) console.error("Internal email:", internal.reason);
  if (!customer.ok) console.error("Customer email:", customer.reason);

  return { internal, customer };
}
