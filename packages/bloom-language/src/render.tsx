import {
  createElement,
  Fragment,
  useContext,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform, Pressable, Text as RNText, View } from 'react-native';
import { styled } from 'react-native-css';
import { Avatar as BloomAvatar } from '@oxy.so/bloom/avatar';
import { Button as BloomButton } from '@oxy.so/bloom/button';
import { EngagementAction, EngagementBar, EngagementGroup } from '@oxy.so/bloom/engagement-bar';
import { Image as ShapeImage } from '@oxy.so/bloom/shapes';
import { Surface } from '@oxy.so/bloom/surface';

import {
  isNode,
  type Node,
  type ActionProps,
  type AvatarProps,
  type Child,
  type EmbedProps,
  type IconProps,
  type ImageProps,
  type Modifier,
  type PressHandler,
  type StackProps,
  type TextProps,
  type TextRun,
  type ViewNodeProps,
} from './node';
import { ENVIRONMENT } from './generated/spec.generated';
import {
  addToLayers,
  cachedStyle,
  flexStyle,
  foregroundOf,
  isLayerModifier,
  layerStyle,
  stackStyle,
  textStyle,
  type Layer,
  type Resolved,
  type StyleOut,
  type Target,
} from './style';
import { Painted, type Paint } from './paint';
import {
  HIT_SLOP,
  resolveAvatarSize,
  resolveIconSize,
  tokenKey,
  type AvatarSizeName,
  type ColorName,
  type IconSizeToken,
  type Role,
  type ShrinkPriority,
} from './tokens';
import { deriveEnv, EnvContext, type Env } from './env';
import { adoptLanguageSheet } from './web-sheet';

const IS_WEB = Platform.OS === 'web';

/**
 * The web host for a hover group: the `group` class, so a descendant's
 * `group-hover:` utilities (Bloom `SubtleHover`) answer the pointer over this
 * view. Native has no hover group and keeps the plain host.
 */
const HoverGroupPressable = styled(Pressable as ComponentType<{ style?: unknown }>, {
  className: 'style',
}) as ComponentType<Record<string, unknown>>;
const HoverGroupView = styled(View as ComponentType<{ style?: unknown }>, {
  className: 'style',
}) as ComponentType<Record<string, unknown>>;

/** A host or Bloom component, as `draw` takes it. */
type Host = unknown;

/**
 * `createElement` over the host and Bloom components with props assembled from
 * the chain. Their prop contracts are what the render suite asserts.
 */
const draw = createElement as (
  type: unknown,
  props?: Record<string, unknown> | null,
  ...children: ReactNode[]
) => ReactElement;

const ROLE: Record<Role, string | undefined> = {
  button: 'button',
  link: 'link',
  header: 'header',
  image: 'image',
  text: 'text',
  none: 'none',
};

const ENV_KINDS: ReadonlySet<string> = new Set(ENVIRONMENT);

/** One pass over a node's modifiers: what it draws with, sorted by what it affects. */
interface Plan {
  layers: Layer[];
  grow: boolean;
  shrink: ShrinkPriority | undefined;
  env: Modifier[];
  pressable: boolean;
  onPress: PressHandler | undefined;
  onLongPress: (() => void) | undefined;
  onHoverIn: (() => void) | undefined;
  onHoverOut: (() => void) | undefined;
  hoverGroup: boolean;
  label: string | undefined;
  hint: string | undefined;
  role: Role | undefined;
  hitSlop: number | undefined;
  testID: string | undefined;
  id: string | number | undefined;
  own: Map<Modifier['kind'], Modifier>;
}

