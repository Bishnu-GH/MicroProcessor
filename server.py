import http.server
import socketserver
import webbrowser
import os

PORT = 8000

Handler = http.server.SimpleHTTPRequestHandler

# Change directory to script location if needed, but we assume we run it from root
# os.chdir(os.path.dirname(os.path.abspath(__file__)))

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at http://localhost:{PORT}")
    # Open browser automatically
    webbrowser.open(f"http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
