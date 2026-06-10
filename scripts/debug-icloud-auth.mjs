#!/usr/bin/env node
/**
 * Diagnóstico detallado de auth iCloud CalDAV.
 * Uso: ICLOUD_CALENDAR_EMAIL=... ICLOUD_APP_PASSWORD=... node scripts/debug-icloud-auth.mjs
 */
const email = (process.env.ICLOUD_CALENDAR_EMAIL || "").trim().toLowerCase();
const rawPass = (process.env.ICLOUD_APP_PASSWORD || "").trim();

if (!email || !rawPass) {
  console.error("\nFaltan ICLOUD_CALENDAR_EMAIL e ICLOUD_APP_PASSWORD\n");
  process.exit(1);
}

const variants = [
  { label: "contraseña tal cual (sin espacios extra)", pass: rawPass.replace(/\s+/g, "") },
  { label: "contraseña sin guiones", pass: rawPass.replace(/[\s-]/g, "") },
];

async function testAuth(label, password) {
  const auth = "Basic " + Buffer.from(`${email}:${password}`, "utf8").toString("base64");
  const res = await fetch("https://caldav.icloud.com/", {
    method: "PROPFIND",
    headers: {
      Authorization: auth,
      Depth: "0",
      "Content-Type": "application/xml; charset=utf-8",
    },
    body: `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal /></d:prop></d:propfind>`,
  });
  return { status: res.status, ok: res.status === 207 };
}

console.log("\n── Diagnóstico iCloud ──\n");
console.log("Email:", email);
console.log("Longitud contraseña (tal cual):", rawPass.replace(/\s+/g, "").length, "caracteres\n");

let anyOk = false;
for (const v of variants) {
  try {
    const r = await testAuth(v.label, v.pass);
    const icon = r.ok ? "✅" : "❌";
    console.log(`${icon} ${v.label} → HTTP ${r.status}`);
    if (r.ok) anyOk = true;
  } catch (e) {
    console.log(`❌ ${v.label} → error: ${e.message}`);
  }
}

console.log(`
── Si todo es ❌ 401, revisa en tu iPhone/Mac ──

1. Ajustes → tu nombre → iCloud → Calendario: ACTIVADO
2. appleid.apple.com → el email de arriba debe ser TU Apple ID exacto
   (si ves un @icloud.com como principal, usa ESE en vez de Gmail)
3. Si cambiaste la contraseña de Apple hoy, las contraseñas de app
   se revocan solas → genera una NUEVA
4. Prueba manual en Mac:
   Ajustes → Internet → Cuentas → Añadir cuenta → Otra cuenta CalDAV
   Servidor: caldav.icloud.com
   Usuario: ${email}
   Contraseña: (contraseña de app)
   Si aquí también falla, el problema NO es Vercel ni el código.

── Alternativa si iCloud no coopera ──

Tu correo es Gmail (${email.includes("@gmail") ? "sí" : "no"}).
Puedes usar Google Calendar (misma cuenta) y ver las citas en la app
Calendario del iPhone añadiendo la cuenta Google.
`);

process.exit(anyOk ? 0 : 1);
