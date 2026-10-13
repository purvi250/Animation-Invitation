# Kenvi & Puru — An Animated Reception Invitation

A scroll-driven storybook invitation to the **wedding reception** of **Kenvi Dwivedi & Puru Tyagi**,
**Saturday, 28 November 2026**, at **Hotel Royal Residency, Ambala Road, Opp. Kalpana Cinema, Purani Mandi,
Saharanpur, Uttar Pradesh 247001, India**.

Three little helpers run the show. They pull a ceremonial rope to raise a banner and reveal the date, scatter
petals for the bride, bring a garland to the groom, light the lamps as the two meet beneath a floral mandap, carry
in the invitation, lead the way to the venue, and wave goodbye under the night sky.

This is a **separate, self-contained project**. It does not read from, change, or depend on the original
`Reception` project (the animated MP4 invitation), which is left exactly as it was.

---

## 1. Open it

**Easiest — double-click `Start Invitation.bat`.**
A browser tab opens at `http://localhost:5180` (or the next free port — the window tells you which).
Keep the black window open while you look; close it to stop.

| Other ways | |
|---|---|
| From a terminal | `npm start` |
| Try it on your phone (same Wi-Fi) | `npm run phone`, then type the "On your phone" address it prints into the phone's browser. Windows may ask to allow access — choose *Allow*. |
| No Node.js at all | Double-click `index.html`. Everything works straight from the file. |

Nothing has to be installed to *view* the invitation. Node.js is only needed for the local server and the
optional tools below (`winget install OpenJS.NodeJS.LTS`).

---

## 2. The story, chapter by chapter

| # | Chapter | What happens | What the guest can do |
|---|---|---|---|
| 1 | **The garden gate** | The garden wakes: lamps light one by one, a rangoli draws itself, butterflies cross. A helper peeks from behind a flower pot, two more step out from behind the pillars, spot the rope and take hold of it. On "Begin Our Story" they heave the banner up in four pulls, tumble over, cheer beside the date, and one runs ahead. | Press **Begin Our Story**, tap any helper, or press Enter. Simply scrolling sets them off too. |
| 2 | **The bride** | A helper runs in scattering petals; the curtain of flowers parts; Kenvi steps through the marble arch; her name plaque unfolds. | **Tap her bouquet** — it blooms and petals drift across the screen. |
| 3 | **The groom** | A helper races through with a golden flag; Puru steps out from behind a pillar with a second helper at his side, who hands him a garland; his plaque unfolds and petals fall. | **Tap him** for a greeting. |
| 4 | **Together** | Played by the scroll bar: the two approach, helpers run between them, the mandap rises, lamps light from the middle outward, the floral ring and portrait appear, then the names. Scroll back and it reverses. | Scroll, in either direction. |
| 5 | **The invitation** | A helper tosses the rolled invitation onto its stand. | **Tap it**: the ribbon lets go, the paper unrolls, a gold border draws itself and the details arrive. (If nobody taps, it opens by itself after a few seconds.) |
| 6 | **The venue** | A helper walks up the path of an illustrated hotel forecourt carrying a map marker. | **Tap the marker** or *Get directions* for Google Maps. *Copy address* copies the full address. |
| 7 | **Until then** | One helper climbs a ladder to place the last flower, one lets a lantern go, one throws petals. The date appears once more. | *Download calendar event*, *Open Google Maps*, *Replay invitation*. |

**Always available:** the round button top-right mutes and unmutes music and sound effects; ↺ replays from the start;
the dots on the right jump between chapters; the thin gold line at the top shows progress.

**Nothing is ever locked.** Scrolling is ordinary browser scrolling with wheel, touch, trackpad or keyboard. Every
detail is real text on the page, readable by screen readers from the first moment.

**Sound** begins only after a tap, click or key press, as browsers require. Small effects (a bell, a rustle of
paper, a sparkle) follow the same mute button.

**Reduced motion.** If the device asks for less motion, the performances are skipped: the date is simply shown,
the invitation is already open, the helpers stand still in a friendly pose. Add `?motion=reduce` to the address to
preview it.

---

## 3. What is genuinely animated — and what would need more artwork

**Real, working animation**

* **The helpers** are articulated rigs drawn in code (`src/helpers.js`): two legs, two arms, torso, head and eyes
  move independently. Running alternates the legs and counter-swings the arms; pulling leans the body back and steps
  backwards; they sit, jump, wave, point, climb hand over hand, and blink.
* **The rope** is redrawn every frame through the helpers' hands; the banner's height and the helpers' position
  are driven by the same number, in four heaves.
* **The couple's scene** is tied to the scroll position, including the helpers' run cycle, which advances frame by
  frame as you scroll and holds still when you stop.
* Curtain, bouquet, garland, name plaques, scroll, gold border, lamps, bells, rangoli, butterflies, lanterns.

**Limited by the artwork available**

The bride, the groom and the couple are each **one flat illustration**. A single picture cannot move its own arms or
legs, and cutting one up distorts it, so:

