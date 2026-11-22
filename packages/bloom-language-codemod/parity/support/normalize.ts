import normalizeColor from '@react-native/normalize-colors';

/**
 * Native host trees in one spelling, so two trees compare on what React
 * Native draws and not on how a style was written. Each fold is a rule React
 * Native itself applies, nothing is a tolerance:
 *
 * - Shorthands are their longhands (`padding`, `paddingBlock`,
 *   `paddingInline`, `paddingVertical`, `paddingHorizontal`, margins alike;
 *   a longhand overrides its shorthand, as React Native resolves them).
 * - A border side is drawn only with a width: each side is its width, colour
 *   and style, and a side with no width is no side.
 * - `fontWeight` is its string (React Native takes `600` and `'600'` alike).
 * - React Native's own defaults are left out where nothing can inherit them:
 *   `fontWeight` 400 and `letterSpacing` 0 on a Text that is no span of
 *   another, `borderStyle` solid, a View's `flexDirection` column and
 *   `position` relative, a Text's `ellipsizeMode` tail.
 * - A span's text prop equal to what the Text around it gives it is what it
 *   inherits, so it is left out.
 * - A hex colour is its long lowercase form (`#fff` is `#ffffff`, `#fff9`
 *   `#ffffff99`); a
 *   colour with an alpha is compared at the 8 bits of alpha a device draws.
 * - A corner of the reading direction is its physical corner left to right.
 * - A style's `pointerEvents` is the view's `pointerEvents` prop: React Native
 *   sends that style attribute to the view as its prop.
 * - A number is compared to 12 significant digits: `12 * 0.025` is
 *   `0.30000000000000004` in JavaScript and `0.3` in NativeWind's compiler.
 * - A percentage is compared to 4 decimals: NativeWind writes a third as
 *   `33.3333%`, the language as `33.333333%`; Yoga rounds a layout to the
 *   device's pixels, where 1e-6 of a percent cannot move one.
 * - A `boxShadow` is the list React Native draws, parsed as its
 *   `processBoxShadow` parses one (the same splits and lengths, each colour
 *   through its `normalizeColor`): NativeWind writes Tailwind's `shadow-sm` as
 *   a parsed list (`#0000001a`), the language as its CSS string
 *   (`rgb(0 0 0 / 0.1)`), and React Native draws both as the same list.
 */

/** React Native's own splits and length rule (`Libraries/StyleSheet/processBoxShadow`). */
const SHADOW_SPLIT = /,(?![^()]*\))/;
const SHADOW_ARGS = /\s+(?![^(]*\))/;
const SHADOW_LENGTH = /^([+-]?\d*\.?\d+)(px)?$/;

type Shadow = Record<string, unknown>;

/** One shadow as React Native draws it: lengths in points, the colour normalised, the defaults it fills. */
function drawnShadow(shadow: Shadow): Shadow {
  const length = (value: unknown) =>
    typeof value === 'string' ? Number(SHADOW_LENGTH.exec(value)?.[1]) : (value ?? 0);
  return {
    offsetX: length(shadow.offsetX),
    offsetY: length(shadow.offsetY),
    blurRadius: length(shadow.blurRadius),
    spreadDistance: length(shadow.spreadDistance),
    color: normalizeColor(shadow.color as string),
    inset: shadow.inset === true,
  };
}

/** A box shadow, a CSS string or a list, as the list React Native draws. */
function drawnShadows(value: unknown): Shadow[] {
  if (Array.isArray(value)) return value.map((shadow: Shadow) => drawnShadow(shadow));
  return String(value)
    .split(SHADOW_SPLIT)
    .map((part) => part.trim())
    .filter((part) => part !== '')
    .map((part) => {
      const shadow: Shadow = {};
      const lengths: string[] = [];
      for (const arg of part.split(SHADOW_ARGS)) {
        if (arg === 'inset') shadow.inset = true;
        else if (normalizeColor(arg) !== null) shadow.color = arg;
        else lengths.push(arg);
      }
      [shadow.offsetX, shadow.offsetY, shadow.blurRadius, shadow.spreadDistance] = lengths;
      return drawnShadow(shadow);
    });
}

interface Host {
  type: string;
  props: Record<string, unknown>;
  children: (Host | string)[];
}

const SIDES = ['Top', 'Bottom', 'Start', 'End', 'Left', 'Right'] as const;
/** A shorthand and the longhands it sets, widest first. */
const BOX: [string, string[]][] = [
  ['', ['Top', 'Bottom', 'Start', 'End']],
  ['Vertical', ['Top', 'Bottom']],
  ['Block', ['Top', 'Bottom']],
  ['Horizontal', ['Start', 'End']],
  ['Inline', ['Start', 'End']],
  ['BlockStart', ['Top']],
  ['BlockEnd', ['Bottom']],
  ['InlineStart', ['Start']],
  ['InlineEnd', ['End']],
];

function foldBox(style: Record<string, unknown>, prefix: 'padding' | 'margin'): void {
  const out: Record<string, unknown> = {};
  for (const [suffix, sides] of BOX) {
    const key = `${prefix}${suffix}`;
    if (style[key] === undefined) continue;
    for (const side of sides) out[`${prefix}${side}`] = style[key];
    delete style[key];
  }
  for (const side of SIDES) {
    const key = `${prefix}${side}`;
    if (style[key] !== undefined) out[key] = style[key];
  }
  Object.assign(style, out);
}

