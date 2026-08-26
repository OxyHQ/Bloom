/**
 * COPIED FROM react-native-teleport 1.2.0 — `src/global.d.ts`
 * MIT, Copyright (c) 2025 Kiryl Ziusko. Full licence in `NOTICE` at the root.
 *
 * Changed: nothing — byte-for-byte, only its path. `moveBefore` is newer than
 * TypeScript's DOM library, and this is how they declare it.
 */
// https://developer.mozilla.org/en-US/docs/Web/API/Element/moveBefore
interface Node {
  moveBefore(node: Node, child: Node | null): void;
}
