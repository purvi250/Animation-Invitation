/* ============================================================================
   A tiny local web server for the invitation (no dependencies).

     node tools/serve.mjs              serve this folder and open the browser
     node tools/serve.mjs --lan        also reachable from phones on the same Wi-Fi
     node tools/serve.mjs --dir=dist   serve the built copy
     node tools/serve.mjs --port=8080  choose a port (default 5180, next free one if busy)
     node tools/serve.mjs --no-open    do not open the browser
   ============================================================================ */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.avif': 'image/avif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.ics': 'text/calendar; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

export function createServer({ dir = ROOT } = {}) {
  const base = path.resolve(dir);
  return http.createServer((req, res) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end('Bad request'); return; }
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(base, `.${pathname}`);
    // never serve anything outside the site folder
    if (file !== base && !file.startsWith(base + path.sep)) { res.writeHead(403).end('Forbidden'); return; }

    fs.stat(file, (err, stat) => {
      if (err || !stat.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found');
        return;
      }
      const headers = {
        'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
      };
      // byte ranges, so audio can seek and loop reliably
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
      if (range && (range[1] || range[2])) {
        const start = range[1] ? Number(range[1]) : Math.max(0, stat.size - Number(range[2]));
        const end = range[1] && range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
        if (start > end || start >= stat.size) { res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` }).end(); return; }
        res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
        if (req.method === 'HEAD') { res.end(); return; }
        fs.createReadStream(file, { start, end }).pipe(res);
        return;
      }
      res.writeHead(200, { ...headers, 'Content-Length': stat.size });
      if (req.method === 'HEAD') { res.end(); return; }
      fs.createReadStream(file).pipe(res);
    });
  });
}

/** Starts listening on the first free port at or after `port`. */
export function listen(server, port, host) {
  return new Promise((resolve, reject) => {
    const attempt = (p, left) => {
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE' && left > 0) attempt(p + 1, left - 1);
        else reject(err);
      });
      server.listen(p, host, () => { server.removeAllListeners('error'); resolve(p); });
    };
    attempt(port, 20);
  });
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const flag = (name) => process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  const value = (name, fallback) => { const f = flag(name); return f && f.includes('=') ? f.split('=')[1] : fallback; };
  const dir = path.resolve(ROOT, value('dir', '.'));
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    console.error(`\n  There is no index.html in ${dir}\n  ${value('dir') ? 'Run "npm run build" first.' : ''}\n`);
    process.exit(1);
  }
  const lan = Boolean(flag('lan'));
  const host = lan ? '0.0.0.0' : '127.0.0.1';
  const server = createServer({ dir });
  const port = await listen(server, Number(value('port', 5180)), host);
  const url = `http://localhost:${port}/`;

  // plain ASCII on purpose: the classic Windows console garbles fancier dashes
  console.log('\n  Kenvi & Puru - Reception Invitation');
  console.log('  -----------------------------------');
  console.log(`  On this computer:  ${url}`);
  if (lan) {
    const addresses = Object.values(os.networkInterfaces()).flat().filter((n) => n && n.family === 'IPv4' && !n.internal);
    addresses.forEach((n) => console.log(`  On your phone:     http://${n.address}:${port}/   (same Wi-Fi)`));
    if (!addresses.length) console.log('  No Wi-Fi/LAN address found.');
  } else {
    console.log('  To try it on your phone:  npm run phone');
  }
  console.log('\n  Leave this window open while you view it. Press Ctrl + C to stop.\n');

  if (!flag('no-open')) {
    const opener = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    try { spawn(opener[0], opener[1], { stdio: 'ignore', detached: true }).unref(); } catch { /* the address is printed above */ }
  }
}
