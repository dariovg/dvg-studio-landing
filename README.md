# DVG Studio — Landing Page

Landing + chat IA con Bedrock Nova Lite y documento de conocimiento.

## Activar el modelo en el chat (paso a paso)

### 1. AWS — activar Nova Lite

1. Consola AWS → **Bedrock** → **Model access**
2. Activa **Amazon Nova Lite**
3. Región: `us-east-1`

### 2. AWS — usuario IAM para el chat

Crea un usuario (o usa el existente) con política mínima:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["bedrock:InvokeModel", "bedrock:Converse"],
    "Resource": [
      "arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0",
      "arn:aws:bedrock:*::foundation-model/amazon.nova*"
    ]
  }]
}
```

Genera **Access Key** + **Secret Key**.

### 3. AWS — presupuesto (anti-sorpresas)

1. **Billing** → **Budgets** → Create budget
2. Cost budget: **10 USD/mes**
3. Alerta al 80% y 100%

### 4. Vercel — variables de entorno

En el proyecto → **Settings → Environment Variables**:

| Variable | Valor | Obligatorio |
|----------|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Tu access key | Sí |
| `AWS_SECRET_ACCESS_KEY` | Tu secret key | Sí |
| `AWS_REGION` | `us-east-1` | Sí |
| `BEDROCK_MODEL_ID` | `amazon.nova-lite-v1:0` | Sí |
| `CHAT_SITE_KEY` | Misma clave que `data-site-key` en `index.html` | Recomendado |
| `CHAT_ALLOWED_ORIGINS` | `https://tudominio.com,https://www.tudominio.com` | Recomendado |
| `CHAT_LIMIT_HOUR` | `6` | Opcional |
| `CHAT_LIMIT_DAY` | `20` | Opcional |
| `CHAT_BEDROCK_DAILY_MAX` | `100` | Opcional |

Tras guardar → **Redeploy**.

### 5. Probar

1. Abre la web, espera 3 segundos, abre el chat
2. Pregunta: "¿Cuánto cuesta el plan Pro?" → debería responder (FAQ, 0 €)
3. Pregunta algo raro no en FAQ → Nova Lite responde con `empresa.md`

## Completar la base de conocimiento

Edita **`knowledge/empresa.md`**. El chat solo dice lo que hay ahí.

### Bloques que debes personalizar

Busca `[EDITAR:` en el archivo y rellena:

- Teléfono / WhatsApp de contacto
- Setup fee o condiciones especiales de precio
- Horario de soporte exacto si difiere
- LinkedIn, Calendly u otros enlaces
- Casos reales de clientes (cuando los tengas)

### Qué añadir para mejores respuestas

| Sección | Ejemplo |
|---------|---------|
| Servicios concretos | "Instalamos chat en WordPress, Shopify…" |
| Objeciones | "¿Y si el cliente quiere hablar con una persona?" |
| Integraciones | "Holded, HubSpot, Google Calendar…" |
| Tono de marca | "Cercano pero profesional, tuteo, sin tecnicismos" |
| Límites | "No hacemos desarrollo web ni diseño gráfico" |

Tras editar: `git push` → Vercel redespliega en ~1 min.

## Seguridad del chat (capas activas)

| Capa | Qué hace |
|------|----------|
| FAQ local | ~80% preguntas sin llamar a AWS (0 €) |
| Nova Lite | Modelo barato cuando sí hace falta IA |
| Límite IP | 6/hora, 20/día por visitante |
| Tope global | 100 llamadas Bedrock/día en todo el sitio |
| Honeypot | Campo oculto anti-bots |
| Site key | Clave en HTML + Vercel (`CHAT_SITE_KEY`) |
| Origen | Solo dominios en `CHAT_ALLOWED_ORIGINS` |
| Anti-spam | Sin URLs múltiples, sin mensajes repetidos |
| Cliente | 5 s entre mensajes, máx. 8 por sesión |

**Importante:** cambia `data-site-key` en `index.html` y `CHAT_SITE_KEY` en Vercel por una clave aleatoria larga.

## Estructura

```
index.html          Landing
css/main.css        Estilos
js/chat.js          Widget chat
js/scroll.js        Animaciones
api/chat.js         API Bedrock
api/lib/            FAQ, rate-limit, seguridad
knowledge/empresa.md  Documento que lee el modelo
```

## Despliegue en Vercel

1. Importa `dariovg/dvg-studio-landing`
2. Framework: **Other** — sin build
3. Añade variables de entorno (arriba)
4. Conecta dominio en Settings → Domains

## Agendar citas (chat → 1 hora)

El visitante escribe **«agendar cita»** en el chat. Se piden nombre, email, teléfono, fecha (DD/MM/AAAA) y hora (HH:MM).

### Opción A — Email con AWS SES (recomendado ahora)

1. Verifica `contact@dvgstudio.com` en AWS SES
2. Variables Vercel: `BOOKING_NOTIFY_EMAIL`, `BOOKING_FROM_EMAIL`
3. Recibes email y añades la cita a Calendario (Apple) a mano

### Opción B — Google Calendar automático

Cuando tengas Gmail/Google del negocio: OAuth refresh token + `GOOGLE_CALENDAR_ID`.
Si sincronizas Google en el Mac, las citas aparecen en Calendario de Apple.

Vercel no escribe en iCloud directamente.
