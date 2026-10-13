/* Writes assets/calendar/reception.ics from invitation.config.js.
   The website builds the same file on the fly; this copy is the fallback for
   browsers with scripting switched off.            Run:  npm run ics            */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, loadSite } from './lib/site.mjs';

export function writeICS(root = ROOT) {
  const { config, derived, calendar } = loadSite(root);
  const ics = calendar.buildICS(config, derived, new Date());
  if (!ics) throw new Error('No valid event.date in invitation.config.js (expected YYYY-MM-DD).');
  const file = path.join(root, 'assets', 'calendar', 'reception.ics');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, ics);
  return { file, ics, derived };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { file, derived } = writeICS();
  console.log(`Calendar file written: ${path.relative(ROOT, file)}  (all-day event on ${derived.dateLong})`);
}
