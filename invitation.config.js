/* ============================================================================
   THE ONE FILE TO EDIT
   Names, date, venue, wording, artwork and music all live here.
   Save, then refresh the browser. Leave a value empty ('') to hide it.
   ============================================================================ */
window.INVITE_CONFIG = {
  /* ---------- The couple ---------- */
  bride: { name: 'Kenvi Dwivedi', short: 'Kenvi' },
  groom: { name: 'Puru Tyagi', short: 'Puru' },

  /* ---------- The event ---------- */
  event: {
    title: 'Wedding Reception',
    // Year-Month-Day. The weekday, the long date and the calendar file are all worked out from this.
    date: '2026-11-28',
    // No time has been announced, so none is shown and the calendar entry is "all day".
    // To show one later, type it here exactly as guests should read it, e.g. '7:00 PM onwards'.
    time: '',
  },

  /* ---------- The venue ---------- */
  venue: {
    name: 'Hotel Royal Residency',
    // One entry per line, exactly as it should appear on the card.
    addressLines: [
      'Ambala Road, Opp. Kalpana Cinema,',
      'Purani Mandi, Saharanpur,',
      'Uttar Pradesh 247001, India',
    ],
    city: 'Saharanpur',
    // Labels on the little hand-drawn map sketch (taken from the address). Empty = label hidden.
    sketchRoad: 'Ambala Road',
    sketchLandmark: 'Kalpana Cinema',
    // What Google Maps should search for when a guest taps "Get directions".
    mapsQuery: 'Hotel Royal Residency, Ambala Road, Opp. Kalpana Cinema, Purani Mandi, Saharanpur, Uttar Pradesh 247001, India',
  },

  /* ---------- Wording, chapter by chapter ---------- */
  text: {
    openingKicker: 'You are invited',
    envelopeFront: 'For our dearest family & friends',
    openHint: 'Tap the envelope to open',
    openedHint: 'Begin the story',
    letterKicker: 'With great joy',
    letterLine: 'invite you to their',

    groomKicker: 'Introducing the groom',
    groomCaption: 'As golden light settles over the garden, he waits.',
    brideKicker: 'Introducing the bride',
    brideCaption: 'And through the blossom, at the end of the day, she arrives.',

    togetherBefore: 'Two paths through the same garden…',
    togetherAfter: ['Two hearts.', 'One beautiful story.'],
    togetherCaption: 'And a celebration to begin the next chapter.',

    cardKicker: 'With great joy, we invite you to the',
    cardOf: 'of',
    venueKicker: 'Venue & directions',
    venueTitle: 'Find your way to us',

    finaleKicker: 'Save the date',
    finaleClosing: 'We look forward to celebrating with you.',
  },

  /* ---------- Artwork ----------
     To swap a picture, either save your new file over the old one (same name),
     or put it in assets/ and change the path here. Transparent PNG or WebP cut-outs work best
     for the three characters. If a file is missing the site shows a graceful stand-in. */
  art: {
    groom: 'assets/characters/groom.webp',
    bride: 'assets/characters/bride.webp',
    couple: 'assets/characters/couple.webp',

    // OPTIONAL full painted backdrops. Leave empty to use the built-in painted scenery.
    // If you add one (see assets/art/README.md for sizes and prompts), it replaces that chapter's scenery.
    backdrops: {
      opening: '',
      groom: '',
      bride: '',
      together: '',
      invitation: '',
      venue: '',
      finale: '',
    },
  },

  /* ---------- Music ----------
     Plays only after the guest taps the envelope or the music button; they can mute it any time.
     If the file is missing, a soft built-in chime melody is used instead. */
  music: {
    src: 'assets/music/reception-theme.mp3',
    volume: 0.6,
    startOnOpen: true,   // false = music starts only when the guest presses the music button
  },
};
