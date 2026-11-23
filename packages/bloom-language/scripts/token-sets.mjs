/**
 * Every token set the language checks a value against, by name: the spec's
 * scales and enums, and the sets made of several of them (`padding` is the
 * space scale and its negatives, `color` the colour roles…). The compiler's
 * tables (`scripts/generate.mjs`) and the reference docs
 * (`scripts/generate-reference.mjs`) both read this one definition.
 */

/** A spec table without its `$comment`. */
export const withoutComment = (table) =>
  Object.fromEntries(Object.entries(table).filter(([key]) => key !== '$comment'));

/** The type ramp's families (`body`, `title-2`…): each variant less its weight. */
export function typeFamiliesOf(typeRamp) {
  const families = [];
  for (const variant of Object.keys(typeRamp)) {
    const family = variant.replace(/-(regular|medium|semibold|bold)$/, '');
    if (!families.includes(family)) families.push(family);
  }
  return families;
}

/** Token set name → its token names, in the spec's order. */
export function tokenSetsOf(spec) {
  const { enums } = spec;
  const scales = Object.fromEntries(
    Object.entries(spec.scales).map(([name, table]) => [name, withoutComment(table)]),
  );
  const colors = withoutComment(spec.colors);
  const typeRamp = withoutComment(spec.typeRamp);
  const motion = withoutComment(spec.motion);
  const loops = withoutComment(spec.loops);
  const negative = Object.keys(scales.space).map((name) => `-${name}`);
  return {
    space: Object.keys(scales.space),
    padding: [...Object.keys(scales.space), ...negative],
    // A pinned view's edge takes a percentage of its parent besides (`top: '25%'`).
    edgeDistance: [...Object.keys(scales.space), ...negative, ...enums.insetPercent],
    // A margin takes `auto` besides: the free space on that side (Tailwind's `ml-auto`).
    margin: [...Object.keys(scales.space), ...negative, ...enums.marginExtra],
    length: [...Object.keys(scales.space), ...Object.keys(scales.length)],
    zIndex: [...Object.keys(scales.zIndex), ...enums.zIndexExtra],
    shadow: Object.keys(scales.shadow),
    scale: Object.keys(scales.scale),
    ring: [...Object.keys(colors), ...enums.ringExtra],
    corner: [...Object.keys(scales.corner), ...enums.cornerExtra],
    // A radius in points: no `concentric`, which is a corner relative to the parent's.
    cornerRadius: [
      ...Object.keys(scales.corner),
      ...enums.cornerExtra.filter((name) => name !== 'concentric'),
    ],
    columnWidth: [...Object.keys(scales.space), ...enums.columnWidthExtra],
    // `.separator()` is a grouped section's and a list's: either's separators.
    separator: [...new Set([...enums.groupedSeparator, ...enums.listSeparator])],
    font: [...typeFamiliesOf(typeRamp), ...Object.keys(scales.fontSize), ...enums.fontFamily],
    // A label's size alone (a tab's): a ramp family or a size, never a face of its own.
    labelFont: [...typeFamiliesOf(typeRamp), ...Object.keys(scales.fontSize)],
    weight: Object.keys(scales.weight),
    leading: [...Object.keys(scales.leading), ...Object.keys(scales.leadingPx)],
    tracking: [...Object.keys(scales.tracking), ...Object.keys(scales.trackingPx)],
    color: Object.keys(colors),
    // A colour role alone, never at an opacity: what a node paints by the role's name.
    colorRole: Object.keys(colors),
    borderWidth: Object.keys(scales.borderWidth),
    opacity: Object.keys(scales.opacity),
    hitSlop: Object.keys(scales.hitSlop),
    shrink: Object.keys(scales.shrink),
    flex: Object.keys(withoutComment(scales.flex)),
    alignment: Object.keys(scales.alignment),
    iconSize: Object.keys(scales.iconSize),
    avatarSize: Object.keys(scales.avatarSize),
    glassOpacity: Object.keys(scales.glassOpacity),
    duration: Object.keys(scales.duration),
    rotation: Object.keys(scales.rotation),
    motion: Object.keys(motion),
    // What a reveal takes: the motions with a duration, never a spring.
    timedMotion: Object.keys(motion).filter((name) => 'duration' in motion[name]),
    typeRamp: Object.keys(typeRamp),
    anchor: Object.keys(scales.anchor),
    loop: Object.keys(loops),
    ...enums,
  };
}

/** Parameter types that take no token: a view, a boolean. A string written there is never valid. */
export const NO_TOKEN = ['view', 'boolean'];

/**
 * A node's own parameters for modifier `name`: the node's `params` where it
 * takes them narrower than the modifier (`Tooltip().side()` takes `top` or
 * `bottom` alone), else the modifier's. The runtime's types, the compiler and
 * the reference all read a node's parameters through this.
 */
export function paramsOf(spec, node, name) {
  return node.params?.[name] ?? spec.modifiers[name] ?? [];
}
