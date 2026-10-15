"""Blender -b -t 4 -P crear_pruebas.py. Animación digital a doses, 24 fps."""
import bpy, os, json, csv, math
from mathutils import Vector
D=os.path.dirname(os.path.abspath(__file__)); BASE=os.path.dirname(D)
# Grados, poses de actuación originales. Una sola intención por beat.
SHOTS=[dict(name='03_curiosidad',meaning='Juan observa una pieza, duda, se acerca y comprende.',beats=[
 (1,'observar',{},{}),
 (13,'detectar',{'Cabeza':[-5,-9,0]}, {'cejas':.008}),
 (25,'anticipar',{'Torso':[-4,0,0],'Cabeza':[0,-12,0]},{}),
 (41,'examinar',{'Torso':[7,-7,0],'Cabeza':[12,-13,0],'Brazo_L':[-15,20,0],'Codo_L':[-40,0,0]}, {'cejas':.018}),
 (57,'sostener pensamiento',{'Torso':[7,-7,0],'Cabeza':[12,-13,0],'Brazo_L':[-15,20,0],'Codo_L':[-40,0,0]}, {'cejas':.018}),
 (69,'comprender',{'Torso':[0,0,0],'Cabeza':[-6,2,0],'Brazo_L':[-15,30,0],'Codo_L':[-55,0,0]}, {'cejas':.012,'boca':1.6}),
 (81,'asentir',{'Cabeza':[9,2,0],'Brazo_L':[-15,30,0],'Codo_L':[-55,0,0]}, {'boca':1.4}),
 (89,'resolver',{'Cabeza':[0,2,0],'Brazo_L':[-12,20,0],'Codo_L':[-35,0,0]},{}),
 (97,'fin',{'Cabeza':[0,2,0],'Brazo_L':[-12,20,0],'Codo_L':[-35,0,0]}, {})]),
 dict(name='04_bienvenida',meaning='Juan descubre a alguien, hace espacio y ofrece un saludo tranquilo.',beats=[
 (1,'escuchar',{'Cabeza':[0,12,0]},{}),
 (13,'reconocer',{'Cabeza':[-4,0,-5]}, {'cejas':.012}),
 (25,'anticipar',{'Brazo_R':[6,8,0],'Codo_R':[-8,0,0]},{}),
 (41,'abrir saludo',{'Brazo_R':[-8,-105,0],'Codo_R':[-15,-20,0],'Cabeza':[0,0,-4]}, {'boca':1.6}),
 (53,'saludar',{'Brazo_R':[-8,-105,0],'Codo_R':[-15,0,0],'Cabeza':[0,0,-4]}, {'boca':1.6}),
 (65,'saludar vuelta',{'Brazo_R':[-8,-105,0],'Codo_R':[-15,-22,0],'Cabeza':[0,0,-4]}, {'boca':1.6}),
 (77,'invitar',{'Brazo_R':[-15,-50,0],'Codo_R':[-55,0,0],'Brazo_L':[-10,22,0],'Codo_L':[-30,0,0]}, {'boca':1.4}),
 (89,'esperar respuesta',{'Brazo_R':[-15,-50,0],'Codo_R':[-55,0,0],'Brazo_L':[-10,22,0],'Codo_L':[-30,0,0]}, {'boca':1.4}),
 (97,'fin',{'Brazo_R':[-15,-50,0],'Codo_R':[-55,0,0],'Brazo_L':[-10,22,0],'Codo_L':[-30,0,0]}, {'boca':1.4})])]
json.dump(SHOTS,open(os.path.join(D,'actuaciones.json'),'w'),ensure_ascii=False,indent=2)
for shot in SHOTS:
 bpy.ops.wm.open_mainfile(filepath=os.path.join(BASE,'02_baile_atuendo.blend'))
 scene=bpy.context.scene; scene.frame_start=1; scene.frame_end=96; scene.render.fps=24;scene.render.fps_base=1;scene.render.resolution_x=384;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.cycles.samples=8
 controls=[o for o in scene.objects if o.type=='EMPTY']
 for o in controls:o.animation_data_clear();o.rotation_euler=(0,0,0)
 brows=[o for o in scene.objects if o.name.startswith('Ceja')]; mouth=bpy.data.objects['Boca']; rest={o.name:o.location.copy() for o in brows}; mouth_scale=mouth.scale.copy()
 # Physical context: a small golden carved piece on its own display block.
 bpy.ops.mesh.primitive_cylinder_add(vertices=32,radius=.15,depth=.73,location=(-.55,-.12,.365)); block=bpy.context.object;block.name='Pedestal_pieza';block.data.materials.append(bpy.data.materials['Madera miel'])
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=12,location=(-.55,-.12,.78));piece=bpy.context.object;piece.name='Pieza_taller';piece.scale=(.07,.04,.07);piece.data.materials.append(bpy.data.materials['Sombrero palma'])
 sheet=[]; beats=shot['beats']
 for frame in range(1,97,2):
  a,b=next((a,b) for a,b in zip(beats,beats[1:]) if a[0]<=frame<b[0]); t=(frame-a[0])/(b[0]-a[0]);t=t*t*(3-2*t)
  scene.frame_set(frame)
  for o in controls:
   ra=a[2].get(o.name,[0,0,0]);rb=b[2].get(o.name,[0,0,0]);o.rotation_euler=[math.radians(x+(y-x)*t) for x,y in zip(ra,rb)];o.keyframe_insert(data_path='rotation_euler',frame=frame)
  for o in brows:
   o.location=rest[o.name];o.location.z+=a[3].get('cejas',0)+(b[3].get('cejas',0)-a[3].get('cejas',0))*t;o.keyframe_insert(data_path='location',frame=frame)
  mouth.scale=mouth_scale.copy();mouth.scale.z*=a[3].get('boca',1)+(b[3].get('boca',1)-a[3].get('boca',1))*t;mouth.keyframe_insert(data_path='scale',frame=frame)
  sheet.append([frame,frame+1,a[1],shot['meaning']])
 # Constant interpolation preserves each handmade-style exposure for two frames.
 for o in controls+brows+[mouth]:
  action=o.animation_data.action
  for layer in action.layers:
   for strip in layer.strips:
    for bag in strip.channelbags:
     for curve in bag.fcurves:
      for key in curve.keyframe_points:key.interpolation='CONSTANT'
 for frame,label,_,_ in beats[:-1]:scene.timeline_markers.new(label,frame=frame)
 with open(os.path.join(D,shot['name']+'_xsheet.csv'),'w') as f:
  w=csv.writer(f);w.writerow(['fotograma_inicio','fotograma_fin','intencion','contexto']);w.writerows(sheet)
 scene.frame_set(49);bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D,shot['name']+'.blend'))
 folder=os.path.join(D,'frames',shot['name']);os.makedirs(folder,exist_ok=True);scene.render.image_settings.file_format='PNG'
 for i,frame in enumerate(range(1,97,2),1):
  scene.frame_set(frame);scene.render.filepath=os.path.join(folder,f'{i:04d}.png');bpy.ops.render.render(write_still=True)