| Requested | What happens today | To get the real thing |
|---|---|---|
| Bride and groom *walking* | The whole figure steps forward with a soft rise-and-fall | Supply walk-cycle frames |
| Dupatta and lehenga *flowing* | Not animated | Supply the pose frames with the cloth drawn in motion |
| Groom *waving* when tapped | A small bow of welcome; the helpers wave | Supply a waving picture |
| Bride *offering* her flowers | The bouquet (drawn in code, in her hand) lifts and blooms | Supply an offering picture |
| The couple *turning to face the visitor* | They face each other throughout | Supply a front-facing portrait |

The site is already built for these: name the files under `art.poses` in `invitation.config.js` and they are used
automatically. Exact file names, sizes and ready-made prompts are in **`assets/art/README.md`**.

Also by design: the hotel in chapter 6 is an **imagined illustration**, labelled as such on the page — it is not a
picture of Hotel Royal Residency.

---

## 4. Change the names, date, venue or wording

Open **`invitation.config.js`** — it is the only file you need to edit. Save, then refresh the browser.

```js
bride: { name: 'Kenvi Dwivedi', short: 'Kenvi' },
groom: { name: 'Puru Tyagi',   short: 'Puru'  },
event: {
  title: 'Wedding Reception',
  date:  '2026-11-28',   // the weekday and the long date are worked out from this
  time:  '',             // empty = not shown anywhere. e.g. '7:00 PM onwards'
},
venue:   { name, addressLines: [ ... ], city, mapsQuery },
opening: 'rope',         // or 'envelope' for the classic sealed-envelope opening
text:    { ... },        // every sentence in the story
art:     { groom, bride, couple, poses: { ... }, backdrops: { ... } },
music:   { src, volume, startOnOpen, effects },
```

* The weekday, "Saturday, 28 November 2026", the monogram, the map links and the calendar file are all derived
  from these values, so they cannot disagree with each other.
* **No time, RSVP or host is stated anywhere**, because none was given. Fill in `event.time` when you know it and it
  appears on the invitation card. (The calendar entry stays "all day" and mentions the time in its notes.)
* **The classic envelope** from the first version is still here: set `opening: 'envelope'`, or add
  `?opening=envelope` to the address to try it.
* After changing details run `npm run check` (it confirms everything lines up) and `npm run ics`.

---

## 5. Replace the artwork

Everything is explained, with exact sizes and prompts, in **`assets/art/README.md`**. In short:

| To change | Do this |
|---|---|
| **Groom / bride / couple illustrations** | Save your new picture over `assets/characters/groom.webp`, `bride.webp` or `couple.webp` (transparent background). |
| **Add walking / waving / offering poses** | Put the pictures in `assets/characters/` and list them under `art.poses`. |
| **A whole scene's background** | Put a painting in `assets/art/` and name it under `art.backdrops`. |
| **Gate, arch, mandap, hotel and other built scenery** | They are painted by code: edit `tools/paint/setpieces.mjs`, then `npm run paint`. |
| **The helpers' colours and hats** | The `LOOKS` table at the top of `src/helpers.js`. |
| **Music** | Replace `assets/music/reception-theme.mp3`, or change `music.src`. Use only music you may share. |

If any file is missing the page never shows a broken picture: a character becomes a monogram medallion, scenery
becomes a soft painted hillside, a set piece simply is not shown, and music becomes a gentle built-in chime melody.

---

## 6. Commands

| Command | What it does |
|---|---|
| `npm start` | Serve the invitation and open the browser. |
| `npm run phone` | The same, reachable from phones on your Wi-Fi. |
| `npm run check` | Verifies scripts, files, links, wording and the date all line up. |
| `npm test` | Unit tests plus a full browser run-through (see section 7). Takes about four minutes. |
| `npm run build` | Makes `dist/` — just the website, ready to upload. Also refreshes the calendar file and the link-preview picture. |
| `npm run preview` | Serve the built `dist/` folder. |
| `npm run ics` | Rewrite `assets/calendar/reception.ics` from the config. |
| `npm run paint` | Repaint the scenery and set pieces (`npm run paint -- --only=gate` for one). |

`npm test`, `npm run build` (preview picture) and `npm run paint` use Chrome or Edge behind the scenes and one
small helper package. Install it once with **`npm install`**. Viewing the invitation needs none of this.

The project is under Git. The state before the cinematic upgrade is tagged **`v1-baseline`**
(`git checkout v1-baseline` to look at it, `git checkout main` to come back).

---

## 7. What is tested

`npm test` runs **12 unit tests** (date, calendar file, map link, local server) and a **177-point browser test**
(`tests/e2e.mjs`) that uses the real page the way a guest would:

* the hero: helpers reach the rope, the pull starts by button, by keyboard, by tapping a helper and by scrolling;
  limbs really move; the rope and banner move with them; the date is uncovered and reads correctly; replay
