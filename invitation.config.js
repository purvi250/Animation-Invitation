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

  /* ---------- How the invitation opens ----------
     'rope'      little helpers pull a ceremonial rope and raise a banner to reveal the date (the default)
     'envelope'  the classic sealed envelope, as in the first version
     Add ?opening=envelope to the address to try the other one without editing this file. */
  opening: 'rope',

  /* ---------- Wording, chapter by chapter ---------- */
  text: {
    // opening (rope)
    heroKicker: 'You are invited to the wedding reception of',
    beginLabel: 'Begin Our Story',
    dateKicker: 'Save the date',
    followHint: 'Follow the little one',
    // opening (envelope)
    openingKicker: 'You are invited',
    envelopeFront: 'For our dearest family & friends',
    openHint: 'Tap the envelope to open',
    openedHint: 'Begin the story',
    letterKicker: 'With great joy',
    letterLine: 'invite you to their',

    brideKicker: 'Introducing the bride',
    brideCaption: 'Through a curtain of flowers, in the golden light, she arrives.',
    brideHint: 'Tap her flowers',
    groomKicker: 'Introducing the groom',
    groomCaption: 'And as the sun sets over the courtyard, he steps out to welcome you.',
    groomHint: 'Tap to say hello',

    togetherBefore: 'Two paths through the same garden…',
    togetherCaption: 'Together, let us celebrate a beautiful new chapter.',

    cardHint: 'Tap the invitation to open it',
    cardKicker: 'With great joy, we invite you to the',
    cardOf: 'of',
    venueKicker: 'Venue & directions',
    venueTitle: 'Find your way to us',
    venueNote: 'The garden scene is an artist’s impression, not a picture of the hotel.',

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

    // OPTIONAL extra poses. The bride and groom are single illustrations, so today they enter with a
    // gentle step and respond to a tap with a small bow. Supply any of these (same framing and size as
    // the main picture, transparent background) and the site uses them automatically:
    //   walk  — two or more frames of a walk cycle, played while the character enters
    //   wave  — the groom waving hello (shown when he is tapped)
    //   offer — the bride holding her flowers out (shown when her flowers are tapped)
    //   front — the couple facing the visitor (shown at the end of their scene)
    // See assets/art/README.md for sizes, file names and ready-made image prompts.
    poses: {
      groom: { walk: [], wave: '' },
      bride: { walk: [], offer: '' },
      couple: { front: '' },
    },

    // OPTIONAL full painted backdrops. Leave empty to use the built-in painted scenery.
    // If you add one (see assets/art/README.md for sizes and prompts), it replaces that chapter's scenery.
    backdrops: {
      opening: '',
      bride: '',
      groom: '',
      together: '',
      invitation: '',
      venue: '',
      finale: '',
    },
  },

  /* ---------- Music and sound ----------
     Nothing is heard until the guest taps; the round button mutes everything at any time.
     If the music file is missing, a soft built-in chime melody is used instead. */
  music: {
    src: 'assets/music/reception-theme.mp3',
    volume: 0.6,
    startOnOpen: true,   // false = music starts only when the guest presses the music button
    effects: true,       // small sounds (a bell, a rustle of paper, a sparkle). They follow the mute button.
  },
};
