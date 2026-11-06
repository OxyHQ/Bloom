"""Local device-audit control endpoint; never serves production data."""
import json
import pathlib
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

folder = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.local/avatar-native-audit')
folder.mkdir(parents=True, exist_ok=True)


class Handler(BaseHTTPRequestHandler):
    def setup(self):
        super().setup()
        self.connection.settimeout(20)

    def log_message(self, *args):
        pass

    def respond(self, data, content_type='application/json', status=200):
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = folder / 'command.json'
        self.respond(path.read_bytes() if path.exists() else b'{}')

    def do_POST(self):
        value = json.loads(self.rfile.read(int(self.headers.get('Content-Length', 0))))
        key = str(value.get('id', 'unknown'))
        if not key.replace('-', '').isalnum():
            self.respond(b'Invalid audit identifier', 'text/plain', 400)
            return
        (folder / f'{key}-native.json').write_text(json.dumps(value))
        self.respond(b'ok', 'text/plain')
        print('captured', key, value.get('width'), value.get('error'), flush=True)


ThreadingHTTPServer(('127.0.0.1', 8099), Handler).serve_forever()
