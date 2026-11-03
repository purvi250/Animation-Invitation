/* ============================================================================
   SHARE — makes copies of the invitation to send on their own.   Run:  npm run share
     share/<Bride>-<Groom>-Invitation.mp4   the opening scene, then a card with every detail,
                                            with music — the best one to send on WhatsApp
     share/<Bride>-<Groom>-Invitation.gif   the same, silent and looping, for places that take GIFs
     share/<Bride>-<Groom>-Invitation.pdf   a three-page A5 invitation to print or send as a document:
                                            the opening scene, the reception, the programme (+ QR code)
   A PDF cannot play animation on phones, so the PDF carries a still of the opening scene and a QR
   code / link to the live animated invitation (config → share.url).

   The animation is recorded from the real page on a virtual clock: time only moves when the next
   frame is wanted, so every frame is evenly spaced however slow the computer is.
   Needs Chrome or Edge, ffmpeg on the PATH (or FFMPEG_PATH), and "npm install" (dev tools only).
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import qrcode from 'qrcode-generator';
import { ROOT, loadSite } from './lib/site.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { createServer, listen } from './serve.mjs';

const FPS = 30;
const SIZE = { width: 540, height: 675 };          // 4 : 5, recorded at twice the size → 1080 × 1350
const NIGHT = '0x0b1040';                         // the colour the loop fades through
const OUT = path.join(ROOT, 'share');
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

/* The page's clock, replaced before any of its scripts run: timers, animation frames, performance.now()
   and every CSS animation advance only when __clock.advance(ms) is called. */
const CLOCK = `(() => {
  let vt = 0, seq = 1, timers = [], frames = [];
  const T0 = Date.now(), started = new WeakMap();
  performance.now = () => vt;
  Date.now = () => T0 + vt;
  window.setTimeout = (fn, ms, ...a) => { const id = seq++; timers.push({ id, at: vt + Math.max(0, +ms || 0), fn, a }); return id; };
  window.setInterval = (fn, ms, ...a) => { const id = seq++; const every = Math.max(1, +ms || 0); const t = { id, at: vt + every, fn, a, every }; timers.push(t); return id; };
  window.clearTimeout = window.clearInterval = (id) => { timers = timers.filter((t) => t.id !== id); };
  window.requestAnimationFrame = (fn) => { const id = seq++; frames.push({ id, fn }); return id; };
  window.cancelAnimationFrame = (id) => { frames = frames.filter((f) => f.id !== id); };
  const run = (fn, a) => { try { typeof fn === 'function' ? fn(...a) : 0; } catch (e) { console.error(e); } };
  window.__clock = {
    now: () => vt,
    advance(ms) {
      const target = vt + ms;
      for (;;) {
        let due = null;
        for (const t of timers) if (t.at <= target && (!due || t.at < due.at)) due = t;
        if (!due) break;
        vt = Math.max(vt, due.at);
        if (due.every) due.at += due.every; else timers = timers.filter((t) => t !== due);
        run(due.fn, due.a);
      }
      vt = target;
      const now = frames; frames = [];
      now.forEach((f) => run(f.fn, [vt]));
      document.getAnimations().forEach((an) => {
        if (!started.has(an)) started.set(an, vt);
        an.pause();
        an.currentTime = vt - started.get(an);
      });
    },
  };
})();`;

function ffmpeg(args) {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.error) throw new Error(`ffmpeg could not be started (${r.error.message}). Install it, or set FFMPEG_PATH.`);
  if (r.status !== 0) throw new Error(`ffmpeg failed (exit ${r.status}).`);
}

async function openPage(browser, url, viewport) {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.warn(`  (page) ${e.message}`));
  await page.evaluateOnNewDocument(CLOCK);
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all([...document.images].filter((i) => i.loading !== 'lazy').map((i) => (i.complete ? 0 : i.decode().catch(() => 0)))));
  return page;
}
const tick = (page, ms = 1000 / FPS) => page.evaluate((m) => window.__clock.advance(m), ms);

