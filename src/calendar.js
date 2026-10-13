/* ============================================================================
   CALENDAR — builds the "save the date" calendar file (.ics) and the Google
   Calendar link. The event is ALL-DAY, because no time has been announced.
   DOM-free, so tools/make-ics.mjs and the tests use exactly the same code.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;

  const pad = (n) => String(n).padStart(2, '0');
  const compact = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const stamp = (d) => `${compact(d)}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  /** RFC 5545 text escaping. */
  const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

  const byteLength = (ch) => {
    const c = ch.codePointAt(0);
    return c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  };
  /** RFC 5545: lines are at most 75 octets; longer ones continue on a line starting with a space. */
  const fold = (line) => {
    const out = [];
    let cur = '';
    let bytes = 0;
    for (const ch of line) {
      const b = byteLength(ch);
      if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
      cur += ch; bytes += b;
    }
    out.push(cur);
    return out.join('\r\n ');
  };

  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  function describe(cfg, derived) {
    const event = cfg.event || {};
    const venue = cfg.venue || {};
    const start = derived.date;
    if (!start) return null;
    const end = new Date(start.getTime() + 24 * 3600 * 1000); // all-day events end on the NEXT day (exclusive)
    const title = `${event.title || 'Celebration'} of ${derived.coupleFull}`;
    const details = [
      `You are invited to the ${String(event.title || 'celebration').toLowerCase()} of ${derived.coupleFull}.`,
      event.time ? `Time: ${event.time}` : '',
      `Venue: ${derived.addressOneLine}`,
      `Directions: ${derived.mapsDirections}`,
    ].filter(Boolean);
    return { start, end, title, details, location: derived.addressOneLine, venueName: venue.name };
  }

  function buildICS(cfg, derived, now) {
    const e = describe(cfg, derived);
    if (!e) return '';
    const uid = `${slug((cfg.event || {}).title)}-${compact(e.start)}-${slug(derived.coupleShort)}@invitation`;
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Reception Invitation//Storybook//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp(now || new Date())}`,
      `DTSTART;VALUE=DATE:${compact(e.start)}`,
      `DTEND;VALUE=DATE:${compact(e.end)}`,
      `SUMMARY:${esc(e.title)}`,
      `LOCATION:${esc(e.location)}`,
      `DESCRIPTION:${esc(e.details.join('\n'))}`,
      `URL:${derived.mapsDirections}`,
      'STATUS:CONFIRMED',
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
      'END:VCALENDAR',
    ];
    return lines.map(fold).join('\r\n') + '\r\n';
  }

  function googleUrl(cfg, derived) {
    const e = describe(cfg, derived);
    if (!e) return '';
    const q = [
      ['action', 'TEMPLATE'],
      ['text', e.title],
      ['dates', `${compact(e.start)}/${compact(e.end)}`],
      ['location', e.location],
      ['details', e.details.join('\n')],
    ];
    return `https://calendar.google.com/calendar/render?${q.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }

  function filename(cfg, derived) {
    const name = `${derived.coupleShort.replace(/\s*&\s*/, '-')}-${(cfg.event || {}).title || 'Event'}`;
    return `${name.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}.ics`;
  }

  Invite.calendar = { buildICS, googleUrl, filename, fold, esc };
})();
