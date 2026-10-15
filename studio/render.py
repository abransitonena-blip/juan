"""Cola de trabajos: renderiza videos de Juan fuera de tiempo real, sin ventana.

    python3 studio/render.py jobs.json [--fps 24] [--workers 1] [--codec webcodecs|jpeg]

Cada cuadro se dibuja en Chrome headless (window.__juanStudio.jobFrame), se pasa
como JPEG a ffmpeg y se une con el mp3 de studio/cache. Salida: studio/output/*.mp4
y studio/output/queue-status.json con el avance.

jobs.json: lista (o {"jobs": [...]}) de
  {"text": "...", "voice": "jorge",  # voice/outfit/background/camera aceptan "random" "outfit": "artesano", "background": "taller",
   "format": "portrait", "rate": 0, "camera": "alternar", "captions": true,
   "hat": true, "coin": false, "name": "opcional"}
Solo "text" es obligatorio. "format": portrait, landscape, square, tiktok, reels, shorts, youtube, instagram.
Opcionales: "music": "archivo.mp3" (en studio/music/ o ruta absoluta), "music_volume": 0.15.
Cada MP4 lleva un .report.json (palabras nuevas/corregidas, palabras a revisar, verificación del archivo).
Si el MP4 de un trabajo idéntico ya existe se salta (reanuda colas largas); --force lo rehace.
"""
import argparse
import base64
import hashlib
import json
import random
import re
import subprocess
import sys
import threading
import time
import unicodedata
from concurrent.futures import ProcessPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"
STATUS = OUTPUT / "queue-status.json"
CHROME_ARGS = ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader",
               "--autoplay-policy=no-user-gesture-required", "--disable-background-timer-throttling",
               "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"]
BATCH = 6  # cuadros por llamada al navegador

def renderer_fingerprint():
    """A model, mouth or renderer change must invalidate old video cache entries."""
    h = hashlib.sha256()
    files = [Path(__file__), *sorted((ROOT / 'static').glob('*.js')),
             *sorted((ROOT.parent / 'Juan.1 ChatGPT' / 'web').glob('*.js'))]
    for file in files:
        h.update(str(file.relative_to(ROOT.parent)).encode())
        h.update(file.read_bytes())
    vocab = ROOT / 'vocab.json'
    if vocab.exists():
        h.update(vocab.read_bytes())
    return h.hexdigest()[:16]

RENDERER_FINGERPRINT = renderer_fingerprint()

CHOICES = {"voice": ["jorge", "alvaro", "tomas", "dalia"], "outfit": ["artesano", "fiesta", "madera"],
           "background": ["taller", "plaza", "noche", "fiesta", "crema"], "camera": ["alternar", "general", "retrato"]}


def resolve_random(job):
    """'random' en voice/outfit/background/camera elige un valor, siempre el mismo para el mismo trabajo."""
    rnd = random.Random(hashlib.sha256(json.dumps(job, sort_keys=True, ensure_ascii=False).encode()).hexdigest())
    return {**job, **{k: rnd.choice(v) for k, v in CHOICES.items() if job.get(k) == "random"}}


def probe(path):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", str(path)],
                       capture_output=True, text=True)
    d = json.loads(r.stdout or "{}")
    return float(d.get("format", {}).get("duration", 0)), sorted(s["codec_type"] for s in d.get("streams", []))



