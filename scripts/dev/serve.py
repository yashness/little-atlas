"""Development-only static server. Never serves dotfiles or project internals."""
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = {"index.html", "styles.css", "app.js"}


class Handler(SimpleHTTPRequestHandler):
    def send_head(self):
        path = unquote(urlsplit(self.path).path).lstrip("/") or "index.html"
        parts = Path(path).parts
        resolved = (ROOT / path).resolve()
        asset = (parts and parts[0] == "assets" and (
            resolved.suffix in {".svg", ".mp3", ".ttf", ".css"}
            or path == "assets/narration.json"
            or (len(parts) > 2 and parts[1] == "licenses" and resolved.suffix == ".txt")))
        allowed = path in PUBLIC or asset
        if (not allowed or any(p.startswith(".") for p in parts)
                or not resolved.is_relative_to(ROOT) or not resolved.is_file()):
            self.send_error(404)
            return None
        return super().send_head()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    host = os.environ.get("HOST", "127.0.0.1")
    server = ThreadingHTTPServer((host, port), partial(Handler, directory=str(ROOT)))
    print(f"Little Atlas dev server: http://{host}:{port}", flush=True)
    server.serve_forever()
