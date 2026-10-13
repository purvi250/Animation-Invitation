# Artwork guide — where each picture goes

The invitation works as it is. Use this page when you want to swap in new illustrations.
Nothing here is required: any file you do not supply falls back to what is already built in.

All artwork must be **original**. Do not use film stills, screenshots, or existing characters from any studio.

---

## A. The three character illustrations (already in place)

| File | Seen in | What it should be |
|---|---|---|
| `assets/characters/groom.webp` | The groom chapter · the meeting · the finale | Full figure, head to shoes, **transparent background**. Looking toward the right of the picture. About 550 × 1850 px or larger. |
| `assets/characters/bride.webp` | The bride chapter · the meeting · the finale | Figure from head to the hem (it may run off the bottom — roses cover it). **Transparent background**. Looking toward the left. About 1300 × 1700 px or larger. |
| `assets/characters/couple.webp` | Inside the floral ring | The two together, waist-up, **transparent background**, soft or faded lower edge. About 820 × 970 px or larger. |

**To replace one:** save the new picture with the *same file name* in `assets/characters/` (PNG works too — then
change the ending in `invitation.config.js` under `art:`), and refresh the browser.

Getting a transparent background: any "remove background" tool, then export as PNG or WebP.

If the new figure sits too high, too low, or looks too large, adjust it in `styles/scenes.css`:

```css
.figure--groom { --fx: 23.5%; --fy: 5.6%; --fh: 73%; --far: 534 / 1852; }
/*               left–right   up–down     height      width / height of YOUR image */
```

`--far` must match the new picture's proportions (its width ÷ its height).
The finale uses `.finale__groom` / `.finale__bride` and the meeting uses `.together__solo--groom` / `--bride`
in `styles/components.css`.

---

## B. Optional: a full painting behind a chapter

Each chapter already has a painted backdrop. To use your own, drop a picture **in this folder** and name it in
`invitation.config.js`:

```js
art: {
  backdrops: {
    opening:    'assets/art/opening.jpg',
    groom:      '',            // empty = keep the built-in scenery
    bride:      '',
    together:   '',
    invitation: '',
    venue:      '',
    finale:     '',
  },
}
```

* **Size:** 2400 × 1350 px or larger, JPG or WebP, under about 600 KB each.
* **Composition:** the picture is cropped to fill the screen and anchored to the *bottom centre*, so a phone shows
  only the middle third. Keep the important part in the centre and the horizon a little below the middle.
  Leave the top third as open sky — the words sit there.
* **No people in the backdrop** — the character cut-outs stand in front of it.
* The sky, sun, moon, clouds, petals and fireflies continue to animate over your painting.

### Image prompts

Use these with any image generator, or hand them to an illustrator. Each one asks for an original scene in a
hand-painted style and names nothing that belongs to anyone else.

**Shared style line** — add to every prompt:

> Original hand-painted background illustration, soft gouache and watercolour, storybook animation background
> painting, lush detailed foliage, luminous natural light, gentle atmospheric perspective, no people, no text,
> no logos, wide 16:9, horizon slightly below centre, open sky across the top third.

| File to create | Chapter and light | Prompt |
|---|---|---|
| `opening.jpg` | Opening · bright afternoon | A sunlit flower meadow rolling toward distant blue hills, a pale path winding to a small domed garden palace far away, round leafy trees left and right, towering white summer clouds in a clear blue sky, wildflowers in pink, white and yellow in the foreground. |
| `groom.jpg` | The groom · golden hour | A formal Indian garden at golden hour, a small red-sandstone pavilion with three scalloped arches and marigold garlands on the left third, a stone path with marigold borders leading to it, a receding row of cypress trees, warm low sun and long shadows, amber sky with peach clouds. |
| `bride.jpg` | The bride · rose dusk | A marble terrace with a white balustrade overlooking a calm lake at dusk, lavender mountains beyond, the last sunlight glittering on the water toward the right, a great blossom tree in pink leaning in from the right, rose and violet sky. |
| `together.jpg` | The two together · blue hour | A garden clearing at blue hour ringed by tall trees hung with glowing lanterns and strings of fairy lights, a lawn scattered with small oil lamps and pale flowers, deep indigo sky with the first stars, open space in the centre. |
| `invitation.jpg` | Invitation card · twilight | A lamp-lit garden walk at twilight seen from a distance, low hedges, lantern posts, glowing white flowers, dark hills and a few town lights on the horizon, deep violet-blue sky. Keep the centre calm — the card covers it. |
| `venue.jpg` | Venue · evening | The same lamp-lit garden from another angle, a softly lit path leading away between cypress trees, lantern posts and fairy lights, quiet indigo night sky. |
| `finale.jpg` | Save the date · night | A night garden dressed for a celebration: a flower-covered stage with an ivory sofa glowing under chandeliers on the right half, festoons of fairy lights overhead, lantern-hung trees, a starry navy sky, paper lanterns drifting upward. |

### Prompts for new character cut-outs

> Original full-length character illustration of an Indian groom in an ivory embroidered sherwani with a red and
> gold stole and a cream turban, wearing glasses, gentle smile, standing relaxed, turned slightly to the right,
> clean line and soft watercolour colouring, hand-painted animation style, plain white background, no text.

> Original illustration of an Indian bride in a maroon and gold embroidered lehenga with long dark hair and
> traditional jewellery, seen from behind and glancing over her left shoulder, dupatta flowing, clean line and soft
> watercolour colouring, hand-painted animation style, plain white background, no text.

> Original waist-up illustration of an Indian couple facing each other and smiling, her hand on his chest, she in a
> purple and gold outfit, he in a pale pink embroidered kurta and glasses, clean line and soft watercolour
> colouring, hand-painted animation style, plain white background, no text.

For a real likeness, give the illustrator or the tool a reference photo of the couple, then remove the white
background before saving.

---

## C. Other pieces you can swap

| File | What it is |
|---|---|
| `assets/florals/floral-ring.webp` | The ring of flowers around the couple (square, transparent centre). |
| `assets/florals/corner-floral.webp` | The spray on the corners of the invitation card (top-left orientation). |
| `assets/florals/rose-bed.webp` | The strip of roses along the bottom of the bride and finale chapters. |
| `assets/florals/reception-stage.webp` | The glowing flower stage in the finale. |
| `assets/scenery/*.webp` | The built-in painted layers. Repaint them with `npm run paint`; the paintings are code in `tools/paint/scenes.mjs`. |
| `assets/music/reception-theme.mp3` | The soundtrack (loops). |

After any change, `npm run check` will tell you if a file name does not match.
