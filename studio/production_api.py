"""Rutas compartidas por los editores. Sin servicios ni base de datos externos."""
import json
import mimetypes
import re
from urllib.parse import parse_qs, urlparse
import production_store as store

PREFIX = '/api/production'

def serve(handler, method):
    parsed = urlparse(handler.path)
    path = parsed.path
    if not path.startswith(PREFIX + '/'):
        return False
    try:
        if method == 'GET':
            if path == PREFIX + '/projects':
                handler.send_json(200, store.listing())
            elif path == PREFIX + '/media':
                handler.send_json(200, store.media_list())
            elif path.startswith(PREFIX + '/media/'):
                file = store.media_path(path.rsplit('/',1)[1])
                if not file or not file.is_file():
                    handler.send_json(404, {'error':'Recurso no encontrado.'})
                else:
                    handler.send_file(file)
            elif path.startswith(PREFIX + '/projects/'):
                pid = path.split('/')[4]
                if path.endswith('/history'):
                    handler.send_json(200,store.history(pid))
                else:
                    revision = parse_qs(parsed.query).get('revision',[None])[0]
                    handler.send_json(200,store.get(pid,int(revision) if revision else None))
            elif path == PREFIX + '/outputs':
                result=[]
                for file in sorted((store.ROOT / 'output').glob('*.mp4'),key=lambda f:f.stat().st_mtime,reverse=True):
                    report=file.with_suffix('.report.json')
                    try: meta=json.loads(report.read_text()) if report.exists() else {}
                    except (OSError,ValueError): meta={}
                    result.append({'name':file.name,'url':'/output/'+file.name,'bytes':file.stat().st_size,
                        'seconds':meta.get('seconds'),'report':meta.get('report',{}),
                        'job':meta.get('job',{}),'verified':bool(meta.get('report')) and not meta.get('report',{}).get('video_problems')})
                handler.send_json(200,result)
            else:
                handler.send_json(404,{'error':'Ruta no encontrada.'})
        elif method == 'POST':
            # Same-origin browser requests only; local endpoint has no public write access.
            origin=handler.headers.get('Origin')
            if origin and origin != 'http://' + handler.headers.get('Host',''):
                handler.send_json(403,{'error':'Origen no permitido.'})
                return True
            length=int(handler.headers.get('Content-Length','0'))
            limit=50*1024*1024 if path == PREFIX+'/media' else 21_000_000
            if not 0 < length <= limit:
                raise ValueError('Archivo vacío o demasiado grande.')
            if path == PREFIX+'/media':
                q=parse_qs(parsed.query)
                def arg(k,default=''): return q.get(k,[default])[0]
                rev=arg('revision')
                result=store.add_media(handler.rfile.read(length),arg('name'),arg('kind'),arg('project') or None,
                    int(rev) if rev else None,arg('source'),arg('license'))
                handler.send_json(201,result)
            else:
                data=json.loads(handler.rfile.read(length))
                if path == PREFIX+'/projects':
                    handler.send_json(200,store.save(data))
                elif re.fullmatch(PREFIX+r'/projects/[^/]+/archive',path):
                    store.archive(path.split('/')[4],data.get('archived',True))
                    handler.send_json(200,{'ok':True})
                else: handler.send_json(404,{'error':'Ruta no encontrada.'})
        return True
    except store.Conflict as e:
        handler.send_json(409,{'error':str(e)})
    except (ValueError,TypeError,KeyError) as e:
        handler.send_json(400,{'error':str(e)})
    return True
