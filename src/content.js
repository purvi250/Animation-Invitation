/* ============================================================================
   CONTENT — turns invitation.config.js into the words on the page.
   Everything that can be worked out (weekday, long date, map links, monogram)
   is derived here, so the date only ever has to be typed once.
   The top of this file touches no DOM, so the build tools can reuse it.
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;
  const cfg = Invite.config;

  const pad = (n) => String(n).padStart(2, '0');
  const parseDate = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  };

  const bride = cfg.bride || {};
  const groom = cfg.groom || {};
  const event = cfg.event || {};
  const venue = cfg.venue || {};
  const lines = venue.addressLines || [];
  const date = parseDate(event.date);
  const part = (opts) => (date ? new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'UTC' }, opts)).format(date) : '');
  const initial = (person) => ((person.short || person.name || '?').trim().charAt(0) || '?').toUpperCase();
  const mapsQuery = venue.mapsQuery || [venue.name].concat(lines).join(' ');

  // the programme on Thursday (optional block in the config)
  const programme = cfg.programme || {};
  const pDate = parseDate(programme.date);
  const pPart = (opts) => (pDate ? new Intl.DateTimeFormat('en-GB', Object.assign({ timeZone: 'UTC' }, opts)).format(pDate) : '');
  const clock = (hhmm) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
    if (!m) return hhmm || '';
    const h = +m[1];
    return `${h % 12 || 12}:${m[2]} ${h < 12 ? 'AM' : 'PM'}`;
  };
  const pLines = (programme.venue && programme.venue.addressLines) || [];
  const pQuery = (programme.venue && programme.venue.mapsQuery) || pLines.join(' ');

  const derived = {
    date,
    programmeDate: pDate,
    programmeDateLong: pDate ? `${pPart({ weekday: 'long' })}, ${pDate.getUTCDate()} ${pPart({ month: 'long' })} ${pDate.getUTCFullYear()}` : '',
    programmeItems: (programme.items || []).map((item) => ({
      name: item.name,
      time: item.time,
      label: clock(item.time),
      iso: `${programme.date}T${item.time}${programme.timezone || '+05:30'}`,
    })),
    // pieces of the programme date and a one-line summary, for the reminders elsewhere in the story
    programmeWeekdayComma: pDate ? `${pPart({ weekday: 'long' })},` : '',
    programmeDayMonthYear: pDate ? `${pDate.getUTCDate()} ${pPart({ month: 'long' })} ${pDate.getUTCFullYear()}` : '',
    programmeShort: pDate ? `${pPart({ weekday: 'short' })}, ${pDate.getUTCDate()} ${pPart({ month: 'short' })}` : '',
    programmeWeekdayShort: pPart({ weekday: 'short' }),
    programmeDayNum: pDate ? String(pDate.getUTCDate()) : '',
    programmeMonthShort: pPart({ month: 'short' }),
    programmeNames: (function (names) { return names.length > 1 ? `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}` : names.join(''); })((programme.items || []).map((i) => i.name)),
    programmeSummary: (programme.items || []).map((i) => `${i.name} ${clock(i.time)}`.replace(/ /g, ' ')).join(' · '),
    programmeAddressOneLine: pLines.join(' ').replace(/\s+/g, ' ').replace(/,\s*$/, '').trim(),
    programmeMaps: pQuery ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(pQuery)}` : '',
    weekday: part({ weekday: 'long' }),
    dateLong: date ? `${part({ weekday: 'long' })}, ${date.getUTCDate()} ${part({ month: 'long' })} ${date.getUTCFullYear()}` : '',
    dateNumeric: date ? `${pad(date.getUTCDate())} · ${pad(date.getUTCMonth() + 1)} · ${date.getUTCFullYear()}` : '',
    // the two halves of the long date, for the date panel at the gate
    weekdayComma: date ? `${part({ weekday: 'long' })},` : '',
    dateDayMonthYear: date ? `${date.getUTCDate()} ${part({ month: 'long' })} ${date.getUTCFullYear()}` : '',
    dateCompact: date ? `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` : '',
    coupleShort: `${bride.short || bride.name || ''} & ${groom.short || groom.name || ''}`,
    coupleFull: `${bride.name || ''} & ${groom.name || ''}`,
    monogram: `${initial(bride)} & ${initial(groom)}`,
    monogramTight: `${initial(bride)}&${initial(groom)}`,
    initials: { bride: initial(bride), groom: initial(groom), couple: `${initial(bride)}&${initial(groom)}` },
    venueShort: [venue.name, venue.city].filter(Boolean).join(', '),
    // one tidy line, for the clipboard and the calendar entry
    addressOneLine: [venue.name, lines.join(' ')].filter(Boolean).join(', ').replace(/\s+/g, ' ').replace(/,\s*$/, '').trim(),
    mapsDirections: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(mapsQuery)}`,
    mapsSearch: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
  };
  Invite.derived = derived;

  const lookup = (path) => (path.indexOf('derived.') === 0 ? Invite.get(derived, path.slice(8)) : Invite.get(cfg, path));
  Invite.lookup = lookup;

  /* ---------- write the words into the page ---------- */
  Invite.bindContent = (scope = document) => {
    // which opening to show: the rope-and-banner hero (default) or the classic envelope
    let mode = cfg.opening === 'envelope' ? 'envelope' : 'rope';
    try {
      const asked = new URLSearchParams(location.search).get('opening');
      if (asked === 'envelope' || asked === 'rope') mode = asked;
    } catch (e) { /* keep the configured one */ }
    Invite.openingMode = mode;
    const opening = document.getElementById('opening');
    if (opening) opening.setAttribute('data-opening', mode);

    scope.querySelectorAll('[data-bind]').forEach((el) => {
      const value = lookup(el.getAttribute('data-bind'));
      if (value !== undefined && value !== null && value !== '') el.textContent = value;
    });
    scope.querySelectorAll('[data-bind-datetime]').forEach((el) => {
      const value = lookup(el.getAttribute('data-bind-datetime'));
      if (value) el.setAttribute('datetime', value);
    });
    scope.querySelectorAll('[data-bind-lines]').forEach((el) => {
      const value = lookup(el.getAttribute('data-bind-lines'));
      if (!Array.isArray(value) || !value.length) return;
      el.textContent = '';
      value.forEach((line, i) => {
        if (i) el.appendChild(document.createElement('br'));
        el.appendChild(document.createTextNode(line));
      });
    });
    // optional rows (for example the time) stay hidden until they have something to say
    scope.querySelectorAll('[data-optional]').forEach((el) => {
      const value = lookup(el.getAttribute('data-optional'));
      const show = !(value === undefined || value === null || value === '');
      if (el instanceof SVGElement) el.style.display = show ? '' : 'none';
      else el.hidden = !show;
    });
    scope.querySelectorAll('.js-directions').forEach((a) => { a.href = derived.mapsDirections; });

    if (derived.coupleShort.trim() !== '&' && event.title && derived.dateLong) {
      document.title = `${derived.coupleShort} · ${event.title} · ${derived.dateLong.replace(/^[^,]+,\s*/, '')}`;
    }
  };
})();
