/* ============================================================================
   End-to-end test — opens the real invitation in Chrome/Edge and uses it the
   way a guest would. Run:  npm run test:e2e      (needs "npm install" once)

   Covers: loading, natural scrolling (wheel / keyboard / touch), the envelope,
   music and autoplay rules, chapter navigation, the pinned "together" scene in
   both directions, invitation text, directions link, copy address, the .ics
   download, replay, phone layout, reduced motion, missing files, no-script,
   and opening index.html straight from disk.
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
const port = await listen(server, 5520, '127.0.0.1');
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
const envelopeState = (page) => page.evaluate(() => document.getElementById('envelope').getAttribute('data-state'));
const music = (page) => page.evaluate(() => ({ paused: document.getElementById('music').paused, playing: window.Invite.audio.playing, pressed: document.getElementById('music-toggle').getAttribute('aria-pressed'), label: document.getElementById('music-toggle').getAttribute('aria-label'), fallback: window.Invite.audio.usingFallback }));
/** Jump to a chapter; `into` 0…1 = how far through its scroll length. */
async function goTo(page, id, into = 0, settle = 1500) {
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
    check('envelope starts sealed', (await envelopeState(page)) === 'sealed');
    const m = await music(page);
    check('music is silent before any interaction', m.paused && !m.playing && m.pressed === 'false');
    const images = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.hidden).map((i) => i.getAttribute('src')));
    check('no broken images', images.length === 0, images.join(', '));
    await page.screenshot({ path: path.join(OUT, 'desktop-opening.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('2 · Natural scrolling (nothing is locked or hijacked)');
    const dims = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight, oy: getComputedStyle(document.body).overflowY, ohy: getComputedStyle(document.documentElement).overflowY }));
    check('the story is one long scrollable page', dims.h > dims.vh * 6, JSON.stringify(dims));
    check('scrolling is not disabled', dims.oy !== 'hidden' && dims.ohy !== 'hidden');
    await page.mouse.move(600, 400);
    await page.mouse.wheel({ deltaY: 500 }); await wait(700);
    const afterWheel = await scrollY(page);
    check('mouse wheel scrolls forward', afterWheel > 300, `scrollY=${afterWheel}`);
    check('scrolling alone opens the envelope (guests are never blocked)', (await envelopeState(page)) !== 'sealed', await envelopeState(page));
    check('…but scrolling alone never starts music', (await music(page)).paused);
    await page.mouse.wheel({ deltaY: -500 }); await wait(700);
    check('mouse wheel scrolls back', (await scrollY(page)) < 20, `scrollY=${await scrollY(page)}`);
    check('scrolling back re-seals the envelope', (await envelopeState(page)) === 'sealed', await envelopeState(page));
    await page.keyboard.press('PageDown'); await wait(900);
    const afterKey = await scrollY(page);
    check('keyboard (Page Down) scrolls', afterKey > 300, `scrollY=${afterKey}`);
    await page.keyboard.press('Home'); await wait(900);
    check('keyboard (Home) returns to the top', (await scrollY(page)) < 5);

    /* ================================================================== */
    section('3 · Envelope, keyboard and music');
    await page.keyboard.press('Tab');
    check('first Tab reaches the "skip to details" link', await page.evaluate(() => document.activeElement.classList.contains('skip-link')));
    await page.focus('#envelope-button');
    const ring = await page.evaluate(() => { const cs = getComputedStyle(document.activeElement); return { outline: cs.outlineStyle, width: parseFloat(cs.outlineWidth) }; });
    check('focused envelope shows a visible focus ring', ring.outline !== 'none' && ring.width >= 2, JSON.stringify(ring));
    check('envelope button is labelled for screen readers', (await page.evaluate(() => document.getElementById('envelope-button').textContent.trim())) === 'Open the invitation');
    await page.keyboard.press('Enter');
    await wait(1100);
    check('pressing Enter starts the opening animation', (await envelopeState(page)) === 'opening', await envelopeState(page));
    await wait(1900);
    check('the envelope finishes open', (await envelopeState(page)) === 'open');
    check('aria-expanded reflects the open state', (await page.evaluate(() => document.getElementById('envelope-button').getAttribute('aria-expanded'))) === 'true');
    check('keyboard focus moves on to "Begin the story"', await page.evaluate(() => document.activeElement.id === 'begin-link'));
    check('the letter is readable', await visible(page, '.letter__names'));
    const letter = await page.evaluate(() => document.getElementById('letter').innerText.replace(/\s+/g, ' ').trim());
    check('the letter carries names, event and date', /Kenvi & Puru/.test(letter) && /WEDDING RECEPTION/i.test(letter) && /Saturday, 28 November 2026/.test(letter), letter);
    let m2 = await music(page);
    check('music begins with that tap (a real user gesture)', !m2.paused && m2.playing && m2.pressed === 'true', JSON.stringify(m2));
    check('music button now offers "Mute music"', m2.label === 'Mute music');
    await page.screenshot({ path: path.join(OUT, 'desktop-envelope-open.jpg'), type: 'jpeg', quality: 80 });
    await page.click('#music-toggle'); await wait(900);
    m2 = await music(page);
    check('the guest can mute', m2.paused && !m2.playing && m2.pressed === 'false', JSON.stringify(m2));
    await page.click('#music-toggle'); await wait(500);
    m2 = await music(page);
    check('…and unmute again', !m2.paused && m2.playing, JSON.stringify(m2));
    await page.click('#music-toggle'); await wait(700);

    /* ================================================================== */
    section('4 · Chapters and navigation');
    await page.click('#begin-link'); await wait(1600);
    const groomTop = await page.evaluate(() => Math.round(document.getElementById('groom').getBoundingClientRect().top));
    check('"Begin the story" travels to the groom', Math.abs(groomTop) < 6, `top=${groomTop}`);
    check('the groom\'s name is written in', await visible(page, '#groom-title .ink'));
    check('the groom illustration is shown', await visible(page, '.figure--groom img'));
    check('chapter dot follows along', (await page.evaluate(() => document.querySelector('.chapters a[aria-current="true"]')?.getAttribute('data-chapter'))) === 'groom');
    await page.screenshot({ path: path.join(OUT, 'desktop-groom.jpg'), type: 'jpeg', quality: 80 });

    await goTo(page, 'bride', 0, 2400);
    check('the bride\'s name is written in', await visible(page, '#bride-title .ink'));
    check('the bride illustration is shown', await visible(page, '.figure--bride img'));
    await page.screenshot({ path: path.join(OUT, 'desktop-bride.jpg'), type: 'jpeg', quality: 80 });

    await page.click('.chapters a[data-chapter="invitation"]'); await wait(1800);
    const cardTop = await page.evaluate(() => Math.round(document.getElementById('invitation').getBoundingClientRect().top));
    check('chapter dots jump to a chapter', Math.abs(cardTop) < 6, `top=${cardTop}`);
    const labels = await page.evaluate(() => [...document.querySelectorAll('.chapters a')].map((a) => a.textContent.trim()));
    check('every chapter dot has a text label', labels.length === 7 && labels.every(Boolean), labels.join(','));

    /* ================================================================== */
    section('5 · The couple\'s scene plays with the scroll — forward and back');
    const together = () => page.evaluate(() => {
      const o = (sel) => +getComputedStyle(document.querySelector(sel)).opacity;
      return { solo: o('.together__solo--groom'), portrait: o('.together__portrait'), ring: o('.together__ring'), line: o('.together__line'), pinnedTop: Math.round(document.querySelector('#together .scene__stage').getBoundingClientRect().top) };
    });
    await goTo(page, 'together', 0.22);
    const early = await together();
    check('early on: the two walk in separately', early.solo > 0.9 && early.portrait < 0.05, JSON.stringify(early));
    check('the stage stays pinned while the scene plays', early.pinnedTop === 0, `top=${early.pinnedTop}`);
    await goTo(page, 'together', 1);
    const late = await together();
    check('at the end: together, framed in flowers, with the closing lines', late.solo < 0.05 && late.portrait > 0.95 && late.ring > 0.95 && late.line > 0.95, JSON.stringify(late));
    await page.screenshot({ path: path.join(OUT, 'desktop-together.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'together', 0.22);
    const back = await together();
    check('scrolling back plays it in reverse', back.solo > 0.9 && back.portrait < 0.05, JSON.stringify(back));

    /* ================================================================== */
    section('6 · Invitation card');
    await goTo(page, 'invitation', 0, 2200);
    check('the card is revealed', await visible(page, '.card'));
    const card = await page.evaluate(() => document.querySelector('.card').innerText.replace(/\s+/g, ' ').trim());
    check('card shows both full names', card.includes('Kenvi Dwivedi') && card.includes('Puru Tyagi'), card);
    check('card shows the event and date', /WEDDING RECEPTION/i.test(card) && card.includes('Saturday, 28 November 2026'));
    check('card shows the complete venue address', card.includes('Hotel Royal Residency') && card.includes('Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India'), card);
    check('no time row is shown (none was announced)', await page.evaluate(() => document.querySelector('[data-optional="event.time"]').hidden));
    await page.screenshot({ path: path.join(OUT, 'desktop-card.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('7 · Venue: directions and copy address');
    await goTo(page, 'venue', 0, 2200);
    const links = await page.evaluate(() => [...document.querySelectorAll('.js-directions')].map((a) => ({ href: a.href, target: a.target, rel: a.rel })));
    check('both directions buttons point at Google Maps directions for the venue', links.length === 2 && links.every((l) => l.href === derived.mapsDirections), JSON.stringify(links));
    check('they open in a new tab safely', links.every((l) => l.target === '_blank' && /noopener/.test(l.rel)));
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
    await page.screenshot({ path: path.join(OUT, 'desktop-venue.jpg'), type: 'jpeg', quality: 80 });

    /* ================================================================== */
    section('8 · Save the date: calendar download');
    await goTo(page, 'save-the-date', 0, 2600);
    check('the date is shown large', await visible(page, '.finale__date'));
    const downloads = fs.mkdtempSync(path.join(os.tmpdir(), 'invite-dl-'));
    const cdp = await page.createCDPSession();
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads });
    await page.click('#calendar-link');
    let file = '';
    for (let i = 0; i < 40 && !file; i++) { await wait(150); file = fs.readdirSync(downloads).find((f) => f.endsWith('.ics')) || ''; }
    check('"Add to calendar" downloads an .ics file', Boolean(file), fs.readdirSync(downloads).join(','));
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
    section('9 · Replay');
    await page.click('#revisit');
    for (let i = 0; i < 40 && (await scrollY(page)) > 2; i++) await wait(150);
    await wait(900);
    check('"Revisit the invitation" returns to the start', (await scrollY(page)) <= 2, `scrollY=${await scrollY(page)}`);
    check('…with the envelope sealed again', (await envelopeState(page)) === 'sealed', await envelopeState(page));
    check('…and focus back on the envelope', await page.evaluate(() => document.activeElement.id === 'envelope-button'));
    await page.click('#envelope-button'); await wait(3300);
    check('it can be opened again', (await envelopeState(page)) === 'open');
    check('a guest who muted stays muted on replay', (await music(page)).paused);
    await page.click('#replay'); await wait(1200);
    check('the corner replay button seals it too', (await envelopeState(page)) === 'sealed');
    check('still no errors after the whole journey', problems.length === 0, problems.join(' | '));
    await page.close();
  }

  /* ====================================================================== */
  section('10 · Phone (390 × 844, touch)');
  {
    const { page, problems } = await open({ viewport: PHONE });
    check('loads cleanly on a phone', problems.length === 0, problems.join(' | '));
    await page.touchscreen.tap(195, 330); await wait(3400);
    check('tapping the envelope opens it', (await envelopeState(page)) === 'open', await envelopeState(page));
    check('…and starts the music', (await music(page)).playing);
    await page.screenshot({ path: path.join(OUT, 'phone-envelope-open.jpg'), type: 'jpeg', quality: 80 });
    await page.click('#music-toggle'); await wait(300);
    // a real finger drag: touch down, move in small steps, lift
    const drag = async (fromY, toY) => {
      await page.touchscreen.touchStart(195, fromY);
      for (let i = 1; i <= 14; i++) { await page.touchscreen.touchMove(195, fromY + ((toY - fromY) * i) / 14); await wait(16); }
      await page.touchscreen.touchEnd();
      await wait(900);
    };
    await drag(720, 260);
    const swiped = await scrollY(page);
    check('a finger swipe scrolls the story', swiped > 250, `scrollY=${swiped}`);
    await drag(260, 720);
    check('…and swiping back works', (await scrollY(page)) < swiped - 200, `scrollY=${await scrollY(page)}`);

    let overflow = 0;
    for (const id of ['opening', 'groom', 'bride', 'together', 'invitation', 'venue', 'save-the-date']) {
      await goTo(page, id, 0.5, 900);
      overflow = Math.max(overflow, await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
      await page.screenshot({ path: path.join(OUT, `phone-${id}.jpg`), type: 'jpeg', quality: 78 });
    }
    check('no sideways scrolling anywhere', overflow <= 0, `overflow=${overflow}px`);

    await goTo(page, 'invitation', 0, 2200);
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
      // is anything painted on top of the invitation text?
      const el = document.querySelector('.card__address'); const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !(top === el || el.contains(top) || top.closest('.card'));
    });
    check('nothing is painted over the invitation details', !covered);
    check('the petal canvas sits beneath the text', await page.evaluate(() => +getComputedStyle(document.getElementById('particles')).zIndex < +getComputedStyle(document.querySelector('#invitation .scene__content')).zIndex));

    await goTo(page, 'venue', 0, 2000);
    const targets = await page.evaluate(() => [...document.querySelectorAll('.btn, .icon-btn, .chrome__mark')].map((b) => { const r = b.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width) }; }));
    check('buttons are comfortably tappable (44px or more)', targets.every((t) => t.h >= 44 && t.w >= 44), JSON.stringify(targets));
    await page.close();
  }

  /* ====================================================================== */
  section('11 · Reduced motion');
  {
    const { page, problems } = await open({ viewport: DESKTOP, reducedMotion: true });
    check('loads cleanly', problems.length === 0, problems.join(' | '));
    check('the preference is detected', await page.evaluate(() => document.documentElement.classList.contains('reduce-motion') && window.Invite.motion.reduced));
    const still = await page.evaluate(() => ({
      canvas: getComputedStyle(document.getElementById('particles')).display,
      stage: getComputedStyle(document.querySelector('#together .scene__stage')).position,
      togetherH: document.getElementById('together').offsetHeight, vh: innerHeight,
      cloud: getComputedStyle(document.querySelector('.cloud')).animationName,
      behaviour: getComputedStyle(document.documentElement).scrollBehavior,
      hidden: [...document.querySelectorAll('[data-reveal]')].filter((el) => +getComputedStyle(el).opacity < 1 || getComputedStyle(el).transform !== 'none').length,
      layers: [...document.querySelectorAll('.layer')].filter((el) => el.style.transform).length,
    }));
    check('floating petals are switched off', still.canvas === 'none', still.canvas);
    check('no pinned, scroll-driven scenes', still.stage !== 'sticky' && still.togetherH <= still.vh * 1.6, JSON.stringify(still));
    check('clouds hold still and scrolling is instant', still.cloud === 'none' && still.behaviour === 'auto', JSON.stringify(still));
    check('all text and pictures are simply visible (no reveal animation)', still.hidden === 0, `hidden=${still.hidden}`);
    check('no parallax is applied', still.layers === 0, `layers=${still.layers}`);
    await page.click('#envelope-button'); await wait(120);
    check('the envelope opens at once, without animation', (await envelopeState(page)) === 'open', await envelopeState(page));
    await goTo(page, 'together', 0.5, 500);
    const pic = await page.evaluate(() => ({ p: +getComputedStyle(document.querySelector('.together__portrait')).opacity, solo: +getComputedStyle(document.querySelector('.together__solo--groom')).opacity, text: +getComputedStyle(document.querySelector('.together__line')).opacity }));
    check('the couple\'s scene shows its finished picture', pic.p === 1 && pic.solo === 0 && pic.text === 1, JSON.stringify(pic));
    await page.screenshot({ path: path.join(OUT, 'reduced-motion-together.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'invitation', 0, 400);
    check('the invitation card is readable straight away', await visible(page, '.card__address'));
    await page.close();
  }

  /* ====================================================================== */
  section('12 · Missing files are handled gracefully');
  {
    const { page } = await open({ viewport: DESKTOP, block: ['characters/groom.webp', 'characters/couple.webp', 'scenery/golden-near.webp', 'florals/floral-ring.webp', 'reception-theme.mp3', 'great-vibes'] });
    await goTo(page, 'groom', 0, 1800);
    const groom = await page.evaluate(() => { const f = document.querySelector('.figure--groom'); return { missing: f.classList.contains('is-missing'), initial: f.getAttribute('data-initial'), label: f.getAttribute('aria-label'), art: document.querySelector('#groom .scene__art').classList.contains('is-missing') }; });
    check('a missing character becomes a monogram medallion', groom.missing && groom.initial === 'P' && /Puru/.test(groom.label), JSON.stringify(groom));
    check('a missing scenery plate falls back to a painted-in-CSS landscape', groom.art);
    check('the groom\'s name still reads (font falls back too)', await visible(page, '#groom-title'));
    await page.screenshot({ path: path.join(OUT, 'missing-groom.jpg'), type: 'jpeg', quality: 80 });
    await goTo(page, 'together', 1, 1200);
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && !i.hidden && getComputedStyle(i).display !== 'none').map((i) => i.getAttribute('src')));
    check('no broken-image icons are left on the page', broken.length === 0, broken.join(', '));
    check('the missing couple portrait shows the joint monogram', (await page.evaluate(() => document.querySelector('.together__portrait').getAttribute('data-initial'))) === 'K&P');
    await page.screenshot({ path: path.join(OUT, 'missing-together.jpg'), type: 'jpeg', quality: 80 });
    await page.click('#music-toggle'); await wait(1500);
    const m = await music(page);
    check('missing music switches to the built-in chimes', m.fallback && m.playing && m.pressed === 'true', JSON.stringify(m));
    await page.click('#music-toggle'); await wait(300);
    check('…which can be muted like the real thing', !(await music(page)).playing);
    await page.close();
  }

  /* ====================================================================== */
  section('13 · Without JavaScript');
  {
    const { page } = await open({ viewport: DESKTOP, js: false });
    const text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
    check('every detail is still on the page', ['Kenvi Dwivedi', 'Puru Tyagi', 'Saturday, 28 November 2026', 'Hotel Royal Residency', 'Uttar Pradesh 247001, India'].every((t) => text.includes(t)));
    check('the letter is shown open and nothing is pinned', await page.evaluate(() => getComputedStyle(document.querySelector('.scene__stage')).position !== 'sticky' && getComputedStyle(document.getElementById('envelope-button')).display === 'none'));
    const hrefs = await page.evaluate(() => ({ maps: document.getElementById('directions-link').getAttribute('href'), ics: document.getElementById('calendar-link').getAttribute('href') }));
    check('directions and calendar links still work as plain links', hrefs.maps === derived.mapsDirections && hrefs.ics === 'assets/calendar/reception.ics', JSON.stringify(hrefs));
    await page.screenshot({ path: path.join(OUT, 'no-js-card.jpg'), type: 'jpeg', quality: 80, clip: { x: 0, y: 0, width: 1366, height: 768 } });
    await page.close();
  }

  /* ====================================================================== */
  section('14 · Opened straight from the file (double-clicking index.html)');
  {
    const { page, problems } = await open({ viewport: DESKTOP, url: pathToFileURL(path.join(ROOT, 'index.html')).href });
    check('starts without a server', await page.evaluate(() => document.documentElement.classList.contains('is-ready')), problems.join(' | '));
    check('no script errors from the file', problems.filter((p) => p.startsWith('script error')).length === 0, problems.join(' | '));
    await page.click('#envelope-button'); await wait(3300);
    check('the envelope works there too', (await envelopeState(page)) === 'open');
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
