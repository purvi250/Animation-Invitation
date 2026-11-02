/* Writes the calendar files from invitation.config.js:
     assets/calendar/reception.ics   the reception — an all-day entry (no time has been announced)
     assets/calendar/programme.ics   Thursday's programme — one entry per item, at its start time
   The website builds the same files on the fly; these copies are the fallback for
   browsers with scripting switched off.            Run:  npm run ics            */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadSite } from './lib/site.mjs';

export function writeICS(root = ROOT) {
  const { config, derived, calendar } = loadSite(root);
  const now = new Date();
  const ics = calendar.buildICS(config, derived, now);
  if (!ics) throw new Error('No valid event.date in invitation.config.js (expected YYYY-MM-DD).');
  const dir = path.join(root, 'assets', 'calendar');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'reception.ics');
  fs.writeFileSync(file, ics);

  // the programme is optional: write its file when the config has one, remove a stale one when it does not
  const programmeFile = path.join(dir, 'programme.ics');
  const programme = calendar.buildProgrammeICS(config, derived, now);
  if (programme) fs.writeFileSync(programmeFile, programme);
  else if (fs.existsSync(programmeFile)) fs.rmSync(programmeFile);

  return { file, ics, derived, programmeFile: programme ? programmeFile : null };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { file, derived, programmeFile } = writeICS();
  console.log(`Calendar file written: ${path.relative(ROOT, file)}  (all-day event on ${derived.dateLong})`);
  if (programmeFile) {
    console.log(`Calendar file written: ${path.relative(ROOT, programmeFile)}  (${derived.programmeDateLong}: ${derived.programmeItems.map((i) => `${i.name} ${i.label}`).join(', ')})`);
  }
}
