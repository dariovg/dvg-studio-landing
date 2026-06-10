# Alternativa: Google Calendar con tu Gmail

Si iCloud CalDAV da 401, usa **Google Calendar** con `elniu@gmail.com` (o tu Gmail).
Las citas aparecen en la app **Calendario** del iPhone si añades la cuenta Google.

## Paso 1 — Google Cloud (cuenta elniu@gmail.com)

1. [console.cloud.google.com](https://console.cloud.google.com) → proyecto nuevo
2. Activar **Google Calendar API**
3. Credenciales → OAuth 2.0 → **Aplicación de escritorio**
4. En tu Mac:
   ```bash
   cd ~/Documents/dvg-studio-landing
   GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy \
   /Users/dariovg/Documents/.tools/node-v22.19.0-darwin-arm64/bin/node scripts/get-google-refresh-token.mjs
   ```
5. Autoriza con **elniu@gmail.com**

## Paso 2 — Vercel

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
GOOGLE_CALENDAR_ID=primary
BOOKING_TIMEZONE=Europe/Madrid
```

**Quita** (o deja vacías) `ICLOUD_*` para que use Google.

## Paso 3 — iPhone

Ajustes → Calendario → Cuentas → Añadir Google → verás las citas en Calendario.
