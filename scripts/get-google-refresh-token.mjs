#!/usr/bin/env node
/**
 * Genera GOOGLE_REFRESH_TOKEN para la cuenta Google del CALENDARIO (negocio).
 * Uso: GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-refresh-token.mjs
 */
import { createServer } from "http";
import { google } from "googleapis";
import { exec } from "child_process";

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const port = 3456;

if (!clientId || !clientSecret) {
  console.error("Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET");
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(
  clientId,
  clientSecret,
  `http://localhost:${port}/oauth2callback`
);

const url = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar.events"],
});

console.log("\n1. Abre esta URL e inicia sesión con la cuenta GOOGLE DEL NEGOCIO:\n");
console.log(url);
console.log("\n2. Tras autorizar, se abrirá el navegador en localhost...\n");

const server = createServer(async (req, res) => {
  if (!req.url?.startsWith("/oauth2callback")) return;
  const q = new URL(req.url, `http://localhost:${port}`).searchParams;
  const code = q.get("code");
  if (!code) {
    res.end("Sin código");
    return;
  }
  const { tokens } = await oauth2.getToken(code);
  res.end("OK — vuelve a la terminal");
  server.close();
  console.log("\n✅ Añade esto a Vercel:\n");
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("\nGOOGLE_CALENDAR_ID=primary");
  console.log("BOOKING_TIMEZONE=Europe/Madrid\n");
});

server.listen(port, () => {
  exec(`open "${url}"`, () => {});
});
