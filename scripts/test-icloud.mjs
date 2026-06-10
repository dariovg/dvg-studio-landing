#!/usr/bin/env node
/**
 * Prueba conexión iCloud CalDAV en local.
 * Uso:
 *   ICLOUD_CALENDAR_EMAIL=tu@icloud.com ICLOUD_APP_PASSWORD=xxxx node scripts/test-icloud.mjs
 */
import { icloudConfigured, createBookingEvent } from "../api/lib/icloud-calendar.js";

if (!icloudConfigured()) {
  console.error("Faltan ICLOUD_CALENDAR_EMAIL e ICLOUD_APP_PASSWORD");
  process.exit(1);
}

console.log("1. Probando descubrimiento de calendario…");
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const d = String(tomorrow.getDate()).padStart(2, "0");
const m = String(tomorrow.getMonth() + 1).padStart(2, "0");
const y = tomorrow.getFullYear();

const result = await createBookingEvent({
  name: "Prueba script",
  email: process.env.ICLOUD_CALENDAR_EMAIL,
  phone: "600000000",
  date: `${d}/${m}/${y}`,
  time: "11:00",
  notes: "Test local DVG Studio",
});

if (result.ok) {
  console.log("✅ Cita creada en iCloud:", result.calendarLabel);
  console.log("   UID:", result.eventId);
} else {
  console.error("❌ Error:", result.error);
  process.exit(1);
}
