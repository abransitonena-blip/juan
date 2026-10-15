"""Ensamblado local, validación y paquete reproducible; no publica en internet."""
import csv,hashlib,json,pathlib,subprocess,zipfile
D=pathlib.Path(__file__).resolve().parent; BASE=D.parent
for name in ['03_curiosidad','04_bienvenida']:
 folder=D/'frames'/name
 frames=sorted(folder.glob('*.png'))
 assert [p.name for p in frames]==[f'{i:04d}.png' for i in range(1,49)],f'Faltan exposiciones: {name}'
 rows=list(csv.DictReader((D/(name+'_xsheet.csv')).open()))
 assert [(int(r['fotograma_inicio']),int(r['fotograma_fin'])) for r in rows]==[(i,i+1) for i in range(1,97,2)]
 subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-i',str(folder/'%04d.png'),'-vf','fps=24','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(D/(name+'.mp4'))],check=True)
 result=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:stream=width,height,nb_frames,r_frame_rate','-of','json',str(D/(name+'.mp4'))]))
 v=result['streams'][0];assert v['nb_frames']=='96' and v['r_frame_rate']=='24/1' and float(result['format']['duration'])==4
 subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-i',str(folder/'%04d.png'),'-vf',"select='eq(n,0)+eq(n,14)+eq(n,26)+eq(n,40)',tile=2x2",'-frames:v','1',str(D/(name+'_secuencia.png'))],check=True)
 print(name, 'OK: 48 exposiciones, 96 fotogramas, 4 segundos, 24 fps')
def deliverable(p):
 r=p.relative_to(BASE)
 return (p.is_file() and not any(x in {'frames','__pycache__','Juan.1_ChatGPT'} for x in r.parts)
  and not p.name.startswith('.') and p.suffix not in {'.zip','.log','.blend1','.pyc'} and p.name!='MANIFIESTO.json')
files=sorted(p for p in BASE.rglob('*') if deliverable(p))
manifest={'destino':'Mismo proyecto local, carpeta Juan.1 ChatGPT','tipo':'Prototipo 3D y animación digital con estética stop motion','archivos':[{'ruta':str(p.relative_to(BASE)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
m=BASE/'MANIFIESTO.json';m.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(BASE/'Juan.1_ChatGPT.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in files+[m]:z.write(p,p.relative_to(BASE))
with zipfile.ZipFile(BASE/'Juan.1_ChatGPT.zip') as z:assert z.testzip() is None
print('Manifiesto y ZIP verificados:',len(files)+1,'archivos')
