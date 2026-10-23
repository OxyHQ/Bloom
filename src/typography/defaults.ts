import type { StyleProp, TextStyle } from 'react-native';

/**
 * Bloom typography defaults are inline `style`. NativeWind compiles a caller's
 * `className` utilities into `style` FIRST, so an inline default repeating a key
 * the className already sets would win the merge and silently override the
 * utility (the Homiio hero-title bug). The opposite failure is dropping ALL
 * defaults the moment any `className` exists: `className="mt-2"` then lost the
 * colour and size too, and dark-mode text rendered with the platform default
 * (black on near-black).
 *
 * So defaults are dropped PER KEY: only the keys the className claims
 * (`text-<size>`, `text-<colour>`, `font-<weight>`, `leading-*`) are removed,
 * and every other default still applies under a className.
 */

const VARIANT_PREFIX = '(?:[\\w-]+:)*';

const SIZE_TOKEN =
  /^(?:xs|sm|base|lg|[1-9]xl|title-[123]-(?:regular|medium|semibold|bold)|\[(?:length:)?-?[\d.]+(?:px|rem|em|%|pt|vw|vh)\])(?:\/.+)?$/;

/** `text-left`, `text-wrap`, … set neither a size nor a colour. */
const NON_COLOR_TEXT_TOKEN =
  /^(?:left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip)$/;

const WEIGHT_TOKEN =
  /^(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black|\[\d+\])$/;

/**
 * Utilities that cannot set size, weight or colour. A token outside every
 * recognised family is a CUSTOM class (`chip-label`, an app's own `.hero`): its
 * rules are opaque here, so it is assumed to set any of them and every default
 * is dropped, as before. Only a className made wholly of recognised tokens keeps
 * the defaults it does not claim.
 */
const NON_TYPOGRAPHIC_UTILITY = new RegExp(
  `^(?:-?(?:m|p)[trblxyse]?-|-?(?:inset|top|left|right|bottom|start|end|z|order|translate|rotate|scale|skew)-|(?:flex|grow|shrink|basis|w|h|min|max|size|gap|space|items|justify|self|content|place|col|row|grid|auto|overflow|rounded|border|divide|bg|from|via|to|shadow|opacity|tracking|align|whitespace|break|select|pointer|cursor|transition|duration|delay|ease|animate|aspect|object|ring|outline|fill|stroke|line-clamp|backdrop|blur|web|native|ios|android)(?:-|$)|(?:block|inline|inline-block|hidden|relative|absolute|fixed|sticky|static|truncate|uppercase|lowercase|capitalize|normal-case|italic|not-italic|underline|no-underline|line-through|sr-only|font-(?:sans|serif|mono|display)|grow|shrink)$)`,
);

type TypographyKey = 'color' | 'fontSize' | 'lineHeight' | 'fontWeight';

const ALL_KEYS: readonly TypographyKey[] = ['color', 'fontSize', 'lineHeight', 'fontWeight'];

/** The default keys a className's utilities already set. */
export function typographyKeysClaimedByClassName(
  className: string | undefined,
): ReadonlySet<TypographyKey> {
  const claimed = new Set<TypographyKey>();
  if (!className?.trim()) return claimed;
  const prefix = new RegExp(`^${VARIANT_PREFIX}`);
  for (const raw of className.trim().split(/\s+/)) {
    const token = raw.replace(prefix, '').replace(/^!/, '');
    if (token.startsWith('text-')) {
      const rest = token.slice(5);
      if (SIZE_TOKEN.test(rest)) {
        claimed.add('fontSize');
        claimed.add('lineHeight');
      } else if (!NON_COLOR_TEXT_TOKEN.test(rest)) {
        claimed.add('color');
      }
    } else if (token.startsWith('leading-')) {
      claimed.add('lineHeight');
    } else if (token.startsWith('font-') && WEIGHT_TOKEN.test(token.slice(5))) {
      claimed.add('fontWeight');
    } else if (!NON_TYPOGRAPHIC_UTILITY.test(token)) {
      for (const key of ALL_KEYS) claimed.add(key);
    }
  }
  return claimed;
}

export function typographyDefaultsWhenNoClassName(
  className: string | undefined,
  defaults: TextStyle,
): TextStyle | undefined {
  if (!className?.trim()) return defaults;
  const claimed = typographyKeysClaimedByClassName(className);
  const kept: TextStyle = {};
  let any = false;
  for (const key of Object.keys(defaults) as (keyof TextStyle)[]) {
    if (claimed.has(key as TypographyKey)) continue;
    (kept as Record<string, unknown>)[key] = defaults[key];
    any = true;
  }
  return any ? kept : undefined;
}

export function mergeTypographyStyle(
  className: string | undefined,
  defaults: TextStyle | undefined,
  base: StyleProp<TextStyle>,
  style: StyleProp<TextStyle> | undefined,
): StyleProp<TextStyle> {
  const resolvedDefaults = defaults
    ? typographyDefaultsWhenNoClassName(className, defaults)
    : undefined;

  return [resolvedDefaults, base, style];
}
