/**
 * Which surface a `SettingsListGroup` paints, given the colour actually behind
 * it. Pure, so the rule can be walked over every preset x mode without rendering
 * anything: `__tests__/surface-level-adoption.test.ts` does that (it is where
 * the families that resolve their own surface are measured against the ladder),
 * and `__tests__/SettingsListGroupSurface.test.tsx` ties the rendered component
 * to it in both modes.
 *
 * The question a group has to answer is about its PARENT, and a group cannot
 * see its parent. It used to be told, per call site, by a `variant` prop: one
 * app repeated it at ~75 of them, and a screen that forgot rendered a `card`
 * group on a `card` panel — present, correct, invisible.
 *
 * ## The rule
 *
 * The group is a surface ON another surface, so it takes the surface ladder's
 * own step off the fill the container published (`styles/surface-levels.ts`),
 * with ONE named exception:
 *
 *   on the page   `theme.colors.background` behind it -> `theme.colors.card`
 *   anywhere else                                     -> `surfaceFillOn(fill)`
 *
 * ### Why the page is a special case rather than another step
 *
 * Because the palette already has a token for this exact pair, and it is a
 * stronger answer than the ladder's in dark mode. Measured over all 64 presets:
 *
 *   light   `card` on the page  1.101-1.110   the ladder's step  1.101-1.110  (identical:
 *                                                                 rung 1 IS `card` in light)
 *   dark    `card` on the page  1.552-1.576   the ladder's step  1.226-1.241
 *
 * So in light the two answers coincide and the branch is invisible; in dark,
 * taking the step would flatten every settings screen in the fleet against its
 * page for no gain. `theme.colors.card` means "the colour a card paints on the
 * page", and on the page that is what a group has always painted. This is the
 * one surface pair the palette has an opinion about — off the page there is no
 * "card on a panel" token, and the step is the only honest answer.
 *
 * ### Why the FILL and not the rung
 *
 * The first version of this read `useSurfaceLevelValue() === 0`, which is the
 * same answer for every container Bloom currently ships — and wrong the moment
 * one publishes a rung that is not its colour. `ContentPanel` does: repainted
 * with `surfaceColor={colors.background}` it still publishes level 1, so the
 * rung says "you are on a card" while the panel is painting the page. Asking
 * the fill gets `colors.card` there, which is right; asking the rung got
 * `backgroundSecondary`, which measures 1.121-1.132 against that page in dark.
 *
 * ### Why a step and not `backgroundSecondary`
 *
 * `backgroundSecondary` is calibrated against `card`, so it works on a
 * `ContentPanel` (dark 1.378-1.404) and nowhere else. On the menu/popover
 * surface `FloatingPanel` and `QueuePanel` publish, in DARK, it measures
 * **1.086-1.106 — failing the ladder's 1.1 just-noticeable floor on 52 of the
 * 64 presets** and scraping over it on the other 12: the disappearance this
 * whole design exists to prevent, reappearing one container over. The ladder's
 * step measures 1.296-1.312 there, on all 64. In LIGHT both clear it
 * comfortably (1.221-1.230 vs 1.148-1.152), which is why a suite pinned to one
 * mode cannot see any of this. `surface-level-adoption.test.ts` pins the failing
 * presets as a named set.
 *
 * ### Why `surfaceFillOn` and not `useSurfaceLevel(1)`
 *
 * `useSurfaceLevel(1)` CLAMPS at rung 3, so a group inside a rung-3 container
 * would be handed rung 3 — its parent's own colour, 1.000:1. A step that always
 * steps cannot do that, and "never lands on my parent" is the one property this
 * component must not lose.
 */
import { surfaceFillOn } from '../styles/surface-levels';
import type { Theme } from '../theme/types';
import type { SettingsListGroupVariant } from './types';

/**
 * The `testID` on the group's card.
 *
 * The group's fill is the whole point of this component and it is invisible to a
 * structural assertion, so a test has to read the style off the exact node that
 * carries it. Without a handle, a suite identifies it by elimination — "the one
 * background that is not the container's" — which degenerates silently the day a
 * container paints through a `className` instead of an inline style, and then
 * measures the wrong node while staying green.
 */
export const SETTINGS_LIST_GROUP_TEST_ID = 'settings-list-group';

/**
 * The colour the group's card paints.
 *
 * `variant` is the explicit override and wins in both directions — it names one
 * of `Card`'s two surfaces, for a container Bloom does not paint and therefore
 * cannot publish a fill for.
 *
 * @param ambientFill what `useSurfaceFill()` reports: the colour the surrounding
 *   surface actually painted.
 */
export function settingsGroupSurface(
  theme: Theme,
  ambientFill: string,
  variant?: SettingsListGroupVariant,
): string {
  if (variant === 'filled') return theme.colors.backgroundSecondary;
  if (variant === 'plain') return theme.colors.card;
  // A string equality, and deliberately: every Bloom surface publishes a colour
  // read off the SAME theme object — level 0 resolves to `colors.background`,
  // `Dialog` and the sheet shell publish it verbatim, a panel repainted as the
  // page publishes it through `surfaceColor` — so the two are identical by
  // construction, not by luck. A consumer publishing an equal-but-differently-
  // spelled colour falls through to the step, which is a legible surface on the
  // page too — just not the one the palette names. Wrong-but-legible, never
  // invisible, which is the direction this failure has to fall.
  if (ambientFill === theme.colors.background) return theme.colors.card;
  return surfaceFillOn(theme, ambientFill);
}
