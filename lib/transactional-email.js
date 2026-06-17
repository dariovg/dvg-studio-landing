import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { google } from "googleapis";
import { CONTACT_EMAIL } from "./site-config.js";
import { fromEmail } from "./booking-email-template.js";

function sesReady() {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

export function gmailSendConfigured() {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

export function emailConfigured() {
  return sesReady() || gmailSendConfigured();
}

function sesClient() {
  return new SESClient({ region: process.env.AWS_REGION || "us-east-1" });
}

async function sendViaSes({ to, subject, text, html }) {
  const from = fromEmail();
  await sesClient().send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      ReplyToAddresses: [CONTACT_EMAIL],
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
    })
  );
}

function buildGmailRaw({ from, to, subject, text, html }) {
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const displayFrom = `DVG Studio <${from}>`;
  const message = [
    `From: ${displayFrom}`,
    `To: ${to}`,
    `Reply-To: ${CONTACT_EMAIL}`,
    `Subject: ${subjectEncoded}`,
    "MIME-Version: 1.0",
    'Content-Type: multipart/alternative; boundary="dvg_alt"',
    "",
    "--dvg_alt",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: quoted-printable",
    "",
    text,
    "",
    "--dvg_alt",
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: quoted-printable",
    "",
    html,
    "",
    "--dvg_alt--",
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sendViaGmail({ to, subject, text, html }) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  const gmail = google.gmail({ version: "v1", auth });
  const from = fromEmail();

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: buildGmailRaw({ from, to, subject, text, html }),
    },
  });
}

/**
 * Envía email al cliente: primero SES, si falla Gmail (Workspace).
 * Devuelve { ok, channel } o { ok: false, reason }.
 */
export async function sendTransactionalEmail({ to, subject, text, html }) {
  const errors = [];

  if (sesReady()) {
    try {
      await sendViaSes({ to, subject, text, html });
      return { ok: true, channel: "ses" };
    } catch (err) {
      const msg = err?.message || String(err);
      errors.push(`SES: ${msg}`);
      console.error("Transactional SES:", msg);
    }
  }

  if (gmailSendConfigured()) {
    try {
      await sendViaGmail({ to, subject, text, html });
      return { ok: true, channel: "gmail" };
    } catch (err) {
      const msg = err?.message || String(err);
      errors.push(`Gmail: ${msg}`);
      console.error("Transactional Gmail:", msg);
    }
  }

  return {
    ok: false,
    reason: errors.join(" | ") || "sin_proveedor_email",
  };
}

export function emailFailureMessage(reason) {
  const r = String(reason || "");
  if (/insufficient.*scope|invalid_grant|unauthorized|403/i.test(r)) {
    return `El correo automático necesita permiso Gmail en Google OAuth. Mientras tanto, escríbenos a ${CONTACT_EMAIL} y te enviamos la guía.`;
  }
  if (/Email address is not verified|MessageRejected|sandbox/i.test(r)) {
    return `El servidor de email está en modo prueba. Ya tenemos tus datos — te contactamos desde ${CONTACT_EMAIL} en breve.`;
  }
  return `No pude enviarte el correo ahora. Escríbenos a ${CONTACT_EMAIL} y te mandamos la información enseguida.`;
}