function plan(node: Node): Plan {
  const result: Plan = {
    layers: [],
    grow: false,
    shrink: undefined,
    env: [],
    pressable: false,
    onPress: undefined,
    onLongPress: undefined,
    onHoverIn: undefined,
    onHoverOut: undefined,
    hoverGroup: false,
    label: undefined,
    hint: undefined,
    role: undefined,
    hitSlop: undefined,
    testID: undefined,
    id: undefined,
    own: new Map(),
  };
  for (const modifier of node.modifiers) {
    if (isLayerModifier(modifier)) {
      addToLayers(result.layers, modifier);
      continue;
    }
    if (ENV_KINDS.has(modifier.kind)) {
      result.env.push(modifier);
      continue;
    }
    switch (modifier.kind) {
      case 'grow':
        result.grow = true;
        break;
      case 'shrink':
        result.shrink = modifier.value;
        break;
      case 'onPress':
        result.pressable = true;
        result.onPress = modifier.value;
        break;
      case 'onLongPress':
        result.pressable = true;
        result.onLongPress = modifier.value;
        break;
      case 'hoverGroup':
        result.hoverGroup = true;
        break;
      case 'onHover':
        result.pressable = true;
        result.onHoverIn = modifier.enter;
        result.onHoverOut = modifier.leave;
        break;
      case 'label':
        result.label = modifier.value;
        break;
      case 'hint':
        result.hint = modifier.value;
        break;
      case 'role':
        result.role = modifier.value;
        break;
      case 'hitSlop':
        result.hitSlop = HIT_SLOP[modifier.value];
        break;
      case 'testID':
        result.testID = modifier.value;
        break;
      case 'id':
        result.id = modifier.value;
        break;
      default:
        result.own.set(modifier.kind, modifier);
    }
  }
  return result;
}

function ownValue<K extends Modifier['kind']>(
  p: Plan,
  kind: K,
): Extract<Modifier, { kind: K }> | undefined {
  return p.own.get(kind) as Extract<Modifier, { kind: K }> | undefined;
}

/**
 * The accessibility and press props of a view, for whichever host ends up
 * outermost; `undefined` when it has none, so a bare node never gets a host
 * of its own.
 */
function behaviourProps(p: Plan): Record<string, unknown> | undefined {
  const props: Record<string, unknown> = {};
  if (p.label !== undefined) props.accessibilityLabel = p.label;
  if (p.hint !== undefined) props.accessibilityHint = p.hint;
  if (p.role !== undefined) props.accessibilityRole = ROLE[p.role];
  if (p.testID !== undefined) props.testID = p.testID;
  if (p.hitSlop !== undefined) props.hitSlop = p.hitSlop;
  if (p.pressable) {
    // A view whose press handler is absent stays the same host, out of the tab order.
    props.focusable = p.onPress !== undefined || p.onLongPress !== undefined;
    if (p.onPress) props.onPress = p.onPress;
    if (p.onLongPress) props.onLongPress = p.onLongPress;
  }
  if (p.onHoverIn) props.onHoverIn = p.onHoverIn;
  if (p.onHoverOut) props.onHoverOut = p.onHoverOut;
  if (IS_WEB && p.hoverGroup) props.className = 'group';
  for (const _ in props) return props;
  return undefined;
}

/** The style key of a node's flex placement, '' when it has none. */
function flexKey(p: Plan): string {
  return p.grow || p.shrink ? `grow:${p.grow ? 1 : 0}:${p.shrink ?? ''}` : '';
}

/**
 * Where a node renders: its environment, and the environment `EnvContext`
 * holds at this point of the React tree (they differ below an environment
 * modifier, until a `view()` needs it provided).
 */
interface Context {
  env: Env;
  provided: Env;
}

/**
 * Draws `host` with a resolved style: directly when the style is final, or
 * through a `Painted` leaf when the style names theme colours (native).
 */
function drawHost(
  host: Host,
  out: StyleOut,
  props: Record<string, unknown>,
  ...children: ReactNode[]
): ReactElement {
  if (out.paint !== undefined)
    return draw(Painted, { ...props, host, paint: out.paint }, ...children);
  if (out.style !== undefined) props.style = out.style;
  return draw(host, props, ...children);
}

// ── Hosts ────────────────────────────────────────────────────────

/**
 * Draws one node, or hands back what it drew last time in the same place
 * (see `Rendered` in node.ts): a node that keeps its identity across renders
 * gives React the same element, and React skips the subtree.
 */
function renderNode(node: Node, ctx: Context, key: string | number | undefined): ReactNode {
  const last = node.rendered;
  if (
    last !== undefined &&
    last.env === ctx.env &&
    last.provided === ctx.provided &&
    last.key === key
  ) {
    return last.element;
  }
  const element = drawNode(node, ctx, key);
  node.rendered = { env: ctx.env, provided: ctx.provided, key, element };
  return element;
}

