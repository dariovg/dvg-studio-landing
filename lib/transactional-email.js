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

function isSesSandboxError(message) {
  return /Email address is not verified|MessageRejected|sandbox|not verified/i.test(
    String(message || "")
  );
}

function isGmailScopeError(message) {
  return /insufficient.*scope|invalid_grant|unauthorized|403|Request had insufficient authentication scopes/i.test(
    String(message || "")
  );
}

function encodeMimePart(content, contentType) {
  const body = Buffer.from(String(content || ""), "utf8").toString("base64");
  return [
    `Content-Type: ${contentType}`,
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
}

function buildGmailRaw({ from, to, subject, text, html }) {
  const subjectEncoded = `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
  const displayFrom = `DVG Studio <${from}>`;
  const boundary = `dvg_alt_${Date.now()}`;

  const altParts = [encodeMimePart(text, 'text/plain; charset="UTF-8"')];
  if (html) {
    altParts.push(encodeMimePart(html, 'text/html; charset="UTF-8"'));
  }

  const message = [
    `From: ${displayFrom}`,
    `To: ${to}`,
    `Reply-To: ${CONTACT_EMAIL}`,
    `Subject: ${subjectEncoded}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    ...altParts.flatMap((part) => [`--${boundary}`, part]),
    "",
    `--${boundary}--`,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
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
          ...(html ? { Html: { Data: html, Charset: "UTF-8" } } : {}),
        },
      },
    })
  );
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

async function tryChannel(channel, fn) {
  try {
    await fn();
    return { ok: true, channel };
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(`Transactional ${channel}:`, msg);
    return { ok: false, channel, reason: `${channel}: ${msg}` };
  }
}

/**
 * Envía email al cliente.
 * preferGmail: útil para leads (SES suele estar en sandbox; Gmail Workspace envía a cualquier destino).
 * Devuelve { ok, channel } o { ok: false, reason, needsGmailScope?, sesSandbox? }.
 */
export async function sendTransactionalEmail({
  to,
  subject,
  text,
  html,
  preferGmail = false,
}) {
  const errors = [];
  const order = preferGmail ? ["gmail", "ses"] : ["ses", "gmail"];

  for (const channel of order) {
    if (channel === "ses" && sesReady()) {
      const result = await tryChannel("ses", () => sendViaSes({ to, subject, text, html }));
      if (result.ok) return result;
      errors.push(result.reason);
      continue;
    }
    if (channel === "gmail" && gmailSendConfigured()) {
      const result = await tryChannel("gmail", () => sendViaGmail({ to, subject, text, html }));
      if (result.ok) return result;
      errors.push(result.reason);
    }
  }

  const reason = errors.join(" | ") || "sin_proveedor_email";
  return {
    ok: false,
    reason,
    needsGmailScope: errors.some(isGmailScopeError),
    sesSandbox: errors.some(isSesSandboxError),
  };
}

/** Envío a clientes externos: Gmail primero + reintento solo texto si el HTML falla. */
export async function sendCustomerEmail({ to, subject, text, html }) {
  const attempts = [
    { preferGmail: true, html },
    { preferGmail: true, html: null },
    { preferGmail: false, html: null },
  ];

  const errors = [];
  for (const attempt of attempts) {
    const result = await sendTransactionalEmail({
      to,
      subject,
      text,
      html: attempt.html,
      preferGmail: attempt.preferGmail,
    });
    if (result.ok) return result;
    errors.push(result.reason);
    if (result.needsGmailScope) break;
  }

  const reason = errors.join(" | ") || "sin_proveedor_email";
  return {
    ok: false,
    reason,
    needsGmailScope: errors.some(isGmailScopeError),
    sesSandbox: errors.some(isSesSandboxError),
  };
}

export function emailFailureMessage(reason, meta = {}) {
  const r = String(reason || "");
  const needsGmailScope = meta.needsGmailScope || isGmailScopeError(r);
  const sesSandbox = meta.sesSandbox || isSesSandboxError(r);

  if (needsGmailScope) {
    return `El correo automático necesita permiso Gmail (gmail.send) en Google OAuth. Mientras tanto, escríbenos a ${CONTACT_EMAIL} y te enviamos la guía.`;
  }
  if (sesSandbox) {
    return `El servidor de email está en modo prueba (AWS SES). Ya tenemos tus datos — te contactamos desde ${CONTACT_EMAIL} en breve.`;
  }
  return `No pude enviarte el correo ahora. Escríbenos a ${CONTACT_EMAIL} y te mandamos la información enseguida.`;
}
