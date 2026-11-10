import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(root, '.env.local');
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}
const PORT = Number(process.env.PORT || 4173);
let modelCalls = 0;
const MODEL_CALL_LIMIT = 250;
const MIME = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
function send(res, status, data, type='application/json; charset=utf-8') { res.writeHead(status, {'content-type':type,'cache-control':'no-store','access-control-allow-origin':'null'}); res.end(type.startsWith('application/json') && !Buffer.isBuffer(data) ? JSON.stringify(data) : data); }
async function model(messages, max_tokens=500) {
  const key=process.env.DEEPSEEK_API_KEY;
  if (!key) throw new Error('尚未配置 DeepSeek API Key');
  if (modelCalls >= MODEL_CALL_LIMIT) throw new Error(`本机服务已达到 ${MODEL_CALL_LIMIT} 次模型调用保护上限，请检查用量后重启`);
  let response;
  for (let attempt=0;attempt<2;attempt++) {
    if (modelCalls >= MODEL_CALL_LIMIT) throw new Error('本机模型调用保护上限已到，请检查用量后重启');
    modelCalls += 1;
    try {
      response = await fetch('https://api.deepseek.com/chat/completions', {method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify({model:process.env.DEEPSEEK_MODEL||'deepseek-flash',messages,max_tokens,temperature:0.7,thinking:{type:'disabled'}}), signal:AbortSignal.timeout(45000)});
      break;
    } catch (error) {
      if (attempt===1) throw new Error('DeepSeek 网络连接中断，请稍后重试；当前调查记录仍保留');
    }
  }
  const data=await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `DeepSeek 请求失败 (${response.status})`);
  return {text:data.choices?.[0]?.message?.content||'', usage:data.usage||null};
}
function readBody(req) { return new Promise((resolve,reject)=>{let s=''; req.on('data',c=>{s+=c;if(s.length>40000){reject(Error('请求过大'));req.destroy();}});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{reject(Error('JSON 格式错误'))}});}); }
const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/api/status') return send(res,200,{configured:!!process.env.DEEPSEEK_API_KEY,model:process.env.DEEPSEEK_MODEL||'deepseek-flash'});
  if(req.method==='POST'&&url.pathname==='/api/chat') {
    try { const b=await readBody(req); if(typeof b.system!=='string'||typeof b.question!=='string'||b.question.length>600) return send(res,400,{error:'问题最多 600 字'}); const out=await model([{role:'system',content:b.system},{role:'user',content:b.question}],420); return send(res,200,out); }
    catch(e){return send(res,502,{error:e.message});}
  }
  if(req.method==='POST'&&url.pathname==='/api/intro') {
    try { const b=await readBody(req); const out=await model([{role:'system',content:'你是中文悬疑游戏编剧。根据固定案件事实写一段不超过100字、克制、有氛围的案发现场开场旁白。不得泄露凶手、动机和作案手法。只返回旁白。'},{role:'user',content:JSON.stringify(b)}],180); return send(res,200,out); }
    catch(e){return send(res,502,{error:e.message});}
  }
  if(req.method==='POST'&&url.pathname==='/api/generate') {
    try {
      const b=await readBody(req); const count=Number(b.count); const room=String(b.room||'居民客厅');
      if(![3,4,6].includes(count)) return send(res,400,{error:'人数参数无效'});
      const names=['林岚','周启明','陈露','赵叔','许薇','王骁'];
      const prompt=`请生成中文奇幻城镇探案游戏案件 JSON。玩家是狐狸警官，其他NPC是使用中文姓名的人类镇民。场景：${room}。使用旅店、药师、古物商人、抄写员、守夜人、契约、茶具、药剂、机械锁等背景。不要出现手机、电脑、监控、现代公司或现代装备，不得用魔法、读心术或新法术替代物证推理。嫌疑人必须恰好${count}人，姓名按顺序使用：${names.slice(0,count).join('、')}。全部调查在一个室内空间进行，凶手必须在嫌疑人之中，每人只掌握部分信息，无辜者也可能隐瞒和撒谎。不要血腥描写。只返回JSON，结构严格为：{"title":"案件名","victim":"死者姓名与身份","opening":"60字内、不泄露答案的简介","culprit":"嫌疑人姓名","motive":"动机短语","method":"作案方式短语","suspects":[{"name":"","role":"城镇身份与死者关系","position":"房间内位置","knowledge":"本人知道的局部事实","secret":"个人隐瞒","lie":"可能的谎言；无则空字符串","truth":"实际行为及时间"}],"evidence":[{"name":"线索名","location":"规定位置","prop":"cup","detail":"玩家能观察的客观事实，可与口供交叉核对","implicates":"实际关联的嫌疑人姓名"}],"timeline":["事实1","事实2","事实3","事实4"]}。四件物证必须按此顺序：1.中央茶桌的陶瓷茶杯，prop=cup；2.木柜上层抽屉的一页收据/契约/信，prop=document；3.木柜下层柜门内的铜钥匙，prop=key；4.后墙书架的药剂瓶，prop=vial。现场抽屉和柜门已由警方解除机械锁，玩家可以直接打开；不要把铜钥匙写成玩家必须使用的解锁道具。铜钥匙平放在柜中，不写成插在锁孔。每件证物的location必须与规定位置一致，detail围绕实物生成，案件不能依赖不存在的第五件核心物证。至少2条独立客观物证指向凶手的关键行动，每个无辜者最多被1条证物关联。implicates必须与detail事实一致。NPC局部知识应能核实衣料、笔迹、钥匙用途、药剂气味等线索特征，以保证唯一可解；不要在detail直接写某人就是凶手。嫌疑人恰好${count}人，evidence恰好4条，timeline恰好4条。`;
      const out=await model([{role:'system',content:'你是严谨的奇幻城镇探案案件生成器。只输出满足格式的JSON；四件规定物证与人物局部知识相互对应，线索客观且唯一可解。'},{role:'user',content:prompt}],2200);
      let data; try{data=JSON.parse(out.text)}catch{throw Error('AI 案件格式校验失败，请重新生成')}
      const suspectNames=new Set((data?.suspects||[]).map(s=>s.name));
      const linked=(data?.evidence||[]).map(e=>e.implicates);
      if(!data||!Array.isArray(data.suspects)||data.suspects.length!==count||!Array.isArray(data.evidence)||data.evidence.length!==4||!Array.isArray(data.timeline)||data.timeline.length!==4||!suspectNames.has(data.culprit)||!data.title||!data.motive||!data.method||data.suspects.some(s=>!s.role||!s.knowledge||!s.secret||!s.truth)||data.evidence.some(e=>!e.name||!e.location||!e.detail||!suspectNames.has(e.implicates))||linked.filter(n=>n===data.culprit).length<2||[...suspectNames].some(n=>n!==data.culprit&&linked.filter(x=>x===n).length>1)) throw Error('案件完整性检查未通过，请重新生成');
      const props=['cup','document','key','vial'];data.evidence.forEach((e,i)=>e.prop=props[i]);
      return send(res,200,{case:{...data,room},usage:out.usage});
    }catch(e){return send(res,502,{error:e.message});}
  }
  if(req.method==='POST'&&url.pathname==='/api/replay') {
    try { const b=await readBody(req); const out=await model([{role:'system',content:'你是案件复盘旁白。只根据提供的固定事实，按时间顺序写中文结案复盘，160字以内。不可添加人物、证据或行动。'},{role:'user',content:JSON.stringify(b)}],360); return send(res,200,out); }
    catch(e){return send(res,502,{error:e.message});}
  }
  if(req.method!=='GET') return send(res,404,{error:'Not found'});
  const rel=url.pathname==='/'?'index.html':decodeURIComponent(url.pathname.slice(1)); const file=path.resolve(root,'public',rel);
  if(!file.startsWith(path.join(root,'public')+path.sep)) return send(res,403,{error:'Forbidden'});
  fs.readFile(file,(e,data)=>e?send(res,404,{error:'Not found'}):send(res,200,data,MIME[path.extname(file)]||'application/octet-stream'));
});
server.listen(PORT,'127.0.0.1',()=>console.log(`Local game ready: http://127.0.0.1:${PORT}`));
