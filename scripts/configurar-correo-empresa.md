# Correo de empresa — checklist (ya tienes Google Workspace)

Correo: **info@dvgsstudio.com**  
Dominio: **dvgsstudio.com**

## ✅ Hecho en código (tras push)

- Web, chat y FAQ usan `info@dvgsstudio.com`
- Orígenes del chat permitidos por defecto: `dvgsstudio.com`, `www`, `.es`, Vercel preview
- Avisos de citas usan `BOOKING_NOTIFY_EMAIL` o ese correo por defecto

## Paso 1 — Variables en Vercel (5 min)

Proyecto **dvg-studio-landing** → **Settings** → **Environment Variables** → añade:

```
BOOKING_NOTIFY_EMAIL=info@dvgsstudio.com
BOOKING_FROM_EMAIL=info@dvgsstudio.com
CONTACT_EMAIL=info@dvgsstudio.com
BOOKING_MEET_URL=https://meet.google.com/xxx-xxxx-xxx
CHAT_ALLOWED_ORIGINS=https://dvgsstudio.com,https://www.dvgsstudio.com,https://dvgsstudio.es,https://www.dvgsstudio.es
```

Marca **Production** (y Preview si quieres). **Save** → **Redeploy**.

## Paso 2 — AWS SES (avisos cuando alguien agenda cita)

1. [AWS Console](https://console.aws.amazon.com/ses) → región **us-east-1** (la de tu Bedrock)
2. **Verified identities** → **Create identity**
3. Tipo **Email** → `info@dvgsstudio.com`
4. Abre el correo de confirmación en Gmail de empresa → **Confirmar**
5. Si SES está en *sandbox*: solo envía a correos verificados (el tuyo basta para empezar). Para producción, pide *production access* en SES.

Cuando alguien agenda en el chat:
- Te llega aviso a **info@dvgsstudio.com**
- Al cliente le llega confirmación HTML (logo, slogan, Meet, botón Google Calendar + adjunto .ics)

### Google Meet (enlace fijo)

1. Crea una sala en [meet.google.com](https://meet.google.com) → **Nueva reunión** → **Crear enlace permanente** (o usa un enlace de reunión recurrente)
2. Vercel:
   ```
   BOOKING_MEET_URL=https://meet.google.com/abc-defg-hij
   ```

## Paso 3 — Probar

1. Abre https://www.dvgsstudio.com
2. Chat → «agendar cita» → datos de prueba
3. Comprueba:
   - Cita en calendario **DVG Studio** (iCloud)
   - Aviso en **info@dvgsstudio.com** (si SES está verificado)

## Paso 4 — Redes (siguiente fase)

- Bio Instagram/LinkedIn: `info@dvgsstudio.com` + enlace a la web
- Agente de leads en DM (cuando tengas cuentas conectadas)
- Contenido: tú grabas, IA adapta posts (ver estrategia en chat)

## Si el aviso no llega

| Síntoma | Solución |
|---------|----------|
| Cita sí, email no | Verifica SES + variables `BOOKING_*` en Vercel |
| Error SES en logs Vercel | Correo remitente no verificado en SES |
| Chat bloqueado | Añade dominio en `CHAT_ALLOWED_ORIGINS` |

Logs: Vercel → proyecto → **Logs** → filtra `/api/book`.