/** Records `count` frames (or until `stop` says so) into dir, numbered from `from`. */
async function record(page, dir, { count = Infinity, from = 0, stop = null, before = null } = {}) {
  let n = from;
  for (let i = 0; i < count; i++) {
    if (before) await before(i);
    await tick(page);
    await page.screenshot({ path: path.join(dir, `f${String(n).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 94 });
    n += 1;
    if (stop && (await stop(i))) break;
  }
  return n - from;
}

/** The opening scene: the helpers holding the rope, the pull, the date, the cheer and the programme sign. */
async function recordOpening(browser, origin, dir) {
  const page = await openPage(browser, `${origin}/?motion=full`, { ...SIZE, deviceScaleFactor: 2 });
  await page.addStyleTag({ content: '.chrome, .chapters, .progress, .hero__actions, .skip-link { visibility: hidden !important; }' });
  await page.evaluate(() => { window.Invite.audio.startFromGesture = () => {}; });
  // (off camera) the helpers find the rope and take hold of it
  for (let i = 0; i < 600 && (await page.evaluate(() => window.Invite.hero.state)) !== 'ready'; i++) await tick(page, 100);
  for (let i = 0; i < 10; i++) await tick(page, 100);
  let revealedAt = -1;
  const frames = await record(page, dir, {
    count: FPS * 11,
    before: async (i) => { if (i === Math.round(FPS * 0.7)) await page.evaluate(() => window.Invite.hero.begin(false)); },
    stop: async (i) => {
      const s = await page.evaluate(() => window.Invite.hero.state);
      if (revealedAt < 0 && (s === 'revealed' || s === 'done')) revealedAt = i;
      return revealedAt >= 0 && i - revealedAt >= FPS * 3.4;        // the sign has dropped and settled; everyone has cheered
    },
  });
  await page.close();
  return frames;
}

/** The closing card: every detail of the reception and the programme. */
async function recordCard(browser, origin, dir) {
  const page = await openPage(browser, `${origin}/tools/share/card.html`, { ...SIZE, deviceScaleFactor: 2 });
  const frames = await record(page, dir, { count: Math.round(FPS * 6.2) });
  await page.close();
  return frames;
}

/** A still of the opening scene, the date revealed and the programme sign hanging beneath it — the PDF's cover. */
export async function coverStill(browser, origin) {
  const page = await openPage(browser, `${origin}/?motion=full`, { width: 560, height: 795, deviceScaleFactor: 3 });
  await page.addStyleTag({ content: '.chrome, .chapters, .progress, .hero__actions, .skip-link { visibility: hidden !important; }' });
  await page.evaluate(() => { window.Invite.audio.startFromGesture = () => {}; });
  for (let i = 0; i < 600 && (await page.evaluate(() => window.Invite.hero.state)) !== 'ready'; i++) await tick(page, 100);
  await page.evaluate(() => window.Invite.hero.begin(false));
  let since = -1;
  for (let i = 0; i < 400; i++) {
    await tick(page);
    const s = await page.evaluate(() => ({ state: window.Invite.hero.state, cheer: [...document.querySelectorAll('#gate .helper')].filter((h) => h.dataset.state === 'cheer').length }));
    if (since < 0 && (s.state === 'revealed' || s.state === 'done')) since = i;
    if (since >= 0 && i - since >= FPS * 2.4 && s.cheer >= 2) break;
  }
  const jpg = await page.screenshot({ type: 'jpeg', quality: 92, encoding: 'base64' });
  await page.close();
  return jpg;
}

async function makePdf(browser, origin, cover, url, file) {
  const page = await browser.newPage();
  await page.goto(`${origin}/tools/share/print.html`, { waitUntil: 'networkidle0' });
  let qr = '';
  if (url) {
    const code = qrcode(0, 'M'); code.addData(url); code.make();
    qr = code.createSvgTag({ cellSize: 4, margin: 0, scalable: true }).replace(/fill="black"/g, 'fill="#2b1420"');
  }
  await page.evaluate(async ({ cover, qr }) => {
    const img = document.getElementById('cover');
    img.src = `data:image/jpeg;base64,${cover}`;
    if (qr) document.getElementById('qr').innerHTML = qr;
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode().catch(() => 0)));
  }, { cover, qr });
  await page.pdf({ path: file, printBackground: true, preferCSSPageSize: true });
  await page.close();
}

export async function makeShare({ only = null } = {}) {
  const { config, derived } = loadSite();
  const name = `${derived.coupleShort.replace(/\s*&\s*/, '-').replace(/[^\w-]+/g, '')}-Invitation`;
  const url = (config.share && config.share.url) || '';
  const want = (k) => !only || only.includes(k);
  fs.mkdirSync(OUT, { recursive: true });
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'invite-share-'));
  const server = createServer({ dir: ROOT });
  const origin = `http://127.0.0.1:${await listen(server, 5340, '127.0.0.1')}`;
  const browser = await launchBrowser(['--autoplay-policy=user-gesture-required', '--mute-audio']);
  const made = [];
  try {
    if (want('video') || want('gif')) {
      const a = path.join(work, 'opening'), b = path.join(work, 'card');
      fs.mkdirSync(a); fs.mkdirSync(b);
      console.log('  … recording the opening scene');
      const na = await recordOpening(browser, origin, a);
      console.log('  … recording the closing card');
      const nb = await recordCard(browser, origin, b);
      const da = na / FPS, db = nb / FPS, X = 0.7, total = da + db - X;
      const master = path.join(work, 'master.mp4');
      ffmpeg(['-framerate', String(FPS), '-i', path.join(a, 'f%05d.jpg'), '-framerate', String(FPS), '-i', path.join(b, 'f%05d.jpg'),
        '-filter_complex', `[0:v]format=yuv420p,setsar=1[a];[1:v]format=yuv420p,setsar=1[b];[a][b]xfade=transition=fade:duration=${X}:offset=${(da - X).toFixed(3)},fade=t=in:st=0:d=0.4:c=${NIGHT},fade=t=out:st=${(total - 0.6).toFixed(3)}:d=0.6:c=${NIGHT}[v]`,
        '-map', '[v]', '-c:v', 'libx264', '-crf', '17', '-preset', 'slow', '-pix_fmt', 'yuv420p', master]);
      if (want('video')) {
        const music = config.music && config.music.src && path.join(ROOT, config.music.src);
        const mp4 = path.join(OUT, `${name}.mp4`);
        if (music && fs.existsSync(music)) {
          ffmpeg(['-i', master, '-i', music, '-filter_complex', `[1:a]atrim=0:${total.toFixed(3)},afade=t=in:d=0.5,afade=t=out:st=${(total - 1.6).toFixed(3)}:d=1.6[m]`,
            '-map', '0:v', '-map', '[m]', '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-shortest', mp4]);
        } else {
          ffmpeg(['-i', master, '-c:v', 'libx264', '-crf', '21', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
        }
        made.push(mp4);
      }
      if (want('gif')) {
        const gif = path.join(OUT, `${name}.gif`);
        ffmpeg(['-i', master, '-vf', 'fps=12,scale=540:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=256:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle', '-loop', '0', gif]);
        made.push(gif);
      }
    }
    if (want('pdf')) {
      console.log('  … laying out the PDF');
      const pdf = path.join(OUT, `${name}.pdf`);
      await makePdf(browser, origin, await coverStill(browser, origin), url, pdf);
      made.push(pdf);
    }
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(work, { recursive: true, force: true });
  }
  return made;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const only = process.argv.slice(2).filter((a) => ['video', 'gif', 'pdf'].includes(a));
  const made = await makeShare({ only: only.length ? only : null });
  made.forEach((f) => console.log(`  ✓ ${path.relative(ROOT, f)}  (${(fs.statSync(f).size / 1048576).toFixed(1)} MB)`));
}
