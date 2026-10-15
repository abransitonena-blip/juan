"""Servidor local del Estudio de Juan (solo 127.0.0.1).

    python3 studio/server.py [puerto]

- Sirve la página del estudio (studio/static) y, en solo lectura, los módulos
  del avatar de ChatGPT (Juan.1 ChatGPT/web) bajo /web/.
- POST /api/tts  {text, voice, rate}  -> mp3 + tiempos de cada palabra (edge-tts).
- GET  /api/voices                    -> voces permitidas.
No modifica ningún archivo de Juan.1 ChatGPT.
"""
import asyncio
import hashlib
import json
import mimetypes
import re
import subprocess
import sys
import tempfile
import threading
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

import edge_tts
import production_api

ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"
CACHE = ROOT / "cache"
WEB = (ROOT.parent / "Juan.1 ChatGPT" / "web").resolve()
OUTPUT = ROOT / "output"
CACHE.mkdir(exist_ok=True)
OUTPUT.mkdir(exist_ok=True)
QUEUE = {"proc": None, "status": OUTPUT / "queue-status.json"}
QUEUE_LOCK = threading.Lock()
VOCAB_FILE = ROOT / "vocab.json"
VOCAB_LOCK = threading.Lock()
PATTERN_RE = re.compile(r"^[AEIOUMFLSRKN]( [AEIOUMFLSRKN]){0,13}$")


def load_vocab():
    try:
        return json.loads(VOCAB_FILE.read_text())
    except (OSError, json.JSONDecodeError):
        return {}


def save_vocab(v):
    tmp = VOCAB_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(v, ensure_ascii=False, indent=0, sort_keys=True))
    tmp.replace(VOCAB_FILE)
MAX_JOBS = 5000

VOICES = {
    "es-MX-JorgeNeural": "Jorge · español México (hombre)",
    "es-MX-DaliaNeural": "Dalia · español México (mujer)",
    "es-ES-AlvaroNeural": "Álvaro · español España (hombre)",
    "es-AR-TomasNeural": "Tomás · español Argentina (hombre)",
    "zh-CN-YunxiNeural": "Yunxi · chino mandarín (hombre)",
    "zh-CN-XiaoxiaoNeural": "Xiaoxiao · chino mandarín (mujer)",
    "en-US-GuyNeural": "Guy · inglés EE. UU. (hombre)",
}
MAX_TEXT = 3000
MAX_BODY = 20_000


async def synthesize(text, voice, rate):
    key = hashlib.sha256(f"{voice}|{rate}|{text}".encode()).hexdigest()[:24]
    mp3, meta = CACHE / f"{key}.mp3", CACHE / f"{key}.json"
    if mp3.exists() and meta.exists():
        return json.loads(meta.read_text())
    audio, words = bytearray(), []
    comm = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            audio += chunk["data"]
        elif chunk["type"] == "WordBoundary":
            start = chunk["offset"] / 1e7
            words.append({"text": chunk["text"], "start": round(start, 3),
                          "end": round(start + chunk["duration"] / 1e7, 3)})
    if not audio:
        raise RuntimeError("El servicio de voz no devolvió audio.")
    duration = max([w["end"] for w in words] + [0.0])
    result = {"audio": f"/cache/{key}.mp3", "words": words, "speech_end": round(duration, 3)}
    mp3.write_bytes(bytes(audio))
    meta.write_text(json.dumps(result))
    return result


def safe_join(base: Path, rel: str):
    target = (base / unquote(rel).lstrip("/")).resolve()
    return target if target.is_relative_to(base) and target.is_file() else None


