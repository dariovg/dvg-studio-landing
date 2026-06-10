#!/usr/bin/env node
/**
 * Diagnóstico + prueba de cita en iCloud.
 * Uso:
 *   ICLOUD_CALENDAR_EMAIL=tu@icloud.com ICLOUD_APP_PASSWORD=xxxx node scripts/test-icloud.mjs
 */
import { diagnoseIcloud, createBookingEvent, icloudConfigured } from "../api/lib/icloud-calendar.js";

if (!icloudConfigured()) {
  console.error("\n❌ Faltan variables:\n");
  console.error("  ICLOUD_CALENDAR_EMAIL=tu@icloud.com");
  console.error("  ICLOUD_APP_PASSWORD=contraseña-de-app (16 caracteres, sin guiones)\n");
  process.exit(1);
}

console.log("\n── Diagnóstico iCloud ──\n");
const diag = await diagnoseIcloud();
for (const s of diag.steps) {
  console.log(`${s.ok ? "✅" : "❌"} ${s.step}: ${s.detail}`);
}
if (!diag.ok) process.exit(1);

console.log("\n── Creando cita de prueba ──\n");
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const d = String(tomorrow.getDate()).padStart(2, "0");
const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
const y = tomorrow.getFullYear();

const result = await createBookingEvent({
  name: "Prueba DVG",
  email: process.env.ICLOUD_CALENDAR_EMAIL,
  phone: "600000000",
  date: `${d}/${m}/${y}`,
  time: "11:00",
  notes: "Test local",
});

if (result.ok) {
  console.log("✅ Cita creada:", result.calendarLabel);
  console.log("   Calendario:", result.calendarUrl);
  console.log("\nAbre la app Calendario en tu Mac/iPhone y busca mañana a las 11:00.\n");
} else {
  console.error("❌ Error al crear cita:", result.error);
  console.error("\nSi el diagnóstico fue OK pero el PUT falló, copia ICLOUD_CALENDAR_URL en Vercel:");
  console.error("  ICLOUD_CALENDAR_URL=<la URL de calendario_elegido>\n");
  process.exit(1);
}