* bride: petals scattered, curtain, entrance, plaque, bouquet blooms on tap
* groom: flag bearer, stepping out, garland received, plaque, greeting on tap
* scrolling back replays a chapter; the couple's scene forwards and in reverse, with scroll-scrubbed helpers
* the invitation: delivered, opened by tap, and opening by itself when nobody taps; every line of the card
* music stays silent until a tap, mutes and unmutes; sound effects obey the mute button
* directions (including a live check that Google Maps answers), the map marker, copy address
* the downloaded `.ics` file's contents; replay
* phone layout: no sideways scrolling, tappable targets, nothing covering the details
* reduced motion; nine files missing at once; JavaScript switched off; opening `index.html` from disk
* the classic envelope opening

Screenshots from the run are saved in `tests/output/`.

---

## 8. Share it with family and friends

A website needs an address before it can be sent on WhatsApp.

1. `npm run build`
2. Upload **everything inside the `dist` folder** to any free static host — for example drag the folder onto
   <https://app.netlify.com/drop>, or use GitHub Pages or Cloudflare Pages.
3. Send the link.

For the link to show a picture in WhatsApp, open `index.html`, find `og:image`, and replace
`assets/icons/share-preview.jpg` with the full address, e.g. `https://your-site.example/assets/icons/share-preview.jpg`
(messaging apps require a complete web address there), then build again.

---

## 9. What is in the folder

```
InvitationWeb/
├─ index.html                 the page: seven chapters, top to bottom
├─ invitation.config.js       ← names, date, venue, wording, opening, artwork, music
├─ Start Invitation.bat       double-click to open
├─ styles/
│  ├─ base.css                fonts, colours, buttons, focus ring, reduced-motion rules
│  ├─ backdrop.css            the sky: sun, moon, stars, clouds, petal canvas
│  ├─ chrome.css              monogram, music + replay buttons, progress line, chapter dots
│  ├─ scenes.css              chapter scaffolding, parallax layers, characters, mist, reveals
│  ├─ components.css          envelope, the couple's scene, card, venue panel, finale
│  ├─ helpers.css             how the helper rigs move (run, pull, sit, cheer, wave, climb…)
│  └─ story.css               gate, banner, rope, plaques, arch, curtain, bouquet, garland, mandap, scroll, ladder
├─ src/                       one small script per component (no build step, no framework)
│  ├─ core.js  content.js  assets.js  calendar.js  sky.js  particles.js  audio.js  sfx.js  scroll.js
│  ├─ helpers.js              the three helper rigs, and the director that runs a scripted scene
│  ├─ hero.js                 chapter 1 — rope pull and date reveal
│  ├─ entrances.js            chapters 2 and 3 — bride and groom, and the optional-pose system
│  ├─ together.js             chapter 4 — the scroll-driven meeting
│  ├─ scrollcard.js           chapter 5 — the invitation scroll
│  ├─ venue.js  finale.js     chapters 6 and 7
│  └─ envelope.js  nav.js  main.js
├─ assets/
│  ├─ characters/             groom, bride, couple illustrations (+ optional pose pictures)
│  ├─ scenery/                painted backdrops, clouds and set pieces (made by `npm run paint`)
│  ├─ florals/                floral ring, corner sprays, rose bed, reception stage
│  ├─ fonts/  music/  calendar/  icons/
│  └─ art/                    drop optional scene paintings here — see its README
├─ tools/
│  ├─ serve.mjs               tiny local web server
│  ├─ check.mjs  build.mjs  make-ics.mjs  make-preview.mjs
│  └─ paint-scenery.mjs + paint/   kit.mjs (brushes), scenes.mjs (landscapes), setpieces.mjs (gate, arch, mandap…)
└─ tests/                     unit.test.mjs, e2e.mjs
```

---

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| No sound | Sound only starts after a tap — press *Begin Our Story* or the music button. Check the phone's silent switch. |
| The page looks unchanged after an edit | Hard-refresh with `Ctrl + F5`. |
| A different, older invitation appears | Another local server is using that port. Use the address printed in the black window, or close the other window. |
| `npm` "is not recognized" | Install Node.js (`winget install OpenJS.NodeJS.LTS`) and reopen the terminal — or just double-click `index.html`. |
| "Could not find Google Chrome or Microsoft Edge" | Only the tests and tools need a browser. Install either, or set `BROWSER_PATH` to its `.exe`. |
| A long name does not fit its plaque | Lower the size of `.plaque__name` in `styles/story.css`. |
| Phone cannot reach the "On your phone" address | Both devices must be on the same Wi-Fi, and Windows Firewall must allow Node.js on private networks. |

---

## Credits

* **Bride, groom and couple illustrations** — supplied by the couple.
* **The three helpers, the gate, toran, arch, mandap, hotel forecourt, all scenery, the rope, banner, plaques,
  bouquet, garland, scroll, animation and code** — made for this invitation. Nothing is taken from any film or
  studio; the helpers are original characters.
* **Floral ring, corner sprays, rose bed, reception stage and soundtrack** — original pieces created for the
  couple's first invitation; independent copies are included here.
* **Fonts** — Great Vibes, Cormorant Garamond, Cinzel, under the SIL Open Font License (`assets/fonts/LICENSE.txt`).
