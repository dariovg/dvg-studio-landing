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
import { sendCustomerEmail, emailConfigured } from "./transactional-email.js";

function sesClient() {
  const region = process.env.AWS_REGION || "us-east-1";
  return new SESClient({ region });
}

function sesReady() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

function sesErrorHint(err) {
  const msg = String(err?.message || err || "");
  if (/Email address is not verified|MessageRejected|not verified/i.test(msg)) {
    return "ses_sandbox";
  }
  if (/AccessDenied|is not authorized|SendRawEmail/i.test(msg)) {
    return "ses_permissions";
  }
  return "ses_error";
}

function encodeMimePart(content, charset = "UTF-8") {
  const buf = Buffer.from(String(content || ""), "utf8");
  return {
    body: buf.toString("base64"),
    encoding: "base64",
    charset,
  };
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
  const altBoundary = "alt";
  const textPart = encodeMimePart(text);
  const htmlSource = html || text;
  const htmlPart = encodeMimePart(htmlSource);
  const icsPart = encodeMimePart(icsBody);

  const raw = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    `Content-Type: text/plain; charset=${textPart.charset}`,
    `Content-Transfer-Encoding: ${textPart.encoding}`,
    "",
    textPart.body,
    "",
    `--${altBoundary}`,
    `Content-Type: text/html; charset=${htmlPart.charset}`,
    `Content-Transfer-Encoding: ${htmlPart.encoding}`,
    "",
    htmlPart.body,
    "",
    `--${altBoundary}--`,
    "",
    `--${boundary}`,
    "Content-Type: text/calendar; charset=UTF-8; method=PUBLISH",
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${icsFilename}"`,
    "",
    icsPart.body,
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
  if (!booking.email) return { ok: false, reason: "sin_email_cliente" };
  if (!fromEmail() && !emailConfigured()) {
    return { ok: false, reason: "sin_remitente" };
  }

  const { subject, html, text } = buildCustomerConfirmationEmail(booking, meetOverride);
  const ics = buildIcsPack(booking, meetOverride);

  if (sesReady()) {
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
      return { ok: true, channel: "ses" };
    } catch (err) {
      console.error("SES customer (with ics):", err.message);
      try {
        await sendSimpleEmail({ to: booking.email, subject, text, html });
        return { ok: true, fallback: "ses_simple", channel: "ses" };
      } catch (fallbackErr) {
        console.error("SES customer (fallback):", fallbackErr.message);
      }
    }
  }

  const tx = await sendCustomerEmail({
    to: booking.email,
    subject,
    text,
    html,
  });
  if (tx.ok) return { ok: true, channel: tx.channel };
  return { ok: false, reason: sesErrorHint({ message: tx.reason }), detail: tx.reason };
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
