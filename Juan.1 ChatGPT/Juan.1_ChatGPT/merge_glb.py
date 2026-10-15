import pathlib,json,struct
for f in pathlib.Path(__file__).parent.glob('*.glb'):
 b=f.read_bytes();n=struct.unpack_from('<I',b,12)[0];d=json.loads(b[20:20+n]);merged={'name':f.stem,'channels':[],'samplers':[]}
 for a in d.get('animations',[]):
  offset=len(merged['samplers']);merged['samplers'].extend(a['samplers'])
  for c in a['channels']:c['sampler']+=offset;merged['channels'].append(c)
 d['animations']=[merged];j=json.dumps(d,separators=(',',':')).encode();j+=b' '*((-len(j))%4);tail=b[20+n:];out=struct.pack('<III',0x46546c67,2,20+len(j)+len(tail))+struct.pack('<II',len(j),0x4e4f534a)+j+tail;f.write_bytes(out)
 print(f.name,len(merged['channels']),'canales unidos')