/**
 * Draws one node: its host element with the innermost layer merged into the
 * host's own style, then each further layer as a view around it. The press,
 * hover and accessibility props go on the outermost box; `grow`/`shrink` too.
 */
function drawNode(node: Node, ctx: Context, key: string | number | undefined): ReactNode {
  const p = plan(node);
  const env = p.env.length > 0 ? deriveEnv(ctx.env, p.env) : ctx.env;
  const inner: Context = env === ctx.env ? ctx : { env, provided: ctx.provided };
  const reactKey = p.id ?? key;
  const layers = p.layers;
  // A glass layer is a Surface, which the host cannot be; so the host takes
  // the innermost layer only when that layer is plain.
  const hostTakesLayer = layers.length > 0 && (layers[0] as Layer).glass === undefined;
  const hostLayer = hostTakesLayer ? (layers[0] as Layer) : undefined;
  const wrappers = hostTakesLayer ? layers.slice(1) : layers;
  const outermostIsHost = wrappers.length === 0;
  const flex = flexKey(p);
  const behaviour = behaviourProps(p);

  let element = renderHost(
    node,
    p,
    inner,
    hostLayer,
    outermostIsHost ? flex : '',
    outermostIsHost ? behaviour : undefined,
    outermostIsHost ? reactKey : undefined,
  );

  for (let i = 0; i < wrappers.length; i++) {
    const layer = wrappers[i] as Layer;
    const outermost = i === wrappers.length - 1;
    const flexOf = outermost ? flex : '';
    element = wrapLayer(
      layer,
      flexOf,
      p,
      element,
      outermost ? behaviour : undefined,
      outermost ? reactKey : undefined,
    );
  }
  return element;
}

function boxStyle(layer: Layer | undefined, flex: string, p: Plan): Resolved {
  const style = layerStyle(layer);
  return flex ? Object.assign(style, flexStyle(p.grow, p.shrink)) : style;
}

function wrapLayer(
  layer: Layer,
  flex: string,
  p: Plan,
  child: ReactNode,
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
): ReactElement {
  const styleKey = `L|${layer.key}|${flex}`;
  const glass = layer.glass;
  if (glass !== undefined) {
    const resolved = boxStyle(layer, flex, p);
    const corner = resolved.borderRadius;
    const out = cachedStyle('component', styleKey, () => resolved);
    const props: Record<string, unknown> = {
      radius: typeof corner === 'number' ? corner : undefined,
      ...(glass.sheen ? null : { sheen: false }),
      ...(behaviour && !p.pressable ? behaviour : null),
      key: behaviour && p.pressable ? undefined : key,
    };
    const fill = glass.fillRole;
    const surface =
      fill === undefined
        ? drawHost(Surface, out, props, child)
        : draw(
            Painted,
            { ...props, host: Surface, paint: glassPaint(styleKey, out, fill, glass.fillOpacity) },
            child,
          );
    return behaviour && p.pressable ? draw(hostFor(p), { ...behaviour, key }, surface) : surface;
  }
  const out = cachedStyle('host', styleKey, () => boxStyle(layer, flex, p));
  return drawHost(behaviour ? hostFor(p) : View, out, { ...behaviour, key }, child);
}

const glassPaints = new Map<string, Paint>();

/** A glass Surface's paint: its box style (painted on native), and its fill from a role. One per style and fill. */
function glassPaint(
  styleKey: string,
  out: StyleOut,
  fill: ColorName,
  opacity: number | undefined,
): Paint {
  const id = `${styleKey}|${fill}|${opacity ?? ''}`;
  let paint = glassPaints.get(id);
  if (paint === undefined) {
    const base = out.paint ?? {
      style: out.style as object | undefined,
      styleRoles: [],
      propRoles: [],
    };
    const fillRole: readonly [string, ColorName, number?] =
      opacity === undefined ? ['fill', fill] : ['fill', fill, opacity];
    paint = { style: base.style, styleRoles: base.styleRoles, propRoles: [fillRole] };
    glassPaints.set(id, paint);
  }
  return paint;
}

