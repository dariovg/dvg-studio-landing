# Correo de empresa — checklist (ya tienes Google Workspace)

Correo: **contact@dvgsstudio.com**  
Dominio: **dvgsstudio.com**

## ✅ Hecho en código (tras push)

- Web, chat y FAQ usan `contact@dvgsstudio.com`
- Orígenes del chat permitidos por defecto: `dvgsstudio.com`, `www`, `.es`, Vercel preview
- Avisos de citas usan `BOOKING_NOTIFY_EMAIL` o ese correo por defecto

## Paso 1 — Variables en Vercel (5 min)

Proyecto **dvg-studio-landing** → **Settings** → **Environment Variables** → añade:

```
BOOKING_NOTIFY_EMAIL=contact@dvgsstudio.com
BOOKING_FROM_EMAIL=contact@dvgsstudio.com
CONTACT_EMAIL=contact@dvgsstudio.com
CHAT_ALLOWED_ORIGINS=https://dvgsstudio.com,https://www.dvgsstudio.com,https://dvgsstudio.es,https://www.dvgsstudio.es
```

Marca **Production** (y Preview si quieres). **Save** → **Redeploy**.

## Paso 2 — AWS SES (avisos cuando alguien agenda cita)

1. [AWS Console](https://console.aws.amazon.com/ses) → región **us-east-1** (la de tu Bedrock)
2. **Verified identities** → **Create identity**
3. Tipo **Email** → `contact@dvgsstudio.com`
4. Abre el correo de confirmación en Gmail de empresa → **Confirmar**
5. Si SES está en *sandbox*: solo envía a correos verificados (el tuyo basta para empezar). Para producción, pide *production access* en SES.

Cuando alguien agenda en el chat, recibirás un email en **contact@dvgsstudio.com**.

## Paso 3 — Probar

1. Abre https://www.dvgsstudio.com
2. Chat → «agendar cita» → datos de prueba
3. Comprueba:
   - Cita en calendario **DVG Studio** (iCloud)
   - Aviso en **contact@dvgsstudio.com** (si SES está verificado)

## Paso 4 — Redes (siguiente fase)

- Bio Instagram/LinkedIn: `contact@dvgsstudio.com` + enlace a la web
- Agente de leads en DM (cuando tengas cuentas conectadas)
- Contenido: tú grabas, IA adapta posts (ver estrategia en chat)

## Si el aviso no llega

| Síntoma | Solución |
|---------|----------|
| Cita sí, email no | Verifica SES + variables `BOOKING_*` en Vercel |
| Error SES en logs Vercel | Correo remitente no verificado en SES |
| Chat bloqueado | Añade dominio en `CHAT_ALLOWED_ORIGINS` |

Logs: Vercel → proyecto → **Logs** → filtra `/api/book`.
