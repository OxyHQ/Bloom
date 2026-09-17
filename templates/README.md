# Templates

Full-screen templates, built from Bloom's components as Storybook
stories (`Templates/*`). Not published: this directory is outside `src` and out of
`package.json#files`. Anything reusable a template needs is built as a real Bloom
family under `src/` and only composed here.

`shared/dashboard.tsx` is the one place the dashboard-family templates (home,
HR, finance, marketing, medical, AI profile) share template-only code: the demo
sidebar, notifications and photo avatars, the seeded PRNG, the `DashboardShell`
frame, the responsive chart rows and a few demo cells. Table chips, in-row
selects, filters, search and row actions are Bloom API (`Chip hue`,
`DataTableSelect`, `DataTableFilter`, `DataTableSearch`, `DataTableRowActions`).

`music/` is a whole app rather than one screen: `PlayerContext.tsx` holds the
one player (a fake playback clock, the loaded item, the queue, shuffle, repeat,
volume, device and likes) and `router.tsx` an in-memory history, so every card,
row, bar and lyric line in every story agrees and really navigates.
`MusicFrame.tsx` is the frame — three panes over the now-playing bar on desktop,
the mini player above the tab bar on a phone — and the pages sit beside it
(`HomePage`, `CollectionPages`, `ArtistPage`, `SearchPage`, `PodcastPages`,
`NowPlayingPage`, `ProfilePage`, `StudioPages`). `data.ts` is the invented
catalogue: artists, albums, playlists, shows, audiobooks, venues and cities,
with every cover generated as a gradient SVG data URI, so nothing loads over the
network.

Typecheck: `bunx tsc --noEmit -p templates`.
