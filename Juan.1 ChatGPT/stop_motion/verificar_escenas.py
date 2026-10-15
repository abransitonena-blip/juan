import bpy,os
D=os.path.dirname(os.path.abspath(__file__))
for name in ['03_curiosidad','04_bienvenida']:
 bpy.ops.wm.open_mainfile(filepath=os.path.join(D,name+'.blend'))
 scene=bpy.context.scene
 animated=[o for o in scene.objects if o.animation_data and o.animation_data.action]
 def values():return {o.name:tuple(o.location)+tuple(o.rotation_euler)+tuple(o.scale) for o in animated}
 seen=set()
 for f in range(1,97,2):
  scene.frame_set(f);a=values();scene.frame_set(f+1);assert a==values(),(name,f,'Interpolacion dentro de una exposicion');seen.add(str(a))
 assert len(seen)>10
 assert scene.render.fps==24 and scene.frame_end==96
 print('VERIFICADO',name,len(animated),'objetos animados;',len(seen),'poses distintas; parejas de fotogramas constantes')
