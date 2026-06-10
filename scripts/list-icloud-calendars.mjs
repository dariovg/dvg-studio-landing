#!/usr/bin/env node
import { listIcloudCalendars, icloudConfigured } from "../lib/icloud-calendar.js";

if (!icloudConfigured()) {
  console.error("\n❌ Faltan ICLOUD_CALENDAR_EMAIL e ICLOUD_APP_PASSWORD\n");
  process.exit(1);
}

const { username, selected, calendars } = await listIcloudCalendars();
console.log("\nCuenta:", username);
console.log("Calendario seleccionado:", selected);
console.log("\nCalendarios disponibles:\n");
for (const c of calendars) {
  const mark = c.name === selected ? " ← usa este" : "";
  console.log(`  • ${c.name}${mark}`);
  console.log(`    ${c.url}\n`);
}
console.log("En Vercel puedes fijar uno con:");
console.log('  ICLOUD_CALENDAR_NAME=DVG Studio');
console.log("  o ICLOUD_CALENDAR_URL=<url del calendario>\n");
