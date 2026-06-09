# DVG Studio — Landing Page

Landing page estática para **DVG Studio**: empleados digitales autónomos 24/7 para PYMEs.

## Ver en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8080
```

Luego visita http://localhost:8080

## Chatbot IGNITE (IA 24/7)

El widget llama a `/api/chat` (Vercel Serverless + AWS Bedrock Haiku).

En Vercel → **Settings → Environment Variables**:

| Variable | Valor |
|----------|--------|
| `AWS_ACCESS_KEY_ID` | Tu access key |
| `AWS_SECRET_ACCESS_KEY` | Tu secret key |
| `AWS_REGION` | `us-east-1` |
| `BEDROCK_MODEL_ID` | `us.anthropic.claude-haiku-4-5-20251001-v1:0` |

Sin estas variables el chat muestra mensaje de fallback (la web sigue funcionando).

## Despliegue en Vercel (recomendado)

1. Entra en [vercel.com](https://vercel.com) → **Add New Project**
2. Importa el repo: `dariovg/dvg-studio-landing`
3. Framework: **Other** — sin build command, sin install command
4. **Deploy**

### Conectar tu dominio

1. En el proyecto → **Settings → Domains**
2. Añade tu dominio (ej. `dvgstudio.com` y `www.dvgstudio.com`)
3. Vercel te da los registros DNS — cópialos en donde compraste el dominio:
   - Si el dominio está **en Vercel**: se configura solo
   - Si está en **otro registrador** (GoDaddy, Namecheap, etc.): añade el registro `A` o `CNAME` que indique Vercel

En unos minutos quedará en `https://tudominio.com`.

## Otros hosts

Compatible con GitHub Pages, Netlify o cualquier hosting estático.

## Contenido

- Hero, servicios, casos de uso, testimonios
- Planes y precios (toggle mensual/anual)
- FAQ, badges de confianza
- Widget de chat (WhatsApp / Instagram)
