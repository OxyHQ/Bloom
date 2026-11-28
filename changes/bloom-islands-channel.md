---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Keyed islands, fed off React's commit (ADR 0003, M1): a `BloomIsland` with an `islandKey`
  draws that key's one shared composition, and the `BloomIslands` TurboModule sets its data
  (`setProps(key, json)`) and theme (`setTheme(key, preset, scheme)`) directly, whether or not a
  host is mounted yet. The composition lives in the host attached last and goes back to the one
  before when it leaves, so an island mounted early out of sight (at the root, before the data)
  is drawn at once by the screen that shows it, with its rows and scroll position kept. A keyed
  island's intents are the device event `BloomIslandEvent` (`{ key, name, payload }`). An island
  without a key is unchanged.
