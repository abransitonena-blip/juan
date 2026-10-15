import bpy, math, os, json
from mathutils import Vector
D=os.path.dirname(os.path.abspath(__file__))
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(n,c):
 m=bpy.data.materials.new(n); m.diffuse_color=(*c,1); m.use_nodes=True; p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*c,1); p.inputs['Roughness'].default_value=.48
 return m
wood=mat('Madera miel',(.5,.245,.085)); dark=mat('Bigote canoso',(.12,.105,.09)); white=mat('Marfil',(.85,.79,.65)); black=mat('Pupila',(.018,.012,.007)); teal=mat('Chaleco petroleo',(.025,.18,.2)); red=mat('Panuelo granate',(.42,.035,.04)); straw=mat('Sombrero palma',(.59,.37,.12))
nodes=wood.node_tree.nodes; noise=nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=7; bump=nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.2; bump.inputs['Distance'].default_value=.035; wood.node_tree.links.new(noise.outputs['Fac'],bump.inputs['Height']); wood.node_tree.links.new(bump.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])
controls={}; outfits=[]
def ctrl(n,loc,parent=None):
 o=bpy.data.objects.new(n,None); bpy.context.collection.objects.link(o); o.location=loc; o.parent=parent; controls[n]=o; return o
def ball(n,loc,scale,material,parent=None):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=24,ring_count=16); o=bpy.context.object; o.name=n; o.parent=parent; o.location=loc; o.scale=scale; o.data.materials.append(material)
 for f in o.data.polygons:f.use_smooth=True
 return o
root=ctrl('Raiz',(0,0,0)); torso=ctrl('Torso',(0,0,1.18),root)
ball('Torso madera',(0,0,0),(.27,.15,.35),wood,torso); ball('Cadera',(0,0,.84),(.22,.14,.15),wood,root)
head=ctrl('Cabeza',(0,0,.48),torso); ball('Cuello',(0,0,-.16),(.075,.075,.12),wood,head); ball('Rostro',(0,0,.06),(.225,.19,.28),wood,head)
for s in [-1,1]:
 ball('Oreja',(s*.23,0,.05),(.045,.035,.075),wood,head)
 ball('Ojo',(s*.085,-.17,.12),(.058,.028,.05),white,head); ball('Pupila',(s*.085,-.196,.12),(.027,.012,.029),black,head)
 o=ball('Ceja',(s*.085,-.18,.19),(.075,.025,.021),dark,head); o.rotation_euler.y=s*-.18
 o=ball('Bigote',(s*.075,-.209,-.005),(.09,.027,.03),dark,head); o.rotation_euler.y=s*-.22
 ball('Rizo bigote',(s*.155,-.199,.015),(.022,.025,.038),dark,head)
ball('Nariz',(0,-.212,.064),(.047,.062,.064),wood,head)
ball('Boca',(0,-.178,-.06),(.057,.02,.014),dark,head)
for s,label in [(-1,'L'),(1,'R')]:
 arm=ctrl('Brazo_'+label,(s*.3,0,.18),torso); ball('Hombro',(0,0,0),(.075,.075,.075),dark,arm); ball('Brazo',(0,0,-.16),(.061,.061,.17),wood,arm)
 elbow=ctrl('Codo_'+label,(0,0,-.33),arm); ball('Articulacion',(0,0,0),(.06,.06,.06),dark,elbow); ball('Antebrazo',(0,0,-.14),(.05,.05,.145),wood,elbow)
 ball('Palma',(0,0,-.32),(.065,.035,.075),wood,elbow)
 for i in range(4):ball('Dedo',((i-1.5)*.028,-.006,-.405),(.012,.018,.043),wood,elbow)
 ball('Pulgar',(s*.075,-.004,-.33),(.025,.025,.05),wood,elbow)
 leg=ctrl('Pierna_'+label,(s*.12,0,.84),root); ball('Muslo',(0,0,-.18),(.085,.085,.19),wood,leg)
 knee=ctrl('Rodilla_'+label,(0,0,-.38),leg); ball('Rodilla',(0,0,0),(.068,.068,.068),dark,knee); ball('Pantorrilla',(0,0,-.16),(.061,.061,.17),wood,knee); ball('Pie',(0,-.06,-.36),(.085,.15,.06),wood,knee)
