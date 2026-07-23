import http.server, socketserver, os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 5177

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving lexikon at http://localhost:{PORT}")
    httpd.serve_forever()
