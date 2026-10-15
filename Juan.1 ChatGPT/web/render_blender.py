"""blender -b -P render_blender.py -- toma.glb --output render --height 720 [--still]
Importa una toma GLB animada, conserva la cámara y crea un .blend y PNG/MP4.
"""
import argparse,json,math,os,struct,sys,subprocess
from pathlib import Path
import bpy
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
p=argparse.ArgumentParser();p.add_argument('glb');p.add_argument('--output',default='render_juan');p.add_argument('--height',type=int,default=720);p.add_argument('--samples',type=int,default=32);p.add_argument('--still',action='store_true');a=p.parse_args(args)
source=Path(a.glb).resolve();out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True)
b=source.read_bytes();size=struct.unpack_from('<I',b,12)[0];data=json.loads(b[20:20+size]);duration=max((data['accessors'][s['input']].get('max',[0])[0] for anim in data.get('animations',[]) for s in anim['samplers']),default=0)
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(source));scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=max(1,min(256,a.samples));scene.render.fps=24;scene.frame_start=1;scene.frame_end=max(1,round(duration*24));
cameras=[o for o in scene.objects if o.type=='CAMERA']
if cameras:scene.camera=cameras[0]
else:
 bpy.ops.object.camera_add(location=(0,-8,3));scene.camera=bpy.context.object;scene.camera.rotation_euler=(Vector((0,0,1.5))-scene.camera.location).to_track_quat('-Z','Y').to_euler()
aspect=data.get('cameras',[{}])[0].get('perspective',{}).get('aspectRatio',16/9);scene.render.resolution_y=max(240,min(2160,a.height));scene.render.resolution_x=2*round(scene.render.resolution_y*aspect/2);scene.render.resolution_percentage=100
world=bpy.data.worlds.new('Ambiente de render');world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.77,1);world.node_tree.nodes['Background'].inputs[1].default_value=.5;scene.world=world
bpy.ops.object.light_add(type='AREA',location=(-3,-4,6));light=bpy.context.object;light.name='Luz_suave_de_render';light.data.energy=700;light.data.shape='DISK';light.data.size=5;light.rotation_euler=(Vector((0,0,1.2))-light.location).to_track_quat('-Z','Y').to_euler()
# glTF does not carry hemisphere lights or the 2D background image. Preserve mesh and punctual lights.
scene.frame_set(1);scene.render.image_settings.file_format='PNG';bpy.ops.wm.save_as_mainfile(filepath=str(out/'Juan_toma.blend'))
if a.still:
 scene.frame_set(max(1,round(scene.frame_end*.35)));scene.render.filepath=str(out/'vista.png');bpy.ops.render.render(write_still=True)
else:
 frames=out/'frames';frames.mkdir(exist_ok=True);scene.render.filepath=str(frames/'');bpy.ops.render.render(animation=True)
 subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','24','-start_number','1','-i',str(frames/'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(out/'Juan_toma.mp4')],check=True)
print('RENDER JUAN',json.dumps({'duration':duration,'frames':scene.frame_end,'objects':len(scene.objects),'output':str(out)}))
