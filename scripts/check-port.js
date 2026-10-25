#!/usr/bin/env node
/**
 * scripts/check-port.js  (ESM version)
 *
 * 检测并清理 5173 端口占用。
 *
 * 背景：
 *   `npm run dev` 残留进程占用 5173 时，tauri dev 会启动新的 5174，
 *   但 Tauri 的 devUrl 固定指向 http://localhost:5173，
 *   导致 Tauri 加载到旧页面 / 缓存页面。
 *
 * 触发：
 *   package.json 里 "predev": "node scripts/check-port.js" 自动钩子
 *
 * 跨平台：
 *   Windows 用 netstat+taskkill，macOS/Linux 用 lsof+kill
 */

import { execSync } from 'child_process';
import net from 'net';

const PORT = 5173;
const HOST = '127.0.0.1';

/**
 * 检测端口是否被占用（尝试 bind，成功说明空闲）
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE' || err.code === 'EACCES') resolve(true);
      else resolve(false);
    });
    server.once('listening', () => {
      server.close();
      resolve(false);
    });
    server.listen(port, HOST);
  });
}

/**
 * Windows：查找占用指定端口的 PID 并 taskkill
 */
function killPortWindows(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf-8' });
    const lines = output.split('\n').filter(l => l.includes('LISTENING'));
    const pids = new Set();
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    if (pids.size === 0) return 0;

    let killed = 0;
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`[check-port] ✓ Killed PID ${pid} (occupied port ${port})`);
        killed++;
      } catch (e) {
        console.warn(`[check-port] ✗ Failed to kill PID ${pid} (need admin?)`);
      }
    }
    return killed;
  } catch (e) {
    return 0; // findstr 找不到匹配（端口空闲）
  }
}

/**
 * macOS/Linux：用 lsof 查找 PID 并 kill
 */
function killPortUnix(port) {
  try {
    const output = execSync(`lsof -ti:${port}`, { encoding: 'utf-8' });
    const pids = output.trim().split('\n').filter(Boolean);
    if (pids.length === 0) return 0;

    let killed = 0;
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
        console.log(`[check-port] ✓ Killed PID ${pid} (occupied port ${port})`);
        killed++;
      } catch (e) {
        console.warn(`[check-port] ✗ Failed to kill PID ${pid} (need sudo?)`);
      }
    }
    return killed;
  } catch (e) {
    return 0; // lsof 找不到匹配（端口空闲）
  }
}

function printManualHint() {
  console.warn('');
  console.warn('[check-port] Manual fix (run these commands):');
  if (process.platform === 'win32') {
    console.warn(`[check-port]   netstat -ano | findstr :${PORT}`);
    console.warn(`[check-port]   taskkill /F /PID <pid-from-above>`);
  } else {
    console.warn(`[check-port]   lsof -ti:${PORT}`);
    console.warn(`[check-port]   kill -9 <pid-from-above>`);
  }
  console.warn('[check-port]');
  console.warn('[check-port] NOTE: Vite uses strictPort=true, so it will FAIL');
  console.warn('[check-port]       instead of silently falling back to 5174.');
  console.warn('');
}

async function main() {
  console.log(`[check-port] Checking port ${PORT}...`);

  const inUse = await isPortInUse(PORT);
  if (!inUse) {
    console.log(`[check-port] ✓ Port ${PORT} is free`);
    return;
  }

  console.log(`[check-port] ⚠ Port ${PORT} is in use, attempting to free it...`);
  const killed = process.platform === 'win32' ? killPortWindows(PORT) : killPortUnix(PORT);

  if (killed > 0) {
    // 等 500ms 让 OS 真正释放端口
    await new Promise(r => setTimeout(r, 500));

    const stillInUse = await isPortInUse(PORT);
    if (!stillInUse) {
      console.log(`[check-port] ✓ Freed port ${PORT} (killed ${killed} process${killed > 1 ? 'es' : ''})`);
    } else {
      console.warn(`[check-port] ⚠ Port ${PORT} still in use after kill attempt`);
      printManualHint();
    }
  } else {
    console.warn(`[check-port] ⚠ Could not auto-kill port ${PORT} occupants`);
    printManualHint();
  }
}

// 不阻塞主流程：即使清理失败也让 vite 自己报错（strictPort）
main().catch((e) => {
  console.error('[check-port] Unexpected error:', e);
  process.exit(0);
});