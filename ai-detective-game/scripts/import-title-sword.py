from pathlib import Path
import json,shutil,hashlib,sys
ROOT=Path(__file__).resolve().parents[2];sys.path.insert(0,str(ROOT/'research/tunic/scripts'));from asset_probe import Bundle,SOURCE,load_nodes
b=Bundle(SOURCE);e=load_nodes(b,{'sharedassets3.assets'});ob=e.files['sharedassets3.assets'].objects[12];text=ob.read().export()
v=[];vn=[];vt=[];pos=[];norm=[];uv=[];idx=[];groups=[];lookup={};start=0;gname=''
for l in text.splitlines():
 a=l.split()
 if not a:continue
 if a[0]=='v':v.append(list(map(float,a[1:4])))
 elif a[0]=='vt':vt.append(list(map(float,a[1:3])))
 elif a[0]=='vn':vn.append(list(map(float,a[1:4])))
 elif a[0]=='g':
  if len(idx)>start:groups.append({'start':start,'count':len(idx)-start,'name':gname});start=len(idx)
  gname=a[1]
 elif a[0]=='f':
  for key in a[1:]:
   if key not in lookup:
    n=[int(x)-1 for x in key.split('/')];lookup[key]=len(lookup);pos.extend(v[n[0]]);uv.extend(vt[n[1]]);norm.extend(vn[n[2]])
   idx.append(lookup[key])
if len(idx)>start:groups.append({'start':start,'count':len(idx)-start,'name':gname})
for i,g in enumerate(groups):
 g['materialIndex']=i;z=[pos[idx[j]*3+2] for j in range(g['start'],g['start']+g['count'])];print(g,'zmean',sum(z)/len(z))
out=ROOT/'ai-detective-game/public/assets/reference';(out/'title-sword.json').write_text(json.dumps({'positions':pos,'normals':norm,'uvs':uv,'indices':idx,'groups':groups},separators=(',',':')))
assets=[('sharedassets3.assets__7__foxgod_sword_mask.png','sword-mask.png'),('resources.assets__300__caustic.png','caustic.png')]
for a,d in assets:shutil.copyfile(ROOT/'research/tunic/extended/visual/textures/png'/a,out/d)
manifest=json.load(open(out/'manifest.json'));manifest['files'].append({'file':'title-sword.json','game':'TUNIC','source_file':'sharedassets3.assets','path_id':12,'source_sha256':hashlib.sha256(ob.get_raw_data()).hexdigest(),'kind':'original title elderfox_sword mesh geometry+UV+submesh groups'})
for a,d in assets:manifest['files'].append({'file':d,'game':'TUNIC','source':a})
(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2))
