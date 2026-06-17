#!/usr/bin/env python3
"""
Genera GOOGLE_REFRESH_TOKEN (calendar.events + gmail.send) sin Node.js.

Uso:
  GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy python3 scripts/get-google-refresh-token.py

En Google Cloud → Credenciales OAuth, debe existir el redirect:
  http://localhost:3456/oauth2callback
"""
import http.server
import json
import os
import socketserver
import urllib.parse
import urllib.request
import webbrowser

PORT = 3456
REDIRECT_URI = f"http://localhost:{PORT}/oauth2callback"
SCOPES = [
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/gmail.send",
]

client_id = (os.environ.get("GOOGLE_CLIENT_ID") or "").strip()
client_secret = (os.environ.get("GOOGLE_CLIENT_SECRET") or "").strip()

if not client_id or not client_secret:
    print("Define GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET")
    raise SystemExit(1)

auth_params = urllib.parse.urlencode(
    {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
)
auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{auth_params}"


def exchange_code(code: str) -> dict:
    body = urllib.parse.urlencode(
        {
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": REDIRECT_URI,
            "grant_type": "authorization_code",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        "https://oauth2.googleapis.com/token",
        data=body,
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


class OAuthHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if not self.path.startswith("/oauth2callback"):
            self.send_error(404)
            return

        query = urllib.parse.urlparse(self.path).query
        code = urllib.parse.parse_qs(query).get("code", [None])[0]
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()

        if not code:
            self.wfile.write(b"<h1>Sin codigo de autorizacion</h1>")
            return

        try:
            tokens = exchange_code(code)
        except Exception as err:
            msg = f"<h1>Error al obtener token</h1><pre>{err}</pre>"
            self.wfile.write(msg.encode("utf-8"))
            print(f"\nError: {err}\n")
            return

        refresh = tokens.get("refresh_token") or ""
        self.wfile.write(
            b"<h1>OK</h1><p>Vuelve a la terminal y copia GOOGLE_REFRESH_TOKEN.</p>"
        )

        print("\n" + "=" * 60)
        if refresh:
            print(f"\nGOOGLE_REFRESH_TOKEN={refresh}\n")
            print("Pega ese valor en Vercel y haz Redeploy.\n")
        else:
            print(
                "\nNo llego refresh_token. Prueba de nuevo o revoca el acceso en\n"
                "https://myaccount.google.com/permissions y repite con prompt=consent.\n"
            )
            print("Respuesta:", json.dumps(tokens, indent=2))
        print("=" * 60 + "\n")

        self.server.should_stop = True

    def log_message(self, format, *args):
        return


print("\n1. Abre esta URL e inicia sesion con la cuenta del negocio (info@...):\n")
print(auth_url)
print("\n2. Tras autorizar, vuelve aqui para copiar el token.\n")

webbrowser.open(auth_url)

with socketserver.TCPServer(("", PORT), OAuthHandler) as httpd:
    httpd.should_stop = False
    while not httpd.should_stop:
        httpd.handle_request()
