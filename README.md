# Kenvi & Puru — Interactive Reception Invitation

A scroll-driven storybook invitation to the **wedding reception** of **Kenvi Dwivedi & Puru Tyagi**,
**Saturday, 28 November 2026**, at **Hotel Royal Residency, Ambala Road, Opp. Kalpana Cinema, Purani Mandi,
Saharanpur, Uttar Pradesh 247001, India**.

The guest opens an envelope, then scrolls through one garden as the day turns from a sunlit afternoon to a
starlit night: the groom, the bride, the two meeting, the invitation card, directions, and a save-the-date finale.

This is a **separate, self-contained project**. It does not read from, change, or depend on the original
`Reception` project (the animated MP4 invitation), which is left exactly as it was.

---

## 1. Open it

**Easiest — double-click `Start Invitation.bat`.**
A browser tab opens at `http://localhost:5180`. Keep the black window open while you look; close it to stop.

| Other ways | |
|---|---|
| From a terminal | `npm start` |
| Try it on your phone (same Wi-Fi) | `npm run phone`, then type the "On your phone" address it prints into the phone's browser. Windows may ask to allow access — choose *Allow*. |
| No Node.js at all | Double-click `index.html`. Everything works straight from the file. |

Nothing has to be installed to *view* the invitation. Node.js is only needed for the local server and the
optional tools below (`winget install OpenJS.NodeJS.LTS`).

---

## 2. What the guest can do

| | |
|---|---|
| **Open the envelope** | Tap, click, or press Enter / Space on it. Guests who just scroll are never blocked — scrolling opens it too. |
| **Scroll** | Ordinary scrolling with wheel, touch, trackpad or keyboard, forwards and backwards. Nothing is hijacked. |
| **Music** | Starts with the tap on the envelope (browsers do not allow sound before a tap). The round button top-right mutes and unmutes; a muted guest stays muted. |
| **Replay** | The ↺ button top-right, or "Revisit the invitation" at the end, returns to a sealed envelope. |
| **Chapters** | The dots on the right jump to any chapter; the thin gold line at the top shows progress. |
| **Get directions** | Opens Google Maps directions to the venue. No account or API key involved. |
| **Copy address** | Puts the venue name and full address on the clipboard. |
| **Add to calendar** | Downloads an `.ics` file — an **all-day** entry, because no time has been announced. There is also an "Add to Google Calendar" link. |

Accessibility: every control is reachable by keyboard with a clearly visible focus ring; a "Skip to the invitation
details" link is the first Tab stop; images have descriptions; and if the device is set to **reduce motion**, the
page shows the same content with the movement removed (add `?motion=reduce` to the address to preview that).

---

## 3. Change the names, date, venue or wording

Open **`invitation.config.js`** — it is the only file you need to edit. Save, then refresh the browser.

```js
bride: { name: 'Kenvi Dwivedi', short: 'Kenvi' },
groom: { name: 'Puru Tyagi',   short: 'Puru'  },
event: {
  title: 'Wedding Reception',
  date:  '2026-11-28',   // the weekday and the long date are worked out from this
  time:  '',             // empty = not shown anywhere. e.g. '7:00 PM onwards'
},
venue: { name, addressLines: [ ... ], city, mapsQuery },
text:  { ... }           // every sentence in the story
```

* The weekday, "Saturday, 28 November 2026", "28 · 11 · 2026", the monogram, the map links and the calendar file
  are all derived from these values, so they cannot disagree with each other.
* **No time is stated anywhere**, because none was given. Fill in `event.time` when you know it and it appears on the
  invitation card. (The calendar entry stays "all day" and mentions the time in its notes.)
* After changing the details run `npm run check` — it confirms everything still lines up — and `npm run ics`
  to refresh the bundled calendar file.

---

## 4. Replace the artwork

Everything is explained, with exact sizes and ready-to-use image prompts, in **`assets/art/README.md`**. In short:

| To change | Do this |
|---|---|
| **Groom / bride / couple illustrations** | Save your new picture over `assets/characters/groom.webp`, `bride.webp` or `couple.webp` (transparent background). Or drop it in `assets/characters/` and change the path under `art:` in `invitation.config.js`. |
| **A whole scene's background** | Put a painting in `assets/art/` and name it under `art.backdrops` in the config. It replaces the built-in scenery for that chapter. |
| **Music** | Replace `assets/music/reception-theme.mp3`, or change `music.src`. Use only music you may share. |

If any file is missing the page never shows a broken picture: a character becomes a monogram medallion, scenery
becomes a soft painted hillside, and music becomes a gentle built-in chime melody.

---

## 5. Commands

