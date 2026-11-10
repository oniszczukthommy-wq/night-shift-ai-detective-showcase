from pathlib import Path
import json,math,hashlib,gzip
ROOT=Path(__file__).resolve().parents[2];src=ROOT/'research/escape-simulator/rooms/victorian1';out=ROOT/'ai-detective-game/public/assets/reference';placements=json.load(open(src/'placements.json'));meshes={m['id']:m for m in json.load(open(src/'meshes.json'))};manifest=json.load(open(out/'manifest.json'));hierarchy=json.load(gzip.open(src/'hierarchy.json.gz','rt'))
for kind,name,size,axis in [('cup','TeaCup_p (1)',.40,1),('document','paper.002',.60,0),('key','KeyDrawers_p',.59,0),('vial','InkBottle_p',.58,1)]:
 root=next(p for p in placements if p['name']==name and p.get('renderer_enabled'));parts=[]
 for pp in placements:
  cur=pp['transform'];seen=set()
  while cur and cur not in seen:
   seen.add(cur)
   if cur==root['transform']:
    if pp.get('active_in_hierarchy') and pp.get('renderer_enabled') and pp['mesh'] in meshes and 'Token' not in pp['name']:parts.append(pp)
    break
   cur=hierarchy['transform_parent'].get(cur)
 positions=[];normals=[];uvs=[];idx=[];sources=[]
 for p in parts:
  m=meshes[p['mesh']];path=ROOT/'research/escape-simulator/rooms'/m['obj'];sources.append({'object':p['name'],'mesh':p['mesh'],'source':str(path.relative_to(ROOT)),'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest()});v=[];vt=[];vn=[];lookup={};M=p['effective_mesh_to_world_unity'];R=root['effective_mesh_to_world_unity'];C=[-1,1,1]
  def vec(a):return [sum(M[i][j]*a[j]*C[j] for j in range(3))*C[i] for i in range(3)]
  for l in path.read_text().splitlines():
   a=l.split()
   if not a:continue
   if a[0]=='v':v.append([q+(M[i][3]-R[i][3])*C[i] for i,q in enumerate(vec(list(map(float,a[1:4]))))])
   elif a[0]=='vn':
    n=vec(list(map(float,a[1:4])));mag=math.sqrt(sum(t*t for t in n)) or 1;vn.append([i/mag for i in n])
   elif a[0]=='vt':vt.append(list(map(float,a[1:3])))
   elif a[0]=='f':
    face=[]
    for token in a[1:]:
     if token not in lookup:
      ns=[int(i)-1 if i else -1 for i in token.split('/')];lookup[token]=len(positions)//3;positions.extend(v[ns[0]]);normals.extend(vn[ns[2]] if len(ns)>2 and ns[2]>=0 else [0,1,0]);uvs.extend(vt[ns[1]] if len(ns)>1 and ns[1]>=0 else [0,0])
     face.append(lookup[token])
    for j in range(1,len(face)-1):idx.extend([face[0],face[j],face[j+1]])
 lo=[min(positions[i::3]) for i in range(3)];hi=[max(positions[i::3]) for i in range(3)];sc=size/max(hi[axis]-lo[axis],.001);center=[(lo[i]+hi[i])/2 for i in range(3)];center[1]=lo[1]
 for i in range(len(positions)):positions[i]=round((positions[i]-center[i%3])*sc,6)
 data={'positions':positions,'normals':normals,'uvs':uvs,'indices':idx};(out/f'prop-{kind}.json').write_text(json.dumps(data,separators=(',',':')));manifest['files'].append({'file':f'prop-{kind}.json','game':'Escape Simulator','sources':sources,'object':name,'adaptation':'Mesh-to-world orientation baked; centered and uniformly scaled for local inspection'})
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
