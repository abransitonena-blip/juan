"""Turns an episode script into audio + a mouth timeline for Juan.

    python3 scripts/make_episode.py scripts/episodes/demo.json

Steps: edge-tts (free Microsoft voices) -> one mp3 per line -> ffmpeg joins to
one wav -> RMS envelope drives the mouth ("AI" viseme) frame by frame.
Outputs output/<name>/audio.wav and output/<name>/timeline.json.
"""
import asyncio
import json
import os
import subprocess
import sys
import wave
import array

import edge_tts

FPS = 24
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SPEC = json.load(open(os.path.join(ROOT, "character", "juan.json")))


async def synth(text, voice, path):
    await edge_tts.Communicate(text, voice).save(path)


def to_wav(src, dst):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-ac", "1", "-ar", "16000", dst], check=True)


def envelope(wav_path):
    """Return one loudness value (0..1) per video frame."""
    with wave.open(wav_path) as w:
        rate = w.getframerate()
        samples = array.array("h", w.readframes(w.getnframes()))
    per_frame = rate // FPS
    vals = []
    for i in range(0, len(samples), per_frame):
        chunk = samples[i:i + per_frame]
        rms = (sum(s * s for s in chunk) / max(len(chunk), 1)) ** 0.5
        vals.append(min(rms / 6000.0, 1.0))
    # smooth so the mouth doesn't flicker
    out, prev = [], 0.0
    for v in vals:
        prev = prev * 0.5 + v * 0.5
        out.append(round(prev, 3))
    return out


def main(script_path):
    script = json.load(open(script_path))
    name = script["name"]
    out_dir = os.path.join(ROOT, "output", name)
    os.makedirs(out_dir, exist_ok=True)

    parts = []
    for i, line in enumerate(script["lines"]):
        voice = SPEC["voice"][line.get("lang", "es")]
        mp3 = os.path.join(out_dir, f"line{i:03d}.mp3")
        asyncio.run(synth(line["text"], voice, mp3))
        wav = os.path.join(out_dir, f"line{i:03d}.wav")
        to_wav(mp3, wav)
        parts.append(wav)

    listing = os.path.join(out_dir, "parts.txt")
    with open(listing, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")
    audio = os.path.join(out_dir, "audio.wav")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                    "-i", listing, "-c", "copy", audio], check=True)

    env = envelope(audio)
    timeline = {
        "name": name,
        "fps": FPS,
        "frames": len(env),
        "outfit": script.get("outfit", "default"),
        "mouth": env,
    }
    with open(os.path.join(out_dir, "timeline.json"), "w") as f:
        json.dump(timeline, f)
    print(f"{name}: {len(env)} frames ({len(env) / FPS:.1f}s) -> {out_dir}")


if __name__ == "__main__":
    main(sys.argv[1])
