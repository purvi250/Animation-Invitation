/* Makes assets/icons/share-preview.jpg (1200 × 630) — the picture that messaging apps show
   next to the link. It is a real screenshot of the opened invitation, so it always matches.
   Needs Chrome or Edge and "npm install" (dev tools only).                              */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ROOT } from './lib/site.mjs';
import { launchBrowser } from './lib/browser.mjs';
import { createServer, listen } from './serve.mjs';

export async function makePreview() {
  const server = createServer({ dir: ROOT });
  const port = await listen(server, 5290, '127.0.0.1');
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/?motion=full`, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    // play the opening without sound, hide the controls, and catch the best moment
    await page.evaluate(() => {
      window.Invite.audio.startFromGesture = () => {};
      document.querySelectorAll('.chrome, .chapters, .progress, .hero__actions').forEach((el) => { el.style.visibility = 'hidden'; });
      document.querySelectorAll('.opening__hint > *').forEach((el) => { el.style.display = 'none'; });
    });
    if (await page.evaluate(() => window.Invite.openingMode === 'envelope')) {
      await page.evaluate(() => document.getElementById('envelope-button').click());
      await new Promise((r) => setTimeout(r, 3600));
    } else {
      // the date revealed, with the three helpers cheering beside it
      await page.waitForFunction(() => window.Invite.hero.state === 'ready', { timeout: 20000 });
      await page.evaluate(() => window.Invite.hero.begin(false));
      await page.waitForFunction(() => [...document.querySelectorAll('#gate .helper')].filter((h) => h.dataset.state === 'cheer').length === 3, { timeout: 15000 });
      await new Promise((r) => setTimeout(r, 420));
    }
    const out = path.join(ROOT, 'assets', 'icons', 'share-preview.jpg');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await page.screenshot({ path: out, type: 'jpeg', quality: 86 });
    return out;
  } finally {
    await browser.close();
    server.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Link-preview picture written: ${path.relative(ROOT, await makePreview())}`);
}
