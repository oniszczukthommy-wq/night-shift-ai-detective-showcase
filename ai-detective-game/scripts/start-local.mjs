import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtime = path.join(root, '.runtime');
const statusURL = 'http://127.0.0.1:4173/api/status';
const gameURL = 'http://127.0.0.1:4173/?v=0.8';

async function ready() {
  try {
    const response = await fetch(statusURL, { signal: AbortSignal.timeout(1000) });
    if (!response.ok) return false;
    const status = await response.json();
    return typeof status.configured === 'boolean' && typeof status.model === 'string';
  } catch { return false; }
}

async function start() {
  if (!await ready()) {
    fs.mkdirSync(runtime, { recursive: true, mode: 0o700 });
    const log = fs.openSync(path.join(runtime, 'server.log'), 'a', 0o600);
    // Detached process survives closing this launcher and the agent's terminal.
    const child = spawn(process.execPath, [path.join(root, 'server.mjs')], {
      cwd: root, detached: true, stdio: ['ignore', log, log],
    });
    fs.closeSync(log);
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    fs.writeFileSync(path.join(runtime, 'server.pid'), String(child.pid), { mode: 0o600 });
    child.unref();
    let available = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      if (await ready()) { available = true; break; }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!available) throw new Error(`服务启动失败，请查看 ${path.join(runtime, 'server.log')}`);
  }
  console.log(`游戏已启动：${gameURL}`);
  console.log('可以关闭此终端窗口，游戏服务会继续运行。');
  if (!process.argv.includes('--no-open')) {
    const chrome = '/Applications/Google Chrome.app';
    const args = fs.existsSync(chrome) ? ['-a', chrome, gameURL] : [gameURL];
    const command = process.platform === 'win32' ? 'rundll32.exe' : process.platform === 'darwin' ? '/usr/bin/open' : 'xdg-open';
    const openArgs = process.platform === 'win32' ? ['url.dll,FileProtocolHandler', gameURL] : process.platform === 'darwin' ? args : [gameURL];
    const opened = spawnSync(command, openArgs, { stdio: 'ignore' });
    if (opened.status !== 0) console.log(`请在浏览器地址栏输入：${gameURL}`);
  }
}

start().catch(error => { console.error(error.message); process.exitCode = 1; });
