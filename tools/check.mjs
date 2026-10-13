/* ============================================================================
   Project check — a quick "is everything wired up?" pass. Run:  npm run check
     · every script parses
     · every file the page asks for exists (images, fonts, styles, scripts, music)
     · every in-page link points at a real section, and ids are unique
     · every word bound to the config resolves, and the no-script wording matches it
     · the date, calendar file and map link agree with invitation.config.js
   Exits with an error code if something is broken; warnings are only advice.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT, loadSite, walk } from './lib/site.mjs';

const errors = [];
const warnings = [];
const ok = [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const exists = (p) => fs.existsSync(path.join(ROOT, p));
const decodeEntities = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');

/* 1 · scripts parse */
const scripts = ['invitation.config.js', ...walk(path.join(ROOT, 'src')).map((f) => `src/${f}`)];
for (const file of scripts) {
  try { new vm.Script(fs.readFileSync(path.join(ROOT, file), 'utf8'), { filename: file }); }
  catch (err) { errors.push(`${file}: ${err.message}`); }
}
ok.push(`${scripts.length} scripts parse`);

/* 2 · the config loads and makes sense */
let site;
try { site = loadSite(); } catch (err) { errors.push(`invitation.config.js could not be loaded: ${err.message}`); }

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

if (site) {
  const { config, derived, lookup, calendar } = site;
  if (!derived.date) errors.push('event.date must look like 2026-11-28');
  else ok.push(`event date ${config.event.date} is a ${derived.weekday} → "${derived.dateLong}"`);
  for (const key of ['bride.name', 'groom.name', 'event.title', 'venue.name']) if (!lookup(key)) errors.push(`config: ${key} is empty`);
  if (!(config.venue.addressLines || []).length) errors.push('config: venue.addressLines is empty');
  if (config.event.time) warnings.push(`event.time is set ("${config.event.time}") — it is shown on the card; the calendar entry stays all-day.`);
  else ok.push('no event time is stated anywhere (all-day calendar entry)');

  /* 3 · bound words resolve, and the static (no-script) wording matches the config */
  const bindRe = /<([a-zA-Z0-9]+)([^>]*?)\sdata-bind="([^"]+)"([^>]*)>([^<]*)</g;
  let m; let bound = 0;
  while ((m = bindRe.exec(html))) {
    bound += 1;
    const key = m[3]; const value = lookup(key);
    const staticText = decodeEntities(m[5]).trim();
    if (value === undefined) { errors.push(`index.html: data-bind="${key}" does not exist in the config`); continue; }
    if (value !== '' && staticText && staticText !== String(value)) {
      warnings.push(`index.html fallback text for ${key} is "${staticText}" but the config says "${value}" (only seen with scripting off).`);
    }
  }
  ok.push(`${bound} bound texts resolve`);

  /* 4 · calendar + map link */
  const icsPath = 'assets/calendar/reception.ics';
  if (!exists(icsPath)) errors.push(`${icsPath} is missing — run "npm run ics"`);
  else {
    const ics = fs.readFileSync(path.join(ROOT, icsPath), 'utf8');
    if (!ics.includes(`DTSTART;VALUE=DATE:${derived.dateCompact}`)) errors.push(`${icsPath} is out of date — run "npm run ics"`);
    else ok.push('calendar file matches the event date (all-day)');
    const fresh = calendar.buildICS(config, derived, new Date(0)).replace(/DTSTAMP:.*\r\n/, '');
    if (ics.replace(/DTSTAMP:.*\r\n/, '') !== fresh) warnings.push(`${icsPath} differs from the config — run "npm run ics" to refresh it.`);
  }
  const staticMaps = [...html.matchAll(/class="[^"]*js-directions[^"]*"[^>]*?href="([^"]+)"/g)].map((x) => decodeEntities(x[1]));
  staticMaps.forEach((url) => { if (url !== derived.mapsDirections) warnings.push('index.html: a fallback directions link differs from the config (only used with scripting off).'); });
  if (!/^https:\/\/www\.google\.com\/maps\/dir\/\?api=1&destination=.+/.test(derived.mapsDirections)) errors.push('directions link is malformed');
  else ok.push('directions link is well-formed');

  /* 5 · artwork and music named in the config */
  const art = config.art || {};
  for (const key of ['groom', 'bride', 'couple']) {
    if (!art[key]) warnings.push(`art.${key} is empty — a monogram medallion will be shown instead.`);
    else if (!exists(art[key])) warnings.push(`art.${key} → ${art[key]} is missing — a monogram medallion will be shown instead.`);
  }
  for (const [key, src] of Object.entries(art.backdrops || {})) if (src && !exists(src)) warnings.push(`art.backdrops.${key} → ${src} is missing — the built-in scenery will be used.`);
  const music = (config.music || {}).src;
  if (!music) warnings.push('music.src is empty — the built-in chime melody will be used.');
  else if (!exists(music)) warnings.push(`music.src → ${music} is missing — the built-in chime melody will be used.`);
}

