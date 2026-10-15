import bpy,os,json
D=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.open_mainfile(filepath=os.path.join(D,'01_saludo_madera.blend'))
poses=json.load(open(os.path.join(D,'poses.json')))
os.makedirs(os.path.join(D,'poses'),exist_ok=True)
for name,p in poses.items():
 for o in bpy.data.objects:
  if o.type=='EMPTY':o.animation_data_clear();o.rotation_euler=(0,0,0)
 for n,r in p.items():bpy.data.objects[n].rotation_euler=r
 bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D,'poses',name+'.blend'))
