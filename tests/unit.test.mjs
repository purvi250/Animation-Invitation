/* Unit tests for the logic guests rely on: the date, the calendar file, the map link, the server.
   Run:  npm run test:unit   (uses only Node's built-in test runner) */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, loadSite } from '../tools/lib/site.mjs';
import { createServer, listen } from '../tools/serve.mjs';

const { config, derived, calendar } = loadSite();
const ics = calendar.buildICS(config, derived, new Date(Date.UTC(2026, 9, 13, 8, 30, 0)));
const unfolded = ics.replace(/\r\n /g, '');
const field = (name) => (unfolded.split('\r\n').find((l) => l.startsWith(`${name}:`) || l.startsWith(`${name};`)) || '').replace(/^[^:]+:/, '');
const unescape = (s) => s.replace(/\\n/g, '\n').replace(/\\([,;\\])/g, '$1');

test('the event details are the ones given — nothing invented', () => {
  assert.equal(config.bride.name, 'Kenvi Dwivedi');
  assert.equal(config.groom.name, 'Puru Tyagi');
  assert.equal(config.event.title, 'Wedding Reception');
  assert.equal(config.event.date, '2026-11-28');
  assert.equal(config.event.time, '', 'no event time has been announced, so none may be stated');
  assert.equal(config.venue.name, 'Hotel Royal Residency');
  assert.equal(config.venue.addressLines.join(' '), 'Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India');
});

test('the date is worked out correctly from the single ISO date', () => {
  assert.equal(derived.weekday, 'Saturday');
  assert.equal(derived.dateLong, 'Saturday, 28 November 2026');
  assert.equal(derived.dateNumeric, '28 · 11 · 2026');
  assert.equal(derived.coupleShort, 'Kenvi & Puru');
  assert.equal(derived.monogram, 'K & P');
  assert.equal(derived.venueShort, 'Hotel Royal Residency, Saharanpur');
});

test('the copied address is one clean line with the complete address', () => {
  assert.equal(derived.addressOneLine, 'Hotel Royal Residency, Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India');
});

test('calendar file: an ALL-DAY event on Saturday 28 November 2026', () => {
  assert.match(ics, /^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\n/);
  assert.match(ics, /\r\nEND:VCALENDAR\r\n$/);
  assert.ok(ics.includes('\r\nDTSTART;VALUE=DATE:20261128\r\n'));
  assert.ok(ics.includes('\r\nDTEND;VALUE=DATE:20261129\r\n'), 'all-day events end on the following day (exclusive)');
  assert.ok(!/DTSTART[^\r\n]*T\d{6}/.test(ics), 'must not carry a clock time');
  assert.ok(!/Time:/i.test(unfolded), 'must not mention a time');
  assert.equal(field('DTSTAMP'), '20261013T083000Z');
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 1);
});

test('calendar file: title, location and directions are complete and correctly escaped', () => {
  assert.equal(unescape(field('SUMMARY')), 'Wedding Reception of Kenvi Dwivedi & Puru Tyagi');
  assert.equal(unescape(field('LOCATION')), derived.addressOneLine);
  assert.ok(field('LOCATION').includes('Hotel Royal Residency\\, Ambala Road\\,'), 'commas must be escaped');
  assert.ok(unescape(field('DESCRIPTION')).includes(derived.mapsDirections));
  assert.equal(field('URL'), derived.mapsDirections);
});

test('calendar file: strict formatting (CRLF, lines of at most 75 bytes)', () => {
  assert.ok(!/[^\r]\n/.test(ics), 'every line ends with CRLF');
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, `line too long: ${line}`);
  const long = calendar.fold(`SUMMARY:${'नमस्ते · é · '.repeat(20)}`);
  for (const line of long.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75);
  assert.equal(long.replace(/\r\n /g, ''), `SUMMARY:${'नमस्ते · é · '.repeat(20)}`, 'folding must be lossless');
  assert.equal(calendar.esc('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
});

test('the bundled calendar file matches the config', () => {
  const bundled = fs.readFileSync(path.join(ROOT, 'assets/calendar/reception.ics'), 'utf8');
  assert.equal(bundled.replace(/DTSTAMP:.*\r\n/, ''), ics.replace(/DTSTAMP:.*\r\n/, ''), 'run "npm run ics" to refresh it');
  assert.equal(calendar.filename(config, derived), 'Kenvi-Puru-Wedding-Reception.ics');
});

test('directions link: Google Maps directions to the full venue address, no API key', () => {
  const url = new URL(derived.mapsDirections);
  assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/dir/');
  assert.equal(url.searchParams.get('api'), '1');
  assert.equal(url.searchParams.get('destination'), 'Hotel Royal Residency, Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India');
  assert.ok(!url.searchParams.has('key'));
});

test('Google Calendar link carries the same all-day event', () => {
  const url = new URL(calendar.googleUrl(config, derived));
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('dates'), '20261128/20261129');
  assert.equal(url.searchParams.get('location'), derived.addressOneLine);
});

test('the page works without scripting: its built-in wording matches the config', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const text of ['Kenvi Dwivedi', 'Puru Tyagi', 'Wedding Reception', 'Saturday, 28 November 2026', 'Hotel Royal Residency',
    'Ambala Road, Opp. Kalpana Cinema,<br>Purani Mandi, Saharanpur,<br>Uttar Pradesh 247001, India']) {
    assert.ok(html.includes(text), `index.html should contain "${text}"`);
  }
  assert.ok(html.includes(derived.mapsDirections.replace(/&/g, '&amp;')), 'fallback directions link matches');
  assert.ok(!/\b\d{1,2}[:.]\d{2}\s?(am|pm)\b/i.test(html.replace(/<script[\s\S]*?<\/script>/g, '')), 'no clock time appears in the page');
});

test('local server: when a port is busy it moves on and reports the port it is really using', async () => {
  const first = createServer({ dir: ROOT });
  const taken = await listen(first, 5480, '127.0.0.1');
  const second = createServer({ dir: ROOT });
  try {
    const got = await listen(second, taken, '127.0.0.1');
    assert.notEqual(got, taken, 'must not claim a port that is already in use');
    assert.equal(got, second.address().port, 'the reported port is the real one');
    const page = await fetch(`http://127.0.0.1:${got}/`);
    assert.match(await page.text(), /Kenvi/, 'and it serves this invitation');
  } finally {
    first.close(); second.close();
  }
});

test('local server: correct types, byte ranges for audio, and no escaping the site folder', async () => {
  const server = createServer({ dir: ROOT });
  const port = await listen(server, 5460, '127.0.0.1');
  const base = `http://127.0.0.1:${port}`;
  try {
    const page = await fetch(`${base}/`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    const cal = await fetch(`${base}/assets/calendar/reception.ics`);
    assert.match(cal.headers.get('content-type'), /text\/calendar/);
    const part = await fetch(`${base}/assets/music/reception-theme.mp3`, { headers: { Range: 'bytes=0-99' } });
    assert.equal(part.status, 206);
    assert.equal((await part.arrayBuffer()).byteLength, 100);
    assert.equal((await fetch(`${base}/nope.png`)).status, 404);
    const escape = await fetch(`${base}/..%2F..%2FReception%2Findex.html`);
    assert.ok([403, 404].includes(escape.status), 'must not serve files outside the project');
  } finally {
    server.close();
  }
});
