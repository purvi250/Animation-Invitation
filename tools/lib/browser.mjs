/* Finds an installed Chrome or Edge (used only by the dev tools: painting scenery and running tests). */
import fs from 'node:fs';

export function findBrowser() {
  const e = process.env;
  const candidates = [
    e.BROWSER_PATH,
    e.PROGRAMFILES && `${e.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
    e['PROGRAMFILES(X86)'] && `${e['PROGRAMFILES(X86)']}\\Google\\Chrome\\Application\\chrome.exe`,
    e.LOCALAPPDATA && `${e.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    e['PROGRAMFILES(X86)'] && `${e['PROGRAMFILES(X86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
    e.PROGRAMFILES && `${e.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find((p) => p && fs.existsSync(p)) || null;
}

export async function launchBrowser(extraArgs = []) {
  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch {
    throw new Error('The dev tools need one small package. Run "npm install" in this folder once, then try again.');
  }
  const executablePath = findBrowser();
  if (!executablePath) {
    throw new Error('Could not find Google Chrome or Microsoft Edge. Install either, or set BROWSER_PATH to the browser .exe.');
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-extensions', ...extraArgs],
  });
}