function foldBorders(style: Record<string, unknown>): void {
  const part = (side: string, what: 'Width' | 'Color' | 'Style') =>
    style[`border${side}${what}`] ?? style[`border${what}`];
  const sides: Record<string, unknown> = {};
  for (const side of ['Top', 'Bottom', 'Start', 'End', 'Left', 'Right']) {
    const width = part(side, 'Width');
    if (width === undefined || width === 0) continue;
    const borderStyle = part(side, 'Style');
    sides[`border${side}`] = [
      width,
      part(side, 'Color'),
      borderStyle === 'solid' ? undefined : borderStyle,
    ];
  }
  for (const key of Object.keys(style))
    if (/^border(Top|Bottom|Start|End|Left|Right)?(Width|Color|Style)$/.test(key))
      delete style[key];
  Object.assign(style, sides);
}

function foldStyle(
  input: Record<string, unknown>,
  text: boolean,
  span: boolean,
): Record<string, unknown> {
  const style = { ...input };
  foldBox(style, 'padding');
  foldBox(style, 'margin');
  foldBorders(style);
  if (style.fontWeight !== undefined) style.fontWeight = String(style.fontWeight);
  if (style.boxShadow !== undefined) style.boxShadow = drawnShadows(style.boxShadow);
  // A corner of the reading direction is its physical corner left to right (the web harness folds them alike).
  for (const [logical, physical] of [
    ['borderTopStartRadius', 'borderTopLeftRadius'],
    ['borderTopEndRadius', 'borderTopRightRadius'],
    ['borderBottomStartRadius', 'borderBottomLeftRadius'],
    ['borderBottomEndRadius', 'borderBottomRightRadius'],
  ] as const) {
    if (style[logical] === undefined) continue;
    style[physical] = style[logical];
    delete style[logical];
  }
  for (const [key, value] of Object.entries(style)) {
    if (typeof value === 'number') style[key] = Number(value.toPrecision(12));
    if (typeof value !== 'string') continue;
    // A short hex colour is its long form: `#fff` is `#ffffff`, `#fff9` is `#ffffff99`.
    const short = /^#([0-9a-f]{3,4})$/i.exec(value);
    const long = short
      ? `#${[...(short[1] as string)].map((c) => c + c).join('')}`.toLowerCase()
      : value;
    if (/^#[0-9a-f]{6}$/i.test(long)) style[key] = long.toLowerCase();
    // A colour with an alpha, as the 8 bits a device draws it with (`#ffffffb3` is white at 179/255).
    const hex8 = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(long);
    const rgba = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(value);
    if (hex8)
      style[key] =
        `rgba(${[1, 2, 3].map((i) => Number.parseInt(hex8[i] as string, 16)).join(', ')}, ${Number.parseInt(hex8[4] as string, 16)}/255)`;
    else if (rgba)
      style[key] =
        `rgba(${rgba[1]}, ${rgba[2]}, ${rgba[3]}, ${Math.round(Number(rgba[4]) * 255)}/255)`;
    const percent = /^(-?[\d.]+)%$/.exec(value);
    if (percent) style[key] = `${Number(Number(percent[1]).toFixed(4))}%`;
  }
  if (!text) {
    if (style.flexDirection === 'column') delete style.flexDirection;
    if (style.position === 'relative') delete style.position;
  }
  if (text && !span) {
    if (style.fontWeight === '400' || style.fontWeight === 'normal') delete style.fontWeight;
    if (style.letterSpacing === 0) delete style.letterSpacing;
  }
  return Object.fromEntries(Object.entries(style).sort(([a], [b]) => (a < b ? -1 : 1)));
}

/** The text props a span inherits from the Text around it. */
const INHERITED = [
  'fontSize',
  'lineHeight',
  'fontWeight',
  'fontFamily',
  'letterSpacing',
  'color',
  'fontStyle',
];

function fold(
  node: Host | string,
  inText: boolean,
  around: Record<string, unknown> = {},
): Host | string {
  if (typeof node === 'string') return node;
  const text = node.type === 'Text';
  const props = { ...node.props };
  if (text && props.ellipsizeMode === 'tail') delete props.ellipsizeMode;
  if (props.style && typeof props.style === 'object') {
    // `pointerEvents` is a style attribute React Native sends as the view's own prop.
    const { pointerEvents, ...rest } = props.style as Record<string, unknown>;
    if (pointerEvents !== undefined && props.pointerEvents === undefined) {
      props.pointerEvents = pointerEvents;
      props.style = rest;
    }
    props.style = foldStyle(props.style as Record<string, unknown>, text, inText);
    if (Object.keys(props.style as object).length === 0) delete props.style;
  }
  // A span writing what the Text around it already gives it draws what it inherits.
  const style = (props.style ?? {}) as Record<string, unknown>;
  if (text && inText) {
    for (const key of INHERITED)
      if (style[key] !== undefined && style[key] === around[key]) delete style[key];
    if (props.style && Object.keys(style).length === 0) delete props.style;
  }
  const next = text
    ? {
        ...around,
        ...Object.fromEntries(
          INHERITED.filter((k) => style[k] !== undefined).map((k) => [k, style[k]]),
        ),
      }
    : around;
  return {
    type: node.type,
    props,
    children: node.children.map((c) => fold(c, inText || text, text ? next : around)),
  };
}

export function normalizeNative(tree: unknown): unknown {
  return (tree as (Host | string)[]).map((node) => fold(node, false));
}
