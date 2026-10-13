# Artwork guide — what exists, what is optional, and exactly where each file goes

The invitation works as it is. Nothing on this page is required: any file you do not supply falls back to what
is already built in. Use this page when you want to swap or add illustrations.

All artwork must be **original**. Do not use film stills, screenshots, or existing characters from any studio.

**Quick map**

| Section | What it is | Needed? |
|---|---|---|
| A | The three character illustrations | Already in place |
| B | **Extra poses** — real walking, waving, offering | Optional, and the biggest upgrade available |
| C | A full painting behind a chapter | Optional |
| D | Set pieces, florals, helpers, music | Already in place; replaceable |

---

## A. The three character illustrations (already in place)

| File | Seen in | What it should be |
|---|---|---|
| `assets/characters/groom.webp` | The groom chapter · the meeting · the finale | Full figure, head to shoes, **transparent background**, looking toward the right of the picture. About 550 × 1850 px or larger. |
| `assets/characters/bride.webp` | The bride chapter · the meeting · the finale | Figure from head to the hem (it may run off the bottom — roses cover it), **transparent background**, looking toward the left, one hand held out to the left. About 1300 × 1700 px or larger. |
| `assets/characters/couple.webp` | Inside the floral ring | The two together, waist-up, **transparent background**, soft or faded lower edge. About 820 × 970 px or larger. |

**To replace one:** save the new picture with the *same file name* in `assets/characters/` (PNG works too — then
change the ending in `invitation.config.js` under `art:`), and refresh the browser.

If a new figure sits too high, too low or too large, adjust it in `styles/scenes.css`:

```css
.figure--groom { --fx: 23.5%; --fy: 5.6%; --fh: 73%; --far: 534 / 1852; }
/*               left–right   up–down     height      width / height of YOUR image */
```

Three things are pinned to these pictures, so re-check them after replacing a character (`styles/story.css`):

| Pinned item | Where | What to adjust |
|---|---|---|
| The bride's bouquet sits in her outstretched hand | `.bouquet` | `left`, `top`, `width` (percentages of her picture) |
| The sparkles on her jewellery | `index.html`, the four `.sparkle` spans | `--sx`, `--sy` (percentages of her picture) |
| The groom's garland hangs from his neck | `src/entrances.js`, `garlandInto(worn, …)` | the numbers `300` (neck centre, x) and `400` (neck, y), in his picture's own pixels |

---

## B. Extra poses — the way to get real walking, waving and flowing cloth

Today the bride and groom are **one picture each**. A single picture cannot move its own arms or legs, so they
enter with a gentle step of the whole figure, and the groom answers a tap with a small bow. That is deliberate:
slicing a finished illustration into moving parts distorts faces and seams.

Supply any of the pictures below and the site uses them automatically — no code changes.

**Rules for every pose picture**

* **Same canvas size and same position** as that character's main picture, so nothing jumps when it swaps.
* Same character, face, clothes, colours and line style. Transparent background. WebP or PNG.
* Keep the feet (or hem) in the same place in every frame.

| What you get | File names to create | Where to list them |
|---|---|---|
| **Groom walks** in on his own legs | `assets/characters/groom-walk-1.webp` … `groom-walk-6.webp` (4 to 8 frames of one walk cycle) | `art.poses.groom.walk: [ ... ]` |
| **Groom waves** when tapped | `assets/characters/groom-wave.webp` | `art.poses.groom.wave` |
| **Bride walks**, dupatta and lehenga swaying | `assets/characters/bride-walk-1.webp` … `bride-walk-6.webp` | `art.poses.bride.walk: [ ... ]` |
| **Bride holds her flowers out** when the bouquet is tapped | `assets/characters/bride-offer.webp` | `art.poses.bride.offer` |
| **The couple turn to face the visitor** at the end of their scene | `assets/characters/couple-front.webp` | `art.poses.couple.front` |

In `invitation.config.js`:

```js
art: {
  poses: {
    groom:  { walk: ['assets/characters/groom-walk-1.webp', 'assets/characters/groom-walk-2.webp',
                     'assets/characters/groom-walk-3.webp', 'assets/characters/groom-walk-4.webp'],
              wave: 'assets/characters/groom-wave.webp' },
    bride:  { walk: [], offer: 'assets/characters/bride-offer.webp' },
    couple: { front: 'assets/characters/couple-front.webp' },
  },
}
```

A walk needs at least two frames to count; with fewer, the gentle step is used. `npm run check` reports any
name that does not match a file.

**Prompts** (give the tool or the illustrator the existing picture as the reference, and ask for the same
character on the same canvas):

> Same character as the reference, identical face, outfit, colours and line style, same canvas size and position,
> transparent background. **Walk cycle, frame N of 6**, side-on three-quarter view matching the reference,
> one leg forward and the opposite arm swinging, stole swaying with the step.

> Same character as the reference, identical face, outfit and style, same canvas and position, transparent
> background. **Raising his right hand in a warm, friendly wave**, smiling at the viewer.

> Same character as the reference, identical face, outfit and style, same canvas and position, transparent
> background. **Holding a small bouquet out toward the viewer with both hands**, gentle smile, dupatta and skirt
> caught mid-sway.

