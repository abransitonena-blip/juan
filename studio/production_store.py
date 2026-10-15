"""Biblioteca local: proyectos y revisiones inmutables en SQLite; medios en disco."""
import hashlib
import json
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'data' / 'production.sqlite3'
MEDIA = ROOT / 'data' / 'media'
ENGINES = {'scene3d', 'speech', 'blocks'}

class Conflict(ValueError):
    pass

def now():
    return datetime.now(timezone.utc).isoformat(timespec='microseconds')

@contextmanager
def connect(db=DB):
    db.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db, timeout=15) as c:
        c.row_factory = sqlite3.Row
        c.execute('PRAGMA foreign_keys=ON')
        c.execute('PRAGMA journal_mode=WAL')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY, title TEXT NOT NULL, engine TEXT NOT NULL,
          series TEXT NOT NULL DEFAULT '', season INTEGER NOT NULL DEFAULT 1,
          episode INTEGER NOT NULL DEFAULT 1, revision INTEGER NOT NULL,
          archived INTEGER NOT NULL DEFAULT 0, updated TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS revisions (
          project_id TEXT NOT NULL REFERENCES projects(id), revision INTEGER NOT NULL,
          payload TEXT NOT NULL, notes TEXT NOT NULL, created TEXT NOT NULL,
          PRIMARY KEY(project_id, revision));
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL, path TEXT NOT NULL,
          sha256 TEXT NOT NULL, bytes INTEGER NOT NULL, project_id TEXT REFERENCES projects(id),
          revision INTEGER, source TEXT NOT NULL, license TEXT NOT NULL, created TEXT NOT NULL);
        ''')
        yield c

def clean(value, limit=140):
    return str(value or '').strip()[:limit]

def validate(data):
    if not isinstance(data, dict) or data.get('engine') not in ENGINES:
        raise ValueError('Elige un editor válido.')
    p = data.get('payload')
    if not isinstance(p, dict):
        raise ValueError('Falta el contenido del proyecto.')
    engine = data['engine']
    if engine == 'speech' and not 1 <= len(str(p.get('text', '')).strip()) <= 3000:
        raise ValueError('El guion debe tener entre 1 y 3000 caracteres.')
    if engine == 'scene3d' and (p.get('version') not in (2, 3) or not isinstance(p.get('clips'), list) or not 1 <= len(p['clips']) <= 40):
        raise ValueError('La película necesita entre 1 y 40 tomas.')
    if engine == 'blocks' and (not isinstance(p.get('blocks'), list) or len(p['blocks']) > 80):
        raise ValueError('El proyecto admite hasta 80 bloques.')
    # Detailed engine validation still runs on opening in the corresponding editor.
    body = json.dumps(p, ensure_ascii=False, allow_nan=False)
    if len(body.encode()) > 20_000_000:
        raise ValueError('El proyecto supera los 20 MB.')
    notes = data.get('notes', {})
    if not isinstance(notes, dict) or len(json.dumps(notes).encode()) > 50_000:
        raise ValueError('Las notas deben ser un objeto de hasta 50 KB.')
    return body, json.dumps(notes, ensure_ascii=False, allow_nan=False)

def save(data, db=DB):
    body, notes = validate(data)
    stamp, pid = now(), clean(data.get('id'), 80) or uuid.uuid4().hex
    title = clean(data.get('title')) or 'Una historia de Juan'
    season, episode = int(data.get('season', 1)), int(data.get('episode', 1))
    if not (1 <= season <= 999 and 1 <= episode <= 9999):
        raise ValueError('Temporada o episodio fuera de rango.')
    with connect(db) as c:
        c.execute('BEGIN IMMEDIATE')
        old = c.execute('SELECT * FROM projects WHERE id=?', (pid,)).fetchone()
        if old and old['revision'] != data.get('expectedRevision'):
            raise Conflict('Existe una versión más reciente. Abre el proyecto antes de guardar otra vez; tu edición sigue en el editor.')
        if old and old['engine'] != data['engine']:
            raise ValueError('El editor de un proyecto no puede cambiar.')
        if not old and data.get('id'):
            raise ValueError('El proyecto ya no existe. Guarda una copia.')
        rev = old['revision'] + 1 if old else 1
        c.execute('''INSERT INTO projects(id,title,engine,series,season,episode,revision,updated)
          VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,
          series=excluded.series,season=excluded.season,episode=excluded.episode,
          revision=excluded.revision,updated=excluded.updated''',
          (pid, title, data['engine'], clean(data.get('series')), season, episode, rev, stamp))
        c.execute('INSERT INTO revisions VALUES(?,?,?,?,?)', (pid,rev,body,notes,stamp))
    return get(pid, db=db)

def get(pid, revision=None, db=DB):
    with connect(db) as c:
        project = c.execute('SELECT * FROM projects WHERE id=?', (pid,)).fetchone()
        if not project:
            raise ValueError('Proyecto no encontrado.')
        row = c.execute('SELECT * FROM revisions WHERE project_id=? AND revision=?', (pid, revision or project['revision'])).fetchone()
        if not row:
            raise ValueError('Versión no encontrada.')
        result = dict(project)
        result.update(payload=json.loads(row['payload']), notes=json.loads(row['notes']), loadedRevision=row['revision'])
        return result

def listing(db=DB):
    with connect(db) as c:
        return [dict(r) for r in c.execute('SELECT * FROM projects ORDER BY updated DESC')]

def history(pid, db=DB):
    with connect(db) as c:
        return [dict(r) for r in c.execute('SELECT revision,created FROM revisions WHERE project_id=? ORDER BY revision DESC', (pid,))]

def archive(pid, value, db=DB):
    with connect(db) as c:
        if not c.execute('UPDATE projects SET archived=? WHERE id=?', (bool(value),pid)).rowcount:
            raise ValueError('Proyecto no encontrado.')

def add_media(content, name, kind, project_id=None, revision=None, source='', license='', db=DB, media_dir=MEDIA):
    if not content or len(content) > 50 * 1024 * 1024:
        raise ValueError('El recurso debe pesar entre 1 byte y 50 MB.')
    suffix = Path(name).suffix.lower()
    allowed = {'image':{'.png','.jpg','.jpeg','.webp'},'audio':{'.mp3','.wav','.ogg','.m4a'},'model':{'.glb'},'video':{'.mp4','.webm'}}
    if suffix not in allowed.get(kind,set()):
        raise ValueError('Formato de recurso no admitido.')
    digest = hashlib.sha256(content).hexdigest()
    media_dir.mkdir(parents=True, exist_ok=True)
    target = media_dir / (digest + suffix)
    # Atomic replace avoids incomplete reads if two editors upload the same bytes.
    tmp = media_dir / (uuid.uuid4().hex + '.tmp')
    tmp.write_bytes(content)
    tmp.replace(target)
    with connect(db) as c:
        if project_id:
            p = c.execute('SELECT revision FROM projects WHERE id=?', (project_id,)).fetchone()
            if not p or not isinstance(revision,int) or revision < 1 or revision > p['revision']:
                raise ValueError('Asocia el recurso a una versión existente.')
        mid = uuid.uuid4().hex
        c.execute('INSERT INTO media VALUES(?,?,?,?,?,?,?,?,?,?,?)', (mid,clean(name),kind,str(target),digest,len(content),project_id,revision,clean(source,500),clean(license,200),now()))
    return {'id':mid,'name':clean(name),'kind':kind,'bytes':len(content)}

def media_list(db=DB):
    with connect(db) as c:
        return [dict(r) for r in c.execute('SELECT id,name,kind,bytes,project_id,revision,source,license,created FROM media ORDER BY created DESC')]

def media_path(mid, db=DB):
    with connect(db) as c:
        r = c.execute('SELECT path FROM media WHERE id=?', (mid,)).fetchone()
        return Path(r['path']) if r else None
