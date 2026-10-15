"""Abre el taller localmente; no expone el servidor a la red."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Timer
import webbrowser
root=Path(__file__).resolve().parent
handler=partial(SimpleHTTPRequestHandler,directory=str(root))
for port in range(8765,8785):
 try:
  server=ThreadingHTTPServer(('127.0.0.1',port),handler)
  break
 except OSError:
  continue
else:
 raise SystemExit('No hay puerto disponible entre 8765 y 8784.')
url=f'http://127.0.0.1:{port}/'
print(f'El taller de Juan: {url}\nMantén esta ventana abierta. Ctrl+C para cerrar.',flush=True)
Timer(.5,lambda:webbrowser.open(url)).start()
try:server.serve_forever()
except KeyboardInterrupt:pass
finally:server.server_close()
