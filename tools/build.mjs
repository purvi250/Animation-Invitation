/* ============================================================================
   Build — collects just the website into dist/, ready to upload to any static
   host (Netlify Drop, GitHub Pages, Cloudflare Pages…).   Run:  npm run build
     1. refreshes the calendar file from invitation.config.js
     2. makes the link-preview picture (if Chrome or Edge is installed)
     3. copies index.html, the config, styles/, src/ and assets/ into dist/
   The tools, tests and painter sources are deliberately left out.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, walk } from './lib/site.mjs';
import { writeICS } from './make-ics.mjs';
import { makePreview } from './make-preview.mjs';

const DIST = path.join(ROOT, 'dist');
const INCLUDE = ['index.html', 'invitation.config.js', 'styles', 'src', 'assets'];
const SKIP = [/^assets\/art\/README\.md$/, /\.DS_Store$/, /Thumbs\.db$/];

const { derived } = writeICS();
console.log(`  ✓ calendar file refreshed (${derived.dateLong}, all-day)`);

try {
  await makePreview();
  console.log('  ✓ link-preview picture made (assets/icons/share-preview.jpg)');
} catch (err) {
  console.log(`  ! link-preview picture skipped: ${err.message}`);
}

fs.rmSync(DIST, { recursive: true, force: true });
let count = 0; let bytes = 0;
for (const item of INCLUDE) {
  const from = path.join(ROOT, item);
  const files = fs.statSync(from).isDirectory() ? walk(from).map((f) => `${item}/${f}`) : [item];
  for (const file of files) {
    if (SKIP.some((re) => re.test(file))) continue;
    const to = path.join(DIST, file);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(path.join(ROOT, file), to);
    count += 1; bytes += fs.statSync(to).size;
  }
}
console.log(`  ✓ ${count} files copied to dist/  (${(bytes / 1048576).toFixed(1)} MB)`);
console.log('\n  Preview it with:  npm run preview');
console.log('  Put it online by uploading everything INSIDE the dist folder to a static host.\n');
