# Configurar Vercel — checklist completo (citas + emails + Meet)

Proyecto: **dvg-studio-landing** → [vercel.com/dashboard](https://vercel.com/dashboard)  
**Settings → Environment Variables** → marca **Production** + **Preview** → **Save** → **Deployments → Redeploy**

---

## Bloque 1 — Obligatorio (chat + emails)

Copia y pega cada variable. Sustituye los valores entre `<>`.

```
AWS_ACCESS_KEY_ID=<tu access key IAM>
AWS_SECRET_ACCESS_KEY=<tu secret key IAM>
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
CHAT_SITE_KEY=dvg-studio-chat-2026
CONTACT_EMAIL=info@dvgsstudio.com
BOOKING_NOTIFY_EMAIL=info@dvgsstudio.com
BOOKING_FROM_EMAIL=info@dvgsstudio.com
BOOKING_MEET_URL=<https://meet.google.com/xxx-xxxx-xxx>
BOOKING_TIMEZONE=Europe/Madrid
CHAT_ALLOWED_ORIGINS=https://dvgsstudio.com,https://www.dvgsstudio.com,https://dvgsstudio.es,https://www.dvgsstudio.es,https://dvg-studio-landing.vercel.app
DIAGNOSTIC_KEY=<elige una clave larga aleatoria>
```

`CHAT_SITE_KEY` debe coincidir con `data-site-key` en `index.html` (ahora: `dvg-studio-chat-2026`).

---

## Bloque 2 — Calendario iCloud (recomendado)

```
ICLOUD_CALENDAR_EMAIL=<tu Apple ID, ej. tu@gmail.com o tu@icloud.com>
ICLOUD_APP_PASSWORD=<16 letras de appleid.apple.com → Contraseñas de app>
ICLOUD_CALENDAR_NAME=DVG Studio
```

**Crear contraseña de app:** [appleid.apple.com](https://appleid.apple.com) → Iniciar sesión → **Contraseñas de app** → generar «DVG Studio booking».

**Calendario:** en iPhone/Mac debe existir un calendario llamado **DVG Studio** (o cambia `ICLOUD_CALENDAR_NAME` al nombre que uses).

Prueba en tu Mac antes de Vercel:

```bash
cd dvg-studio-landing
ICLOUD_CALENDAR_EMAIL=tu@icloud.com ICLOUD_APP_PASSWORD=xxxxxxxxxxxxxxxx node scripts/debug-icloud-auth.mjs
```

---

## Bloque 3 — Horario de citas (opcional)

```
BOOKING_HOURS_START=9
BOOKING_HOURS_END=18
BOOKING_DURATION_MINUTES=60
```

---

## AWS SES (sin esto los emails NO llegan a los leads)

1. [AWS SES](https://console.aws.amazon.com/ses) → región **us-east-1**
2. **Verified identities** → **Create identity**
3. Dominio `dvgsstudio.com` (recomendado) o email `info@dvgsstudio.com`
4. Confirma el enlace que llega a Gmail
5. Si estás en **sandbox**: pide **Production access** (Account dashboard → Request production access) para enviar a cualquier email de clientes

**IAM:** la access key de Vercel necesita:

- `bedrock:InvokeModel`, `bedrock:Converse`
- `ses:SendEmail`, `ses:SendRawEmail`

---

## Google Meet (mismo enlace para ti y el cliente)

1. Entra en [meet.google.com](https://meet.google.com) con la cuenta de empresa
2. **Nueva reunión** → **Crear enlace permanente**
3. Copia la URL → `BOOKING_MEET_URL` en Vercel

Ese enlace aparece en: tu calendario, email a info@, email al cliente y archivo .ics.

---

## Comprobar que está bien

Tras **Redeploy**, abre en el navegador (sustituye `TU_CLAVE` por `DIAGNOSTIC_KEY`):

```
https://www.dvgsstudio.com/api/status?key=TU_CLAVE
```

Deberías ver `"readyForBooking": true` y `"meetUrl": true`.

---

## Prueba real

1. https://www.dvgsstudio.com → chat IGNITE
2. «Podemos quedar mañana a las 10» → completa datos → confirmar
3. Comprueba:
   - [ ] Email en **info@dvgsstudio.com** con .ics
   - [ ] Email al cliente con Meet y hora
   - [ ] Evento en calendario **DVG Studio** (iPhone/Mac)
4. Si falla: Vercel → **Logs** → filtra `book` o `SES`

---

## Errores frecuentes

| Síntoma | Solución |
|---------|----------|
| Cita OK, sin emails | SES no verificado o IAM sin permiso SES |
| Email solo a info@, no al lead | SES en sandbox — salir de sandbox |
| Sin Meet en el correo | Falta `BOOKING_MEET_URL` en Vercel |
| Sin evento en calendario | Revisa iCloud: email + contraseña de app |
| Chat «Acceso no permitido» | `CHAT_SITE_KEY` no coincide con `index.html` |
