/* ============================================================================
   End-to-end test — opens the real invitation in Chrome/Edge and uses it the
   way a guest would. Run:  npm run test:e2e      (needs "npm install" once)

   Covers: loading · the rope-pull hero (start by button, by tapping a helper,
   by keyboard, by scrolling; replay) · real limb animation of the helpers ·
   the date reveal · bride and groom entrances and their interactions · the
   couple's scroll-driven scene forwards and backwards · the invitation scroll
   (tap, and opening by itself) · music rules · directions, map marker and copy
   address · the .ics download · replay · phone layout · reduced motion ·
   missing files · no-script · opening from disk · the classic envelope opening.
   Screenshots are saved in tests/output/.
   ============================================================================ */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, loadSite } from '../tools/lib/site.mjs';
import { launchBrowser } from '../tools/lib/browser.mjs';
import { createServer, listen } from '../tools/serve.mjs';

const OUT = path.join(ROOT, 'tests', 'output');
fs.mkdirSync(OUT, { recursive: true });
const { derived } = loadSite();
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

let passed = 0;
const failures = [];
const skipped = [];
function check(name, condition, detail = '') {
  if (condition) { passed += 1; console.log(`  ✓ ${name}`); }
  else { failures.push(name); console.log(`  ✗ ${name}${detail ? `  →  ${detail}` : ''}`); }
}
const section = (title) => console.log(`\n${title}`);

const server = createServer({ dir: ROOT });
const port = await listen(server, 5540, '127.0.0.1');
const ORIGIN = `http://127.0.0.1:${port}`;
const browser = await launchBrowser();

/** A fresh page with error tracking. */
async function open({ viewport, url = `${ORIGIN}/`, reducedMotion = false, js = true, block = [] } = {}) {
  const page = await browser.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push(`script error: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') problems.push(`console: ${m.text()}`); });
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url()}`); });
  if (viewport) await page.setViewport(viewport);
  if (reducedMotion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  if (!js) await page.setJavaScriptEnabled(false);
  if (block.length) {
    await page.setRequestInterception(true);
    page.on('request', (req) => (block.some((part) => req.url().includes(part)) ? req.abort() : req.continue()));
  }
  await page.goto(url, { waitUntil: 'networkidle0' });
  if (js) await page.evaluate(() => document.fonts.ready);
  return { page, problems };
}

const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));
const hero = (page) => page.evaluate(() => window.Invite.hero.state);
/** Waits until fn() is truthy in the page; returns false instead of throwing when time runs out. */
const until = (page, fn, timeout = 15000, arg) => page.waitForFunction(fn, { timeout, polling: 100 }, arg).then(() => true, () => false);
const heroIs = (page, states, timeout) => until(page, (list) => list.includes(window.Invite.hero.state), timeout, states);
const music = (page) => page.evaluate(() => ({ paused: document.getElementById('music').paused, playing: window.Invite.audio.playing, pressed: document.getElementById('music-toggle').getAttribute('aria-pressed'), label: document.getElementById('music-toggle').getAttribute('aria-label'), fallback: window.Invite.audio.usingFallback }));
/** Jump to a chapter; `into` 0…1 = how far through its scroll length. */
async function goTo(page, id, into = 0, settle = 1200) {
  await page.evaluate(({ id, into }) => {
    const el = document.getElementById(id);
    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + Math.max(0, el.offsetHeight - window.innerHeight) * into, behavior: 'instant' });
  }, { id, into });
  await wait(settle);
}
const visible = (page, selector) => page.evaluate((sel) => {
  const el = document.querySelector(sel);
  if (!el) return false;
  const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
  let opacity = 1; for (let n = el; n && n.nodeType === 1; n = n.parentElement) opacity *= parseFloat(getComputedStyle(n).opacity);
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && cs.visibility !== 'hidden' && cs.display !== 'none' && opacity > 0.9;
}, selector);
/** How far the banner has been raised (0 = down, 1 = fully up), read from what is actually painted. */
const bannerRaised = (page) => page.evaluate(() => {
  const cloth = document.querySelector('.banner__cloth'); const box = document.querySelector('.banner');
  return +((box.getBoundingClientRect().top - cloth.getBoundingClientRect().top) / cloth.getBoundingClientRect().height).toFixed(3);
});
/** Is the date itself what a visitor sees at the middle of the date panel? */
const dateUncovered = (page) => page.evaluate(() => {
  const dm = document.querySelector('.datepanel__dm').getBoundingClientRect();
  const cloth = document.querySelector('.banner__cloth').getBoundingClientRect();
  return cloth.bottom < dm.top + 2;
});
const helpers = (page, scope) => page.evaluate((sel) => [...document.querySelectorAll(`${sel} .helper`)].map((h) => ({
  kind: h.className.replace(/helper\s+helper--/, '').split(' ')[0], state: h.dataset.state, facing: h.dataset.facing,
  x: +h.style.getPropertyValue('--x'), y: +h.style.getPropertyValue('--y'), shown: h.style.visibility !== 'hidden',
})), scope);
/** A snapshot of a helper's limbs: if these change over time, the limbs are really moving. */
const limbs = (page, selector) => page.evaluate((sel) => {
  const h = document.querySelector(sel);
  return ['.h-leg--a', '.h-leg--b', '.h-arm--a', '.h-upper'].map((part) => getComputedStyle(h.querySelector(part)).transform).join('|');
}, selector);

const DESKTOP = { width: 1366, height: 768, deviceScaleFactor: 1 };
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

