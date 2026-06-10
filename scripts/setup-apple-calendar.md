# Citas en Apple Calendar (iCloud)

## Variables Vercel

```
ICLOUD_CALENDAR_EMAIL=elniu101@gmail.com
ICLOUD_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
ICLOUD_CALENDAR_NAME=DVG Studio
BOOKING_TIMEZONE=Europe/Madrid
```

`ICLOUD_CALENDAR_NAME` elige el calendario de Apple (por defecto busca **DVG Studio**).
Si no existe, créalo en la app Calendario del iPhone/Mac antes de agendar.

Si tu Apple ID es Gmail, el sistema **prueba también** `tu@icloud.com` y `tu@me.com` automáticamente.

## Paso 1 — Contraseña de app

1. [appleid.apple.com](https://appleid.apple.com) → Contraseñas de app
2. Genera una nueva → copia las 16 letras
3. **Nunca** uses la contraseña normal de Apple

## Paso 2 — Calendario iCloud activo

iPhone → tu nombre → **iCloud** → **Calendario** → ON

## Paso 3 — Encuentra tu @icloud.com (importante con Gmail)

1. [appleid.apple.com](https://appleid.apple.com) → **Email y teléfonos**
2. Busca direcciones **@icloud.com** o **@me.com**
3. Si hay una, añádela en Vercel como `ICLOUD_ALT_EMAILS`

## Paso 4 — Prueba en Mac (definitiva)

Ajustes → Internet → Cuentas → Añadir → **CalDAV**:
- Servidor: `caldav.icloud.com`
- Usuario: prueba Gmail y @icloud.com
- Contraseña: contraseña de app

## Paso 5 — Prueba en Terminal

```bash
ICLOUD_CALENDAR_EMAIL=tu@icloud.com \
ICLOUD_APP_PASSWORD=tuapppassword \
node scripts/debug-icloud-auth.mjs
```

Si dice qué email funcionó, usa ese en `ICLOUD_CALENDAR_EMAIL`.
