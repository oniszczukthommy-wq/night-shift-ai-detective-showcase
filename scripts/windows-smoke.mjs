import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {cp,mkdtemp,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const repo=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
// Exercise Windows paths with spaces/Unicode, without copying local credentials.
const sandbox=await mkdtemp(path.join(tmpdir(),'night shift 中文-'));
await cp(path.join(repo,'ai-detective-game/public'),path.join(sandbox,'public'),{recursive:true});
await cp(path.join(repo,'ai-detective-game/server.mjs'),path.join(sandbox,'server.mjs'));
const child=spawn(process.execPath,[path.join(sandbox,'server.mjs')],{cwd:sandbox,env:{...process.env,PORT:'14773',DEEPSEEK_API_KEY:''},stdio:'inherit'});
const closed=new Promise(resolve=>child.once('close',resolve));
const base='http://127.0.0.1:14773';
try {
  let ready=false;
  for(let i=0;i<80;i++) {
    if(child.exitCode!==null) throw Error('Server exited early');
    try { const r=await fetch(base+'/api/status'); if(r.ok){ready=true;break;} } catch {}
    await new Promise(r=>setTimeout(r,100));
  }
  assert.ok(ready,'server ready');
  assert.equal((await (await fetch(base+'/api/status')).json()).configured,false);
  assert.equal((await fetch(base+'/')).status,200);
  let files=0;
  async function verify(directory,relative='') {
    for(const item of await readdir(directory,{withFileTypes:true})) {
      const local=path.join(directory,item.name),url=relative+'/'+encodeURIComponent(item.name);
      if(item.isDirectory()) {await verify(local,url);continue;}
      const response=await fetch(base+url);
      assert.equal(response.status,200,url);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()),await readFile(local),url);
      files++;
    }
  }
  await verify(path.join(sandbox,'public'));
  const bad=await fetch(base+'/api/generate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({count:99})});
  assert.equal(bad.status,400);
  const noKey=await fetch(base+'/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({system:'test',question:'test'})});
  assert.equal(noKey.status,502);
  assert.match((await noKey.json()).error,/尚未配置/);
  console.log(`PASS: Unicode path, HTTP, ${files} public files, input guard and missing-key behavior; no model calls`);
} finally {
  child.kill();await closed;
  await rm(sandbox,{recursive:true,force:true});
}
