from http.server import HTTPServer, BaseHTTPRequestHandler
import ssl


httpd = HTTPServer(('localhost', 4448), BaseHTTPRequestHandler)
print(1)
httpd.socket = ssl.wrap_socket (httpd.socket, 
        keyfile="key.pem", 
        certfile='cert.pem', server_side=True)
print(2)
httpd.serve_forever()
print(3)