# Independent wardrobe collection, toggled between clips.
outfits.append(ball('ATUENDO_Chaleco',(0,0,0),(.285,.165,.34),teal,torso))
outfits.append(ball('ATUENDO_Panuelo',(0,-.16,.25),(.11,.04,.13),red,torso))
outfits.append(ball('ATUENDO_Ala',(0,0,.3),(.39,.32,.036),straw,head))
outfits.append(ball('ATUENDO_Copa',(0,.015,.39),(.235,.2,.15),straw,head))
for z in [-.18,-.04,.1]:outfits.append(ball('ATUENDO_Boton',(0,-.169,z),(.018,.013,.018),straw,torso))
poses={'reposo':{},'saludo':{'Brazo_R':(0,-2.2,0),'Codo_R':(-.3,-.5,0)},'presentar':{'Brazo_L':(-.5,.8,0),'Codo_L':(-1,0,0)},'pensar':{'Brazo_R':(-.7,-.6,0),'Codo_R':(-1.8,0,0)},'brazos_abiertos':{'Brazo_R':(0,-1.1,0),'Brazo_L':(0,1.1,0)},'celebrar':{'Brazo_R':(0,-2.6,0),'Brazo_L':(0,2.6,0)},'inclinar':{'Torso':(.25,0,0)},'paso':{'Pierna_L':(.5,0,0),'Pierna_R':(-.5,0,0)}}
json.dump(poses,open(os.path.join(D,'poses.json'),'w'),indent=2)
scene=bpy.context.scene; scene.render.engine='CYCLES'; scene.cycles.samples=12; scene.render.resolution_x=480; scene.render.resolution_y=640; scene.render.resolution_percentage=100; scene.render.fps=24; scene.frame_end=72
floor=mat('Suelo',(.035,.065,.07)); bpy.ops.mesh.primitive_plane_add(size=200); bpy.context.object.data.materials.append(floor)
world=bpy.data.worlds.new('Estudio'); scene.world=world; world.use_nodes=True; world.node_tree.nodes['Background'].inputs[0].default_value=(.13,.19,.21,1); world.node_tree.nodes['Background'].inputs[1].default_value=.5
for loc,power,size in [((3,-4,5),650,4),((-3,-1,3),450,3),((0,3,4),850,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc); o=bpy.context.object; o.data.energy=power; o.data.shape='DISK'; o.data.size=size; o.rotation_euler=(Vector((0,0,1.1))-o.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(2.7,-6,2.7)); cam=bpy.context.object; cam.rotation_euler=(Vector((0,0,1.05))-cam.location).to_track_quat('-Z','Y').to_euler(); cam.data.type='ORTHO'; cam.data.ortho_scale=2.65; scene.camera=cam
for mode in ['01_saludo_madera','02_baile_atuendo']:
 for o in controls.values():o.animation_data_clear(); o.rotation_euler=(0,0,0)
 for o in outfits:o.hide_render=mode.startswith('01'); o.hide_viewport=o.hide_render
 for f in range(1,73):
  t=(f-1)/71; scene.frame_set(f)
  for o in controls.values():o.rotation_euler=(0,0,0)
  if mode.startswith('01'):
   controls['Brazo_R'].rotation_euler.y=-2.1; controls['Codo_R'].rotation_euler.y=-.4+.3*math.sin(t*math.pi*6); head.rotation_euler.y=.1*math.sin(t*math.pi*2)
  else:
   torso.rotation_euler.y=.12*math.sin(t*math.pi*4)
   for s,l in [(-1,'L'),(1,'R')]:
    controls['Brazo_'+l].rotation_euler.y=s*(-.7+.4*math.sin(t*math.pi*4)); controls['Pierna_'+l].rotation_euler.x=s*.25*math.sin(t*math.pi*4); controls['Codo_'+l].rotation_euler.x=-.6
  for o in controls.values():o.keyframe_insert(data_path='rotation_euler',frame=f)
 scene.frame_set(1); bpy.ops.wm.save_as_mainfile(filepath=os.path.join(D,mode+'.blend'))
 scene.render.image_settings.file_format='PNG'; scene.render.filepath=os.path.join(D,mode+'.png'); bpy.ops.render.render(write_still=True)
 scene.render.resolution_percentage=60
 scene.render.image_settings.file_format='PNG'; scene.render.filepath=os.path.join(D,'frames',mode,''); os.makedirs(scene.render.filepath,exist_ok=True)
 bpy.ops.render.render(animation=True)
 scene.render.resolution_percentage=100
