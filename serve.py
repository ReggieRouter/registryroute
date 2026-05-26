#!/usr/bin/env python3
"""
Registry Route — semantic URL server.

Routes:
  /                                         → index.html
  /about    /about/                         → about.html
  /{state-slug}/secretary-of-state/         → index.html
  /{state-slug}/reinstatement/              → index.html
  /{state-slug}/                            → index.html
  Any path with a static file extension     → served directly from ROOT
  Any other path                            → index.html (graceful fallback)

Usage:
  python3 serve.py          # port 8085
  python3 serve.py 3000     # custom port
"""

import os
import sys
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# Extensions that should always be served as static files, never route to index.html
STATIC_EXTS = {
    '.json', '.svg', '.png', '.ico', '.jpg', '.jpeg', '.gif', '.webp',
    '.css', '.js', '.woff', '.woff2', '.ttf', '.eot', '.pdf', '.txt',
    '.xml', '.map', '.webmanifest',
}


class RRHandler(BaseHTTPRequestHandler):

    def do_GET(self):
        # Strip query string and fragment — JS history API handles those
        path = self.path.split('?')[0].split('#')[0]
        self._dispatch(path)

    def _dispatch(self, raw_path):
        # Resolve to absolute path and block traversal
        try:
            target = (ROOT / raw_path.lstrip('/')).resolve()
        except Exception:
            self._serve_html(ROOT / 'index.html')
            return

        root_str = str(ROOT)
        if not (str(target) == root_str or str(target).startswith(root_str + os.sep)):
            self.send_error(403, 'Forbidden')
            return

        # 1. Exact static file on disk → serve it
        if target.is_file():
            self._serve_file(target)
            return

        # 2. Path has a known static extension but file is missing → 404
        suffix = target.suffix.lower()
        if suffix in STATIC_EXTS:
            self.send_error(404, 'Static asset not found')
            return

        # 3. /about, /about/ → about.html
        normalized = raw_path.rstrip('/')
        if normalized == '/about':
            self._serve_html(ROOT / 'about.html')
            return

        # 4. Everything else (/, /california/secretary-of-state/, unknown slugs)
        #    → index.html — client JS reads pathname and handles gracefully
        self._serve_html(ROOT / 'index.html')

    def _serve_html(self, filepath):
        self._serve_file(filepath, cache='no-cache, must-revalidate')

    def _serve_file(self, filepath, cache=None):
        try:
            data = filepath.read_bytes()
        except FileNotFoundError:
            self.send_error(404, 'Not found')
            return
        except PermissionError:
            self.send_error(403, 'Forbidden')
            return
        except Exception as e:
            self.send_error(500, str(e))
            return

        mime, _ = mimetypes.guess_type(str(filepath))
        mime = mime or 'application/octet-stream'

        if cache is None:
            cache = 'no-cache' if filepath.suffix == '.html' else 'public, max-age=3600'

        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', cache)
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        sys.stdout.write(f'  {self.address_string()}  {fmt % args}\n')
        sys.stdout.flush()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8085
    server = HTTPServer(('', port), RRHandler)
    print(f'\nRegistry Route  →  http://localhost:{port}/\n', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.\n')