/* 6 · every local file the page and the styles ask for exists */
const refs = new Set();
for (const x of html.matchAll(/\s(?:src|href)="([^"#]+)"/g)) refs.add(x[1]);
for (const css of walk(path.join(ROOT, 'styles'))) {
  const text = fs.readFileSync(path.join(ROOT, 'styles', css), 'utf8');
  for (const x of text.matchAll(/url\((['"]?)([^'")]+)\1\)/g)) {
    // inline data images, and "#id" references inside them (written %23id), are not files
    if (x[2].startsWith('data:') || x[2].startsWith('#') || x[2].startsWith('%23')) continue;
    refs.add(rel(path.resolve(ROOT, 'styles', x[2])));
  }
}
for (const src of ['sky', 'assets', 'audio']) {
  const text = fs.readFileSync(path.join(ROOT, 'src', `${src}.js`), 'utf8');
  for (const x of text.matchAll(/['"`](assets\/[^'"`$]+\.[a-z0-9]+)['"`]/g)) refs.add(x[1]);
}
for (const tint of ['day', 'sunset', 'night']) for (let i = 1; i <= 4; i++) refs.add(`assets/scenery/cloud-${i}-${tint}.webp`);
let local = 0;
for (const ref of refs) {
  if (/^(https?:|mailto:|tel:|data:)/.test(ref)) continue;
  local += 1;
  if (!exists(decodeURIComponent(ref))) {
    if (ref === 'assets/icons/share-preview.jpg') warnings.push('assets/icons/share-preview.jpg is missing — link previews (WhatsApp etc.) will have no picture. Run "npm run build".');
    else errors.push(`missing file: ${ref}`);
  }
}
ok.push(`${local} referenced files checked`);

/* 7 · anchors and ids */
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((x) => x[1]);
const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) errors.push(`duplicate ids: ${[...new Set(dup)].join(', ')}`);
for (const x of html.matchAll(/href="#([^"]+)"/g)) if (!ids.includes(x[1])) errors.push(`link to #${x[1]} has no matching section`);
for (const x of html.matchAll(/aria-(?:labelledby|controls)="([^"]+)"/g)) if (!ids.includes(x[1])) errors.push(`aria reference to #${x[1]} has no matching element`);
ok.push(`${ids.length} ids unique, in-page links resolve`);

/* 8 · images carry alt text; new-tab links are safe */
for (const x of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt=/.test(x[0])) errors.push(`image without alt: ${x[0].slice(0, 80)}…`);
for (const x of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) if (!/rel="[^"]*noopener/.test(x[0])) errors.push(`new-tab link without rel="noopener": ${x[0].slice(0, 80)}…`);
ok.push('images have alt text; external links use rel="noopener"');

/* 9 · weight */
const bytes = (dir) => walk(path.join(ROOT, dir)).reduce((sum, f) => sum + fs.statSync(path.join(ROOT, dir, f)).size, 0);
const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;
ok.push(`site weight: assets ${mb(bytes('assets'))} (scenery ${mb(bytes('assets/scenery'))}, music ${mb(bytes('assets/music'))}), code ${(bytes('src') + bytes('styles') + fs.statSync(path.join(ROOT, 'index.html')).size) / 1024 | 0} KB`);

/* ---------- report ---------- */
console.log('\n  Project check\n  ─────────────');
ok.forEach((line) => console.log(`  ✓ ${line}`));
warnings.forEach((line) => console.log(`  ! ${line}`));
errors.forEach((line) => console.log(`  ✗ ${line}`));
console.log(`\n  ${errors.length ? `${errors.length} problem(s) to fix` : 'All good'}${warnings.length ? `, ${warnings.length} note(s)` : ''}.\n`);
process.exit(errors.length ? 1 : 0);
