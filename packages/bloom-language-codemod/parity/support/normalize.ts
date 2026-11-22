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
 * - A hex colour is its six-digit lowercase form (`#fff` is `#ffffff`).
 * - A percentage is compared to 4 decimals: NativeWind writes a third as
 *   `33.3333%`, the language as `33.333333%`; Yoga rounds a layout to the
 *   device's pixels, where 1e-6 of a percent cannot move one.
 */
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
  for (const [key, value] of Object.entries(style)) {
    if (typeof value !== 'string') continue;
    const hex = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
    if (hex)
      style[key] = `#${hex
        .slice(1)
        .map((c) => c + c)
        .join('')}`.toLowerCase();
    else if (/^#[0-9a-f]{6}$/i.test(value)) style[key] = value.toLowerCase();
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

function fold(node: Host | string, inText: boolean): Host | string {
  if (typeof node === 'string') return node;
  const text = node.type === 'Text';
  const props = { ...node.props };
  if (text && props.ellipsizeMode === 'tail') delete props.ellipsizeMode;
  if (props.style && typeof props.style === 'object') {
    props.style = foldStyle(props.style as Record<string, unknown>, text, inText);
    if (Object.keys(props.style as object).length === 0) delete props.style;
  }
  return { type: node.type, props, children: node.children.map((c) => fold(c, inText || text)) };
}

export function normalizeNative(tree: unknown): unknown {
  return (tree as (Host | string)[]).map((node) => fold(node, false));
}