class Handler(BaseHTTPRequestHandler):
    server_version = "JuanStudio/1.0"

    def log_message(self, fmt, *args):
        pass

    def send_bytes(self, status, body, ctype, extra=None):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, status, obj):
        self.send_bytes(status, json.dumps(obj, ensure_ascii=False).encode(), "application/json; charset=utf-8")

    def send_file(self, file):
        """Serve videos with byte ranges so previews can seek without rereading the file."""
        size = file.stat().st_size
        start, end, status = 0, size - 1, 200
        requested = self.headers.get('Range')
        if requested:
            match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested)
            if not match or not any(match.groups()):
                return self.send_bytes(416, b'', 'application/octet-stream', {'Content-Range': f'bytes */{size}'})
            a, b = match.groups()
            if a:
                start, end = int(a), min(int(b), size - 1) if b else size - 1
            else:
                start = max(0, size - int(b))
            if start > end or start >= size:
                return self.send_bytes(416, b'', 'application/octet-stream', {'Content-Range': f'bytes */{size}'})
            status = 206
        ctype = 'text/javascript' if file.suffix == '.js' else mimetypes.guess_type(file.name)[0] or 'application/octet-stream'
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Cache-Control', 'no-store')
        if status == 206:
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.end_headers()
        try:
            with file.open('rb') as source:
                source.seek(start)
                remaining = end - start + 1
                while remaining > 0:
                    chunk = source.read(min(256 * 1024, remaining))
                    if not chunk: break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def do_GET(self):
        if production_api.serve(self, 'GET'):
            return
        path = urlparse(self.path).path
        if path == "/api/voices":
            return self.send_json(200, VOICES)
        if path in ("/", "/index.html"):
            file = STATIC / "index.html"
        elif path.startswith("/web/"):
            file = safe_join(WEB, path[5:] or "index.html")
        elif path == "/api/vocab":
            with VOCAB_LOCK:
                return self.send_json(200, load_vocab())
        elif path == "/api/queue":
            status = QUEUE["status"]
            data = json.loads(status.read_text()) if status.exists() else {"running": False, "total": 0, "done": 0, "results": []}
            proc = QUEUE["proc"]
            data["running"] = bool(proc and proc.poll() is None)
            return self.send_json(200, data)
        elif path.startswith("/output/"):
            file = safe_join(OUTPUT, path[8:])
        elif path.startswith("/cache/"):
            file = safe_join(CACHE, path[7:])
        else:
            file = safe_join(STATIC, path)
        if not file:
            return self.send_json(404, {"error": "No encontrado"})
        ctype = mimetypes.guess_type(file.name)[0] or "application/octet-stream"
        if file.suffix == ".js":
            ctype = "text/javascript"
        self.send_file(file)

    def start_queue(self):
        with QUEUE_LOCK:
            return self._start_queue()

    def _start_queue(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 5_000_000:
                raise ValueError("Cuerpo vacío o demasiado grande.")
            data = json.loads(self.rfile.read(length))
            jobs = data.get("jobs")
            if not isinstance(jobs, list) or not 0 < len(jobs) <= MAX_JOBS:
                raise ValueError(f"Envía entre 1 y {MAX_JOBS} trabajos.")
            for j in jobs:
                if not isinstance(j, dict) or not str(j.get("text", "")).strip() or len(str(j["text"])) > MAX_TEXT:
                    raise ValueError("Cada trabajo necesita un 'text' de 1 a %d caracteres." % MAX_TEXT)
            workers = min(max(int(data.get("workers", 1)), 1), 4)
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            return self.send_json(400, {"error": str(e)})
        proc = QUEUE["proc"]
        if proc and proc.poll() is None:
            return self.send_json(409, {"error": "Ya hay una cola en ejecución."})
        f = tempfile.NamedTemporaryFile("w", suffix=".json", prefix="juan-queue-", delete=False, encoding="utf-8")
        json.dump(jobs, f, ensure_ascii=False); f.close()
        status = OUTPUT / ("queue-" + uuid.uuid4().hex + ".json")
        QUEUE["status"] = status
        status.write_text(json.dumps({"running":True,"total":len(jobs),"done":0,"results":[]}))
        with status.with_suffix('.log').open('w') as log:
            QUEUE["proc"] = subprocess.Popen([sys.executable, str(ROOT / "render.py"), f.name, "--workers", str(workers), "--status", str(status)], stdout=log, stderr=log)
        self.send_json(202, {"started": len(jobs)})

    def vocab_post(self, action):
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= 500_000:
                raise ValueError("Cuerpo vacío o demasiado grande.")
            data = json.loads(self.rfile.read(length))
            with VOCAB_LOCK:
                vocab = load_vocab()
                if action == "learn":      # {words: {palabra: patrón_auto}} -> cuenta y registra palabras nuevas
                    for w, p in (data.get("words") or {}).items():
                        w = str(w)[:40]
                        if not w or not PATTERN_RE.match(str(p)):
                            continue
                        e = vocab.setdefault(w, {"p": p, "src": "auto", "n": 0})
                        e["n"] = e.get("n", 0) + 1
                else:                       # set: corrección del usuario; reset: volver al automático
                    w, p = str(data.get("word", ""))[:40], str(data.get("pattern", "")).strip().upper()
                    if not w:
                        raise ValueError("Falta la palabra.")
                    if action == "set":
                        if not PATTERN_RE.match(p):
                            raise ValueError("Patrón inválido: usa códigos A E I O U M F L S R K N separados por espacio.")
                        vocab[w] = {"p": p, "src": "user", "n": vocab.get(w, {}).get("n", 0)}
                    else:
                        vocab.pop(w, None)
                save_vocab(vocab)
            self.send_json(200, vocab)
        except (ValueError, TypeError, json.JSONDecodeError) as e:
            self.send_json(400, {"error": str(e)})

    def do_POST(self):
        if production_api.serve(self, 'POST'):
            return
        p = urlparse(self.path).path
        if p in ("/api/vocab/learn", "/api/vocab/set", "/api/vocab/reset"):
            return self.vocab_post(p.rsplit("/", 1)[1])
        if urlparse(self.path).path == "/api/queue":
            return self.start_queue()
        if urlparse(self.path).path != "/api/tts":
            return self.send_json(404, {"error": "No encontrado"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if not 0 < length <= MAX_BODY:
                raise ValueError("Cuerpo vacío o demasiado grande.")
            data = json.loads(self.rfile.read(length))
            text = str(data.get("text", "")).strip()
            voice = data.get("voice", "es-MX-JorgeNeural")
            rate = int(data.get("rate", 0))
            if not text or len(text) > MAX_TEXT:
                raise ValueError(f"El texto debe tener entre 1 y {MAX_TEXT} caracteres.")
            if voice not in VOICES:
                raise ValueError("Voz no permitida.")
            if not -50 <= rate <= 50:
                raise ValueError("Velocidad fuera de rango.")
        except (ValueError, json.JSONDecodeError) as e:
            return self.send_json(400, {"error": str(e)})
        try:
            result = asyncio.run(synthesize(text, voice, f"{rate:+d}%"))
        except Exception as e:  # red caída, servicio de voz no disponible, etc.
            return self.send_json(502, {"error": f"No se pudo generar la voz: {e}"})
        self.send_json(200, result)


def main():
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 8800
    for port in range(start, start + 20):
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    else:
        raise SystemExit("No hay puerto libre.")
    print(f"Estudio de Juan: http://127.0.0.1:{port}/", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
