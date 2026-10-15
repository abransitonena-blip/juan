import bpy,os
D=os.path.dirname(os.path.abspath(__file__))
for name in ['01_saludo_madera','02_baile_atuendo']:
 bpy.ops.wm.open_mainfile(filepath=os.path.join(D,name+'.blend'))
 bpy.ops.object.select_all(action='DESELECT')
 for o in bpy.context.scene.objects:
  if o.type in {'MESH','EMPTY'} and o.name!='Plane' and not o.hide_render:o.select_set(True)
 bpy.ops.export_scene.gltf(filepath=os.path.join(D,name+'.glb'),use_selection=True,export_animations=True,export_animation_mode="SCENE")
