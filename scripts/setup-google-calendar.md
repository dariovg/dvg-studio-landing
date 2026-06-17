# Google Calendar — Meet único por cita

Genera un **enlace Google Meet distinto** en cada reserva. Compatible con **iCloud** para disponibilidad y calendario Apple.

## Paso 1 — Google Cloud (cuenta de empresa, p. ej. info@dvgsstudio.com)

1. [console.cloud.google.com](https://console.cloud.google.com) → proyecto nuevo
2. Activar **Google Calendar API**
3. Credenciales → OAuth 2.0 → **Aplicación de escritorio**
4. En tu Mac:
   ```bash
   cd ~/Documents/dvg-studio-landing
   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy node scripts/get-google-refresh-token.mjs
   ```
5. Autoriza con la cuenta Google de la empresa

## Paso 2 — Vercel

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=primary
BOOKING_TIMEZONE=Europe/Madrid
```

### Con iCloud (recomendado)

Mantén también:

```
ICLOUD_CALENDAR_EMAIL=...
ICLOUD_APP_PASSWORD=...
ICLOUD_CALENDAR_NAME=DVG Studio
```

- **iCloud** → comprueba huecos (todos tus calendarios Apple) y crea el evento en iPhone
- **Google** → genera el Meet único de esa cita

No necesitas `BOOKING_MEET_URL` si Google está configurado.

## Paso 3 — Comprobar

Tras redeploy, reserva una cita de prueba. El email al cliente debe llevar un enlace `meet.google.com/xxx-xxxx-xxx` distinto en cada reserva.

`/api/status?key=DIAGNOSTIC_KEY` → `"meetMode": "per_event"`.

## Solo Google (sin iCloud)

Deja vacías las variables `ICLOUD_*`. Las citas se crean solo en Google Calendar con Meet incluido.

## iPhone

Con iCloud activo, las citas aparecen en Calendario (calendario DVG Studio). El Meet va en la descripción y en el email.
