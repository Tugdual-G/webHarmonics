#!/usr/bin/env python3
from http.server import SimpleHTTPRequestHandler, HTTPServer


class CustomHTTPRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith(".js"):
            self.send_header("Content-Type", "text/javascript")
        super().end_headers()


# Set the server address and port
server_address = ("", 8000)
httpd = HTTPServer(server_address, CustomHTTPRequestHandler)

print("Serving on port 8000...")
httpd.serve_forever()