def slug(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = re.sub(r"[̀-ͯ]", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:40] or "video"


def start_server():
    import server
    srv = None
    for port in range(8900, 8960):
        try:
            srv = server.ThreadingHTTPServer(("127.0.0.1", port), server.Handler)
            break
        except OSError:
            continue
    if srv is None:
        raise SystemExit("No hay puerto libre.")
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, f"http://127.0.0.1:{port}/"


_state = {}


def _worker_init(url):
    from playwright.sync_api import sync_playwright
    pw = sync_playwright().start()
    browser = pw.chromium.launch(channel="chrome", headless=True, args=CHROME_ARGS)
    page = browser.new_page(viewport={"width": 1000, "height": 800})
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(url, wait_until="load")
    page.wait_for_function("window.__juanStudio !== undefined", timeout=30000)
    _state.update(pw=pw, browser=browser, page=page, url=url, errors=errors)


def render_job(args):
    idx, job, fps, quality, codec, force = args
    page = _state["page"]
    t0 = time.time()
    try:
        text = str(job.get("text", "")).strip()
        if not text:
            raise ValueError("falta 'text'")
        job = resolve_random(job)
        key = hashlib.sha256(json.dumps([job, fps, quality, codec, RENDERER_FINGERPRINT], sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:8]
        out = OUTPUT / f"juan-{key}-{slug(job.get('name') or text)}.mp4"
        if out.exists() and not force:  # reanudar: ya está hecho
            dur, kinds = probe(out)
            if dur <= 0 or kinds != ["audio", "video"]:
                raise RuntimeError("El archivo previo está incompleto. Usa --force para volver a generarlo.")
            return {"index": idx, "ok": True, "file": out.name, "seconds": round(dur, 2), "wall": 0, "skipped": True}
        info = page.evaluate("(j) => window.__juanStudio.prepareJob(j)", job)
        total, audio = info["total"], ROOT / info["audio"].lstrip("/")
        w, h = info["size"]
        n = int(total * fps)
        # Audio: se rellena con silencio hasta la duración total (cola de 1 s tras la voz).
        audio_args = ["-i", str(audio)]
        music = job.get("music")
        if music:  # música de fondo en bucle, por debajo de la voz
            mp = Path(music) if Path(music).is_absolute() else ROOT / "music" / music
            if not mp.is_file():
                raise FileNotFoundError(f"música no encontrada: {mp}")
            vol = float(job.get("music_volume", 0.15))
            audio_args += ["-stream_loop", "-1", "-i", str(mp), "-filter_complex",
                           f"[1:a]apad=whole_dur={total:.3f}[v];[2:a]volume={vol}[m];[v][m]amix=inputs=2:duration=first:normalize=0[a]"]
        else:
            audio_args += ["-filter_complex", f"[1:a]apad=whole_dur={total:.3f}[a]"]
        audio_args += ["-map", "0:v", "-map", "[a]", "-c:a", "aac", "-b:a", "128k"]
        tail = ["-t", f"{n / fps:.3f}", "-movflags", "+faststart", str(out)]
        if codec == "webcodecs":  # H.264 por hardware en el navegador; ffmpeg solo empaqueta
            cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "h264", "-r", str(fps), "-i", "-"] + audio_args + ["-c:v", "copy", "-bsf:v", f"setts=ts=N/{fps}/TB"] + tail
            ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            page.evaluate("([f, b]) => window.__juanStudio.encodeStart(f, b)", [fps, 6e6 * (w * h) / (720 * 1280)])
            for start in range(0, n, 24):
                ff.stdin.write(base64.b64decode(page.evaluate("([s, e, f]) => window.__juanStudio.encodeFrames(s, e, f)", [start, min(n, start + 24), fps])))
            ff.stdin.write(base64.b64decode(page.evaluate("() => window.__juanStudio.encodeFinish()")))
        else:  # JPEG por cuadro + libx264 (más lento, no depende de WebCodecs)
            cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-c:v", "mjpeg", "-i", "-"] + audio_args + [
                "-c:v", "libx264", "-preset", "veryfast", "-crf", "20", "-pix_fmt", "yuv420p"] + tail
            ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
            for start in range(0, n, BATCH):
                frames = page.evaluate("([s, e, f, q]) => Array.from({length: e - s}, (_, k) => window.__juanStudio.jobFrame(s + k, f, q))",
                                       [start, min(n, start + BATCH), fps, quality])
                for b64 in frames:
                    ff.stdin.write(base64.b64decode(b64))
        ff.stdin.close()
        if ff.wait() != 0:
            raise RuntimeError("ffmpeg falló")
        dur, kinds = probe(out)  # verificación del archivo final
        problems = []
        if abs(dur - n / fps) > 0.15:
            problems.append(f"duración {dur:.2f} s, esperada {n / fps:.2f} s")
        if kinds != ["audio", "video"]:
            problems.append(f"streams: {kinds}")
        report = info["report"]
        report["video_problems"] = problems
        report["renderer_version"] = RENDERER_FINGERPRINT
        out.with_suffix(".report.json").write_text(json.dumps({"job": job, "report": report, "seconds": round(dur, 2)}, ensure_ascii=False, indent=1))
        if problems:
            raise RuntimeError("; ".join(problems))
        return {"index": idx, "ok": True, "file": out.name, "seconds": round(n / fps, 2), "wall": round(time.time() - t0, 2),
                "size": [w, h], "flagged": len(report["flagged"]), "new_words": report["new"]}
    except Exception as e:  # un trabajo malo no detiene la cola
        return {"index": idx, "ok": False, "error": str(e)[:300], "wall": round(time.time() - t0, 2)}