| Command | What it does |
|---|---|
| `npm start` | Serve the invitation and open the browser. |
| `npm run phone` | The same, reachable from phones on your Wi-Fi. |
| `npm run check` | Verifies scripts, files, links, wording and the date all line up. |
| `npm test` | Unit tests plus a full browser run-through (see section 6). |
| `npm run build` | Makes `dist/` — just the website, ready to upload. Also refreshes the calendar file and the link-preview picture. |
| `npm run preview` | Serve the built `dist/` folder. |
| `npm run ics` | Rewrite `assets/calendar/reception.ics` from the config. |
| `npm run paint` | Repaint the scenery (`npm run paint -- --only=meadow` for one scene). |

`npm test`, `npm run build` (preview picture) and `npm run paint` use Chrome or Edge behind the scenes and one
small helper package. Install it once with **`npm install`**. Viewing the invitation needs none of this.

---

## 6. What is tested

`npm test` runs **11 unit tests** (date, calendar file, map link, local server) and a **98-point browser test**
(`tests/e2e.mjs`) that uses the real page the way a guest would:

loading without errors · wheel, keyboard and touch scrolling in both directions · envelope by click, tap and
keyboard · music stays silent until a tap, mutes and unmutes · chapter navigation · the couple's scene forwards and
in reverse · every line on the invitation card · the directions link (including a live check that Google Maps
answers it) · copy address · the downloaded `.ics` file's contents · replay · phone layout with no sideways
scrolling and nothing covering the details · reduced motion · missing pictures, font and music · JavaScript
switched off · opening `index.html` directly from disk.

Screenshots from the run are saved in `tests/output/`.

---

## 7. Share it with family and friends

A website needs an address before it can be sent on WhatsApp.

1. `npm run build`
2. Upload **everything inside the `dist` folder** to any free static host — for example drag the folder onto
   <https://app.netlify.com/drop>, or use GitHub Pages or Cloudflare Pages.
3. Send the link.

For the link to show a picture in WhatsApp, open `index.html`, find `og:image`, and replace
`assets/icons/share-preview.jpg` with the full address, e.g. `https://your-site.example/assets/icons/share-preview.jpg`
(messaging apps require a complete web address there), then build again.

---

## 8. What is in the folder

```
InvitationWeb/
├─ index.html                 the page: seven chapters, top to bottom
├─ invitation.config.js       ← names, date, venue, wording, artwork, music
├─ Start Invitation.bat       double-click to open
├─ styles/
│  ├─ base.css                fonts, colours, buttons, focus ring, reduced-motion rules
│  ├─ backdrop.css            the sky: sun, moon, stars, clouds, petal canvas
│  ├─ chrome.css              monogram, music + replay buttons, progress line, chapter dots
│  ├─ scenes.css              chapter scaffolding, parallax layers, characters, mist, reveals
│  └─ components.css          envelope & letter, the couple's scene, card, venue, finale
├─ src/                       one small script per component (no build step, no framework)
│  ├─ core.js  content.js  assets.js  calendar.js
│  ├─ sky.js  particles.js  audio.js  scroll.js
│  └─ envelope.js  together.js  venue.js  nav.js  main.js
├─ assets/
│  ├─ characters/             groom, bride, couple illustrations
│  ├─ scenery/                painted backdrop layers and clouds (made by `npm run paint`)
│  ├─ florals/                floral ring, corner sprays, rose bed, reception stage
│  ├─ fonts/                  Great Vibes, Cormorant Garamond, Cinzel (bundled, offline)
│  ├─ music/  calendar/  icons/
│  └─ art/                    drop optional scene paintings here — see its README
├─ tools/
│  ├─ serve.mjs               tiny local web server
│  ├─ check.mjs  build.mjs  make-ics.mjs  make-preview.mjs
│  └─ paint-scenery.mjs + paint/   the code that paints the scenery
└─ tests/                     unit.test.mjs, e2e.mjs
```

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| No sound | Sound only starts after a tap — tap the envelope or the music button. Check the phone's silent switch. |
| The page looks unchanged after an edit | Hard-refresh with `Ctrl + F5`. |
| `npm` "is not recognized" | Install Node.js (`winget install OpenJS.NodeJS.LTS`) and reopen the terminal — or just double-click `index.html`. |
| "Could not find Google Chrome or Microsoft Edge" | Only the tests and tools need a browser. Install either, or set `BROWSER_PATH` to its `.exe`. |
| Port 5180 is busy | Nothing to do; the next free port is used and printed. |
| A long name wraps awkwardly | Shorten `short:` in the config, or lower the size of `.name` / `.card__name` in the styles. |
| Phone cannot reach the "On your phone" address | Both devices must be on the same Wi-Fi, and Windows Firewall must allow Node.js on private networks. |

---

## Credits

* **Character illustrations** — supplied by the couple.
* **Scenery, clouds, envelope, map sketch, animation and code** — made for this invitation (`tools/paint/` paints
  every backdrop; no stock images, film stills or existing characters are used).
* **Floral ring, corner sprays, rose bed, reception stage and soundtrack** — original pieces created for the
  couple's first invitation; independent copies are included here.
* **Fonts** — Great Vibes, Cormorant Garamond, Cinzel, under the SIL Open Font License (`assets/fonts/LICENSE.txt`).
