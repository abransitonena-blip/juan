"""Un solo servidor para biblioteca y los tres editores."""
import sys
import threading
import webbrowser
from server import Handler, ThreadingHTTPServer
for port in range(8800, 8820):
    try:
        server=ThreadingHTTPServer(('127.0.0.1',port),Handler)
        break
    except OSError:
        continue
else:
    raise SystemExit('No hay un puerto libre para el estudio.')
url=f'http://127.0.0.1:{port}/production.html'
print(url,flush=True)
threading.Timer(.7,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
