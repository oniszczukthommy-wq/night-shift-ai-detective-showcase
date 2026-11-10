"""Hash the browser assets and retain source identities after conversions."""
from pathlib import Path
import json,hashlib
ROOT=Path(__file__).resolve().parents[2];folder=ROOT/'ai-detective-game/public/assets/reference';manifest=json.load(open(folder/'manifest.json'));entries={r['file']:r for r in manifest['files']};catalog=json.load(open(ROOT/'research/escape-simulator/characters/object-catalog.json'));lookup={str(x['id']):x for x in catalog}
for path in folder.iterdir():
 if not path.is_file() or path.name=='manifest.json':continue
 row=entries.setdefault(path.name,{'file':path.name})
 if path.name.startswith('es-tex-'):
  key=path.stem.replace('es-tex-','');src=lookup.get(key) or lookup.get('-'+key);row.update(game='Escape Simulator',bundle='characters',path_id=str(src['id']) if src else key,source_name=src['name'] if src else None)
 row['runtime_sha256']=hashlib.sha256(path.read_bytes()).hexdigest();row['runtime_bytes']=path.stat().st_size
manifest['files']=list(entries.values());manifest['active_scene_assets']=['fox.json','title-sword.json','arch.json','table.json','stool.json','chest.json','avatars.json','prop-cup.json','prop-document.json','prop-key.json','prop-vial.json'];manifest['reserved_assets']=['house.json','house-palette.png','stone-huts.png'];(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print('Hashed',len(entries),'runtime files')