try {
  /* ====================================================================== */
  section('1 · Loading');
  {
    const { page, problems } = await open({ viewport: DESKTOP });
    check('page loads with no script errors, console errors or missing files', problems.length === 0, problems.join(' | '));
    check('title names the couple, the event and the date', (await page.title()) === 'Kenvi & Puru · Wedding Reception · 28 November 2026', await page.title());
    check('all components started', await page.evaluate(() => document.documentElement.classList.contains('is-ready')));
    check('the rope-and-banner opening is the default', (await page.evaluate(() => document.getElementById('opening').dataset.opening)) === 'rope');
    const m = await music(page);
    check('music is silent before any interaction', m.paused && !m.playing && m.pressed === 'false');
    const images = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.hidden).map((i) => i.getAttribute('src')));
    check('no broken images', images.length === 0, images.join(', '));

    /* ================================================================== */
    section('2 · Hero: the helpers get ready');
    check('three little helpers are on stage', (await helpers(page, '#gate')).length === 3);
    check('the banner starts down, hiding the date', (await bannerRaised(page)) < 0.05 && !(await dateUncovered(page)));
    await page.screenshot({ path: path.join(OUT, 'desktop-hero-intro.jpg'), type: 'jpeg', quality: 80 });
    const walkA = await limbs(page, '#gate .helper--genda');
    check('the helpers act out finding the rope, and end up holding it', await heroIs(page, ['ready'], 16000), await hero(page));
    const ready = await helpers(page, '#gate');
    check('all three have both hands on the rope, leaning back', ready.every((h) => h.state === 'grab' && h.facing === 'left'), JSON.stringify(ready));
    check('their limbs moved to get there (a rig, not a sliding picture)', walkA !== (await limbs(page, '#gate .helper--genda')));
    check('the rope is drawn through their hands', (await page.evaluate(() => document.querySelector('.rope__line').getAttribute('d') || '')).length > 60);
    await page.screenshot({ path: path.join(OUT, 'desktop-hero-ready.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('3 · Hero: "Begin Our Story" — the rope pull and the date reveal');
    await page.keyboard.press('Tab');
    check('first Tab reaches the "skip to details" link', await page.evaluate(() => document.activeElement.classList.contains('skip-link')));
    await page.focus('#hero-begin');
    const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { outline: cs.outlineStyle, width: parseFloat(cs.outlineWidth) }; });
    check('the button shows a visible focus ring', ring.outline !== 'none' && ring.width >= 2, JSON.stringify(ring));
    check('it is labelled "Begin Our Story"', (await page.evaluate(() => document.getElementById('hero-begin').textContent.trim())) === 'Begin Our Story');
    await page.keyboard.press('Enter');
    check('pressing Enter starts the pull', await heroIs(page, ['pulling'], 1500), await hero(page));
    await wait(450);
    const p1 = { cast: await helpers(page, '#gate'), limbs: await limbs(page, '#gate .helper--genda'), lift: await bannerRaised(page), rope: await page.evaluate(() => document.querySelector('.rope__line').getAttribute('d')) };
    await wait(700);
    const p2 = { cast: await helpers(page, '#gate'), limbs: await limbs(page, '#gate .helper--genda'), lift: await bannerRaised(page), rope: await page.evaluate(() => document.querySelector('.rope__line').getAttribute('d')) };
    check('all three are pulling', p1.cast.every((h) => h.state === 'pull'), JSON.stringify(p1.cast.map((h) => h.state)));
    check('legs and arms are really moving while they pull', p1.limbs !== p2.limbs);
    check('they back away, hauling the rope with them', p2.cast.every((h, i) => h.x > p1.cast[i].x + 1), `${p1.cast.map((h) => h.x.toFixed(1))} → ${p2.cast.map((h) => h.x.toFixed(1))}`);
    check('the rope moves with them', p1.rope !== p2.rope);
    check('the banner rises as they pull', p2.lift > p1.lift + 0.05 && p2.lift < 1, `${p1.lift} → ${p2.lift}`);
    await page.screenshot({ path: path.join(OUT, 'desktop-hero-pulling.jpg'), type: 'jpeg', quality: 80 });
    let m2 = await music(page);
    check('music begins with that key press (a real user gesture)', !m2.paused && m2.playing && m2.pressed === 'true', JSON.stringify(m2));

    check('the banner reaches the top', await heroIs(page, ['revealed', 'done'], 6000), await hero(page));
    check('the date is uncovered', (await bannerRaised(page)) > 0.98 && (await dateUncovered(page)));
    const panel = await page.evaluate(() => document.getElementById('date-panel').innerText.replace(/\s+/g, ' ').trim());
    check('it reads SAVE THE DATE · SATURDAY, 28 NOVEMBER 2026', /SAVE THE DATE/i.test(panel) && /SATURDAY, 28 NOVEMBER 2026/i.test(panel), panel);
    await wait(250);
    const tumble = await helpers(page, '#gate');
    check('the helpers tumble onto the ground', tumble.some((h) => h.state === 'sit'), JSON.stringify(tumble.map((h) => h.state)));
    await page.screenshot({ path: path.join(OUT, 'desktop-hero-tumble.jpg'), type: 'jpeg', quality: 80 });
    check('then get up and cheer beside the date', await until(page, () => [...document.querySelectorAll('#gate .helper')].filter((h) => h.dataset.state === 'cheer').length === 3, 6000));
    await page.screenshot({ path: path.join(OUT, 'desktop-hero-cheer.jpg'), type: 'jpeg', quality: 80 });
    check('one runs ahead and the story is ready to continue', await heroIs(page, ['done'], 9000), await hero(page));
    await wait(800);   // the link fades in
    check('"Follow the little one" appears and leads to the bride', (await visible(page, '#hero-follow')) && (await page.evaluate(() => document.getElementById('hero-follow').getAttribute('href'))) === '#bride');
    check('the "Begin" button steps aside once used', !(await visible(page, '#hero-begin')));

    section('4 · Music controls');
    check('music button offers "Mute music"', (await music(page)).label === 'Mute music');
    await page.click('#music-toggle'); await wait(900);
    m2 = await music(page);
    check('the guest can mute', m2.paused && !m2.playing && m2.pressed === 'false', JSON.stringify(m2));
    await page.click('#music-toggle'); await wait(500);
    m2 = await music(page);
    check('…and unmute again', !m2.paused && m2.playing, JSON.stringify(m2));
    const heard = await page.evaluate(() => { let n = 0; window.Invite.on('sfx', () => { n += 1; }); const ok = window.Invite.sfx.play('bell'); return { ok, n }; });
    check('sound effects play while music is on', heard.ok && heard.n === 1, JSON.stringify(heard));
    await page.click('#music-toggle'); await wait(700);
    check('…and are silent once the guest has muted', (await page.evaluate(() => window.Invite.sfx.play('bell'))) === false);

    /* ================================================================== */
    section('5 · Hero: replay, and starting it by tapping a helper');
    await page.click('#replay'); await wait(900);
    check('the corner replay button resets the scene', (await hero(page)) === 'ready' && (await bannerRaised(page)) < 0.05, `${await hero(page)} lift=${await bannerRaised(page)}`);
    check('…and returns focus to "Begin Our Story"', await page.evaluate(() => document.activeElement.id === 'hero-begin'));
    await page.click('#gate .helper--chameli');
    check('tapping one of the helpers starts the pull too', await heroIs(page, ['pulling'], 1500), await hero(page));
    check('a guest who muted stays muted', (await music(page)).paused);
    check('the reveal completes again', await heroIs(page, ['done'], 16000), await hero(page));

    /* ================================================================== */
    section('6 · Natural scrolling (nothing is locked or hijacked)');
    const dims = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight, oy: getComputedStyle(document.body).overflowY, ohy: getComputedStyle(document.documentElement).overflowY }));
    check('the story is one long scrollable page', dims.h > dims.vh * 6, JSON.stringify(dims));
    check('scrolling is not disabled', dims.oy !== 'hidden' && dims.ohy !== 'hidden');
    await page.mouse.move(600, 400);
    await page.mouse.wheel({ deltaY: 500 }); await wait(700);
    check('mouse wheel scrolls forward', (await scrollY(page)) > 300, `scrollY=${await scrollY(page)}`);
    await page.mouse.wheel({ deltaY: -500 }); await wait(700);
    check('mouse wheel scrolls back', (await scrollY(page)) < 20, `scrollY=${await scrollY(page)}`);
    await page.keyboard.press('PageDown'); await wait(900);
    check('keyboard (Page Down) scrolls', (await scrollY(page)) > 300, `scrollY=${await scrollY(page)}`);
    await page.keyboard.press('Home'); await wait(900);
    check('keyboard (Home) returns to the top', (await scrollY(page)) < 5);
    const labels = await page.evaluate(() => [...document.querySelectorAll('.chapters a')].map((a) => a.textContent.trim()));
    check('seven chapters, each with a labelled dot', labels.length === 7 && labels.every(Boolean), labels.join(','));

    /* ================================================================== */
    section('7 · The bride\'s entrance');
    await page.click('#hero-follow'); await wait(1500);
    const brideTop = await page.evaluate(() => Math.round(document.getElementById('bride').getBoundingClientRect().top));
    check('"Follow the little one" travels to the bride', Math.abs(brideTop) < 6, `top=${brideTop}`);
    check('chapter dot follows along', (await page.evaluate(() => document.querySelector('.chapters a[aria-current="true"]')?.getAttribute('data-chapter'))) === 'bride');
    const cls = (id) => page.evaluate((x) => document.getElementById(x).className, id);
    check('a helper runs in with a basket of petals', await until(page, () => { const h = document.querySelector('#bride .helper--chameli'); return h && h.dataset.state === 'carry' && h.hasAttribute('data-carrying'); }, 4000));
    check('petals are scattered along the path', await until(page, () => document.querySelectorAll('#bride .trail-petal').length >= 6, 6000));
    const hidden = await page.evaluate(() => +getComputedStyle(document.querySelector('.figure--bride')).opacity);
    check('the bride is still behind the curtain of flowers', hidden < 0.1 && !(await cls('bride')).includes('curtain-open'), `opacity=${hidden}`);
    await page.screenshot({ path: path.join(OUT, 'desktop-bride-petals.jpg'), type: 'jpeg', quality: 80 });
    check('the curtain parts', await until(page, () => document.getElementById('bride').classList.contains('curtain-open'), 9000));
    check('and she steps through the arch', await until(page, () => document.getElementById('bride').classList.contains('has-entered') && +getComputedStyle(document.querySelector('.figure--bride')).opacity > 0.95, 6000));
    check('her name plaque unfolds: KENVI DWIVEDI', await until(page, () => document.getElementById('bride').classList.contains('show-plaque'), 8000) && (await page.evaluate(() => document.getElementById('bride-title').textContent)) === 'Kenvi Dwivedi');
    await wait(1300);
    check('the plaque is fully readable', await visible(page, '#bride-title'));
    check('she is offering a bouquet (a real, labelled button)', (await visible(page, '#bride-bouquet')) && /flowers/i.test(await page.evaluate(() => document.getElementById('bride-bouquet').getAttribute('aria-label'))));
    await page.click('#bride-bouquet'); await wait(900);
    const bloom = await page.evaluate(() => ({ on: document.getElementById('bride-bouquet').classList.contains('is-bloomed'), extra: [...document.querySelectorAll('#bride-bouquet .bloom--extra')].map((b) => getComputedStyle(b).transform), petals: document.querySelectorAll('#bride .petalfall i').length }));
    check('tapping the bouquet makes it bloom', bloom.on && bloom.extra.every((t) => t !== 'matrix(0, 0, 0, 0, 0, 0)'), JSON.stringify(bloom.extra));
    check('…and sends petals drifting across the screen', bloom.petals >= 10, `petals=${bloom.petals}`);
    await page.screenshot({ path: path.join(OUT, 'desktop-bride.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('8 · The groom\'s entrance');
    await goTo(page, 'groom', 0, 400);
    check('a helper races in with a golden flag', await until(page, () => { const h = document.querySelector('#groom .helper--genda'); return h && h.hasAttribute('data-carrying') && +h.style.getPropertyValue('--x') > 5; }, 5000));
    const before = await page.evaluate(() => Math.round(document.querySelector('.figure--groom').getBoundingClientRect().left));
    check('the groom steps out from behind the pillar', await until(page, () => document.querySelector('.figure--groom').classList.contains('has-arrived'), 9000) && (await page.evaluate(() => Math.round(document.querySelector('.figure--groom').getBoundingClientRect().left))) > before + 40);
    check('a second helper brings a garland, and he receives it', await until(page, () => document.getElementById('groom').classList.contains('has-garland') && +getComputedStyle(document.getElementById('groom-garland')).opacity > 0.9, 7000));
    check('his name plaque unfolds: PURU TYAGI', await until(page, () => document.getElementById('groom').classList.contains('show-plaque'), 6000) && (await page.evaluate(() => document.getElementById('groom-title').textContent)) === 'Puru Tyagi');
    await until(page, () => document.getElementById('groom').classList.contains('show-caption'), 5000);
    await wait(600);
    const greeted = await page.evaluate(() => { window.__greets = 0; window.Invite.on('groom-greet', () => { window.__greets += 1; }); return true; });
    await page.click('#groom-tap'); await wait(300);
    const greet = await page.evaluate(() => ({ n: window.__greets, bow: document.querySelector('.figure--groom').classList.contains('is-greeting'), petals: document.querySelectorAll('#groom .petalfall i').length, label: document.getElementById('groom-tap').getAttribute('aria-label') }));
    check('tapping him brings a greeting and a fall of petals', greeted && greet.n === 1 && greet.bow && greet.petals >= 8, JSON.stringify(greet));
    const through = await page.evaluate(() => { const r = document.getElementById('groom-tap').getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.3); return top && (top.id || top.className); });
    check('nothing invisible sits on top of him', through === 'groom-tap', String(through));
    check('the greeting control is labelled for screen readers', /Puru/.test(greet.label));
    await page.screenshot({ path: path.join(OUT, 'desktop-groom.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'bride', 0, 500);
    check('scrolling back replays the bride\'s entrance from the start', await until(page, () => { const b = document.getElementById('bride'); return !b.classList.contains('has-entered') && document.querySelector('#bride .helper--chameli'); }, 3000));

    /* ================================================================== */
    section('9 · The couple\'s scene plays with the scroll — forward and back');
    const together = () => page.evaluate(() => {
      const o = (sel) => +getComputedStyle(document.querySelector(sel)).opacity;
      return {
        solo: o('.together__solo--groom'), portrait: o('.together__portrait'), ring: o('.together__ring'), mandap: o('.together__mandap'), names: o('.together__line--name'),
        lamps: document.querySelectorAll('.together__diyas .diya.is-lit').length,
        pinnedTop: Math.round(document.querySelector('#together .scene__stage').getBoundingClientRect().top),
        cast: [...document.querySelectorAll('#together .helper')].map((h) => ({ state: h.dataset.state, x: +h.style.getPropertyValue('--x'), scrubbed: h.classList.contains('is-scrubbed') })),
      };
    });
    await goTo(page, 'together', 0.12);
    const q1 = await together(); const l1 = await limbs(page, '#together .helper--chameli');
    await goTo(page, 'together', 0.2);
    const q2 = await together(); const l2 = await limbs(page, '#together .helper--chameli');
    check('early on: the two walk in separately, no lamps lit yet', q2.solo > 0.9 && q2.portrait < 0.05 && q2.lamps === 0, JSON.stringify(q2));
    check('the stage stays pinned while the scene plays', q2.pinnedTop === 0, `top=${q2.pinnedTop}`);
    check('helpers run between them as the page scrolls', q2.cast.length === 2 && q2.cast.every((h) => h.state === 'carry' && h.scrubbed) && Math.abs(q2.cast[0].x - q1.cast[0].x) > 5, JSON.stringify([q1.cast, q2.cast]));
    check('…and their run cycle advances with the scroll, frame by frame', l1 !== l2);
    await wait(500);
    check('…holding still when the scrolling stops', l2 === (await limbs(page, '#together .helper--chameli')));
    await goTo(page, 'together', 1);
    const late = await together();
    check('at the end: together beneath the floral mandap, framed in flowers', late.solo < 0.05 && late.portrait > 0.95 && late.ring > 0.95 && late.mandap > 0.95, JSON.stringify(late));
    check('all eight lamps are lit', late.lamps === 8, `lamps=${late.lamps}`);
    check('the helpers have stopped to cheer', late.cast.every((h) => h.state === 'cheer' && !h.scrubbed), JSON.stringify(late.cast));
    const names = await page.evaluate(() => document.querySelector('.together__text').innerText.replace(/\s+/g, ' ').trim());
    check('the names and the closing line appear', late.names > 0.95 && /KENVI DWIVEDI/i.test(names) && /PURU TYAGI/i.test(names) && names.includes('Together, let us celebrate a beautiful new chapter.'), names);
    await page.screenshot({ path: path.join(OUT, 'desktop-together.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'together', 0.2);
    const back = await together();
    check('scrolling back plays it in reverse', back.solo > 0.9 && back.portrait < 0.05 && back.lamps === 0 && back.cast.every((h) => h.state === 'carry'), JSON.stringify(back));

    /* ================================================================== */
    section('10 · The invitation: delivered, tapped, unrolled');
    await goTo(page, 'invitation', 0, 300);
    const card = () => page.evaluate(() => { const r = document.getElementById('scrollcard'); return { state: r.dataset.state, has: r.classList.contains('has-scroll'), u: +r.style.getPropertyValue('--u'), b: +r.style.getPropertyValue('--b') }; });
    check('the invitation starts rolled up', (await card()).state === 'rolled');
    check('a helper carries it in and puts it on the stand', await until(page, () => document.getElementById('scrollcard').classList.contains('has-scroll'), 8000) && (await helpers(page, '#invitation')).length === 1);
    check('the visitor is invited to tap it', (await visible(page, '#scroll-open')) && /open/i.test(await page.evaluate(() => document.getElementById('scroll-open').textContent)));
    await page.screenshot({ path: path.join(OUT, 'desktop-card-rolled.jpg'), type: 'jpeg', quality: 80 });
    await page.click('#scroll-open');
    await wait(1200);
    const mid = await card();
    check('tapping loosens the ribbon and the paper begins to unroll', mid.state === 'opening' && mid.u > 0.05 && mid.u < 1, JSON.stringify(mid));
    check('the card finishes open', await until(page, () => document.getElementById('scrollcard').dataset.state === 'open', 5000));
    check('a gold border draws itself around it', await until(page, () => +document.getElementById('scrollcard').style.getPropertyValue('--b') >= 1, 5000));
    await wait(2200);
    check('the details have all appeared', await visible(page, '.card__address'));
    const text = await page.evaluate(() => document.querySelector('.card').innerText.replace(/\s+/g, ' ').trim());
    check('card shows both full names', text.includes('Kenvi Dwivedi') && text.includes('Puru Tyagi'), text);
    check('card shows the event and date', /WEDDING RECEPTION/i.test(text) && text.includes('Saturday, 28 November 2026'));
    check('card shows the complete venue address', text.includes('Hotel Royal Residency') && text.includes('Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India'), text);
    check('no time or RSVP is shown (none was given)', (await page.evaluate(() => document.querySelector('[data-optional="event.time"]').hidden)) && !/rsvp/i.test(text));
    await page.screenshot({ path: path.join(OUT, 'desktop-card.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('11 · Venue: directions, the helper\'s map marker, copy address');
    await goTo(page, 'venue', 0, 600);
    check('a helper walks up the path carrying a map marker', await until(page, () => { const h = document.querySelector('#venue .helper'); return h && h.dataset.state === 'hold' && document.getElementById('marker-link'); }, 12000));
    const links = await page.evaluate(() => [...document.querySelectorAll('.js-directions')].map((a) => ({ id: a.id, href: a.href, target: a.target, rel: a.rel })));
    check('every directions control points at Google Maps directions for the venue', links.length === 3 && links.every((l) => l.href === derived.mapsDirections), JSON.stringify(links.map((l) => l.id)));
    check('they open in a new tab safely', links.every((l) => l.target === '_blank' && /noopener/.test(l.rel)));
    const marker = await page.evaluate(() => { const a = document.getElementById('marker-link'); const r = a.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { label: a.getAttribute('aria-label'), w: Math.round(r.width), h: Math.round(r.height), hit: top === a || a.contains(top), focusable: a.tabIndex >= 0 }; });
    check('the marker is a real, clickable, labelled link', marker.hit && marker.focusable && marker.w >= 40 && marker.h >= 40 && /Hotel Royal Residency/.test(marker.label), JSON.stringify(marker));
    try {
      const res = await fetch(derived.mapsDirections, { redirect: 'follow', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 Safari/537.36' } });
      check('Google Maps answers that link', res.ok, `HTTP ${res.status}`);
    } catch (err) {
      skipped.push(`live check of the Google Maps link (no internet: ${err.message})`);
    }
    await browser.defaultBrowserContext().overridePermissions(ORIGIN, ['clipboard-read', 'clipboard-write']);
    await page.bringToFront();
    await page.click('#copy-address'); await wait(500);
    const clip = await page.evaluate(() => navigator.clipboard.readText());
    check('"Copy address" puts the full address on the clipboard', clip === derived.addressOneLine, clip);
    check('…and confirms it in words (also announced to screen readers)', /copied/i.test(await page.evaluate(() => document.getElementById('copy-status').textContent)));
    check('the address is real, selectable text', (await page.evaluate(() => document.getElementById('venue-address').innerText.replace(/\s+/g, ' ').trim())) === 'Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India');
    check('the scenery is labelled as an illustration, not the real hotel', /artist/i.test(await page.evaluate(() => document.querySelector('.venue__note').textContent)));
    await page.screenshot({ path: path.join(OUT, 'desktop-venue.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('12 · Finale: the helpers return; calendar download');
    await goTo(page, 'save-the-date', 0, 600);
    check('the date is shown once more: SATURDAY, 28 NOVEMBER 2026', (await visible(page, '.finale__date')) || (await until(page, () => +getComputedStyle(document.querySelector('.finale__date')).opacity > 0.9, 4000)));
    check('…as real text', (await page.evaluate(() => document.getElementById('finale-title').textContent.trim())) === 'Saturday, 28 November 2026');
    check('one helper climbs the ladder, rung by rung', await until(page, () => { const h = document.querySelector('#save-the-date .helper--chameli'); return h && h.dataset.state === 'climb' && +h.style.getPropertyValue('--y') > 8; }, 12000));
    const c1 = await limbs(page, '#save-the-date .helper--chameli'); await wait(260);
    check('…hand over hand', c1 !== (await limbs(page, '#save-the-date .helper--chameli')));
    check('…and places the last flower at the top of the frame', await until(page, () => document.getElementById('save-the-date').classList.contains('is-crowned'), 9000));
    check('another lets a lantern go and waves goodbye', await until(page, () => document.querySelector('#save-the-date .released-lantern') && document.querySelector('#save-the-date .helper--genda').dataset.state === 'wave', 12000));
    const buttons = await page.evaluate(() => ['calendar-link', 'finale-directions', 'revisit'].map((id) => document.getElementById(id).innerText.replace(/\s+/g, ' ').trim()));
    check('the three buttons are there: calendar, maps, replay', /DOWNLOAD CALENDAR EVENT/i.test(buttons[0]) && /OPEN GOOGLE MAPS/i.test(buttons[1]) && /REPLAY INVITATION/i.test(buttons[2]), buttons.join(' | '));
    const downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'invite-dl-'));
    const cdp = await page.createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await page.click('#calendar-link');
    let file = '';
    for (let i = 0; i < 40 && !file; i++) { await wait(150); file = fs.readdirSync(downloads).find((f) => f.endsWith('.ics')) || ''; }
    check('"Download calendar event" downloads an .ics file', Boolean(file), fs.readdirSync(downloads).join(','));
    if (file) {
      const ics = fs.readFileSync(path.join(downloads, file), 'utf8');
      check('the file is named for the event', file === 'Kenvi-Puru-Wedding-Reception.ics', file);
      check('it is an all-day event on 28 November 2026', ics.includes('DTSTART;VALUE=DATE:20261128') && ics.includes('DTEND;VALUE=DATE:20261129') && !/DTSTART[^\r\n]*T\d{6}/.test(ics));
      check('it carries the title and the venue', ics.replace(/\r\n /g, '').includes('SUMMARY:Wedding Reception of Kenvi Dwivedi & Puru Tyagi') && ics.replace(/\r\n /g, '').includes('LOCATION:Hotel Royal Residency\\, Ambala Road'));
    }
    fs.rmSync(downloads, { recursive: true, force: true });
    const gcal = await page.evaluate(() => document.getElementById('gcal-link').href);
    check('Google Calendar link carries the same all-day date', new URL(gcal).searchParams.get('dates') === '20261128/20261129', gcal);
    await page.screenshot({ path: path.join(OUT, 'desktop-finale.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('13 · Replay invitation');
    await page.click('#revisit');
    for (let i = 0; i < 40 && (await scrollY(page)) > 2; i++) await wait(150);
    await wait(900);
    check('"Replay invitation" returns to the start', (await scrollY(page)) <= 2, `scrollY=${await scrollY(page)}`);
    check('…with the banner down and the helpers ready again', (await hero(page)) === 'ready' && (await bannerRaised(page)) < 0.05, `${await hero(page)}`);
    check('…focus back on "Begin Our Story"', await page.evaluate(() => document.activeElement.id === 'hero-begin'));
    check('…and the invitation rolled up again', (await page.evaluate(() => document.getElementById('scrollcard').dataset.state)) === 'rolled');
    check('still no errors after the whole journey', problems.length === 0, problems.join(' | '));
    await page.close();
  }

  /* ====================================================================== */
  section('14 · Guests who only scroll are never left out');
  {
    const { page, problems } = await open({ viewport: DESKTOP });
    await page.mouse.move(600, 400);
    await page.mouse.wheel({ deltaY: 420 }); await wait(500);
    check('scrolling on, without pressing anything, sets the helpers pulling', await heroIs(page, ['pulling', 'revealed', 'done'], 2000), await hero(page));
    check('…but scrolling alone never starts music', (await music(page)).paused);
    check('…and the date is revealed', await heroIs(page, ['revealed', 'done'], 8000) && (await dateUncovered(page)));
    await goTo(page, 'invitation', 0, 300);
    check('an invitation nobody taps opens by itself, so the details are never hidden', await until(page, () => document.getElementById('scrollcard').dataset.state === 'open', 16000));
    await wait(2400);
    check('…and is fully readable', await visible(page, '.card__address'));
    check('no errors', problems.length === 0, problems.join(' | '));
    await page.close();
  }

  /* ====================================================================== */
  section('15 · Phone (390 × 844, touch)');
  {
    const { page, problems } = await open({ viewport: PHONE });
    check('loads cleanly on a phone', problems.length === 0, problems.join(' | '));
    await heroIs(page, ['ready'], 16000);
    const begin = await page.evaluate(() => { const r = document.getElementById('hero-begin').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.touchscreen.tap(begin[0], begin[1]);
    check('tapping "Begin Our Story" starts the pull', await heroIs(page, ['pulling'], 1500), await hero(page));
    check('…and starts the music', (await music(page)).playing);
    check('the date is revealed', await heroIs(page, ['revealed', 'done'], 8000) && (await dateUncovered(page)));
    const date = await page.evaluate(() => ['.datepanel__kicker', '.datepanel__day', '.datepanel__dm'].map((sel) => { const el = document.querySelector(sel); const range = document.createRange(); range.selectNodeContents(el); const r = range.getBoundingClientRect(); const p = document.getElementById('date-panel').getBoundingClientRect(); return { size: +parseFloat(getComputedStyle(el).fontSize).toFixed(1), inside: r.left >= p.left && r.right <= p.right }; }));
    check('the date fits its panel and is large enough to read (weekday 14px+, date 16px+)', date.every((d) => d.inside) && date[0].size >= 12 && date[1].size >= 14 && date[2].size >= 16, JSON.stringify(date));
    await heroIs(page, ['done'], 12000);
    await page.screenshot({ path: path.join(OUT, 'phone-hero.jpg'), type: 'jpeg', quality: 80 });
    await page.click('#music-toggle'); await wait(300);
    // a real finger drag: touch down, move in small steps, lift
    const drag = async (fromY, toY) => {
      await page.touchscreen.touchStart(195, fromY);
      for (let i = 1; i <= 14; i++) { await page.touchscreen.touchMove(195, fromY + ((toY - fromY) * i) / 14); await wait(16); }
      await page.touchscreen.touchEnd();
      await wait(900);
    };
    await drag(620, 200);
    const swiped = await scrollY(page);
    check('a finger swipe scrolls the story', swiped > 250, `scrollY=${swiped}`);
    await drag(200, 620);
    check('…and swiping back works', (await scrollY(page)) < swiped - 200, `scrollY=${await scrollY(page)}`);

    let overflow = 0;
    for (const id of ['opening', 'bride', 'groom', 'together', 'invitation', 'venue', 'save-the-date']) {
      await goTo(page, id, 0.5, 1500);
      overflow = Math.max(overflow, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      await page.screenshot({ path: path.join(OUT, `phone-${id}.jpg`), type: 'jpeg', quality: 78 });
    }
    check('no sideways scrolling anywhere', overflow <= 0, `overflow=${overflow}px`);

    await goTo(page, 'bride', 0, 400);
    await until(page, () => document.getElementById('bride').classList.contains('show-bouquet'), 14000);
    await wait(900);
    const bq = await page.evaluate(() => { const r = document.getElementById('bride-bouquet').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.4, w: Math.round(r.width), on: r.right > 0 && r.left < innerWidth }; });
    await page.touchscreen.tap(bq.x, bq.y); await wait(500);
    check('the bouquet can be tapped on a phone', bq.on && bq.w >= 40 && (await page.evaluate(() => document.getElementById('bride-bouquet').classList.contains('is-bloomed'))), JSON.stringify(bq));

    await goTo(page, 'invitation', 0, 300);
    await until(page, () => document.getElementById('scrollcard').classList.contains('has-scroll'), 9000);
    const tap = await page.evaluate(() => { const r = document.getElementById('scroll-open').getBoundingClientRect(); return [r.left + r.width / 2, r.top + 40]; });
    await page.touchscreen.tap(tap[0], tap[1]);
    check('tapping the rolled invitation opens it', await until(page, () => document.getElementById('scrollcard').dataset.state === 'open', 5000));
    await wait(2600);
    const fit = await page.evaluate(() => {
      const out = [];
      document.querySelectorAll('.card__name, .card__event, .card__date, .card__venue, .card__address').forEach((el) => {
        const range = document.createRange(); range.selectNodeContents(el);
        const r = range.getBoundingClientRect();
        out.push({ cls: el.className, left: Math.round(r.left), right: Math.round(r.right), size: parseFloat(getComputedStyle(el).fontSize) });
      });
      return out;
    });
    check('names, date and address fit inside the phone screen', fit.every((f) => f.left >= 0 && f.right <= 390), JSON.stringify(fit));
    check('date and address text is at least 17px', fit.filter((f) => /date|address|venue/.test(f.cls)).every((f) => f.size >= 17), JSON.stringify(fit.map((f) => `${f.cls}:${f.size}`)));
    const covered = await page.evaluate(() => {
      const el = document.querySelector('.card__address'); el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(top === el || el.contains(top) || top.closest('.card'));
    });
    check('nothing is painted over the invitation details', !covered);
    check('petals and helpers sit beneath the text', await page.evaluate(() => { const z = (s) => +getComputedStyle(document.querySelector(s)).zIndex; return z('#particles') < z('#invitation .scene__content') && z('#invitation > .troupe') < z('#invitation .scene__content'); }));

    await goTo(page, 'venue', 0, 1500);
    const targets = await page.evaluate(() => [...document.querySelectorAll('.btn, .icon-btn, .chrome__mark')].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width) }; }));
    check('buttons are comfortably tappable (44px or more)', targets.length > 5 && targets.every((t) => t.h >= 44 && t.w >= 44), JSON.stringify(targets));
    check('no errors on the phone run', problems.length === 0, problems.join(' | '));
    await page.close();
  }

  /* ====================================================================== */
  section('16 · Reduced motion');
  {
    const { page, problems } = await open({ viewport: DESKTOP, reducedMotion: true });
    check('loads cleanly', problems.length === 0, problems.join(' | '));
    check('the preference is detected', await page.evaluate(() => document.documentElement.classList.contains('reduce-motion') && window.Invite.motion.reduced));
    check('the date is simply shown — no banner in the way, no performance to sit through', (await hero(page)) === 'done' && (await dateUncovered(page)));
    const still = await page.evaluate(() => ({
      canvas: getComputedStyle(document.getElementById('particles')).display,
      stage: getComputedStyle(document.querySelector('#together .scene__stage')).position,
      togetherH: document.getElementById('together').offsetHeight, vh: innerHeight,
      cloud: getComputedStyle(document.querySelector('.cloud')).animationName,
      behaviour: getComputedStyle(document.documentElement).scrollBehavior,
      hidden: [...document.querySelectorAll('[data-reveal]')].filter((el) => +getComputedStyle(el).opacity < 1 || getComputedStyle(el).transform !== 'none').length,
      layers: [...document.querySelectorAll('.layer')].filter((el) => el.style.transform).length,
      limbs: [...document.querySelectorAll('.helper .h-leg, .helper .h-arm, .helper .h-fig')].filter((el) => getComputedStyle(el).animationName !== 'none').length,
      helpers: document.querySelectorAll('.helper').length,
      begin: getComputedStyle(document.getElementById('hero-begin')).display,
    }));
    check('floating petals are switched off', still.canvas === 'none', still.canvas);
    check('no pinned, scroll-driven scenes', still.stage !== 'sticky' && still.togetherH <= still.vh * 1.6, JSON.stringify(still));
    check('clouds hold still and scrolling is instant', still.cloud === 'none' && still.behaviour === 'auto', JSON.stringify(still));
    check('the helpers are present but stand perfectly still', still.helpers >= 8 && still.limbs === 0, `helpers=${still.helpers} moving=${still.limbs}`);
    check('all text and pictures are simply visible (no reveal animation)', still.hidden === 0, `hidden=${still.hidden}`);
    check('no parallax is applied', still.layers === 0, `layers=${still.layers}`);
    const shown = await page.evaluate(() => ({
      bride: +getComputedStyle(document.querySelector('.figure--bride')).opacity, groom: Math.round(parseFloat(getComputedStyle(document.querySelector('.figure--groom')).left)),
      plaque: getComputedStyle(document.getElementById('bride-plaque')).clipPath, bouquet: +getComputedStyle(document.getElementById('bride-bouquet')).opacity,
      card: document.getElementById('scrollcard').dataset.state, u: getComputedStyle(document.getElementById('scrollcard')).getPropertyValue('--u').trim(),
    }));
    check('bride, bouquet and name plaque are in place without any staging', shown.bride === 1 && shown.bouquet === 1 && shown.plaque === 'none', JSON.stringify(shown));
    check('the invitation is already open', shown.card === 'open' && shown.u === '1', JSON.stringify(shown));
    await page.click('#bride-bouquet');
    check('the bouquet still responds to a tap', await page.evaluate(() => document.getElementById('bride-bouquet').classList.contains('is-bloomed')));
    await goTo(page, 'together', 0.5, 500);
    const pic = await page.evaluate(() => ({ p: +getComputedStyle(document.querySelector('.together__portrait')).opacity, solo: +getComputedStyle(document.querySelector('.together__solo--groom')).opacity, text: +getComputedStyle(document.querySelector('.together__line--name')).opacity, lamps: document.querySelectorAll('.together__diyas .diya.is-lit').length }));
    check('the couple\'s scene shows its finished picture, lamps lit', pic.p === 1 && pic.solo === 0 && pic.text === 1 && pic.lamps === 8, JSON.stringify(pic));
    await page.screenshot({ path: path.join(OUT, 'reduced-motion-together.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'invitation', 0, 400);
    check('the invitation card is readable straight away', await visible(page, '.card__address'));
    await goTo(page, 'opening', 0, 300);
    await page.screenshot({ path: path.join(OUT, 'reduced-motion-hero.jpg'), type: 'jpeg', quality: 80 });
    await page.close();
  }

  /* ====================================================================== */
  section('17 · Missing files are handled gracefully');
  {
    const { page, problems } = await open({ viewport: DESKTOP, block: ['characters/groom.webp', 'characters/couple.webp', 'scenery/golden-near.webp', 'scenery/gate.webp', 'scenery/arch.webp', 'scenery/mandap.webp', 'florals/floral-ring.webp', 'reception-theme.mp3', 'great-vibes'] });
    check('no script errors even with nine files missing', problems.filter((p) => p.startsWith('script error')).length === 0, problems.filter((p) => p.startsWith('script error')).join(' | '));
    await heroIs(page, ['ready'], 16000);
    await page.click('#hero-begin');
    check('the rope pull still works without the gate painting', await heroIs(page, ['revealed', 'done'], 9000) && (await dateUncovered(page)));
    await page.screenshot({ path: path.join(OUT, 'missing-hero.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'groom', 0, 400);
    await until(page, () => document.getElementById('groom').classList.contains('show-plaque'), 16000);
    const groom = await page.evaluate(() => { const f = document.querySelector('.figure--groom'); return { missing: f.classList.contains('is-missing'), initial: f.getAttribute('data-initial'), label: f.getAttribute('aria-label'), art: document.querySelector('#groom .scene__art').classList.contains('is-missing') }; });
    check('a missing character becomes a monogram medallion', groom.missing && groom.initial === 'P' && /Puru/.test(groom.label), JSON.stringify(groom));
    check('a missing scenery plate falls back to a painted-in-CSS landscape', groom.art);
    check('the groom\'s name still reads', await visible(page, '#groom-title'));
    await page.screenshot({ path: path.join(OUT, 'missing-groom.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'together', 1, 1200);
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.hidden && getComputedStyle(i).display !== 'none').map((i) => i.getAttribute('src')));
    check('no broken-image icons are left on the page', broken.length === 0, broken.join(', '));
    check('the missing couple portrait shows the joint monogram', (await page.evaluate(() => document.querySelector('.together__portrait').getAttribute('data-initial'))) === 'K&P');
    await page.screenshot({ path: path.join(OUT, 'missing-together.jpg'), type: 'jpeg', quality: 80 });
    const m = await music(page);
    check('missing music has switched to the built-in chimes', m.fallback && m.playing && m.pressed === 'true', JSON.stringify(m));
    await page.click('#music-toggle'); await wait(300);
    check('…which can be muted like the real thing', !(await music(page)).playing);
    await page.close();
  }

  /* ====================================================================== */
  section('18 · Without JavaScript');
  {
    const { page } = await open({ viewport: DESKTOP, js: false });
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    check('every detail is still on the page', ['Kenvi Dwivedi', 'Puru Tyagi', 'Saturday, 28 November 2026', 'Hotel Royal Residency', 'Uttar Pradesh 247001, India'].every((t) => text.includes(t)));
    check('the date at the gate is uncovered, and nothing is pinned', (await dateUncovered(page)) && (await page.evaluate(() => getComputedStyle(document.querySelector('.scene__stage')).position !== 'sticky')));
    check('the invitation card is open and the bride is in view', await page.evaluate(() => getComputedStyle(document.getElementById('scrollcard')).getPropertyValue('--u').trim() === '1' && +getComputedStyle(document.querySelector('.figure--bride')).opacity === 1));
    const hrefs = await page.evaluate(() => ({ maps: document.getElementById('directions-link').getAttribute('href'), ics: document.getElementById('calendar-link').getAttribute('href') }));
    check('directions and calendar links still work as plain links', hrefs.maps === derived.mapsDirections && hrefs.ics === 'assets/calendar/reception.ics', JSON.stringify(hrefs));
    await page.screenshot({ path: path.join(OUT, 'no-js.jpg'), type: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: 1366, height: 768 } });
    await page.close();
  }

  /* ====================================================================== */
  section('19 · Opened straight from the file (double-clicking index.html)');
  {
    const { page, problems } = await open({ viewport: DESKTOP, url: pathToFileURL(path.join(ROOT, 'index.html')).href });
    check('starts without a server', await page.evaluate(() => document.documentElement.classList.contains('is-ready')), problems.join(' | '));
    check('no script errors from the file', problems.filter((p) => p.startsWith('script error')).length === 0, problems.join(' | '));
    await heroIs(page, ['ready'], 16000);
    await page.click('#hero-begin');
    check('the rope pull and date reveal work there too', await heroIs(page, ['revealed', 'done'], 9000) && (await dateUncovered(page)));
    await page.close();
  }

  /* ====================================================================== */
  section('20 · The classic envelope opening is still available (?opening=envelope)');
  {
    const { page, problems } = await open({ viewport: DESKTOP, url: `${ORIGIN}/?opening=envelope` });
    const env = () => page.evaluate(() => document.getElementById('envelope').getAttribute('data-state'));
    check('loads cleanly', problems.length === 0, problems.join(' | '));
    check('the envelope is shown instead of the gate', (await visible(page, '#envelope-button')) && (await page.evaluate(() => getComputedStyle(document.getElementById('hero')).display)) === 'none');
    check('it starts sealed and silent', (await env()) === 'sealed' && (await music(page)).paused);
    await page.focus('#envelope-button');
    await page.keyboard.press('Enter');
    await wait(1100);
    check('pressing Enter starts it opening', (await env()) === 'opening', await env());
    await wait(1900);
    check('it finishes open, with the letter readable', (await env()) === 'open' && (await visible(page, '.letter__names')));
    const letter = await page.evaluate(() => document.getElementById('letter').innerText.replace(/\s+/g, ' ').trim());
    check('the letter carries names, event and date', /Kenvi & Puru/.test(letter) && /WEDDING RECEPTION/i.test(letter) && /Saturday, 28 November 2026/.test(letter), letter);
    check('music begins with that key press', (await music(page)).playing);
    check('focus moves on to "Begin the story"', await page.evaluate(() => document.activeElement.id === 'begin-link'));
    await page.click('#begin-link'); await wait(1600);
    check('"Begin the story" travels to the next chapter', Math.abs(await page.evaluate(() => Math.round(document.getElementById('bride').getBoundingClientRect().top))) < 6);
    await page.click('#replay'); await wait(1400);
    check('replay seals the envelope again', (await env()) === 'sealed', await env());
    await page.mouse.move(600, 400); await page.mouse.wheel({ deltaY: 500 }); await wait(700);
    check('scrolling alone opens the envelope too', (await env()) !== 'sealed', await env());
    await page.close();
  }
} catch (err) {
  failures.push(`test run crashed: ${err.stack || err}`);
  console.error(err);
} finally {
  await browser.close();
  server.close();
}

console.log(`\n────────────────────────────────────────`);
console.log(`  ${passed} passed, ${failures.length} failed${skipped.length ? `, ${skipped.length} skipped` : ''}`);
skipped.forEach((s) => console.log(`  (skipped) ${s}`));
failures.forEach((f) => console.log(`  ✗ ${f}`));
console.log(`  Screenshots: tests/output/\n`);
process.exit(failures.length ? 1 : 0);