/** The outermost box's host: pressable when the view takes presses or hovers, a hover group's class host on the web. */
function hostFor(p: Plan): Host {
  if (p.pressable) return IS_WEB && p.hoverGroup ? HoverGroupPressable : Pressable;
  return IS_WEB && p.hoverGroup ? HoverGroupView : View;
}

function hostProps(
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
): Record<string, unknown> {
  const props: Record<string, unknown> = behaviour ? { ...behaviour } : {};
  if (key !== undefined) props.key = key;
  return props;
}

const iconPaints = new Map<ColorName, Paint>();

/** An icon's fill, painted from its foreground role. */
function iconPaint(color: ColorName): Paint {
  let paint = iconPaints.get(color);
  if (paint === undefined) {
    paint = { style: undefined, styleRoles: [], propRoles: [['fill', color]] };
    iconPaints.set(color, paint);
  }
  return paint;
}

function renderHost(
  node: Node,
  p: Plan,
  ctx: Context,
  layer: Layer | undefined,
  flex: string,
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
): ReactElement {
  const layerKey = layer?.key ?? '';
  const box = (target: Target, prefix: string): StyleOut =>
    cachedStyle(target, `${prefix}|${layerKey}|${flex}`, () => boxStyle(layer, flex, p));
  const boxed = layer !== undefined || flex !== '';

  switch (node.kind) {
    case 'stack': {
      const { axis } = node.props as StackProps;
      const spacing = ownValue(p, 'spacing')?.value;
      const align = ownValue(p, 'align')?.value;
      const styleKey = `S|${axis}|${spacing === undefined ? '' : tokenKey(spacing)}|${align ?? ''}|${layerKey}|${flex}`;
      const out = cachedStyle('host', styleKey, () =>
        Object.assign(stackStyle(axis, spacing, align), boxStyle(layer, flex, p)),
      );
      const children =
        axis === 'depth'
          ? renderDepthChildren(node.children, ctx)
          : renderChildren(node.children, ctx);
      const host = behaviour ? hostFor(p) : View;
      return drawHost(host, out, hostProps(behaviour, key), ...children);
    }
    case 'spacer': {
      const out = cachedStyle('host', `SP|${layerKey}|${flex}`, () =>
        Object.assign({ flex: 1 }, boxStyle(layer, flex, p)),
      );
      return drawHost(behaviour ? hostFor(p) : View, out, hostProps(behaviour, key));
    }
    case 'text': {
      const noWrap = ownValue(p, 'noWrap') !== undefined;
      const out = cachedStyle(
        'host',
        `T|${ctx.env.key}|${noWrap ? 'nw' : ''}|${layerKey}|${flex}`,
        () => Object.assign(textStyle(ctx.env.text, noWrap), boxStyle(layer, flex, p)),
      );
      const lines = ownValue(p, 'lines')?.value;
      const props = hostProps(behaviour, key);
      if (lines !== undefined) {
        props.numberOfLines = lines;
        props.ellipsizeMode = 'tail';
      }
      if (behaviour?.focusable !== undefined) delete props.focusable;
      return drawHost(RNText, out, props, ...renderRuns((node.props as TextProps).runs, ctx));
    }
    case 'icon': {
      const size = resolveIconSize(
        (ownValue(p, 'size')?.value as IconSizeToken | undefined) ?? 'md',
      );
      const bare = !boxed && !behaviour;
      const glyph = draw(Painted, {
        host: (node.props as IconProps).icon,
        paint: iconPaint(foregroundOf(ctx.env.text)),
        width: size,
        height: size,
        key: bare ? key : undefined,
      });
      if (bare) return glyph;
      const host = behaviour ? hostFor(p) : View;
      return drawHost(host, box('host', 'I'), hostProps(behaviour, key), glyph);
    }
    case 'avatar': {
      const { source, options } = node.props as AvatarProps;
      const size = ownValue(p, 'size')?.value as AvatarSizeName | undefined;
      const props = hostProps(behaviour, key);
      delete props.focusable;
      Object.assign(props, {
        source,
        variant: options.variant,
        account: options.account,
        size: size === undefined ? undefined : resolveAvatarSize(size),
      });
      if (!boxed) return draw(BloomAvatar, props);
      return drawHost(BloomAvatar, box('component', 'A'), props);
    }
    case 'image': {
      const { source, alt } = node.props as ImageProps;
      const size = resolveAvatarSize(
        (ownValue(p, 'size')?.value as AvatarSizeName | undefined) ?? 'md',
      );
      const bare = !boxed && !behaviour;
      const image = draw(ShapeImage, { source, alt, size, key: bare ? key : undefined });
      if (bare) return image;
      const host = behaviour ? hostFor(p) : View;
      return drawHost(host, box('host', 'IM'), hostProps(behaviour, key), image);
    }
    case 'button': {
      const props = hostProps(behaviour, key);
      delete props.focusable;
      const { icon, label } = buttonContent(node.children);
      const shape = ownValue(p, 'shape')?.value;
      Object.assign(props, {
        appearance: ownValue(p, 'style')?.value,
        tone: ownValue(p, 'tint')?.value,
        size: ownValue(p, 'size')?.value,
        leadingIcon: icon,
        iconOnly:
          icon !== undefined && label === undefined && shape !== undefined ? true : undefined,
        children: label,
      });
      if (!boxed) return draw(BloomButton, props);
      return drawHost(BloomButton, box('component', 'B'), props);
    }
    case 'action': {
      const { icon, label, options } = node.props as ActionProps;
      return draw(EngagementAction, {
        key,
        icon,
        activeIcon: options.activeIcon,
        accessibilityLabel: label,
        accessibilityHint: p.hint,
        count: ownValue(p, 'count')?.value,
        active: ownValue(p, 'active')?.value,
        tone: ownValue(p, 'tint')?.value,
        onPress: p.onPress,
        onLongPress: p.onLongPress,
        popOnActivate: options.pop,
        rollCount: options.rollCount,
        busy: options.busy,
        hitSlop: options.hitSlop,
        accessibilityActions: options.accessibilityActions,
        onAccessibilityAction: options.onAccessibilityAction,
        testID: p.testID,
      });
    }
    case 'actionBar': {
      const trailing = ownValue(p, 'trailing')?.value;
      const props: Record<string, unknown> = {
        key,
        testID: p.testID,
        size: ownValue(p, 'size')?.value,
        formatCount: ownValue(p, 'countFormat')?.value,
        trailing: trailing ? renderChildren(trailing, ctx) : undefined,
      };
      const children = renderChildren(node.children, ctx);
      if (!boxed) return draw(EngagementBar, props, ...children);
      return drawHost(EngagementBar, box('component', 'AB'), props, ...children);
    }
    case 'actionGroup': {
      const props: Record<string, unknown> = { key, testID: p.testID };
      const children = renderChildren(node.children, ctx);
      if (!boxed) return draw(EngagementGroup, props, ...children);
      return drawHost(EngagementGroup, box('component', 'AG'), props, ...children);
    }
    case 'embed': {
      const { content } = node.props as EmbedProps;
      const element =
        typeof content === 'function'
          ? content((child) => renderChild(child, ctx, undefined))
          : content;
      if (!boxed && !behaviour) {
        return key === undefined ? (element as ReactElement) : draw(Fragment, { key }, element);
      }
      const host = behaviour ? hostFor(p) : View;
      return drawHost(host, box('host', 'E'), hostProps(behaviour, key), element);
    }
    case 'view': {
      if (!boxed && !behaviour) return viewElement(node, ctx, key);
      const host = behaviour ? hostFor(p) : View;
      return drawHost(
        host,
        box('host', 'V'),
        hostProps(behaviour, key),
        viewElement(node, ctx, undefined),
      );
    }
  }
}

