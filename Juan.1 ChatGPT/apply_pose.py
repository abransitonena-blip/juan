"""blender -b 01_saludo_madera.blend -P apply_pose.py -- pensar"""
import bpy,os,sys,json
D=os.path.dirname(os.path.abspath(__file__))
name=sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'reposo'
poses=json.load(open(os.path.join(D,'poses.json')))
if name not in poses:raise ValueError('Poses: '+', '.join(poses))
for o in bpy.data.objects:
 if o.type=='EMPTY':o.animation_data_clear();o.rotation_euler=(0,0,0)
for n,rot in poses[name].items():bpy.data.objects[n].rotation_euler=rot
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D,'pose_'+name+'.blend'))
