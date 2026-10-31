import json,pathlib,sys
from http.server import HTTPServer,BaseHTTPRequestHandler
folder=pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '.local/avatar-native-audit');folder.mkdir(parents=True,exist_ok=True)
class Handler(BaseHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  value=(folder/'command.json').read_bytes() if (folder/'command.json').exists() else b'{}'
  self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(value)
 def do_POST(self):
  value=json.loads(self.rfile.read(int(self.headers.get('Content-Length',0))));key=str(value.get('id','unknown'));assert key.replace('-','').isalnum();(folder/f'{key}-native.json').write_text(json.dumps(value));self.send_response(200);self.end_headers();self.wfile.write(b'ok');print('captured',key,value.get('width'),value.get('error'),flush=True)
HTTPServer(('127.0.0.1',8099),Handler).serve_forever()
