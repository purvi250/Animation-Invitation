/* ============================================================================
   Paints the scenery: builds every layer as SVG (tools/paint/svg/) and bakes it
   to a transparent WebP plate in assets/scenery/.

     npm run paint                    repaint everything
     npm run paint -- --only=meadow   repaint the layers whose name contains "meadow"
     npm run paint -- --scale=1.5     sharper (and heavier) plates
     npm run paint -- --svg-only      write the SVGs only (needs no browser)
   ============================================================================ */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from './paint/scenes.mjs';
import { launchBrowser } from './lib/browser.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SVG_DIR = path.join(ROOT, 'tools', 'paint', 'svg');
const OUT_DIR = path.join(ROOT, 'assets', 'scenery');

const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return fallback;
  return hit.includes('=') ? hit.split('=')[1] : true;
};
const only = arg('only', '');
const scale = Number(arg('scale', 1));
const quality = Number(arg('quality', 80));
const svgOnly = arg('svg-only', false);

await fs.mkdir(SVG_DIR, { recursive: true });
await fs.mkdir(OUT_DIR, { recursive: true });

const layers = ALL().filter((l) => !only || l.name.includes(only));
if (!layers.length) { console.error(`No layer matches "${only}".`); process.exit(1); }

const jobs = [];
for (const layer of layers) {
  // clouds keep their own size; hazy far layers are baked smaller, nobody can tell
  const s = layer.name.startsWith('cloud') ? 1 : layer.name.endsWith('-far') ? scale * 0.8 : scale;
  const svg = layer.sheet.render({ grain: layer.grain !== false, scale: s });
  await fs.writeFile(path.join(SVG_DIR, `${layer.name}.svg`), svg);
  jobs.push({ name: layer.name, svg, width: Math.round(layer.sheet.w * s), height: Math.round(layer.sheet.h * s) });
}
console.log(`Painted ${jobs.length} SVG layer(s) → tools/paint/svg/`);
if (svgOnly) process.exit(0);

const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  for (const job of jobs) {
    await page.setViewport({ width: job.width, height: job.height, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">${job.svg}</body></html>`, { waitUntil: 'load' });
    const file = path.join(OUT_DIR, `${job.name}.webp`);
    await page.screenshot({ path: file, type: 'webp', quality, omitBackground: true });
    const { size } = await fs.stat(file);
    console.log(`  ${job.name}.webp  ${job.width}×${job.height}  ${(size / 1024).toFixed(0)} KB`);
  }
} finally {
  await browser.close();
}
console.log('Scenery baked → assets/scenery/');