/**
 * A `view()` node: its component with the props it was called with, under
 * an `EnvContext` provider only when the environment here differs from the
 * one already provided.
 */
function viewElement(node: Node, ctx: Context, key: string | number | undefined): ReactElement {
  const { component, props } = node.props as ViewNodeProps;
  if (ctx.env === ctx.provided) {
    return draw(
      component,
      key === undefined ? (props as Record<string, unknown>) : { ...props, key },
    );
  }
  return draw(
    EnvContext.Provider,
    { value: ctx.env, key },
    draw(component, props as Record<string, unknown>),
  );
}

function buttonContent(children: readonly Child[]): {
  icon: IconProps['icon'] | undefined;
  label: string | undefined;
} {
  let icon: IconProps['icon'] | undefined;
  let label: string | undefined;
  for (const child of flatten(children)) {
    if (child.kind === 'icon' && icon === undefined) icon = (child.props as IconProps).icon;
    if (child.kind === 'text') {
      const text = (child.props as TextProps).runs
        .filter((run) => typeof run === 'string' || typeof run === 'number')
        .join('');
      label = label === undefined ? text : `${label} ${text}`;
    }
  }
  return { icon, label };
}

function flatten(children: readonly Child[]): Node[] {
  const out: Node[] = [];
  for (const child of children) {
    if (Array.isArray(child)) out.push(...flatten(child));
    else if (isNode(child)) out.push(child);
  }
  return out;
}