def write_status(state):
    OUTPUT.mkdir(exist_ok=True)
    tmp = STATUS.with_suffix(".tmp")
    tmp.write_text(json.dumps(state, ensure_ascii=False, indent=1))
    tmp.replace(STATUS)


def run_queue(jobs, fps=24, workers=1, quality=0.92, codec="webcodecs", force=False, url=None):
    OUTPUT.mkdir(exist_ok=True)
    srv = None
    if url is None:
        srv, url = start_server()
    state = {"running": True, "total": len(jobs), "done": 0, "results": [], "started": time.time()}
    write_status(state)
    workers = max(1, min(workers, len(jobs)))
    t0 = time.time()
    with ProcessPoolExecutor(workers, initializer=_worker_init, initargs=(url,)) as pool:
        for r in pool.map(render_job, [(i, j, fps, quality, codec, force) for i, j in enumerate(jobs)]):
            state["results"].append(r)
            state["done"] += 1
            write_status(state)
            print(("OK  " if r["ok"] else "FALLÓ"), r.get("file") or r.get("error"), f"{r.get('seconds', 0)} s de video en {r['wall']} s" + (" (ya existía)" if r.get("skipped") else "") + (f" · {r['flagged']} palabras a revisar" if r.get("flagged") else ""), flush=True)
    wall = time.time() - t0
    video = sum(r.get("seconds", 0) for r in state["results"])
    state.update(running=False, wall=round(wall, 2), video_seconds=round(video, 2), speed=round(video / wall, 2) if wall else 0)
    write_status(state)
    print(f"Total: {video:.1f} s de video en {wall:.1f} s de reloj = {state['speed']}x tiempo real", flush=True)
    if srv:
        srv.shutdown()
    return state


def main():
    global STATUS
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("jobs")
    ap.add_argument("--status", help="archivo de progreso independiente para esta cola")
    ap.add_argument("--fps", type=int, default=24)
    ap.add_argument("--workers", type=int, default=1)
    ap.add_argument("--codec", choices=["webcodecs", "jpeg"], default="webcodecs")
    ap.add_argument("--force", action="store_true", help="volver a renderizar aunque el MP4 ya exista")
    ap.add_argument("--quality", type=float, default=0.92)
    a = ap.parse_args()
    if a.status:
        STATUS = Path(a.status).resolve()
    data = json.loads(Path(a.jobs).read_text())
    jobs = data["jobs"] if isinstance(data, dict) else data
    state = run_queue(jobs, a.fps, a.workers, a.quality, a.codec, a.force)
    sys.exit(0 if all(r["ok"] for r in state["results"]) else 1)


if __name__ == "__main__":
    main()
