"""Integridad de versiones, recuperación, edición concurrente y medios asociados."""
import tempfile
import unittest
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import production_store as store

class ProductionTest(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.db=Path(self.tmp.name)/'test.sqlite3'
        self.media=Path(self.tmp.name)/'media'
    def tearDown(self): self.tmp.cleanup()
    def data(self): return {'title':'Piloto','engine':'speech','payload':{'text':'Hola, soy Juan.'},'series':'El taller','season':1,'episode':1,'notes':{'intention':'Invitar'}}
    def test_revision_and_conflict(self):
        first=store.save(self.data(),self.db)
        update={**self.data(),'id':first['id'],'expectedRevision':1,'payload':{'text':'Una nueva historia.'}}
        second=store.save(update,self.db)
        self.assertEqual(second['revision'],2)
        with self.assertRaises(store.Conflict): store.save(update,self.db)
        old=store.get(first['id'],1,self.db)
        self.assertEqual(old['payload']['text'],'Hola, soy Juan.')
        self.assertEqual(len(store.history(first['id'],self.db)),2)
        restored=store.save({**update,'payload':old['payload'],'expectedRevision':2},self.db)
        self.assertEqual(restored['revision'],3)
        store.archive(first['id'],True,self.db)
        self.assertEqual(store.listing(self.db)[0]['archived'],1)
        store.archive(first['id'],False,self.db)
        self.assertEqual(store.listing(self.db)[0]['archived'],0)
    def test_concurrent_save(self):
        first=store.save(self.data(),self.db)
        def save(i):
            try: return store.save({**self.data(),'id':first['id'],'expectedRevision':1,'title':str(i)},self.db)['revision']
            except store.Conflict: return 'conflict'
        with ThreadPoolExecutor(2) as pool: results=list(pool.map(save,range(2)))
        self.assertEqual(results.count(2),1)
        self.assertEqual(results.count('conflict'),1)
    def test_media_and_validation(self):
        p=store.save(self.data(),self.db)
        m=store.add_media(b'local-test-content','prueba.mp4','video',p['id'],1,'Juan','propia',self.db,self.media)
        self.assertEqual(store.media_path(m['id'],self.db).read_bytes(),b'local-test-content')
        self.assertEqual(store.media_list(self.db)[0]['revision'],1)
        with self.assertRaises(ValueError):store.save({**self.data(),'payload':{'text':''}},self.db)
        with self.assertRaises(ValueError):store.add_media(b'x','bad.html','image',db=self.db,media_dir=self.media)
        with self.assertRaises(ValueError):store.add_media(b'x','bad.mp4','video',p['id'],20,db=self.db,media_dir=self.media)
        with self.assertRaises(ValueError):store.save({**self.data(),'payload':{'text':'x','rate':float('nan')}},self.db)

if __name__=='__main__':unittest.main()