> Same couple as the reference, identical faces, outfits and style, same canvas and position, transparent
> background. **Standing side by side, both turned to face the viewer**, smiling, waist-up, soft lower edge.

---

## C. Optional: a full painting behind a chapter

Each chapter already has a painted backdrop. To use your own, drop a picture **in this folder** and name it in
`invitation.config.js`:

```js
art: {
  backdrops: {
    opening: 'assets/art/opening.jpg',
    bride: '', groom: '', together: '', invitation: '', venue: '', finale: '',   // empty = built-in scenery
  },
}
```

* **Size:** 2400 × 1350 px or larger, JPG or WebP, under about 600 KB each.
* **Composition:** the picture is cropped to fill the screen and anchored to the *bottom centre*, so a phone shows
  only the middle third. Keep the important part in the centre and the horizon a little below the middle. Leave
  the top third as open sky — the words sit there.
* **No people in the backdrop** — the characters and helpers stand in front of it.
* The gate, arch, pillar, mandap and helpers are separate pieces and stay in front of your painting.

**Shared style line** — add to every prompt:

> Original hand-painted background illustration, soft gouache and watercolour, storybook animation background
> painting, lush detailed foliage, luminous natural light, gentle atmospheric perspective, no people, no text,
> no logos, wide 16:9, horizon slightly below centre, open sky across the top third.

| File to create | Chapter and light | Prompt |
|---|---|---|
| `opening.jpg` | The garden gate · warm morning | A sunlit Indian garden seen through open ground: flower meadow, a pale path winding to a small domed garden palace far away, round leafy trees left and right, towering white clouds in a clear blue sky, wildflowers in pink, white and yellow in the foreground. Leave the centre open — a gateway stands there. |
| `bride.jpg` | The bride · golden hour | A marble palace terrace with a white balustrade overlooking a calm lake at golden hour, lotus flowers on the water, soft mountains beyond, blossom trees, marigold arrangements, warm low light. Leave the right-centre open. |
| `groom.jpg` | The groom · sunset | A sandstone courtyard garden at sunset, a small red-sandstone pavilion with three scalloped arches and marigold torans on the left third, a stone path with marigold borders, a receding row of cypress trees, long shadows, rose and amber sky. |
| `together.jpg` | The two together · sunset turning to evening | A garden clearing ringed by tall trees hung with glowing lanterns and strings of fairy lights, a lawn scattered with small oil lamps and pale flowers, deep violet sky with the first stars, open space in the centre. |
| `invitation.jpg` | The invitation · twilight | A lamp-lit garden walk at twilight seen from a distance, low hedges, lantern posts, glowing white flowers, dark hills and a few town lights on the horizon. Keep the centre calm — the invitation hangs there. |
| `venue.jpg` | The venue · evening | An imagined grand Indian hotel entrance at night: arched portico, lit windows, a forecourt path with lamps, clipped trees in pots, floral welcome stands. **Generic and invented — not a likeness of any real hotel.** |
| `finale.jpg` | Until then · night | A night garden dressed for a celebration: festoons of fairy lights overhead, lantern-hung trees, a starry navy sky, paper lanterns drifting upward. Leave the centre open — the flower stage stands there. |

---

## D. Everything else you can swap

**Painted by code** — edit `tools/paint/setpieces.mjs` or `tools/paint/scenes.mjs`, then run `npm run paint`
(`npm run paint -- --only=gate` repaints one). Or simply save your own transparent picture over the file.

| File | What it is |
|---|---|
| `assets/scenery/gate.webp` | The carved sandstone gateway with kalash and jharokhas (chapter 1). 1200 × 1300, open in the middle. |
| `assets/scenery/toran.webp` | Mango-leaf and marigold door garland (chapter 1). |
| `assets/scenery/arch.webp` | The marble archway with hanging lamps (chapter 2). 900 × 1260, open in the middle. |
| `assets/scenery/curtain.webp` | One half of the curtain of flower strings (chapter 2). |
| `assets/scenery/pillar.webp` | The pillar the groom steps out from behind (chapter 3). |
| `assets/scenery/mandap.webp` | The floral canopy on four pillars (chapter 4). 1400 × 1280, open in the middle. |
| `assets/scenery/hotel-front.webp` | The imagined hotel forecourt (chapter 6). |
| `assets/scenery/*-far / -mid / -near.webp`, `cloud-*.webp` | Landscape layers and clouds. |

**Drawn in the page itself** — the three helpers (`src/helpers.js`; change colours and hats in the `LOOKS` table
at the top), the banner, date panel, rope, bells, rangoli, lamps, bouquet, garland, name plaques, scroll and its
stand, ladder and map sketch (`index.html` and `styles/story.css`).

**Florals and sound**

| File | What it is |
|---|---|
| `assets/florals/floral-ring.webp` | The ring of flowers around the couple (square, transparent centre). |
| `assets/florals/corner-floral.webp` | The spray on the corners of the invitation (top-left orientation). |
| `assets/florals/rose-bed.webp` | The strip of roses along the bottom of the bride and finale chapters. |
| `assets/florals/reception-stage.webp` | The glowing flower stage in the finale. |
| `assets/music/reception-theme.mp3` | The soundtrack (loops). Sound effects are generated in the browser and need no files. |

After any change, `npm run check` will tell you if a file name does not match, and `npm test` confirms nothing broke.
