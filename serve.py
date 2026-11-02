#!/usr/bin/env python3
"""Jalankan MoneyMe secara lokal: python3 serve.py [port]"""
import http.server, os, socket, socketserver, sys, webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
                      '.webmanifest': 'application/manifest+json', '.js': 'text/javascript', '.svg': 'image/svg+xml'}
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, *a):
        pass

def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); ip = s.getsockname()[0]; s.close(); return ip
    except Exception:
        return None

socketserver.TCPServer.allow_reuse_address = True
with socketserver.ThreadingTCPServer(('0.0.0.0', PORT), Handler) as httpd:
    url = f'http://localhost:{PORT}'
    print('\n  MoneyMe berjalan!\n')
    print(f'  Di komputer ini : {url}')
    ip = lan_ip()
    if ip:
        print(f'  Dari HP (WiFi sama): http://{ip}:{PORT}')
    print('\n  Tekan Ctrl+C untuk berhenti.\n')
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server dihentikan.')
