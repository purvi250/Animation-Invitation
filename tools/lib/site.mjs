/* Loads the site's own config and DOM-free logic (dates, map links, calendar file) into Node,
   so the tools and tests use exactly the code the browser runs — nothing is duplicated. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function loadSite(root = ROOT) {
  const sandbox = { console, URLSearchParams, performance: { now: () => 0 }, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {} };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  for (const file of ['invitation.config.js', 'src/core.js', 'src/content.js', 'src/calendar.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), sandbox, { filename: file });
  }
  const Invite = sandbox.Invite;
  return { config: sandbox.INVITE_CONFIG, Invite, derived: Invite.derived, calendar: Invite.calendar, lookup: Invite.lookup };
}

/** Every file under a folder (relative paths, forward slashes). */
export function walk(dir, base = dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return out;
}
