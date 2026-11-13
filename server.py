"""
server.py - Small Python web server for the presentation. No packages to install.

It does two things:
  1. Serves index.html, style.css and app.js.
  2. Runs algorithm.py for the page:
        GET  /api/health   -> {"engine": "python", ...}
        POST /api/trace    -> body {"array": [..]}  returns every step of the algorithm

Start:   python server.py          (then open http://127.0.0.1:8000)
"""

import os
import json
import mimetypes
import sys
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import algorithm

ROOT = Path(__file__).resolve().parent
PORT = int(os.environ.get("PORT", "8000"))
HOST = "0.0.0.0" if "PORT" in os.environ else "127.0.0.1"
STATIC = {"/": "index.html", "/index.html": "index.html", "/style.css": "style.css", "/app.js": "app.js"}
MAX_ITEMS = 64


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json; charset=utf-8"):
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = self.path.split("?")[0].split("#")[0]
        if path == "/api/health":
            return self._send(200, {"engine": "python", "file": "algorithm.py", "self_test_runs": algorithm.self_test(300)})
        name = STATIC.get(path)
        if not name:
            return self._send(404, {"error": "Not found"})
        ctype = (mimetypes.guess_type(name)[0] or "text/plain") + "; charset=utf-8"
        self._send(200, (ROOT / name).read_bytes(), ctype)

    def do_POST(self):
        if self.path != "/api/trace":
            return self._send(404, {"error": "Not found"})
        try:
            size = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(size) or b"{}")
            values = payload.get("array")
            if not isinstance(values, list) or len(values) > MAX_ITEMS:
                raise ValueError(f"Send a list of 1 to {MAX_ITEMS} whole numbers.")
            self._send(200, algorithm.build_trace(values))
        except (ValueError, json.JSONDecodeError) as e:
            self._send(400, {"error": str(e)})

    def log_message(self, fmt, *args):
        sys.stderr.write("  " + (fmt % args) + "\n")


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)

    if HOST == "127.0.0.1":
        url = f"http://127.0.0.1:{PORT}"
        print(f"AlgoVision is running at {url} (press Ctrl+C to stop)")
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    else:
        print(f"AlgoVision is running on {HOST}:{PORT}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