// ── Children ─────────────────────────────────────────────────────

/**
 * One slot per child, in order: a child that is `false` or `null` keeps its
 * slot as `null`, so its later siblings never shift onto each other's state
 * (React matches spread children by position). An array (`items.map(...)`) is
 * one slot whose elements are keyed by `.id()`, else by index.
 */
function renderChildren(children: readonly Child[], ctx: Context): ReactNode[] {
  const out: ReactNode[] = [];
  for (const child of children) {
    if (Array.isArray(child)) out.push(renderList(child, ctx));
    else out.push(isNode(child) ? renderNode(child, ctx, undefined) : null);
  }
  return out;
}

function renderList(children: readonly Child[], ctx: Context): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (Array.isArray(child)) out.push(draw(Fragment, { key: `l${i}` }, ...renderList(child, ctx)));
    else if (isNode(child)) out.push(renderNode(child, ctx, i));
  }
  return out;
}

const DEPTH_LAYER = (): Resolved => ({
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
});

/** A ZStack: the first child sets the size; each later one covers it, in order. */
function renderDepthChildren(children: readonly Child[], ctx: Context): ReactNode[] {
  const out = cachedStyle('host', 'Z', DEPTH_LAYER);
  return renderChildren(children, ctx).map((child, index) =>
    index === 0 || child === null
      ? child
      : drawHost(View, out, { pointerEvents: 'box-none' }, child),
  );
}

function renderRuns(runs: readonly TextRun[], ctx: Context): ReactNode[] {
  const out: ReactNode[] = [];
  for (const run of runs) {
    if (typeof run === 'string' || typeof run === 'number') out.push(String(run));
    else out.push(isNode(run) ? renderNode(run, ctx, undefined) : null);
  }
  return out;
}

/** Draws any child in a context: what `Embed`'s render function hands out. */
function renderChild(child: Child, ctx: Context, key: string | number | undefined): ReactNode {
  if (Array.isArray(child)) return renderList(child, ctx);
  return isNode(child) ? renderNode(child, ctx, key) : null;
}

// ── Entry points ─────────────────────────────────────────────────

interface RootProps {
  node: Child;
}

/** The boundary from JSX into the language: it takes the environment provided where it is placed. */
function LanguageRoot({ node }: RootProps): ReactNode {
  const env = useContext(EnvContext);
  return renderChild(node, { env, provided: env }, undefined);
}
LanguageRoot.displayName = 'BloomLanguage';

/**
 * A language tree as a React element, for JSX. A bare `view()` node mounts its
 * component directly; anything else goes under one boundary component.
 */
export function toElement(node: Child, key?: string | number): ReactElement {
  adoptLanguageSheet();
  if (isNode(node) && node.kind === 'view' && node.modifiers.length === 0) {
    const { component, props } = node.props as ViewNodeProps;
    return draw(
      component,
      key === undefined ? (props as Record<string, unknown>) : { ...props, key },
    );
  }
  return draw(LanguageRoot, { node, key });
}

/** What a `view()` component renders: its body, under the environment it is placed in. */
export function renderBody(body: Child, env: Env): ReactNode {
  return renderChild(body, { env, provided: env }, undefined);
}
