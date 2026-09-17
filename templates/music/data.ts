import type { LyricLine } from '../../src/lyrics';
import type { AlbumCardType } from '../../src/media-card';
import type { PlaybackDevice } from '../../src/media-player';
import type { LibraryEntry, RecentSearchEntry } from '../../src/music-library';

/**
 * The music template's demo catalogue: invented artists, albums, playlists,
 * shows, audiobooks, venues and cities. Every cover is a generated gradient
 * SVG (no network), and every item carries the `artworkColor` a backend would
 * send with it.
 */

// ---------------------------------------------------------------------------
//  Artwork
// ---------------------------------------------------------------------------

/** mulberry32 — a tiny deterministic PRNG, so the catalogue is the same on every load. */
export function makeRng(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashOf(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function svgUri(svg: string): string {
  // The plain `data:image/svg+xml,` prefix: react-native-web mangles the `;utf8,` form.
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A generated square cover in one of four motifs, picked from the seed. */
export function cover(seed: string, from: string, to: string): string {
  const rnd = makeRng(hashOf(seed));
  const motif = Math.floor(rnd() * 4);
  const x = Math.round(160 + rnd() * 280);
  const y = Math.round(140 + rnd() * 300);
  const defs = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>`;
  let shapes = '';
  if (motif === 0) {
    shapes = `<circle cx="${x}" cy="${y}" r="150" fill="#ffffff" fill-opacity="0.2"/><circle cx="${600 - x}" cy="${600 - y}" r="80" fill="#ffffff" fill-opacity="0.12"/>`;
  } else if (motif === 1) {
    shapes = [60, 110, 160, 210, 260]
      .map(
        (r, i) =>
          `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="#ffffff" stroke-opacity="${0.34 - i * 0.05}" stroke-width="14"/>`,
      )
      .join('');
  } else if (motif === 2) {
    shapes = Array.from(
      { length: 7 },
      (_, i) =>
        `<rect x="${-300 + i * 130}" y="-100" width="44" height="900" fill="#ffffff" fill-opacity="0.13" transform="rotate(32 300 300)"/>`,
    ).join('');
  } else {
    shapes = `<circle cx="300" cy="${360 + Math.round(rnd() * 60)}" r="170" fill="#ffffff" fill-opacity="0.26"/><rect x="0" y="430" width="600" height="170" fill="#000000" fill-opacity="0.22"/><rect x="0" y="470" width="600" height="6" fill="#ffffff" fill-opacity="0.2"/>`;
  }
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">${defs}<rect width="600" height="600" fill="url(#g)"/>${shapes}</svg>`,
  );
}

/** A generated portrait: a gradient ground and a soft silhouette. */
export function portrait(from: string, to: string, width = 600, height = 600): string {
  const cx = width / 2;
  const head = Math.min(width, height) * 0.17;
  const cy = height * 0.42;
  return svgUri(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="${to}"/><stop offset="1" stop-color="${from}"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><circle cx="${cx}" cy="${cy}" r="${head}" fill="#000000" fill-opacity="0.28"/><ellipse cx="${cx}" cy="${cy + head * 3.1}" rx="${head * 2.1}" ry="${head * 1.9}" fill="#000000" fill-opacity="0.28"/></svg>`,
  );
}

// ---------------------------------------------------------------------------
//  Artists
// ---------------------------------------------------------------------------

export interface DemoArtist {
  id: string;
  name: string;
  artworkColor: string;
  photo: string;
  banner: string;
  verified: boolean;
  listeners: string;
  followers: string;
  bio: string;
  cities: { city: string; count: string }[];
}

function artist(
  id: string,
  name: string,
  from: string,
  to: string,
  listeners: string,
  followers: string,
  bio: string,
  cities: [string, string][],
): DemoArtist {
  return {
    id,
    name,
    artworkColor: from,
    photo: portrait(from, to),
    banner: portrait(from, to, 1600, 640),
    verified: true,
    listeners,
    followers,
    bio,
    cities: cities.map(([city, count]) => ({ city, count })),
  };
}

export const ARTISTS: DemoArtist[] = [
  artist(
    'lumen-vale',
    'Lumen Vale',
    '#5b21b6',
    '#f0abfc',
    '4,218,904',
    '1,204,331',
    'Lumen Vale writes synth-pop for the hour after midnight: warm analogue pads, a drum machine that never quite sits still and a voice recorded close enough to hear the breath. Two records made in a converted ferry terminal in Port Aldern turned a bedroom project into a touring band of five.',
    [
      ['Port Aldern', '184,120'],
      ['Kessel Bay', '121,406'],
      ['Marrowgate', '98,332'],
      ['Ostrava Nueva', '77,915'],
      ['Lintfield', '61,208'],
    ],
  ),
  artist(
    'odessa-rowe',
    'Odessa Rowe',
    '#9a3412',
    '#fdba74',
    '2,905,112',
    '812,440',
    'Odessa Rowe sings soul with a horn section she arranges herself. Raised between a church choir and her uncle’s record shop, she still cuts every vocal live with the band in one room.',
    [
      ['Marrowgate', '142,550'],
      ['Saltmere', '90,127'],
      ['Port Aldern', '66,480'],
    ],
  ),
  artist(
    'paper-lanterns',
    'The Paper Lanterns',
    '#0e7490',
    '#a5f3fc',
    '1,877,560',
    '530,902',
    'Four friends from the harbour side of Kessel Bay making jangling guitar songs about ferries, weather and staying put.',
    [
      ['Kessel Bay', '211,009'],
      ['Lintfield', '70,332'],
      ['Saltmere', '44,871'],
    ],
  ),
  artist(
    'kiko-marenne',
    'Kiko Marenne',
    '#be123c',
    '#fda4af',
    '3,410,227',
    '977,015',
    'Producer and DJ Kiko Marenne builds club records out of field recordings — rain on tram wires, market stalls, a stairwell’s echo.',
    [
      ['Ostrava Nueva', '260,441'],
      ['Port Aldern', '120,512'],
    ],
  ),
  artist(
    'solenne-ashby',
    'Solenne Ashby',
    '#3f6212',
    '#d9f99d',
    '905,338',
    '288,120',
    'Solenne Ashby plays nylon-string guitar and writes folk songs in two languages from a farmhouse outside Lintfield.',
    [
      ['Lintfield', '88,204'],
      ['Marrowgate', '40,118'],
    ],
  ),
  artist(
    'north-ferry',
    'North Ferry',
    '#1e3a8a',
    '#93c5fd',
    '2,114,870',
    '640,776',
    'Loud, bright guitar rock from a band that met on the night boat and never got off.',
    [
      ['Saltmere', '130,774'],
      ['Kessel Bay', '101,300'],
    ],
  ),
  artist(
    'ines-calder',
    'Ines Calder',
    '#86198f',
    '#f5d0fe',
    '712,904',
    '201,556',
    'Pianist and composer Ines Calder leads a quartet that treats standards like weather: the same tune, never the same day.',
    [
      ['Marrowgate', '52,090'],
      ['Ostrava Nueva', '31,006'],
    ],
  ),
  artist(
    'arlo-tamsin',
    'Arlo Tamsin',
    '#115e59',
    '#99f6e4',
    '1,302,448',
    '402,873',
    'Ambient records for reading, walking and falling asleep on trains.',
    [
      ['Port Aldern', '75,601'],
      ['Lintfield', '48,332'],
    ],
  ),
];

export const ARTIST_BY_ID: Record<string, DemoArtist> = Object.fromEntries(ARTISTS.map((a) => [a.id, a]));

// ---------------------------------------------------------------------------
//  Lyrics
// ---------------------------------------------------------------------------

const LYRIC_VERSES: string[][] = [
  [
    'Streetlights hum a quiet tune',
    'Paper lanterns chase the moon',
    'Every window on the bay',
    'Keeps a light for yesterday',
  ],
  [
    'Hold the night a little longer',
    'Let the harbour sing us home',
    'Every wave is getting stronger',
    'Every road we’ve ever known',
  ],
  [
    'Ferry horns and falling rain',
    'Write your name across the pane',
    'I could wait here half my life',
    'For the tide to turn tonight',
  ],
  [
    'Hold the night a little longer',
    'Let the harbour sing us home',
    'Every wave is getting stronger',
    'And we’re never on our own',
  ],
];

/** Synced lines across a track: verses of four lines, a short break between them. */
export function lyricsFor(duration: number): LyricLine[] {
  const lines: LyricLine[] = [];
  let time = 9;
  let round = 0;
  while (time < duration - 12) {
    const verse = LYRIC_VERSES[round % LYRIC_VERSES.length]!;
    for (const text of verse) {
      if (time >= duration - 8) break;
      lines.push({ time, text });
      time += 4.5;
    }
    lines.push({ time, text: '' });
    time += 7;
    round += 1;
  }
  return lines;
}

// ---------------------------------------------------------------------------
//  Albums and tracks
// ---------------------------------------------------------------------------

export interface DemoTrack {
  id: string;
  title: string;
  artistIds: string[];
  albumId: string;
  duration: number;
  plays: string;
  explicit?: boolean;
  disc: number;
  number: number;
}

export interface DemoAlbum {
  id: string;
  title: string;
  artistId: string;
  year: string;
  type: AlbumCardType;
  artworkColor: string;
  artwork: string;
  trackIds: string[];
  saves: string;
  /** Track index where disc 2 starts, for the disc groups. */
  disc2At?: number;
}

const TRACK_TITLES = [
  'Night Ferry',
  'Glass Harbour',
  'Lanterns',
  'Salt in the Air',
  'Low Tide',
  'Kessel Bay',
  'After the Rain',
  'Northbound',
  'Paper Moons',
  'Tramlines',
  'Harbour Lights',
  'Slow Tide',
  'Weather Report',
  'Ember',
  'Orchard Road',
  'Satellites',
  'Still Water',
  'Blue Hour',
  'Signal Fires',
  'Undertow',
  'Quiet Coast',
  'Old Radio',
  'Marrowgate',
  'Wintering',
  'Lighthouse Keeper',
  'Two Rivers',
  'Sunday Market',
  'Echo Stairs',
  'Neon Rain',
  'Driftwood',
  'Open Window',
  'Halfway Home',
  'Morning Train',
  'Copper Sky',
  'Soft Static',
  'The Long Way',
  'Silver Line',
  'Fogbound',
  'Holding Pattern',
  'Last Ferry',
  'Starling',
  'Hollow Pines',
  'Velvet Hours',
  'Cinder',
  'Coastline',
  'Brightwater',
  'Night Market',
  'Parallel',
  'Afterglow',
  'Tin Roof',
  'Meridian',
  'Palisade',
  'Wildflower',
  'Ghost Lights',
  'Riverbed',
  'Overpass',
  'Sea Glass',
  'Dust & Gold',
  'Moth',
  'The Current',
  'Far Shore',
  'Paper Lighthouse',
  'Evergreen',
  'Lamp Oil',
  'Glasshouse',
  'Low Clouds',
  'Night Bus',
  'Saltwater Choir',
  'Harbour at Six',
  'Winter Timetable',
  'Aldern Pier',
  'Honey Hours',
  'Brass Band Sunday',
  'Cold Brew',
  'Streetlamp Waltz',
  'Tideline',
  'Anchor Song',
  'Pale Fire Escape',
  'Radio Silence',
  'Terminal Blue',
  'Weathervane',
  'Kite String',
  'Northern Lights Out',
  'Porchlight',
  'Second Ferry',
  'Market Square',
  'Slow Motion Summer',
  'Ferris Wheel',
  'Rooftop Rain',
  'Linen',
  'Undertone',
  'Chalk Lines',
  'Postcard',
  'Birch & Ash',
  'Lantern Festival',
  'Shipping Forecast',
  'Half Light',
  'Gull',
  'Afterhours',
  'Satellite Town',
  'Pebble Beach',
  'Warm Static',
  'Late Tram',
  'Sleepwalker',
  'Little Harbour',
  'Crosswind',
  'Dune Grass',
  'Blue Note Morning',
  'Softly, Softly',
  'Mooring',
];

let titleCursor = 0;
/** The next unused title: every track in the catalogue has its own. */
function nextTitle(): string {
  const title = TRACK_TITLES[titleCursor % TRACK_TITLES.length]!;
  const round = Math.floor(titleCursor / TRACK_TITLES.length);
  titleCursor += 1;
  return round === 0 ? title : `${title} (Reprise)`;
}

function formatPlays(n: number): string {
  return n.toLocaleString('en-US');
}

function makeAlbum(
  index: number,
  id: string,
  title: string,
  artistId: string,
  year: string,
  type: AlbumCardType,
  from: string,
  to: string,
  count: number,
  saves: string,
  options: { disc2At?: number; featuring?: string } = {},
): { album: DemoAlbum; tracks: DemoTrack[] } {
  const rnd = makeRng(index * 977 + 13);
  const tracks: DemoTrack[] = Array.from({ length: count }, (_, i) => {
    const disc = options.disc2At !== undefined && i >= options.disc2At ? 2 : 1;
    const number = disc === 2 ? i - options.disc2At! + 1 : i + 1;
    return {
      id: `${id}-${i + 1}`,
      title: count === 1 ? title : nextTitle(),
      artistIds: options.featuring && i % 4 === 2 ? [artistId, options.featuring] : [artistId],
      albumId: id,
      duration: Math.round(150 + rnd() * 140),
      plays: formatPlays(Math.round(40000 + rnd() * rnd() * 48000000)),
      explicit: rnd() > 0.82,
      disc,
      number,
    };
  });
  return {
    album: {
      id,
      title,
      artistId,
      year,
      type,
      artworkColor: from,
      artwork: cover(id, from, to),
      trackIds: tracks.map((t) => t.id),
      saves,
      disc2At: options.disc2At,
    },
    tracks,
  };
}

const BUILT = [
  makeAlbum(
    1,
    'lanterns-over-kessel-bay',
    'Lanterns Over Kessel Bay',
    'lumen-vale',
    '2026',
    'album',
    '#4c1d95',
    '#f472b6',
    16,
    '1,204 saves',
    { disc2At: 10, featuring: 'odessa-rowe' },
  ),
  makeAlbum(2, 'soft-static', 'Soft Static', 'lumen-vale', '2024', 'album', '#312e81', '#22d3ee', 11, '842 saves'),
  makeAlbum(3, 'blue-hour-ep', 'Blue Hour', 'lumen-vale', '2025', 'ep', '#1e40af', '#c084fc', 5, '310 saves'),
  makeAlbum(4, 'afterglow-single', 'Afterglow', 'lumen-vale', '2026', 'single', '#9d174d', '#fde68a', 1, '96 saves'),
  makeAlbum(
    5,
    'brass-and-honey',
    'Brass & Honey',
    'odessa-rowe',
    '2025',
    'album',
    '#7c2d12',
    '#facc15',
    12,
    '2,114 saves',
  ),
  makeAlbum(6, 'ferry-songs', 'Ferry Songs', 'paper-lanterns', '2026', 'album', '#155e75', '#bef264', 10, '988 saves'),
  makeAlbum(
    7,
    'tram-wire-rain',
    'Tram Wire Rain',
    'kiko-marenne',
    '2026',
    'album',
    '#881337',
    '#38bdf8',
    9,
    '1,530 saves',
  ),
  makeAlbum(8, 'two-rivers', 'Two Rivers', 'solenne-ashby', '2025', 'album', '#365314', '#fcd34d', 10, '412 saves'),
  makeAlbum(9, 'night-boat', 'Night Boat', 'north-ferry', '2026', 'album', '#172554', '#f97316', 11, '1,006 saves'),
  makeAlbum(
    10,
    'weather-standards',
    'Weather Standards',
    'ines-calder',
    '2024',
    'album',
    '#701a75',
    '#fbcfe8',
    8,
    '377 saves',
  ),
  makeAlbum(11, 'slow-trains', 'Slow Trains', 'arlo-tamsin', '2026', 'album', '#134e4a', '#e0f2fe', 7, '690 saves'),
  makeAlbum(12, 'meridian-single', 'Meridian', 'kiko-marenne', '2026', 'single', '#be185d', '#a78bfa', 1, '221 saves'),
  makeAlbum(13, 'coastline-ep', 'Coastline', 'paper-lanterns', '2025', 'ep', '#0f766e', '#fef08a', 4, '188 saves'),
  makeAlbum(
    14,
    'harbour-live',
    'Harbour Lights (Live)',
    'lumen-vale',
    '2023',
    'compilation',
    '#3b0764',
    '#fb7185',
    9,
    '505 saves',
  ),
];

export const ALBUMS: DemoAlbum[] = BUILT.map((b) => b.album);
export const TRACKS: DemoTrack[] = BUILT.flatMap((b) => b.tracks);
export const ALBUM_BY_ID: Record<string, DemoAlbum> = Object.fromEntries(ALBUMS.map((a) => [a.id, a]));
export const TRACK_BY_ID: Record<string, DemoTrack> = Object.fromEntries(TRACKS.map((t) => [t.id, t]));

export function albumsBy(artistId: string): DemoAlbum[] {
  return ALBUMS.filter((a) => a.artistId === artistId);
}

export function tracksOf(album: DemoAlbum): DemoTrack[] {
  return album.trackIds.map((id) => TRACK_BY_ID[id]!);
}

/** An artist's most played tracks across their records. */
export function popularTracksOf(artistId: string, count = 10): DemoTrack[] {
  const parse = (plays: string) => Number(plays.replace(/,/g, ''));
  return TRACKS.filter((t) => t.artistIds[0] === artistId)
    .sort((a, b) => parse(b.plays) - parse(a.plays))
    .slice(0, count);
}

// ---------------------------------------------------------------------------
//  Playlists and mixes
// ---------------------------------------------------------------------------

export interface DemoPlaylist {
  id: string;
  title: string;
  owner: string;
  description: string;
  artworkColor: string;
  artwork?: string;
  trackIds: string[];
  dateAdded: string[];
  saves: string;
  mine: boolean;
  collaborative?: boolean;
}

function pickTracks(seed: number, count: number): string[] {
  const rnd = makeRng(seed);
  const pool = [...TRACKS];
  const out: string[] = [];
  while (out.length < count && pool.length > 0) {
    const i = Math.floor(rnd() * pool.length);
    out.push(pool.splice(i, 1)[0]!.id);
  }
  return out;
}

const ADDED = [
  '2 hours ago',
  'Yesterday',
  '3 days ago',
  '5 days ago',
  'Sep 2, 2026',
  'Aug 28, 2026',
  'Aug 14, 2026',
  'Jul 30, 2026',
  'Jul 12, 2026',
  'Jun 21, 2026',
  'Jun 3, 2026',
  'May 18, 2026',
];

function playlist(
  seed: number,
  id: string,
  title: string,
  owner: string,
  description: string,
  from: string,
  to: string,
  count: number,
  saves: string,
  mine: boolean,
  withArtwork = true,
): DemoPlaylist {
  return {
    id,
    title,
    owner,
    description,
    artworkColor: from,
    artwork: withArtwork ? cover(id, from, to) : undefined,
    trackIds: pickTracks(seed, count),
    dateAdded: Array.from({ length: count }, (_, i) => ADDED[Math.min(ADDED.length - 1, Math.floor(i / 2))]!),
    saves,
    mine,
  };
}

export const ME = {
  name: 'Noa Brenner',
  handle: 'noa',
  avatar: portrait('#0f766e', '#fcd34d'),
  artworkColor: '#0f766e',
};

export const PLAYLISTS: DemoPlaylist[] = [
  playlist(
    101,
    'late-night-drive',
    'Late Night Drive',
    ME.name,
    'Synths, streetlights and the long way home.',
    '#1e1b4b',
    '#f472b6',
    14,
    '38 saves',
    true,
  ),
  playlist(
    102,
    'sunday-market',
    'Sunday Market',
    ME.name,
    'Slow coffee, open windows, a record on.',
    '#9a3412',
    '#fef3c7',
    12,
    '12 saves',
    true,
  ),
  playlist(
    103,
    'deep-focus',
    'Quiet Focus',
    'Tidewater Radio',
    'Keep calm and keep working: ambient and quiet electronic.',
    '#0f172a',
    '#5eead4',
    18,
    '1,208,440 saves',
    false,
  ),
  playlist(
    104,
    'harbour-run',
    'Harbour Run',
    ME.name,
    'Loud guitars for the coastal path.',
    '#1d4ed8',
    '#fde047',
    10,
    '4 saves',
    true,
    false,
  ),
  playlist(
    105,
    'kitchen-soul',
    'Kitchen Soul',
    'Mika Oduya',
    'Horns, handclaps and something on the stove.',
    '#7c2d12',
    '#fb923c',
    11,
    '2,301 saves',
    false,
  ),
  playlist(
    106,
    'rainy-trams',
    'Rainy Trams',
    'Tidewater Radio',
    'Electronic textures for wet evenings.',
    '#881337',
    '#93c5fd',
    13,
    '640,118 saves',
    false,
  ),
];
PLAYLISTS[0]!.collaborative = true;

export const PLAYLIST_BY_ID: Record<string, DemoPlaylist> = Object.fromEntries(PLAYLISTS.map((p) => [p.id, p]));

export interface DemoMix {
  id: string;
  title: string;
  coverTitle: string;
  artworkColor: string;
  description: string;
  artistIds: string[];
  trackIds: string[];
}

export const MIXES: DemoMix[] = [
  {
    id: 'evening-mix',
    title: 'Evening Mix',
    coverTitle: 'Evening',
    artworkColor: '#7c3aed',
    description: 'Lumen Vale, Kiko Marenne, Arlo Tamsin and more',
    artistIds: ['lumen-vale', 'kiko-marenne', 'arlo-tamsin'],
    trackIds: pickTracks(201, 16),
  },
  {
    id: 'morning-mix',
    title: 'Morning Mix',
    coverTitle: 'Morning',
    artworkColor: '#ea580c',
    description: 'Odessa Rowe, Ines Calder and more',
    artistIds: ['odessa-rowe', 'ines-calder'],
    trackIds: pickTracks(202, 16),
  },
  {
    id: 'this-week',
    title: 'New This Week',
    coverTitle: 'This Week',
    artworkColor: '#0891b2',
    description: 'New music picked for you every Monday',
    artistIds: ['paper-lanterns', 'solenne-ashby', 'north-ferry'],
    trackIds: pickTracks(203, 20),
  },
  {
    id: 'just-out',
    title: 'Just Out',
    coverTitle: 'Just Out',
    artworkColor: '#16a34a',
    description: 'Fresh releases from artists you follow',
    artistIds: ['north-ferry', 'lumen-vale'],
    trackIds: pickTracks(204, 18),
  },
  {
    id: 'chill',
    title: 'Chill Mix',
    coverTitle: 'Chill',
    artworkColor: '#db2777',
    description: 'Arlo Tamsin, Solenne Ashby and more',
    artistIds: ['arlo-tamsin', 'solenne-ashby'],
    trackIds: pickTracks(205, 15),
  },
  {
    id: 'on-repeat',
    title: 'Most Played',
    coverTitle: 'Most Played',
    artworkColor: '#ca8a04',
    description: 'The songs you can’t stop playing',
    artistIds: ['lumen-vale', 'odessa-rowe'],
    trackIds: pickTracks(206, 14),
  },
];

export const MIX_BY_ID: Record<string, DemoMix> = Object.fromEntries(MIXES.map((m) => [m.id, m]));

// ---------------------------------------------------------------------------
//  Podcasts and audiobooks
// ---------------------------------------------------------------------------

export interface DemoShow {
  id: string;
  title: string;
  publisher: string;
  artworkColor: string;
  artwork: string;
  rating: number;
  ratingCount: string;
  categories: string[];
  description: string;
}

export interface DemoEpisode {
  id: string;
  showId: string;
  title: string;
  description: string;
  date: string;
  longDate: string;
  duration: number;
  /** Seconds listened. */
  progress?: number;
  played?: boolean;
}

export const SHOWS: DemoShow[] = [
  {
    id: 'quiet-cartography',
    title: 'Quiet Cartography',
    publisher: 'Marrowgate Audio',
    artworkColor: '#0f766e',
    artwork: cover('quiet-cartography', '#0f766e', '#fde68a'),
    rating: 4.8,
    ratingCount: '12.4K',
    categories: ['History', 'Places', 'Society'],
    description:
      'Every week, the story of a place that only exists on a map — phantom islands, paper towns, borders drawn by accident — and the people who went looking for them.',
  },
  {
    id: 'signal-and-noise',
    title: 'Signal & Noise',
    publisher: 'Port Aldern Radio',
    artworkColor: '#1d4ed8',
    artwork: cover('signal-and-noise', '#1d4ed8', '#f0abfc'),
    rating: 4.6,
    ratingCount: '8.1K',
    categories: ['Science', 'Technology'],
    description: 'How the machines around us actually work, explained slowly.',
  },
  {
    id: 'the-long-table',
    title: 'The Long Table',
    publisher: 'Saltmere Kitchen',
    artworkColor: '#b45309',
    artwork: cover('the-long-table', '#b45309', '#fecaca'),
    rating: 4.7,
    ratingCount: '5.9K',
    categories: ['Food', 'Culture'],
    description: 'Conversations over dinner with cooks, farmers and the occasional fisherman.',
  },
  {
    id: 'liner-notes',
    title: 'Liner Notes',
    publisher: 'Tidewater Studios',
    artworkColor: '#9d174d',
    artwork: cover('liner-notes', '#9d174d', '#c7d2fe'),
    rating: 4.9,
    ratingCount: '21K',
    categories: ['Music', 'Interviews'],
    description: 'Artists take one song apart, track by track.',
  },
  {
    id: 'small-hours',
    title: 'Small Hours',
    publisher: 'Kessel Bay Stories',
    artworkColor: '#312e81',
    artwork: cover('small-hours', '#312e81', '#fca5a5'),
    rating: 4.5,
    ratingCount: '3.2K',
    categories: ['Fiction', 'Drama'],
    description: 'Short fiction read aloud, for the hours when you can’t sleep.',
  },
];

export const SHOW_BY_ID: Record<string, DemoShow> = Object.fromEntries(SHOWS.map((s) => [s.id, s]));

/** Six episodes per show, each show with its own subjects. */
const EPISODE_TITLES: Record<string, [string, string][]> = {
  'quiet-cartography': [
    [
      'The island that sank twice',
      'A phantom island appeared on charts for two centuries. We follow the ship logs that kept it alive.',
    ],
    ['Paper towns', 'Mapmakers once invented villages to catch copiers. One of them became real.'],
    ['The border in the lake', 'A line drawn with a ruler split a lake, a pier and a family kitchen.'],
    ['Lighthouses with no sea', 'Why a dozen lighthouses stand hundreds of kilometres inland.'],
    ['The road that was never built', 'A motorway that exists only in atlases, and the town that waited for it.'],
    ['Maps of places that never were', 'Listeners send in the imaginary places from the maps of their childhood.'],
  ],
  'signal-and-noise': [
    ['How a tram finds its way', 'The century-old signalling trick still running under every junction in the city.'],
    ['The machine that listens', 'What a microphone actually hears, and why your voice arrives late.'],
    ['Cold storage', 'Inside the vault where a country keeps the recordings nobody plays any more.'],
    ['A short history of the loading spinner', 'Waiting, measured: why software tells you it is busy.'],
    ['Ten thousand tiny mirrors', 'The projector in your pocket, explained slowly.'],
    ['Cables under the bay', 'We follow one fibre from a beach hut to the other side of the sea.'],
  ],
  'the-long-table': [
    ['Bread and weather', 'A baker who plans the week by the forecast, and the loaf that proves it.'],
    ['Everything but the fish', 'A fisherman, a cook and the parts of the catch nobody sells.'],
    ['Twelve jars', 'Preserving season with a grower who has not bought a vegetable in nine years.'],
    ['The last dining car', 'Dinner at 90 km/h, with the crew who still cook it.'],
    ['A kitchen with no menu', 'What happens when the market decides what you eat.'],
    ['Sunday, slowly', 'A four-hour lunch, recorded in full and cut to forty minutes.'],
  ],
  'liner-notes': [
    ['Lumen Vale takes “Lanterns” apart', 'Every pad, every take, and the drum machine that would not stay in time.'],
    ['Odessa Rowe on singing live with a horn section', 'One room, eight players, no headphones.'],
    ['Kiko Marenne’s field recorder', 'Rain on tram wires, a stairwell, a market — and how they became a club track.'],
    ['The Paper Lanterns on writing at the harbour', 'Four friends, two chords and a ferry timetable.'],
    ['Solenne Ashby in two languages', 'Writing a chorus that has to work twice.'],
    ['Arlo Tamsin on the long fade', 'Why a record can take an hour to finish.'],
  ],
  'small-hours': [
    ['The night porter', 'A short story read aloud, for the hours when you cannot sleep.'],
    ['Lamp oil', 'A lighthouse keeper writes to a sister who never answers.'],
    ['The 3:40 to Lintfield', 'Two strangers, one carriage, and the stop that is not on the board.'],
    ['Low tide, low light', 'What the sea leaves behind, and who comes to collect it.'],
    ['Winter timetable', 'The village that is only reachable for four months of the year.'],
    ['The last listener', 'A radio station keeps broadcasting long after the town has gone.'],
  ],
};

export const EPISODES: DemoEpisode[] = SHOWS.flatMap((show, s) =>
  EPISODE_TITLES[show.id]!.map(([title, description], i) => ({
    id: `${show.id}-ep-${i + 1}`,
    showId: show.id,
    title,
    description,
    date: ['Sep 15', 'Sep 8', 'Sep 1', 'Aug 25', 'Aug 18', 'Aug 11'][i]!,
    longDate: ['Sep 15, 2026', 'Sep 8, 2026', 'Sep 1, 2026', 'Aug 25, 2026', 'Aug 18, 2026', 'Aug 11, 2026'][i]!,
    duration: [2880, 3420, 2460, 3900, 2710, 3120][i]! + s * 60,
    progress: i === 0 ? 1140 : i === 2 ? 2100 : undefined,
    played: i === 3 || i === 5,
  })),
);

export const EPISODE_BY_ID: Record<string, DemoEpisode> = Object.fromEntries(EPISODES.map((e) => [e.id, e]));

export function episodesOf(showId: string): DemoEpisode[] {
  return EPISODES.filter((e) => e.showId === showId);
}

export const AUDIOBOOKS = [
  {
    id: 'the-salt-archive',
    title: 'The Salt Archive',
    author: 'Wren Calloway',
    narrator: 'Ada Moss',
    duration: '11 h 42 min',
    progress: 0.36,
    artworkColor: '#78350f',
    artwork: cover('the-salt-archive', '#78350f', '#fde68a'),
  },
  {
    id: 'harbour-of-clocks',
    title: 'A Harbour of Clocks',
    author: 'Teo Lindahl',
    narrator: 'Ines Calder',
    duration: '9 h 05 min',
    progress: 0,
    artworkColor: '#1e3a8a',
    artwork: cover('harbour-of-clocks', '#1e3a8a', '#a7f3d0'),
  },
  {
    id: 'wintering-birds',
    title: 'Wintering Birds',
    author: 'Solveig Hart',
    narrator: 'Marek Osei',
    duration: '7 h 30 min',
    progress: 0.8,
    artworkColor: '#14532d',
    artwork: cover('wintering-birds', '#14532d', '#fecdd3'),
  },
];

// ---------------------------------------------------------------------------
//  Events, genres, friends, devices
// ---------------------------------------------------------------------------

export const EVENTS = [
  {
    id: 'ev-1',
    artistId: 'lumen-vale',
    title: 'Lumen Vale — Lanterns Tour',
    month: 'Oct',
    day: '14',
    venue: 'The Tin Hall',
    city: 'Port Aldern',
    time: 'Wed 20:00',
    soldOut: false,
  },
  {
    id: 'ev-2',
    artistId: 'odessa-rowe',
    title: 'Odessa Rowe with full band',
    month: 'Oct',
    day: '22',
    venue: 'Marrowgate Opera House',
    city: 'Marrowgate',
    time: 'Thu 19:30',
    soldOut: true,
  },
  {
    id: 'ev-3',
    artistId: 'north-ferry',
    title: 'North Ferry',
    month: 'Nov',
    day: '3',
    venue: 'Pier 9',
    city: 'Saltmere',
    time: 'Tue 21:00',
    soldOut: false,
  },
  {
    id: 'ev-4',
    artistId: 'kiko-marenne',
    title: 'Kiko Marenne all night long',
    month: 'Nov',
    day: '8',
    venue: 'Stairwell Club',
    city: 'Ostrava Nueva',
    time: 'Sat 23:00',
    soldOut: false,
  },
  {
    id: 'ev-5',
    artistId: 'paper-lanterns',
    title: 'The Paper Lanterns',
    month: 'Nov',
    day: '19',
    venue: 'Harbour Stage',
    city: 'Kessel Bay',
    time: 'Wed 20:30',
    soldOut: false,
  },
  {
    id: 'ev-6',
    artistId: 'lumen-vale',
    title: 'Lumen Vale — Lanterns Tour',
    month: 'Dec',
    day: '2',
    venue: 'Glasshouse',
    city: 'Lintfield',
    time: 'Wed 20:00',
    soldOut: false,
  },
].map((e) => ({ ...e, image: ARTIST_BY_ID[e.artistId]!.banner }));

export const GENRES = [
  { id: 'pop', title: 'Pop', color: '#db2777' },
  { id: 'podcasts', title: 'Podcasts', color: '#0f766e' },
  { id: 'made-for-you', title: 'Made for you', color: '#4338ca' },
  { id: 'new', title: 'New releases', color: '#65a30d' },
  { id: 'electronic', title: 'Electronic', color: '#7c3aed' },
  { id: 'soul', title: 'Soul', color: '#c2410c' },
  { id: 'indie', title: 'Indie', color: '#0369a1' },
  { id: 'focus', title: 'Focus', color: '#475569' },
  { id: 'chill', title: 'Chill', color: '#0d9488' },
  { id: 'folk', title: 'Folk & acoustic', color: '#a16207' },
  { id: 'jazz', title: 'Jazz', color: '#9333ea' },
  { id: 'audiobooks', title: 'Audiobooks', color: '#be123c' },
  { id: 'live', title: 'Live events', color: '#1d4ed8' },
  { id: 'sleep', title: 'Sleep', color: '#1e3a8a' },
  { id: 'workout', title: 'Workout', color: '#b91c1c' },
  { id: 'charts', title: 'Charts', color: '#6d28d9' },
].map((g, i) => ({ ...g, artwork: ALBUMS[i % ALBUMS.length]!.artwork }));

export const FRIENDS = [
  {
    id: 'f-1',
    name: 'Mika Oduya',
    avatar: portrait('#b45309', '#fde68a'),
    trackId: 'brass-and-honey-3',
    context: 'Kitchen Soul',
    contextType: 'playlist' as const,
    live: true,
  },
  {
    id: 'f-2',
    name: 'Jonas Arvid',
    avatar: portrait('#1d4ed8', '#bae6fd'),
    trackId: 'night-boat-2',
    context: 'Night Boat',
    contextType: 'album' as const,
    time: '12 min',
  },
  {
    id: 'f-3',
    name: 'Priya Castell',
    avatar: portrait('#be123c', '#fbcfe8'),
    trackId: 'tram-wire-rain-5',
    context: 'Rainy Trams',
    contextType: 'playlist' as const,
    time: '48 min',
  },
  {
    id: 'f-4',
    name: 'Sol Mendes',
    avatar: portrait('#3f6212', '#d9f99d'),
    trackId: 'two-rivers-1',
    context: 'Two Rivers',
    contextType: 'album' as const,
    time: '2 hr',
  },
  {
    id: 'f-5',
    name: 'Hana Ekberg',
    avatar: portrait('#6d28d9', '#ddd6fe'),
    trackId: 'slow-trains-4',
    context: 'Quiet Focus',
    contextType: 'playlist' as const,
    time: '5 hr',
  },
];

export const DEVICES: PlaybackDevice[] = [
  { id: 'this', name: 'This computer', kind: 'computer' },
  { id: 'living', name: 'Living Room Speaker', kind: 'speaker', description: 'Wi-Fi' },
  { id: 'phone', name: 'Noa’s phone', kind: 'phone' },
  { id: 'tv', name: 'Den TV', kind: 'tv' },
  { id: 'kitchen', name: 'Downstairs', kind: 'group', description: '3 speakers' },
  { id: 'car', name: 'Hatchback', kind: 'car', description: 'Bluetooth', disabled: true },
];

// ---------------------------------------------------------------------------
//  Library, search
// ---------------------------------------------------------------------------

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 8, 17, 12);

export const LIBRARY: LibraryEntry[] = [
  {
    id: 'liked',
    title: 'Liked Songs',
    kind: 'playlist',
    meta: 'Playlist · 20 songs',
    cover: cover('liked-songs', '#4338ca', '#a5b4fc'),
    pinned: true,
    addedAt: NOW - 400 * DAY,
    lastPlayedAt: NOW - DAY / 2,
  },
  {
    id: 'late-night-drive',
    title: 'Late Night Drive',
    kind: 'playlist',
    subtitle: ME.name,
    cover: PLAYLIST_BY_ID['late-night-drive']!.artwork,
    pinned: true,
    downloaded: true,
    addedAt: NOW - 90 * DAY,
    lastPlayedAt: NOW - DAY / 4,
  },
  {
    id: 'lanterns-over-kessel-bay',
    title: 'Lanterns Over Kessel Bay',
    kind: 'album',
    subtitle: 'Lumen Vale',
    cover: ALBUM_BY_ID['lanterns-over-kessel-bay']!.artwork,
    addedAt: NOW - 5 * DAY,
    lastPlayedAt: NOW - DAY / 8,
  },
  {
    id: 'lumen-vale',
    title: 'Lumen Vale',
    kind: 'artist',
    cover: ARTIST_BY_ID['lumen-vale']!.photo,
    addedAt: NOW - 200 * DAY,
    lastPlayedAt: NOW - DAY,
  },
  {
    id: 'quiet-cartography',
    title: 'Quiet Cartography',
    kind: 'podcast',
    subtitle: 'Marrowgate Audio',
    cover: SHOW_BY_ID['quiet-cartography']!.artwork,
    addedAt: NOW - 30 * DAY,
    lastPlayedAt: NOW - 2 * DAY,
  },
  {
    id: 'sunday-market',
    title: 'Sunday Market',
    kind: 'playlist',
    subtitle: ME.name,
    cover: PLAYLIST_BY_ID['sunday-market']!.artwork,
    addedAt: NOW - 60 * DAY,
    lastPlayedAt: NOW - 3 * DAY,
  },
  {
    id: 'deep-focus',
    title: 'Quiet Focus',
    kind: 'playlist',
    subtitle: 'Tidewater Radio',
    cover: PLAYLIST_BY_ID['deep-focus']!.artwork,
    downloaded: true,
    addedAt: NOW - 120 * DAY,
    lastPlayedAt: NOW - 4 * DAY,
  },
  {
    id: 'brass-and-honey',
    title: 'Brass & Honey',
    kind: 'album',
    subtitle: 'Odessa Rowe',
    cover: ALBUM_BY_ID['brass-and-honey']!.artwork,
    addedAt: NOW - 44 * DAY,
    lastPlayedAt: NOW - 6 * DAY,
  },
  {
    id: 'odessa-rowe',
    title: 'Odessa Rowe',
    kind: 'artist',
    cover: ARTIST_BY_ID['odessa-rowe']!.photo,
    addedAt: NOW - 70 * DAY,
    lastPlayedAt: NOW - 8 * DAY,
  },
  {
    id: 'harbour-run',
    title: 'Harbour Run',
    kind: 'playlist',
    subtitle: ME.name,
    cover: null,
    addedAt: NOW - 10 * DAY,
    lastPlayedAt: NOW - 9 * DAY,
  },
  {
    id: 'the-salt-archive',
    title: 'The Salt Archive',
    kind: 'audiobook',
    subtitle: 'Wren Calloway',
    cover: AUDIOBOOKS[0]!.artwork,
    addedAt: NOW - 15 * DAY,
    lastPlayedAt: NOW - 10 * DAY,
  },
  {
    id: 'night-boat',
    title: 'Night Boat',
    kind: 'album',
    subtitle: 'North Ferry',
    cover: ALBUM_BY_ID['night-boat']!.artwork,
    addedAt: NOW - 3 * DAY,
    lastPlayedAt: NOW - 11 * DAY,
  },
  {
    id: 'liner-notes',
    title: 'Liner Notes',
    kind: 'podcast',
    subtitle: 'Tidewater Studios',
    cover: SHOW_BY_ID['liner-notes']!.artwork,
    addedAt: NOW - 50 * DAY,
    lastPlayedAt: NOW - 12 * DAY,
  },
  {
    id: 'kiko-marenne',
    title: 'Kiko Marenne',
    kind: 'artist',
    cover: ARTIST_BY_ID['kiko-marenne']!.photo,
    addedAt: NOW - 80 * DAY,
    lastPlayedAt: NOW - 14 * DAY,
  },
  { id: 'road-trips', title: 'Road trips', kind: 'folder', meta: 'Folder · 4 playlists', addedAt: NOW - 300 * DAY },
  {
    id: 'kitchen-soul',
    title: 'Kitchen Soul',
    kind: 'playlist',
    subtitle: 'Mika Oduya',
    cover: PLAYLIST_BY_ID['kitchen-soul']!.artwork,
    addedAt: NOW - 20 * DAY,
    lastPlayedAt: NOW - 20 * DAY,
  },
];

export const RECENT_SEARCHES: RecentSearchEntry[] = [
  { id: 'rs-1', title: 'Lumen Vale', meta: 'Artist', cover: ARTIST_BY_ID['lumen-vale']!.photo, round: true },
  { id: 'rs-2', title: 'Night Boat', meta: 'Album · North Ferry', cover: ALBUM_BY_ID['night-boat']!.artwork },
  {
    id: 'rs-3',
    title: 'Quiet Cartography',
    meta: 'Podcast · Marrowgate Audio',
    cover: SHOW_BY_ID['quiet-cartography']!.artwork,
  },
  {
    id: 'rs-4',
    title: 'Rainy Trams',
    meta: 'Playlist · Tidewater Radio',
    cover: PLAYLIST_BY_ID['rainy-trams']!.artwork,
  },
  { id: 'rs-5', title: 'Glass Harbour', meta: 'Song · Lumen Vale', cover: ALBUM_BY_ID['soft-static']!.artwork },
];

// ---------------------------------------------------------------------------
//  Profile and recap
// ---------------------------------------------------------------------------

export const FOLLOWERS = [
  { id: 'p-1', name: 'Mika Oduya', avatar: FRIENDS[0]!.avatar, followers: '214 followers', followsYou: true },
  { id: 'p-2', name: 'Jonas Arvid', avatar: FRIENDS[1]!.avatar, followers: '88 followers', followsYou: true },
  { id: 'p-3', name: 'Priya Castell', avatar: FRIENDS[2]!.avatar, followers: '1,032 followers', followsYou: false },
  { id: 'p-4', name: 'Sol Mendes', avatar: FRIENDS[3]!.avatar, followers: '47 followers', followsYou: true },
  { id: 'p-5', name: 'Hana Ekberg', avatar: FRIENDS[4]!.avatar, followers: '392 followers', followsYou: false },
  {
    id: 'p-6',
    name: 'Tomas Rhee',
    avatar: portrait('#0369a1', '#fef9c3'),
    followers: '65 followers',
    followsYou: true,
  },
];

// ---------------------------------------------------------------------------
//  Local devices on the "Now playing" story, recap numbers
// ---------------------------------------------------------------------------

export const RECAP = {
  eyebrow: 'Your 2026 in sound',
  value: '48,210',
  unit: 'minutes listened',
  artworkColor: '#7c3aed',
};

export const GREETING = 'Good evening';

// ---------------------------------------------------------------------------
//  Creator studio (signed in as Lumen Vale)
// ---------------------------------------------------------------------------

function series(base: number, drift: number, count = 14, seed = 1): number[] {
  const rnd = makeRng(seed);
  return Array.from({ length: count }, (_, i) => Math.round(base + drift * i + (rnd() - 0.5) * base * 0.16));
}

export const STUDIO_METRICS = [
  {
    kind: 'listeners' as const,
    label: 'Listeners',
    value: '184,210',
    delta: '+12.4%',
    trend: 'up' as const,
    series: series(11000, 320, 14, 1),
  },
  {
    kind: 'streams' as const,
    label: 'Streams',
    value: '1,312,904',
    delta: '+8.1%',
    trend: 'up' as const,
    series: series(84000, 1400, 14, 2),
  },
  {
    kind: 'followers' as const,
    label: 'Followers',
    value: '12,846',
    delta: '0.0%',
    trend: 'flat' as const,
    series: series(900, 0, 14, 3),
  },
  {
    kind: 'saves' as const,
    label: 'Saves',
    value: '26,120',
    delta: '-3.2%',
    trend: 'down' as const,
    series: series(2100, -24, 14, 4),
  },
];

/** 21 Aug … 17 Sep. */
const STREAM_DAYS = Array.from({ length: 28 }, (_, i) => (i < 11 ? `${21 + i} Aug` : `${i - 10} Sep`));
const streamsByDay = STREAM_DAYS.map((label, i) => ({
  label,
  value: Math.round(38000 + i * 520 + Math.sin(i / 2) * 3400 + (i >= 16 ? 21000 * Math.exp(-(i - 16) / 6) : 0)),
}));

export const STUDIO_STREAMS = [
  { id: 'streams', label: 'Streams', data: streamsByDay, delta: 0.081 },
  {
    id: 'listeners',
    label: 'Listeners',
    data: streamsByDay.map((p) => ({ label: p.label, value: Math.round(p.value * 0.16) })),
    delta: 0.124,
  },
];

export const STUDIO_EVENTS = [{ index: 16, label: 'Afterglow · Single' }];

export const STUDIO_TOP_TRACKS = TRACKS.filter((t) => t.artistIds[0] === 'lumen-vale')
  .slice(0, 8)
  .map((t, i) => {
    const album = ALBUM_BY_ID[t.albumId]!;
    const streams = Math.round(210000 / (i + 1.4));
    return {
      id: t.id,
      title: t.title,
      subtitle: `${album.title} · ${album.type === 'ep' ? 'EP' : album.type[0]!.toUpperCase() + album.type.slice(1)}`,
      artwork: album.artwork,
      streams,
      listeners: Math.round(streams * 0.19),
      saves: Math.round(streams * 0.024),
      trend: (['up', 'flat', 'down', 'new', 'up', 'down', 'flat', 'up'] as const)[i]!,
    };
  });

export const STUDIO_BREAKDOWN = {
  cities: ARTIST_BY_ID['lumen-vale']!.cities.map((c) => ({ label: c.city, value: Number(c.count.replace(/,/g, '')) })),
  countries: [
    { label: 'Marovia', value: 418200 },
    { label: 'Estland Isles', value: 211800 },
    { label: 'Corvall', value: 97420 },
    { label: 'Rasmark', value: 55210 },
    { label: 'Hollin', value: 23400 },
  ],
  ages: [
    { label: '18–24', value: 44200 },
    { label: '25–34', value: 68900 },
    { label: '35–44', value: 38800 },
    { label: '45–54', value: 14100 },
    { label: '55+', value: 6210 },
  ],
  genders: [
    { label: 'Women', value: 83100 },
    { label: 'Men', value: 81400 },
    { label: 'Non-binary', value: 9310 },
    { label: 'Not specified', value: 4400 },
  ],
  sources: [
    { label: 'Playlists', value: 91400 },
    { label: 'Profile', value: 41200 },
    { label: 'Search', value: 29800 },
    { label: 'Other', value: 15810 },
  ],
};

export const STUDIO_PAYOUT_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((label, i) => ({
  label,
  value: [3640, 3720, 4910, 4860, 5120, 6284.5][i]!,
}));

export const STUDIO_RELEASES = [
  {
    id: 'r-afterglow',
    title: 'Afterglow',
    artist: 'Lumen Vale',
    type: 'single' as const,
    releaseDate: '4 Sep 2026',
    status: 'live' as const,
    trackCount: 1,
    artwork: ALBUM_BY_ID['afterglow-single']!.artwork,
  },
  {
    id: 'r-lanterns',
    title: 'Lanterns Over Kessel Bay',
    artist: 'Lumen Vale',
    type: 'album' as const,
    releaseDate: '12 Sep 2026',
    status: 'live' as const,
    trackCount: 16,
    artwork: ALBUM_BY_ID['lanterns-over-kessel-bay']!.artwork,
  },
  {
    id: 'r-winter',
    title: 'Winter Ferry',
    artist: 'Lumen Vale',
    type: 'ep' as const,
    releaseDate: '20 Nov 2026',
    status: 'scheduled' as const,
    trackCount: 4,
    artwork: cover('winter-ferry', '#1e3a8a', '#e0f2fe'),
  },
  {
    id: 'r-tramlines',
    title: 'Tramlines (with Kiko Marenne)',
    artist: 'Lumen Vale, Kiko Marenne',
    type: 'single' as const,
    releaseDate: '9 Oct 2026',
    status: 'in-review' as const,
    trackCount: 2,
    artwork: cover('tramlines', '#be123c', '#c4b5fd'),
  },
  {
    id: 'r-demo',
    title: 'Untitled demo',
    artist: 'Lumen Vale',
    type: 'single' as const,
    releaseDate: 'No date yet',
    status: 'draft' as const,
    trackCount: 1,
  },
  {
    id: 'r-harbour',
    title: 'Harbour Lights (Live)',
    artist: 'Lumen Vale',
    type: 'album' as const,
    releaseDate: '2 Oct 2026',
    status: 'rejected' as const,
    statusReason:
      'The artwork contains a web address. Remove any text that is not the artist or release name and resubmit.',
    trackCount: 9,
    artwork: ALBUM_BY_ID['harbour-live']!.artwork,
  },
  {
    id: 'r-blue',
    title: 'Blue Hour',
    artist: 'Lumen Vale',
    type: 'ep' as const,
    releaseDate: '14 Mar 2025',
    status: 'live' as const,
    trackCount: 5,
    artwork: ALBUM_BY_ID['blue-hour-ep']!.artwork,
  },
  {
    id: 'r-static',
    title: 'Soft Static',
    artist: 'Lumen Vale',
    type: 'album' as const,
    releaseDate: '2 Feb 2024',
    status: 'live' as const,
    trackCount: 11,
    artwork: ALBUM_BY_ID['soft-static']!.artwork,
  },
];

export const STUDIO_STEPS = [
  { id: 'uploaded', label: 'Uploaded', state: 'complete' as const, date: '14 Sep' },
  { id: 'metadata', label: 'Metadata', state: 'complete' as const, date: '15 Sep' },
  {
    id: 'artwork',
    label: 'Artwork',
    state: 'current' as const,
    date: 'Now',
    description: 'Add a square cover, at least 3000 px.',
  },
  { id: 'review', label: 'Review', state: 'upcoming' as const, description: 'Usually takes 2–3 days.' },
  { id: 'scheduled', label: 'Scheduled', state: 'upcoming' as const },
  { id: 'live', label: 'Live', state: 'upcoming' as const, date: '20 Nov' },
];

export const STUDIO_GENRES = [
  'Alternative',
  'Ambient',
  'Electronic',
  'Folk',
  'Indie pop',
  'Jazz',
  'Soul',
  'Synth-pop',
  'Rock',
].map((label) => ({
  value: label.toLowerCase(),
  label,
}));

export const STUDIO_LANGUAGES = ['English', 'Spanish', 'French', 'Portuguese', 'Catalan', 'Instrumental'].map(
  (label) => ({
    value: label.toLowerCase(),
    label,
  }),
);

export const STUDIO_MOODS = ['Dreamy', 'Nocturnal', 'Melancholy', 'Uplifting', 'Driving', 'Calm'];
export const STUDIO_PITCH_GENRES = ['Synth-pop', 'Indie pop', 'Electronic', 'Dream pop', 'Ambient'];
