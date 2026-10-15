"""Renders Juan's frames in Blender from a timeline, then muxes audio with ffmpeg.

    blender -b character/juan.blend -P scripts/render_episode.py -- output/<name>/timeline.json [--preview]

Each frame sets the "AI" mouth shape key to the audio loudness, then renders a PNG.
"""
import json
import os
import subprocess
import sys

import bpy

argv = sys.argv[sys.argv.index("--") + 1:]
TIMELINE = argv[0]
PREVIEW = "--preview" in argv
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
tl = json.load(open(TIMELINE))
out_dir = os.path.dirname(os.path.abspath(TIMELINE))
frames_dir = os.path.join(out_dir, "frames")
os.makedirs(frames_dir, exist_ok=True)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 540 if PREVIEW else 1080
scene.render.resolution_y = 960 if PREVIEW else 1920
scene.render.fps = tl["fps"]
scene.render.image_settings.file_format = "PNG"

for col in bpy.data.collections:
    if col.name.startswith("Outfit_"):
        col.hide_viewport = col.hide_render = col.name != f"Outfit_{tl['outfit']}"

mouth = bpy.data.objects["Mouth"]
keys = mouth.data.shape_keys.key_blocks

for i, level in enumerate(tl["mouth"]):
    if PREVIEW and i > 48:
        break
    keys["AI"].value = min(level * 1.2, 1.0)
    scene.render.filepath = os.path.join(frames_dir, f"f{i:05d}.png")
    bpy.ops.render.render(write_still=True)

n = min(len(tl["mouth"]), 49) if PREVIEW else len(tl["mouth"])
video = os.path.join(out_dir, "preview.mp4" if PREVIEW else "episode.mp4")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(tl["fps"]),
                "-i", os.path.join(frames_dir, "f%05d.png"),
                "-i", os.path.join(out_dir, "audio.wav"),
                "-t", str(n / tl["fps"]), "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-shortest", video], check=True)
print(f"wrote {video}")
