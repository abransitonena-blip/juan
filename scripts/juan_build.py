"""Builds the 3D character Juan in Blender.

    blender -b -P scripts/juan_build.py -- character/juan.blend

Forms are smoothed with Subdivision Surface, so the figure reads as a
sculpted wood-and-clay toy rather than raw primitives. Outfits are Blender
collections (Outfit_<name>); set_outfit() shows one and hides the rest.
Mouth shape keys are named after visemes (see juan.json); render_episode.py
drives the "AI" key from audio loudness.
"""
import json
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
SPEC = json.load(open(os.path.join(HERE, "..", "character", "juan.json")))
OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "character/juan.blend"


# ---------- helpers ----------

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


def mat(name, hex_color, rough=0.6, sheen=0.0, sss=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = hex_rgb(hex_color)
    b.inputs["Roughness"].default_value = rough
    if sheen:
        b.inputs["Sheen Weight"].default_value = sheen
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
    return m


def link(o, col):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    col.objects.link(o)
    return o


def finish(o, col, material, subdiv=2, smooth=True):
    """Apply material, smooth shading and a Subdivision Surface modifier."""
    o.data.materials.append(material)
    if smooth:
        bpy.context.view_layer.objects.active = o
        o.select_set(True)
        bpy.ops.object.shade_smooth()
        o.select_set(False)
    if subdiv:
        m = o.modifiers.new("Subdiv", "SUBSURF")
        m.levels = 1
        m.render_levels = subdiv
    return link(o, col)


def prim(kind, name, col, mtl, loc=(0, 0, 0), scale=(1, 1, 1), rot=(0, 0, 0), subdiv=2, smooth=True):
    ops = {
        "sphere": lambda: bpy.ops.mesh.primitive_uv_sphere_add(segments=40, ring_count=24, location=loc),
        "cube": lambda: bpy.ops.mesh.primitive_cube_add(location=loc),
        "cylinder": lambda: bpy.ops.mesh.primitive_cylinder_add(vertices=40, location=loc),
        "cone": lambda: bpy.ops.mesh.primitive_cone_add(vertices=40, location=loc),
        "torus": lambda: bpy.ops.mesh.primitive_torus_add(major_radius=1, minor_radius=0.25, location=loc),
    }
    ops[kind]()
    o = bpy.context.active_object
    o.name = name
    o.scale = scale
    o.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    return finish(o, col, mtl, subdiv=subdiv, smooth=smooth)


def bevel_all(o, width=0.01, segments=3):
    m = o.modifiers.new("Bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    return o


# ---------- body parts ----------

def build_head(col, s):
    skin = mat("Skin", s["skin"], rough=0.55, sss=0.15)
    eye_w = mat("EyeWhite", "#f5f0e6", rough=0.2)
    eye_i = mat("EyeIris", s["eyes"], rough=0.15)
    brow = mat("Brow", s["hair"]["color"], rough=0.9)
    lip = mat("Lip", "#7a3b2e", rough=0.5)

    # Head: slightly tall ellipsoid, wider at cheekbones
    head = prim("sphere", "Head", col, skin, loc=(0, 0, 1.55), scale=(0.19, 0.2, 0.23), subdiv=3)
    # Cheeks
    for side in (-1, 1):
        prim("sphere", f"Cheek{side}", col, skin, loc=(side * 0.11, -0.14, 1.5),
             scale=(0.07, 0.06, 0.06))
    # Ears
    for side in (-1, 1):
        prim("sphere", f"Ear{side}", col, skin, loc=(side * 0.19, 0.0, 1.55),
             scale=(0.03, 0.035, 0.055))
    # Nose: wedge-like bridge plus rounded tip
    prim("sphere", "NoseBridge", col, skin, loc=(0, -0.2, 1.6), scale=(0.03, 0.05, 0.08))
    prim("sphere", "NoseTip", col, skin, loc=(0, -0.235, 1.53), scale=(0.04, 0.04, 0.03))
    # Eyes: white ball + iris + brow
    for side in (-1, 1):
        x = side * 0.075
        prim("sphere", f"EyeW{side}", col, eye_w, loc=(x, -0.18, 1.6), scale=(0.035, 0.02, 0.03), subdiv=1)
        prim("sphere", f"Iris{side}", col, eye_i, loc=(x, -0.2, 1.6), scale=(0.02, 0.012, 0.02), subdiv=1)
        brow_o = prim("sphere", f"Brow{side}", col, brow, loc=(x, -0.18, 1.67),
                      scale=(0.065, 0.02, 0.012), rot=(0, 0, side * 0.25), subdiv=1)
    # Mustache: two curled, layered halves (the reference's signature feature)
    for side in (-1, 1):
        prim("sphere", f"MustacheMain{side}", col, brow, loc=(side * 0.07, -0.205, 1.48),
             scale=(0.08, 0.028, 0.02), rot=(0, 0, side * 0.5), subdiv=2)
        prim("sphere", f"MustacheCurl{side}", col, brow, loc=(side * 0.135, -0.2, 1.5),
             scale=(0.03, 0.02, 0.03), rot=(0, 0, side * 0.2), subdiv=1)
    # Hair: grey fringe under the hat
    prim("torus", "Hair", col, brow, loc=(0, 0, 1.68), scale=(0.2, 0.19, 0.035), subdiv=2)
    # Neck
    prim("cylinder", "Neck", col, skin, loc=(0, 0.01, 1.32), scale=(0.075, 0.075, 0.1), subdiv=2)
    return head


def build_mouth(col, s):
    """Lips = flat mesh with a shape key per viseme. Base pose is closed."""
    lip = mat("Lip", "#6b2c22", rough=0.45)
    mouth = prim("sphere", "Mouth", col, lip, loc=(0, -0.205, 1.42), scale=(0.045, 0.012, 0.01), subdiv=1)
    mouth.shape_key_add(name="rest", from_mix=False)
    shapes = {
        "AI": (1.0, 2.6), "E": (1.0, 1.4), "O": (0.7, 2.0), "U": (0.6, 1.8),
        "FV": (1.1, 0.5), "MBP": (1.0, 0.2), "LN": (0.9, 0.8), "WQ": (0.6, 1.6), "etc": (0.9, 1.1),
    }
    for vname, (wx, hz) in shapes.items():
        key = mouth.shape_key_add(name=vname, from_mix=False)
        for v in key.data:
            v.co.x *= wx
            v.co.z *= hz
    return mouth


def build_torso(col, s):
    skin_arm = mat("SkinArm", s["skin"], rough=0.55)
    # Torso: rounded box, slightly wider at the chest
    prim("sphere", "Chest", col, mat("ShirtBase", "#f2e8d5", rough=0.85, sheen=0.3),
         loc=(0, 0, 1.02), scale=(0.21, 0.11, 0.27), subdiv=3)
    # Collar of the shirt
    prim("torus", "Collar", col, mat("Collar", "#f2e8d5", rough=0.85),
         loc=(0, -0.03, 1.3), scale=(0.11, 0.08, 0.03), subdiv=2)


def build_arms(col, s):
    """Wooden jointed arms: upper arm, forearm, hand with fingers."""
    wood = mat("WoodArm", "#c0884e", rough=0.5)
    shirt = mat("ShirtSleeve", "#f2e8d5", rough=0.85, sheen=0.3)
    for side in (-1, 1):
        # Shoulder
        prim("sphere", f"Shoulder{side}", col, shirt, loc=(side * 0.27, 0, 1.2), scale=(0.07, 0.07, 0.07))
        # Upper arm (sleeve, rolled cuff at elbow)
        prim("cylinder", f"UpperArm{side}", col, shirt, loc=(side * 0.31, 0, 1.0),
             scale=(0.055, 0.055, 0.17), rot=(0, 0, side * 0.12))
        # Forearm (wooden, visible below rolled sleeve)
        prim("cylinder", f"Forearm{side}", col, wood, loc=(side * 0.34, -0.03, 0.72),
             scale=(0.045, 0.045, 0.15), rot=(0, 0, side * 0.1))
        # Wrist joint
        prim("sphere", f"Wrist{side}", col, wood, loc=(side * 0.35, -0.03, 0.56), scale=(0.04, 0.04, 0.035))
        # Palm
        prim("sphere", f"Palm{side}", col, wood, loc=(side * 0.36, -0.04, 0.5), scale=(0.055, 0.035, 0.07))
        # Fingers and thumb: slightly curled cylinders
        for i in range(4):
            fx = side * (0.355 + (i - 1.5) * 0.02)
            prim("cylinder", f"Finger{side}_{i}", col, wood, loc=(fx, -0.07, 0.43),
                 scale=(0.011, 0.011, 0.05), rot=(math.radians(-20), 0, 0), subdiv=1)
        prim("cylinder", f"Thumb{side}", col, wood, loc=(side * 0.4, -0.05, 0.47),
             scale=(0.012, 0.012, 0.04), rot=(0, math.radians(-30), side * 0.6), subdiv=1)


def build_vest_and_pants(col_outfit, o):
    """Per-outfit clothing, built into the outfit collection."""
    vest = mat(f"Vest_{o['vest']['color']}", o["vest"]["color"], rough=0.9, sheen=0.5)
    btn = mat(f"Btn_{o['vest']['buttons']}", o["vest"]["buttons"], rough=0.3)
    pants = mat(f"Pants_{o['pants']['color']}", o["pants"]["color"], rough=0.95, sheen=0.4)
    hat_m = mat(f"Hat_{o['hat']['color']}", o["hat"]["color"], rough=0.8)
    shirt_m = mat(f"Shirt_{o['shirt']['color']}", o["shirt"]["color"], rough=0.85, sheen=0.3)

    # Vest: a slightly flared, rounded box with a V opening
    vest_o = prim("cube", "Vest", col_outfit, vest, loc=(0, -0.02, 1.0), scale=(0.25, 0.15, 0.3), subdiv=0)
    bevel_all(vest_o, width=0.05, segments=4)
    # Lapel strips to show the open V
    for side in (-1, 1):
        prim("cube", f"Lapel{side}", col_outfit, shirt_m, loc=(side * 0.07, -0.16, 1.2),
             scale=(0.025, 0.01, 0.1), rot=(0, math.radians(side * 15), 0), subdiv=1)
    # Four buttons down the front
    for z in (1.18, 1.05, 0.92):
        prim("sphere", f"Button{z}", col_outfit, btn, loc=(0, -0.175, z), scale=(0.018, 0.012, 0.018), subdiv=1)
    # Pockets
    for side in (-1, 1):
        prim("cube", f"Pocket{side}", col_outfit, vest, loc=(side * 0.12, -0.16, 0.95),
             scale=(0.05, 0.008, 0.035), subdiv=1)
    # Neckerchief (tied, with a knot and two tails)
    if o.get("neckerchief"):
        nk = mat(f"Neck_{o['neckerchief']['color']}", o["neckerchief"]["color"], rough=0.9, sheen=0.4)
        prim("sphere", "NeckKnot", col_outfit, nk, loc=(0, -0.17, 1.27), scale=(0.035, 0.025, 0.03), subdiv=2)
        for side in (-1, 1):
            prim("cone", f"NeckTail{side}", col_outfit, nk, loc=(side * 0.03, -0.19, 1.2),
                 scale=(0.04, 0.012, 0.08), rot=(math.radians(-20), 0, side * 0.3), subdiv=1)
    # Belt and trousers
    belt = prim("cube", "Belt", col_outfit, mat("Belt", "#4a2e18", rough=0.5),
                loc=(0, 0, 0.74), scale=(0.215, 0.145, 0.025), subdiv=1)
    bevel_all(belt, width=0.008, segments=2)
    prim("cube", "Trousers", col_outfit, pants, loc=(0, 0, 0.45), scale=(0.21, 0.14, 0.33), subdiv=3)
    for side in (-1, 1):
        prim("cube", f"Leg{side}", col_outfit, pants, loc=(side * 0.1, 0, 0.2),
             scale=(0.09, 0.1, 0.22), subdiv=2)
        # Boots
        prim("sphere", f"Boot{side}", col_outfit, mat("Boot", "#3e2716", rough=0.4),
             loc=(side * 0.1, -0.05, 0.0), scale=(0.11, 0.14, 0.07), subdiv=2)
    # Straw sombrero: wide brim, cone crown, colored band
    prim("cylinder", "HatBrim", col_outfit, hat_m, loc=(0, 0, 1.75), scale=(0.44, 0.44, 0.018), subdiv=2)
    prim("cone", "HatCrown", col_outfit, hat_m, loc=(0, 0, 1.88), scale=(0.2, 0.2, 0.16), subdiv=2)
    band_m = mat(f"Band_{o['hat']['color']}", o["hat"].get("band", "#6b4b2a"), rough=0.6)
    prim("torus", "HatBand", col_outfit, band_m, loc=(0, 0, 1.78), scale=(0.2, 0.2, 0.025), subdiv=2)


def build_props(col, s):
    clay = mat("ClayPig", "#c96f4a", rough=0.55)
    gold = mat("Gold", "#d4a017", rough=0.2)
    # Piggy bank: body, snout, ears, legs, coin slot
    prim("sphere", "PigBody", col, clay, loc=(0.6, -0.4, 0.78), scale=(0.13, 0.11, 0.1), subdiv=3)
    prim("cylinder", "PigSnout", col, clay, loc=(0.7, -0.4, 0.8), scale=(0.03, 0.03, 0.02),
         rot=(0, math.radians(90), 0), subdiv=2)
    for x in (0.52, 0.66):
        prim("cone", f"PigEar{x}", col, clay, loc=(x, -0.4, 0.9), scale=(0.025, 0.02, 0.03), subdiv=1)
        prim("cylinder", f"PigLeg{x}", col, clay, loc=(x, -0.4, 0.66), scale=(0.025, 0.025, 0.04), subdiv=1)
    # Coins: the one in hand, plus a small stack on the table
    prim("cylinder", "CoinHeld", col, gold, loc=(-0.42, -0.25, 1.15),
         scale=(0.045, 0.045, 0.006), rot=(math.radians(90), 0, 0), subdiv=1)
    for i in range(4):
        prim("cylinder", f"CoinStack{i}", col, gold, loc=(0.72, -0.1, 0.65 + i * 0.012),
             scale=(0.04, 0.04, 0.006), subdiv=1)
    # Table is implied in the reference; a simple board keeps the scene grounded
    prim("cube", "Table", col, mat("Wood", "#6e4a2a", rough=0.7),
         loc=(0.4, -0.3, 0.5), scale=(0.6, 0.35, 0.02), subdiv=0, smooth=False)


def setup_camera_and_light():
    bpy.ops.object.camera_add(location=(0, -4.6, 1.25), rotation=(math.radians(88), 0, 0))
    cam = bpy.context.active_object
    bpy.context.scene.camera = cam
    bpy.ops.object.light_add(type="AREA", location=(1.5, -2.5, 2.5))
    key = bpy.context.active_object
    key.data.energy = 450
    key.data.size = 2.5
    bpy.ops.object.light_add(type="SUN", location=(-2, -2, 3))
    bpy.context.active_object.data.energy = 1.2
    bpy.context.scene.render.engine = "BLENDER_EEVEE"
    bpy.context.scene.view_settings.view_transform = "Standard"
    world = bpy.context.scene.world or bpy.data.worlds.new("World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = hex_rgb("#2a1d14")


def set_outfit(name):
    for col in bpy.data.collections:
        if col.name.startswith("Outfit_"):
            col.hide_viewport = col.hide_render = col.name != f"Outfit_{name}"


def main():
    clear_scene()
    body = bpy.data.collections.new("Body")
    bpy.context.scene.collection.children.link(body)
    s = SPEC["body"]
    build_head(body, s)
    build_mouth(body, s)
    build_torso(body, s)
    build_arms(body, s)
    props = bpy.data.collections.new("Props")
    bpy.context.scene.collection.children.link(props)
    build_props(props, s)
    for name, outfit in SPEC["outfits"].items():
        oc = bpy.data.collections.new(f"Outfit_{name}")
        bpy.context.scene.collection.children.link(oc)
        build_vest_and_pants(oc, outfit)
    setup_camera_and_light()
    set_outfit("default")
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(OUT))
    print(f"saved {OUT}")


if __name__ == "__main__":
    main()
