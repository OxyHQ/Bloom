/**
 * The dev-only guard for a control that CANNOT name itself.
 *
 * Most Bloom controls take their accessible name from what they render: a
 * `Button` reads its label, a menu row reads its title, a tab reads its text.
 * Three do not, because they draw a shape and no words — `Switch` (track and
 * thumb), `Slider` (track and knob) and `DotGridMeter` (dots). For those, the
 * caller's `accessibilityLabel` is the ONLY route to a name, on either
 * platform: a caption sitting beside the control is a sibling element, and
 * neither React Native nor react-native-web associates the two.
 *
 * WHY A WARNING IS WORTH ITS WEIGHT: the failure is invisible to everyone who
 * can see the screen. The switch is drawn, the caption is drawn, the toggle
 * works — and a screen reader says "switch, on", with no clue which of the nine
 * settings on the page it belongs to. Nothing renders wrong, nothing throws,
 * and no type error is available to raise it, because a label the caller merely
 * forgot is indistinguishable from one they deliberately left off. It reached
 * every app in the fleet for exactly that reason, and one consumer forked the
 * component rather than report it.
 *
 * There is no false positive to trade against. Bloom's `Switch` has no
 * `aria-labelledby` prop and renders no text, so within this library
 * `accessibilityLabel` is not the recommended route to a name, it is the only
 * one. The one shape that could look like a false positive — a native parent
 * `View` with `accessible` collapsing the row into a single element — is not
 * one: that collapse does not happen on web, where the control still surfaces
 * as an unnamed switch, so the advice holds on both platforms.
 *
 * Gated on `process.env.NODE_ENV`, matching `toast/use-single-outlet-guard.ts`:
 * Metro and Vite/Rolldown both fold it statically, so production keeps the
 * branch, the latch and the message out of the bundle. Deliberately NOT
 * `__DEV__`, a Metro global a plain web bundler does not define. It only ever
 * warns — an unnamed control still renders and still works.
 *
 * Latched per COMPONENT rather than per instance. A settings screen renders one
 * unnamed switch per row, and twelve identical lines is how a real message gets
 * filtered out; one line names the class, and the fix is the same everywhere.
 */
import * as React from 'react';

const warned = new Set<string>();

/**
 * Warn once per component when a control that renders no text of its own is
 * mounted with no accessible name. `name` is whatever the caller passed, so an
 * empty or whitespace-only string counts as missing — it produces an
 * `aria-label=""`, which names nothing.
 */
export function useAccessibleNameWarning(component: string, name: string | undefined): void {
  const missing = name === undefined || name.trim() === '';

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    if (!missing || warned.has(component)) {
      return;
    }
    warned.add(component);
    // Internal Bloom diagnostic: the consumer's own tree is the only place this
    // can be fixed, so the message states the fix rather than the symptom.
    // eslint-disable-next-line no-console
    console.warn(
      `[Bloom] ${component}: no \`accessibilityLabel\`, so assistive technology ` +
        'announces the control with no name — a caption rendered beside it is a ' +
        'sibling element and does not name it on either platform. Pass ' +
        `\`accessibilityLabel\` (e.g. <${component} accessibilityLabel="Notifications" …/>).`,
    );
  }, [component, missing]);
}

/**
 * Test-only reset. The latch is module state that outlives a render tree, so
 * without this the first suite to mount an unnamed control would latch it and
 * leave every later suite asserting against a guard that can no longer fire —
 * passing whatever the implementation did.
 */
export function resetAccessibleNameWarningsForTests(): void {
  warned.clear();
}
