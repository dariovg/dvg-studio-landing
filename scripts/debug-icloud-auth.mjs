#!/usr/bin/env node
import { diagnoseIcloud, icloudConfigured } from "../lib/icloud-calendar.js";

if (!icloudConfigured()) {
  console.error("\n❌ Faltan ICLOUD_CALENDAR_EMAIL e ICLOUD_APP_PASSWORD\n");
  process.exit(1);
}

console.log("\n── Diagnóstico iCloud (prueba varios emails) ──\n");
const diag = await diagnoseIcloud();
for (const s of diag.steps) {
  console.log(`${s.ok ? "✅" : "❌"} ${s.step}: ${s.detail}`);
}

if (diag.ok) {
  console.log(`\n✅ Usa en Vercel: ICLOUD_CALENDAR_EMAIL=${diag.workingEmail}\n`);
  process.exit(0);
}

console.log(`
── Si todo falla con 401 ──

1. iPhone → tu nombre → iCloud → CALENDARIO activado
2. appleid.apple.com → Email y teléfonos → busca un @icloud.com o @me.com
   Si lo encuentras, en Vercel añade:
   ICLOUD_ALT_EMAILS=tu@icloud.com
3. Genera contraseña de app NUEVA (revoca la antigua)
4. Mac → Ajustes → Internet → Cuentas → CalDAV manual:
   Servidor caldav.icloud.com — si falla aquí, Apple bloquea la cuenta
`);
process.exit(1);
