/**
 * The value that takes a key of an animated style (`useAnimatedStyle`) back to
 * what the view has without it.
 *
 * A worklet's style reaches native through `jsi::dynamicFromValue`, which drops
 * every key whose value is `undefined`: the key keeps the last value the worklet
 * gave it, on Android, iOS and OxyOS alike. A panel shown after hiding kept
 * `maxHeight: 0` that way and never appeared. `null` does reach native, where
 * Fabric resets the prop to its default. (Reanimated's web writer merges the
 * styles it was given and skips both, as before: the web's layouts that move
 * are CSS.) A worklet therefore writes every key on every run, an explicit value or
 * `UNSET`, never `undefined` and never a branch that leaves the key out.
 * Gate: `__tests__/animated-style-resets.test.ts`.
 *
 * Typed as `undefined` (no value), which is what the style means by it.
 */
export const UNSET = null as unknown as undefined;
