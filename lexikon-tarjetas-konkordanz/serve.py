import http.server, socketserver, os
os.chdir(os.path.dirname(os.path.abspath(__file__))); PORT=5180
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self): self.send_header("Cache-Control","no-store"); super().end_headers()
with socketserver.TCPServer(("",PORT),H) as s: print("http://localhost:%d"%PORT); s.serve_forever()
