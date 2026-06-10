#!/usr/bin/env node
import { diagnoseIcloud, createBookingEvent, icloudConfigured } from "../api/lib/icloud-calendar.js";

if (!icloudConfigured()) {
  console.error("\n❌ Faltan ICLOUD_CALENDAR_EMAIL e ICLOUD_APP_PASSWORD\n");
  process.exit(1);
}

console.log("\n── Diagnóstico ──\n");
const diag = await diagnoseIcloud();
for (const s of diag.steps) {
  console.log(`${s.ok ? "✅" : "❌"} ${s.step}: ${s.detail}`);
}
if (!diag.ok) process.exit(1);

if (diag.workingEmail) {
  console.log(`\n→ Email que funciona: ${diag.workingEmail}\n`);
}

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
  notes: "Test",
});

if (result.ok) {
  console.log("✅ Cita creada:", result.calendarLabel);
} else {
  console.error("❌", result.error);
  process.exit(1);
}
