/* ============================================================================
   VENUE — the practical buttons:
     · "Get directions"  → Google Maps directions to the venue (set in content.js)
     · "Copy address"    → the venue name and full address on the clipboard
     · "Add to calendar" → an all-day .ics calendar entry, built from the config
     · "Add to Google Calendar" → the same entry as a Google Calendar link
   ============================================================================ */
(function () {
  'use strict';
  const Invite = window.Invite;

  let statusTimer = 0;

  function legacyCopy(text) {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    area.remove();
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext !== false) {
      return navigator.clipboard.writeText(text).then(() => true, () => legacyCopy(text));
    }
    return Promise.resolve(legacyCopy(text));
  }

  function setupCopy() {
    const button = document.getElementById('copy-address');
    const status = document.getElementById('copy-status');
    const address = document.getElementById('venue-address');
    if (!button || !status) return;
    const label = button.querySelector('.btn__text');
    const idle = label ? label.textContent : '';

    button.addEventListener('click', () => {
      const text = Invite.derived.addressOneLine;
      copyText(text).then((ok) => {
        clearTimeout(statusTimer);
        if (ok) {
          status.textContent = 'Address copied — paste it anywhere.';
          button.classList.add('is-done');
          if (label) label.textContent = 'Copied';
        } else {
          // last resort: select the address so one more keystroke copies it
          if (address && window.getSelection) {
            const range = document.createRange();
            range.selectNodeContents(address);
            const sel = window.getSelection();
            sel.removeAllRanges(); sel.addRange(range);
          }
          status.textContent = 'The address is selected — press Ctrl + C (or long-press) to copy.';
        }
        statusTimer = setTimeout(() => {
          status.textContent = '';
          button.classList.remove('is-done');
          if (label) label.textContent = idle;
        }, 3200);
      });
    });
  }

  function setupCalendar() {
    const link = document.getElementById('calendar-link');
    const google = document.getElementById('gcal-link');
    const cfg = Invite.config, derived = Invite.derived;

    if (google) {
      const url = Invite.calendar.googleUrl(cfg, derived);
      if (url) google.href = url; else google.hidden = true;
    }
    if (!link) return;
    link.setAttribute('download', Invite.calendar.filename(cfg, derived));
    // Build the file from the config, so it always matches what the page says.
    // (If this fails for any reason the link still points at the ready-made file.)
    try {
      const ics = Invite.calendar.buildICS(cfg, derived);
      if (ics && window.Blob && window.URL && URL.createObjectURL) {
        link.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
        link.setAttribute('data-generated', 'true');
      }
    } catch (err) {
      console.warn('Calendar file could not be generated; using the bundled one.', err);
    }
  }

  function init() {
    setupCopy();
    setupCalendar();
  }

  Invite.venue = { init, copyText };
})();
