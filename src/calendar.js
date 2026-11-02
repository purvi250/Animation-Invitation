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

  /** "2026-11-26" + "14:00" + "+05:30" → the same moment in UTC (so every calendar app agrees). */
  function toUTC(date, time, zone) {
    const [y, mo, d] = date.split('-').map(Number);
    const [h, mi] = time.split(':').map(Number);
    const z = /^([+-])(\d{2}):(\d{2})$/.exec(zone || '+05:30') || ['', '+', '05', '30'];
    const offset = (z[1] === '-' ? -1 : 1) * (Number(z[2]) * 60 + Number(z[3]));
    return new Date(Date.UTC(y, mo - 1, d, h, mi) - offset * 60000);
  }

  /**
   * The programme as calendar entries: one per item (e.g. Sundarkand, Dinner), each at its start time.
   * No end times have been given, so none are invented — the entries carry a start time only.
   */
  function buildProgrammeICS(cfg, derived, now) {
    const p = cfg.programme || {};
    const items = (derived.programmeItems || []).filter((i) => /^\d{1,2}:\d{2}$/.test(i.time || ''));
    if (!p.date || !items.length) return '';
    const title = p.title || 'Programme';
    const details = [
      `${title}, ${derived.programmeDateLong}: ${items.map((i) => `${i.name} ${i.label}`).join(', ')}.`,
      `${derived.coupleFull}`,
      `Venue: ${derived.programmeAddressOneLine}`,
      derived.programmeMaps ? `Directions: ${derived.programmeMaps}` : '',
    ].filter(Boolean).join('\n');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Reception Invitation//Storybook//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH'];
    items.forEach((item) => {
      const start = toUTC(p.date, item.time, p.timezone);
      lines.push(
        'BEGIN:VEVENT',
        `UID:${slug(item.name)}-${p.date.replace(/-/g, '')}-${slug(derived.coupleShort)}@invitation`,
        `DTSTAMP:${stamp(now || new Date())}`,
        `DTSTART:${stamp(start)}`,
        `SUMMARY:${esc(`${item.name} · ${derived.coupleShort}`)}`,
        `LOCATION:${esc(derived.programmeAddressOneLine)}`,
        `DESCRIPTION:${esc(details)}`,
        derived.programmeMaps ? `URL:${derived.programmeMaps}` : '',
        'STATUS:CONFIRMED',
        'END:VEVENT',
      );
    });
    lines.push('END:VCALENDAR');
    return lines.filter(Boolean).map(fold).join('\r\n') + '\r\n';
  }

  function programmeFilename(derived) {
    const d = derived.programmeDate;
    const day = d ? `${d.getUTCDate()}-${new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' }).format(d)}` : '';
    return `${derived.coupleShort.replace(/\s*&\s*/, '-')}-Programme-${day}`.replace(/[^A-Za-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '.ics';
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

  Invite.calendar = { buildICS, googleUrl, filename, fold, esc, buildProgrammeICS, programmeFilename, toUTC };
})();
