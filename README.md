# DVG Studio — Landing Page

Landing page estática para **DVG Studio**: empleados digitales autónomos 24/7 para PYMEs.

## Ver en local

Abre `index.html` en el navegador, o sirve la carpeta:

```bash
python3 -m http.server 8080
```

Luego visita http://localhost:8080

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
