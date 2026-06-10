# Citas: avisos empresa + reservas en Apple personal

## Esquema (tu caso)

| Rol | Variable | Ejemplo |
|-----|----------|---------|
| **Avisos** (email de empresa) | `BOOKING_NOTIFY_EMAIL` | `info@dvgsstudio.com` |
| **Remitente SES** | `BOOKING_FROM_EMAIL` | `info@dvgsstudio.com` |
| **Calendario** (Apple personal) | `ICLOUD_CALENDAR_EMAIL` | `tu@icloud.com` |
| **Contraseña app Apple** | `ICLOUD_APP_PASSWORD` | generada en appleid.apple.com |

Flujo:
1. Cliente agenda en el chat
2. La cita se crea en **tu Calendario de Apple** (iCloud)
3. Te llega un **aviso al correo de empresa**

## Paso 1 — Avisos (AWS SES)

1. AWS → SES → verifica `info@dvgsstudio.com`
2. Vercel:
   ```
   BOOKING_NOTIFY_EMAIL=info@dvgsstudio.com
   BOOKING_FROM_EMAIL=info@dvgsstudio.com
   BOOKING_TIMEZONE=Europe/Madrid
   ```

## Paso 2 — Calendario Apple (iCloud)

1. Entra en [appleid.apple.com](https://appleid.apple.com)
2. **Contraseñas de app** → genera una para «DVG Studio booking»
3. Vercel:
   ```
   ICLOUD_CALENDAR_EMAIL=tu-correo-personal@icloud.com
   ICLOUD_APP_PASSWORD=abcdefghijklmnop
   ```
   > La contraseña de app son **16 letras** (puedes pegarla con o sin guiones; el sistema los quita).

4. Prueba en tu Mac:
   ```bash
   cd dvg-studio-landing
   ICLOUD_CALENDAR_EMAIL=tu@icloud.com ICLOUD_APP_PASSWORD=tuapppassword node scripts/test-icloud.mjs
   ```

La cita aparece en la app **Calendario** de tu Mac/iPhone (misma cuenta iCloud).

### Opcional

Si la detección automática del calendario falla, añade la URL directa:

```
ICLOUD_CALENDAR_URL=https://caldav.icloud.com/XXXX/calendars/home/
```

## Paso 3 — Redeploy

Guarda variables en Vercel → **Redeploy** → prueba «agendar cita» en el chat.

## Alternativa: Google Calendar

Si prefieres Google en lugar de Apple, usa `GOOGLE_*` (sin `ICLOUD_*`).
iCloud tiene prioridad si ambos están configurados.
