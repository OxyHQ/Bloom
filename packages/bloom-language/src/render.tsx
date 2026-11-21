import {
  createElement,
  Fragment,
  useContext,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Platform,
  Pressable,
  Text as RNText,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { styled } from 'react-native-css';
import { Avatar as BloomAvatar } from '@oxy.so/bloom/avatar';
import { AvatarGroup as BloomAvatarGroup } from '@oxy.so/bloom/avatar-group';
import { Badge as BloomBadge } from '@oxy.so/bloom/badge';
import { AvatarPresence } from '@oxy.so/bloom/chat-indicators';
import { IconCircle as BloomIconCircle } from '@oxy.so/bloom/icon-circle';
import { Loading as BloomLoading } from '@oxy.so/bloom/loading';
import { PressableScale } from '@oxy.so/bloom/pressable-scale';
import * as BloomSkeleton from '@oxy.so/bloom/skeleton';
import { SubtleHover } from '@oxy.so/bloom/subtle-hover';
import { Button as BloomButton } from '@oxy.so/bloom/button';
import { EngagementAction, EngagementBar, EngagementGroup } from '@oxy.so/bloom/engagement-bar';
import { BloomImage } from '@oxy.so/bloom/image';
import { Fab as BloomFab } from '@oxy.so/bloom/fab';
import { BlurIsland } from '@oxy.so/bloom/blur';
import { Surface } from '@oxy.so/bloom/surface';
import { AspectRatio as BloomAspectRatio } from '@oxy.so/bloom/aspect-ratio';
import { ConcentricView } from '@oxy.so/bloom/concentric';
import { Divider as BloomDivider } from '@oxy.so/bloom/divider';
import { Fill as BloomFill } from '@oxy.so/bloom/fill';
import { ResponsiveGrid } from '@oxy.so/bloom/grid';
import { openExternal } from '@oxy.so/bloom/hooks';
import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Large,
  Lead,
  Muted,
  P,
  Small,
  Subtitle,
  Text as BloomText,
  Title,
} from '@oxy.so/bloom/typography';

import {
  isNode,
  Navigation,
  type Node,
  type ActionProps,
  type AvatarGroupProps,
  type AvatarProps,
  type BadgeProps as BadgeNodeProps,
  type FrameSpec,
  type SkeletonProps,
  type Child,
  type EmbedProps,
  type IconProps,
  type ImageProps,
  type MenuProps,
  type Modifier,
  type Press,
  type PressHandler,
  type StackProps,
  type TextProps,
  type TextRun,
  type ViewNodeProps,
} from './node';
import { ENVIRONMENT, TONE_ROLE } from './generated/spec.generated';
import { regular } from './glass';
import { getPlatformGlass } from './platform/glass-host';
import { MenuHost } from './platform/menu-host';
import { HeaderHost } from './platform/header-host';
import { BottomBarHost } from './platform/bottom-bar-host';
import {
  addToLayers,
  cachedStyle,
  flexStyle,
  foregroundOf,
  isLayerModifier,
  layerStyle,
  role,
  stackStyle,
  textStyle,
  textVariant,
  type Layer,
  type Resolved,
  type StyleOut,
  type Target,
} from './style';
import { Painted, type Paint } from './paint';
import {
  DURATION,
  HIT_SLOP,
  isFontFamily,
  resolveAvatarSize,
  resolveCorner,
  resolveFont,
  resolveLength,
  resolveSpace,
  type AvatarSizeToken,
  type LengthToken,
  type CornerName,
  type SpaceToken,
  resolveIconSize,
  tokenKey,
  type ColorName,
  type ColorToken,
  type IconSizeToken,
  type Role,
  type ShrinkPriority,
  type TextStyleName,
} from './tokens';
import { deriveEnv, EnvContext, type Env } from './env';
import type { TextTraits } from './style';
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
  /** A press that goes somewhere (`navigate()`), resolved against the environment's navigator. */
  navigation: Navigation | undefined;
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
  /** A Button or FAB on glass: the glass draws its fill, tinted `controlTint` when the glass has no tint. */
  control: { tint: ColorName | undefined } | undefined;
}

/** A FAB is on glass: the platform's, unless its chain names another. */
const FAB_GLASS: Modifier = { kind: 'glass', key: regular.key, value: regular };

function plan(node: Node): Plan {
  const result: Plan = {
    layers: [],
    grow: false,
    shrink: undefined,
    env: [],
    pressable: false,
    onPress: undefined,
    navigation: undefined,
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
    control: undefined,
  };
  const onGlass = node.modifiers.some((modifier) => modifier.kind === 'glass');
  const modifiers =
    node.kind === 'fab' && !onGlass ? [FAB_GLASS, ...node.modifiers] : node.modifiers;
  for (const modifier of modifiers) {
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
        if (modifier.value instanceof Navigation) result.navigation = modifier.value;
        else {
          result.navigation = undefined;
          result.onPress = modifier.value;
        }
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
  // A wash that answers the pointer needs the hover group it lights up in.
  if (result.own.has('hoverHighlight') && ownValue(result, 'hoverHighlight')?.value === undefined)
    result.hoverGroup = true;
  if ((node.kind === 'button' || node.kind === 'fab') && result.layers.some((l) => l.glass)) {
    result.control = { tint: controlTint(node.kind, result) };
  }
  return result;
}

/** A press modifier's value as a handler in an environment, for a host that wires presses itself. */
function pressOf(value: Press | undefined, env: Env): (() => void) | undefined {
  if (value === undefined) return undefined;
  if (value instanceof Navigation) return navigationPress(env, value);
  // A system bar item has no gesture of its own to hand the handler.
  return () => value(undefined as unknown as GestureResponderEvent);
}

/** A `navigate()` press: through the navigator the view is drawn under. */
function navigationPress(env: Env, to: Navigation): () => void {
  return () => {
    if (env.navigate) env.navigate(to.href, to.params);
    else if (process.env.NODE_ENV !== 'production') {
      console.warn(
        `[Bloom language] navigate('${to.href}') was pressed outside a router layout() or screen(): it goes nowhere.`,
      );
    }
  };
}

/** The colour role a solid control fills with: what an untinted glass under it is tinted with. */
function controlTint(kind: 'button' | 'fab', p: Plan): ColorName | undefined {
  const appearance = (p.own.get('style') as { value?: string } | undefined)?.value ?? 'solid';
  if (appearance !== 'solid') return undefined;
  const tone = (p.own.get('tint') as { value?: string } | undefined)?.value;
  const role =
    TONE_ROLE[(tone ?? (kind === 'fab' ? 'action' : 'accent')) as keyof typeof TONE_ROLE];
  return role ?? undefined;
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
    // A view whose press handler is absent stays the same host, out of the tab order
    // (a pressable is focusable by default).
    if (p.onPress === undefined && p.onLongPress === undefined) props.focusable = false;
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
  /** Inside a text: a `Text` here is an inline span of it. */
  inText?: boolean;
  /** A child of an `HStack`: a `Divider` here runs top to bottom. */
  inRow?: boolean;
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
    last.key === key &&
    last.inText === ctx.inText &&
    last.inRow === ctx.inRow
  ) {
    return last.element;
  }
  const element = drawNode(node, ctx, key);
  node.rendered = {
    env: ctx.env,
    provided: ctx.provided,
    key,
    inText: ctx.inText,
    inRow: ctx.inRow,
    element,
  };
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
  if (p.navigation !== undefined) p.onPress = navigationPress(env, p.navigation);
  // What the node's children render in: its environment, and no row (a stack sets its own).
  const inner: Context =
    env === ctx.env && !ctx.inRow ? ctx : { env, provided: ctx.provided, inText: ctx.inText };
  const reactKey = p.id ?? key;
  if (node.kind === 'skeleton') return drawSkeleton(node, p, inner, reactKey);
  const layers = p.layers;
  // A glass layer is a Surface and a blur layer an island, which the host cannot
  // be; so the host takes the innermost layer only when that layer is plain.
  const hostTakesLayer =
    layers.length > 0 &&
    (layers[0] as Layer).glass === undefined &&
    !(layers[0] as Layer).blur &&
    !(layers[0] as Layer).concentric;
  const hostLayer = hostTakesLayer ? (layers[0] as Layer) : undefined;
  const wrappers = hostTakesLayer ? layers.slice(1) : layers;
  const outermostIsHost = wrappers.length === 0;
  const flex = flexKey(p);
  const behaviour = behaviourProps(p);
  // A control on glass keeps its own press, focus and name: the glass only draws its fill.
  const hostBehaves = outermostIsHost || p.control !== undefined;

  let element = renderHost(
    node,
    p,
    inner,
    hostLayer,
    outermostIsHost ? flex : '',
    hostBehaves ? behaviour : undefined,
    outermostIsHost ? reactKey : undefined,
    ctx.inRow === true,
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
      outermost && !hostBehaves ? behaviour : undefined,
      outermost ? reactKey : undefined,
    );
  }
  const badge = ownValue(p, 'badge')?.value;
  if (isNode(badge) && badge.kind === 'badge') {
    // An attached badge is Bloom's Badge around the view, at its placement.
    return draw(BloomBadge, { ...badgeProps(badge, plan(badge)), key: reactKey }, element);
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
    // The glass's corner is its radius (it clips itself), not a style of its host.
    const { borderRadius: corner, overflow: _clip, ...resolved } = boxStyle(layer, flex, p);
    const radius = typeof corner === 'number' ? corner : undefined;
    const surfaceRadius = layer.concentric ? 'concentric' : radius;
    const outer = behaviour && !p.pressable ? behaviour : null;
    const ownKey = behaviour && p.pressable ? undefined : key;
    const PlatformGlass = getPlatformGlass();
    if (PlatformGlass !== null) {
      // The platform draws the glass (the lens, Liquid Glass, the system blur).
      const out = cachedStyle('host', `${styleKey}|${p.control ? 'c' : ''}`, () =>
        p.control ? Object.assign({ alignSelf: 'flex-start' }, resolved) : resolved,
      );
      const props: Record<string, unknown> = {
        ...outer,
        glass,
        radius,
        fallbackTint: p.control?.tint,
        interactive: p.pressable || p.control !== undefined,
        key: ownKey,
      };
      const drawn = drawHost(PlatformGlass, out, props, child);
      return behaviour && p.pressable ? draw(hostFor(p), { ...behaviour, key }, drawn) : drawn;
    }
    const out = cachedStyle('component', styleKey, () => resolved);
    const props: Record<string, unknown> = {
      radius: surfaceRadius,
      ...(layer.curve ? { cornerCurve: layer.curve } : null),
      ...(glass.sheen ? null : { sheen: false }),
      ...outer,
      key: ownKey,
    };
    const fill = glass.fillRole ?? p.control?.tint;
    const surface =
      fill === undefined
        ? drawHost(Surface, out, props, child)
        : draw(
            Painted,
            {
              ...props,
              host: Surface,
              paint: propPaint(
                styleKey,
                out,
                'fill',
                fill,
                glass.fillRole === undefined ? undefined : glass.fillOpacity,
              ),
            },
            child,
          );
    return behaviour && p.pressable ? draw(hostFor(p), { ...behaviour, key }, surface) : surface;
  }
  if (layer.blur) {
    // Bloom's floating island: its material, its shadow and its clip; a capsule
    // unless the layer's corner names the radius.
    const { borderRadius: corner, overflow: _clip, ...resolved } = boxStyle(layer, flex, p);
    const out = cachedStyle('material', styleKey, () => resolved);
    const outer = behaviour && !p.pressable ? behaviour : null;
    const island = drawHost(
      BlurIsland,
      out,
      {
        ...(typeof corner === 'number' ? { radius: corner } : null),
        ...(layer.curve ? { cornerCurve: layer.curve } : null),
        ...outer,
        key: behaviour && p.pressable ? undefined : key,
      },
      child,
    );
    return behaviour && p.pressable ? draw(hostFor(p), { ...behaviour, key }, island) : island;
  }
  if (layer.concentric) {
    // Bloom's concentric geometry: the radius of the shape it sits in, less the inset.
    const out = cachedStyle('component', styleKey, () => boxStyle(layer, flex, p));
    const outer = behaviour && !p.pressable ? behaviour : null;
    const view = drawHost(
      ConcentricView,
      out,
      { ...outer, radius: 'concentric', key: behaviour && p.pressable ? undefined : key },
      child,
    );
    return behaviour && p.pressable ? draw(hostFor(p), { ...behaviour, key }, view) : view;
  }
  const out = cachedStyle('host', styleKey, () => boxStyle(layer, flex, p));
  return drawHost(behaviour ? hostFor(p) : View, out, { ...behaviour, key }, child);
}

const propPaints = new Map<string, Paint>();

/**
 * A component's style (painted on native) plus one prop painted from a role:
 * a glass Surface's `fill`, an image's `tintColor`. One per style, prop and role.
 */
function propPaint(
  styleKey: string,
  out: StyleOut,
  prop: string,
  role: ColorName,
  opacity?: number,
): Paint {
  const id = `${styleKey}|${prop}|${role}|${opacity ?? ''}`;
  let paint = propPaints.get(id);
  if (paint === undefined) {
    const base = out.paint ?? {
      style: out.style as object | undefined,
      styleRoles: [],
      propRoles: [],
    };
    const propRole: readonly [string, ColorName, number?] =
      opacity === undefined ? [prop, role] : [prop, role, opacity];
    paint = { style: base.style, styleRoles: base.styleRoles, propRoles: [propRole] };
    propPaints.set(id, paint);
  }
  return paint;
}

/** The outermost box's host: pressable when the view takes presses or hovers, a hover group's class host on the web. */
function hostFor(p: Plan): Host {
  if (p.pressable && p.own.has('pressScale')) return PressableScale;
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

const iconPaints = new Map<ColorToken, Paint>();

/** An icon's fill, painted from its foreground role (at its opacity, if it names one). */
function iconPaint(color: ColorToken): Paint {
  let paint = iconPaints.get(color);
  if (paint === undefined) {
    const { role: name, opacity } = role(color);
    const fill: readonly [string, ColorName, number?] =
      opacity === undefined ? ['fill', name] : ['fill', name, opacity];
    paint = { style: undefined, styleRoles: [], propRoles: [fill] };
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
  /** Placed in an `HStack` (the context the node is in, not the one its children are). */
  inRow: boolean,
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
      const row: Context = axis === 'horizontal' ? { ...ctx, inRow: true } : ctx;
      const children =
        axis === 'depth'
          ? renderDepthChildren(node.children, ctx)
          : renderChildren(node.children, row);
      const wash = ownValue(p, 'hoverHighlight');
      if (wash !== undefined) {
        // A coordinated highlight (`active` given) shows on every platform; the pointer's only on the web.
        children.unshift(
          draw(SubtleHover, wash.value === undefined ? {} : { active: wash.value, native: true }),
        );
      }
      const host = behaviour ? hostFor(p) : View;
      return drawHost(host, out, hostProps(behaviour, key), ...children);
    }
    case 'spacer': {
      const out = cachedStyle('host', `SP|${layerKey}|${flex}`, () =>
        Object.assign({ flex: 1 }, boxStyle(layer, flex, p)),
      );
      return drawHost(behaviour ? hostFor(p) : View, out, hostProps(behaviour, key));
    }
    case 'text':
      return drawText(node, p, ctx, layerKey, flex, () => boxStyle(layer, flex, p), behaviour, key);
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
      const size = ownValue(p, 'size')?.value as AvatarSizeToken | undefined;
      const presence = ownValue(p, 'presence')?.value;
      const props = hostProps(behaviour, key);
      delete props.focusable;
      // An avatar's name is its `alt`, as Bloom's Avatar takes it.
      if (props.accessibilityLabel !== undefined) {
        props.alt = props.accessibilityLabel;
        delete props.accessibilityLabel;
      }
      Object.assign(props, {
        source,
        variant: options.variant,
        account: options.account,
        name: options.name,
        initials: options.initials,
        fallbackSource: options.fallbackSource,
        character: options.character,
        size: size === undefined ? undefined : resolveAvatarSize(size),
        color: ownValue(p, 'tint')?.value,
        shape: ownValue(p, 'shape')?.value,
        verified: ownValue(p, 'verified')?.value,
        live: ownValue(p, 'live')?.value,
        hideLiveBadge: ownValue(p, 'liveBadge')?.value === false ? true : undefined,
        status: presence,
      });
      const host = presence === undefined ? BloomAvatar : AvatarPresence;
      if (!boxed) return draw(host, props);
      return drawHost(host, box('component', 'A'), props);
    }
    case 'avatarGroup': {
      const size = ownValue(p, 'size')?.value as AvatarSizeToken | undefined;
      const spacing = ownValue(p, 'spacing')?.value;
      const props = hostProps(behaviour, key);
      delete props.focusable;
      Object.assign(props, {
        items: (node.props as AvatarGroupProps).items,
        layout: ownValue(p, 'layout')?.value,
        size: size === undefined ? undefined : resolveAvatarSize(size),
        shape: ownValue(p, 'shape')?.value,
        max: ownValue(p, 'max')?.value,
        total: ownValue(p, 'total')?.value,
        spacing: spacing === undefined ? undefined : resolveSpace(spacing),
        overflow: ownValue(p, 'overflow')?.value,
        showInitials: ownValue(p, 'initials') === undefined ? undefined : true,
        onPressItem: ownValue(p, 'onPressItem')?.value,
        hoverCard: ownValue(p, 'hoverCard')?.value,
      });
      if (!boxed) return draw(BloomAvatarGroup, props);
      return drawHost(BloomAvatarGroup, box('component', 'AG'), props);
    }
    case 'badge': {
      const props = { ...hostProps(behaviour, key), ...badgeProps(node, p) };
      delete props.focusable;
      if (!boxed) return draw(BloomBadge, props);
      return drawHost(BloomBadge, box('component', 'BD'), props);
    }
    case 'iconCircle': {
      const props: Record<string, unknown> = {
        ...hostProps(behaviour, key),
        icon: (node.props as IconProps).icon,
      };
      delete props.focusable;
      props.size = ownValue(p, 'size')?.value;
      if (!boxed) return draw(BloomIconCircle, props);
      return drawHost(BloomIconCircle, box('component', 'IC'), props);
    }
    case 'loading': {
      const props = hostProps(behaviour, key);
      delete props.focusable;
      const { label } = buttonContent(node.children);
      Object.assign(props, {
        variant: ownValue(p, 'style')?.value,
        size: ownValue(p, 'size')?.value,
        tone: ownValue(p, 'tint')?.value,
        text: label,
      });
      if (!boxed) return draw(BloomLoading, props);
      return drawHost(BloomLoading, box('component', 'LD'), props);
    }
    case 'skeleton':
      // Drawn in drawNode: a skeleton takes its frame and corner as its size.
      return null as unknown as ReactElement;
    case 'skeletonGroup':
      return drawContainer(
        BloomSkeleton.Region,
        { label: p.label },
        node,
        p,
        ctx,
        box('component', 'SR'),
        behaviour === undefined ? undefined : withoutLabel(behaviour),
        key,
      );
    case 'image': {
      // BloomImage takes the box itself, so the frame sizes the image and the
      // corner clips it. It cannot take presses: a pressable image (or a hover
      // group) is drawn inside its pressable host, which takes the flex placement.
      const interactive = p.pressable || p.hoverGroup;
      const imageFlex = interactive ? '' : flex;
      const aspectRatio = ownValue(p, 'aspectRatio')?.value;
      const styleKey = `IM|${aspectRatio ?? ''}|${layerKey}|${imageFlex}`;
      const out = cachedStyle('component', styleKey, () => {
        const style = boxStyle(layer, imageFlex, p);
        if (aspectRatio !== undefined) style.aspectRatio = aspectRatio;
        return style;
      });
      const { source, alt } = node.props as ImageProps;
      const transition = ownValue(p, 'transition')?.value;
      const props: Record<string, unknown> = interactive ? {} : hostProps(behaviour, key);
      Object.assign(props, {
        source,
        alt,
        contentFit: ownValue(p, 'contentFit')?.value,
        transition: transition === undefined ? undefined : DURATION[transition],
        onLoad: ownValue(p, 'onLoad')?.value,
        onError: ownValue(p, 'onError')?.value,
      });
      const tint = ownValue(p, 'tint')?.value as ColorName | undefined;
      const image =
        tint === undefined
          ? drawHost(BloomImage, out, props)
          : draw(Painted, {
              ...props,
              host: BloomImage,
              paint: propPaint(styleKey, out, 'tintColor', tint),
            });
      if (!interactive) return image;
      const placement = cachedStyle('host', `IMP|${flex}`, () => boxStyle(undefined, flex, p));
      return drawHost(hostFor(p), placement, hostProps(behaviour, key), image);
    }
    case 'button': {
      const props = hostProps(behaviour, key);
      delete props.focusable;
      const { icon, glyph, label, trailing } = buttonContent(node.children);
      const shape = ownValue(p, 'shape')?.value;
      const iconOnly = icon !== undefined && label === undefined && shape !== undefined;
      // A glyph in an ink of its own (`Icon(X).foreground(role)`) is drawn as
      // it is; otherwise the button tints its icon with its tone.
      const inked = glyph?.modifiers.some((modifier) => modifier.kind === 'foreground');
      Object.assign(props, {
        appearance: ownValue(p, 'style')?.value,
        tone: ownValue(p, 'tint')?.value,
        size: ownValue(p, 'size')?.value,
        leadingIcon: inked ? undefined : icon,
        icon: inked && glyph ? renderNode(glyph, ctx, undefined) : undefined,
        trailingIcon: trailing,
        // A circle is Bloom's square icon button; a pill, its wide one.
        iconOnly: iconOnly ? true : undefined,
        wide: iconOnly && shape === 'pill' ? true : undefined,
        children: label,
        disabled: ownValue(p, 'disabled')?.value,
        loading: ownValue(p, 'loading')?.value,
        pressed: ownValue(p, 'pressed')?.value,
        href: ownValue(p, 'link')?.value,
        numberOfLines: ownValue(p, 'lines')?.value,
        underline: ownValue(p, 'underline') === undefined ? undefined : 'rest',
        material: p.control ? 'shared' : undefined,
      });
      if (!boxed) return draw(BloomButton, props);
      return drawHost(BloomButton, box('component', 'B'), props);
    }
    case 'fab': {
      const props = hostProps(behaviour, key);
      delete props.focusable;
      const { icon, label } = buttonContent(node.children);
      Object.assign(props, {
        appearance: ownValue(p, 'style')?.value,
        tone: ownValue(p, 'tint')?.value,
        size: ownValue(p, 'size')?.value,
        icon,
        label,
        disabled: ownValue(p, 'disabled')?.value,
        collapsed: ownValue(p, 'collapsed')?.value,
        material: p.control ? 'shared' : undefined,
      });
      if (!boxed) return draw(BloomFab, props);
      return drawHost(BloomFab, box('component', 'F'), props);
    }
    case 'menu': {
      const menu = draw(MenuHost, {
        key: boxed ? undefined : key,
        trigger: namedTrigger((node.props as MenuProps).trigger, p.label),
        rows: node.children,
        actions: ownValue(p, 'actions')?.value,
        label: p.label,
        testID: p.testID,
        render: (child: Child) => renderChild(child, ctx, undefined),
      });
      if (!boxed) return menu;
      return drawHost(View, box('host', 'M'), hostProps(undefined, key), menu);
    }
    case 'header':
      return draw(HeaderHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    case 'bottomBar':
      return draw(BottomBarHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    // Rows and tabs are read by the menu or the bar that holds them; on their own they draw nothing.
    case 'menuItem':
    case 'menuSubmenu':
    case 'menuSection':
    case 'menuContent':
    case 'menuActions':
    case 'tab':
      return null as unknown as ReactElement;
    // Navigators are drawn by the router's layout(); placed in a view, they draw nothing.
    case 'appLayout':
    case 'navStack':
    case 'route':
    case 'tabView':
      return null as unknown as ReactElement;
    case 'divider': {
      const tint = ownValue(p, 'tint')?.value as ColorName | undefined;
      const spacing = ownValue(p, 'spacing')?.value;
      const [label] = node.children;
      const props = hostProps(behaviour, key);
      Object.assign(props, {
        variant: ownValue(p, 'lineStyle')?.value,
        align: ownValue(p, 'align')?.value,
        vertical: inRow || undefined,
        spacing: spacing === undefined ? undefined : resolveSpace(spacing),
      });
      const content = dividerLabel(label, ctx);
      const out = box('component', 'DV');
      if (tint === undefined) return drawHost(BloomDivider, out, props, content);
      return draw(
        Painted,
        {
          ...props,
          host: BloomDivider,
          paint: propPaint(`DV|${layerKey}|${flex}`, out, 'color', tint),
        },
        content,
      );
    }
    case 'fill':
      return drawContainer(BloomFill, {}, node, p, ctx, box('component', 'FL'), behaviour, key);
    case 'ratio':
      return drawContainer(
        BloomAspectRatio,
        { ratio: (node.props as { ratio: number }).ratio },
        node,
        p,
        ctx,
        box('component', 'AR'),
        behaviour,
        key,
      );
    case 'grid': {
      const gap = ownValue(p, 'spacing')?.value;
      const minWidth = ownValue(p, 'minCellWidth')?.value;
      return drawContainer(
        ResponsiveGrid,
        {
          maxColumns: ownValue(p, 'columns')?.value,
          minItemWidth: minWidth === undefined ? undefined : resolveSpace(minWidth),
          gap: gap === undefined ? undefined : resolveSpace(gap),
          flow: ownValue(p, 'flow')?.value,
        },
        node,
        p,
        ctx,
        box('component', 'G'),
        behaviour,
        key,
      );
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

/**
 * A menu's name is its trigger's: what assistive technology says for the
 * button that opens it. A trigger with a name of its own keeps it.
 */
function namedTrigger(trigger: Child, label: string | undefined): Child {
  if (label === undefined || !isNode(trigger)) return trigger;
  return trigger.modifiers.some((modifier) => modifier.kind === 'label')
    ? trigger
    : trigger.label(label);
}

// ── Containers ───────────────────────────────────────────────────

/**
 * A Bloom container (Fill, AspectRatio, ResponsiveGrid): its own
 * props, the innermost layer as its style, its `testID`, and the children.
 * Presses and the rest of the view's behaviour go on a host around it, since
 * these components take none.
 */
function drawContainer(
  component: Host,
  own: Record<string, unknown>,
  node: Node,
  p: Plan,
  ctx: Context,
  out: StyleOut,
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
): ReactElement {
  const { testID, ...rest } = behaviour ?? {};
  const outer = Object.keys(rest).length > 0;
  const props: Record<string, unknown> = { ...own, testID, key: outer ? undefined : key };
  const element = drawHost(component, out, props, ...renderChildren(node.children, ctx));
  return outer ? draw(hostFor(p), { ...rest, key }, element) : element;
}

/** A Badge node's props for Bloom's Badge, standalone or attached. */
function badgeProps(node: Node, p: Plan): Record<string, unknown> {
  return {
    content: (node.props as BadgeNodeProps).content,
    variant: ownValue(p, 'style')?.value,
    tone: ownValue(p, 'tint')?.value,
    size: ownValue(p, 'size')?.value,
    icon: ownValue(p, 'icon')?.value,
    dot: ownValue(p, 'dot') === undefined ? undefined : true,
    max: ownValue(p, 'max')?.value,
    placement: ownValue(p, 'placement')?.value,
    testID: p.testID,
  };
}

const SKELETON_SHAPES = {
  text: BloomSkeleton.Text,
  circle: BloomSkeleton.Circle,
  pill: BloomSkeleton.Pill,
  box: BloomSkeleton.Box,
} as const;

/**
 * A skeleton shape: its frame is its size (a circle's and a pill's height, a
 * box's width and height), a box's corner its radius, a text line's height
 * the one its font sets. It draws nothing else of a chain.
 */
function drawSkeleton(
  node: Node,
  p: Plan,
  ctx: Context,
  key: string | number | undefined,
): ReactElement {
  const { shape } = node.props as SkeletonProps;
  let frame: FrameSpec = {};
  let corner: CornerName | undefined;
  for (const modifier of node.modifiers) {
    if (modifier.kind === 'frame') frame = { ...frame, ...modifier.value };
    if (modifier.kind === 'corner') corner = modifier.value;
  }
  const length = (token: LengthToken | undefined) =>
    token === undefined ? undefined : resolveLength(token);
  const props: Record<string, unknown> = { key };
  if (shape === 'text') {
    const { lineHeight } = resolveFont(
      ctx.env.text.font,
      ctx.env.text.weight,
      ctx.env.text.leading,
    );
    const width = length(frame.width);
    if (lineHeight !== undefined || width !== undefined) props.style = { lineHeight, width };
  } else if (shape === 'box') {
    props.width = length(frame.width);
    props.height = length(frame.height);
    if (corner !== undefined && corner !== 'concentric') props.borderRadius = resolveCorner(corner);
  } else {
    props.size = length(frame.height ?? frame.width);
  }
  if (p.testID !== undefined) props.testID = p.testID;
  return draw(SKELETON_SHAPES[shape], props);
}

function withoutLabel(behaviour: Record<string, unknown>): Record<string, unknown> {
  const { accessibilityLabel: _label, ...rest } = behaviour;
  return rest;
}

/**
 * A divider's label: a `Text` with nothing of its own is Bloom's divider
 * label (its type and ink), any other view is drawn as it is.
 */
function dividerLabel(label: Child, ctx: Context): ReactNode {
  if (!isNode(label)) return undefined;
  if (label.kind === 'text' && label.modifiers.length === 0) {
    const runs = (label.props as TextProps).runs;
    if (runs.every((run) => typeof run === 'string' || typeof run === 'number'))
      return runs.join('');
  }
  return renderNode(label, ctx, undefined);
}

// ── Text ─────────────────────────────────────────────────────────

/** Bloom's typography components, by the text style that draws each; `Text` without one. */
const TEXT_HOSTS: Record<TextStyleName, Host> = {
  title: Title,
  subtitle: Subtitle,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  paragraph: P,
  lead: Lead,
  large: Large,
  small: Small,
  muted: Muted,
  blockquote: Blockquote,
};

const linkPresses = new Map<string, PressHandler>();

/**
 * A link's press, as Bloom's inline link takes it: it stays in its text (not
 * the row around it), the web's anchor follows itself, and native opens the
 * page outside the app. One handler per address, so a text keeps its props.
 */
function linkPress(href: string): PressHandler {
  let press = linkPresses.get(href);
  if (press === undefined) {
    press = (event) => {
      event.stopPropagation();
      if (!IS_WEB) openExternal(href);
    };
    linkPresses.set(href, press);
  }
  return press;
}

/** The env traits a span's own chain sets: all a span writes (see `textStyle`). */
function spanTraits(p: Plan): ReadonlySet<keyof TextTraits> {
  return new Set(
    p.env.map((modifier) =>
      modifier.kind === 'font' && isFontFamily(modifier.value)
        ? 'family'
        : (modifier.kind as keyof TextTraits),
    ),
  );
}

/**
 * A text. The outermost is Bloom's `Text` (or the typography component its
 * `textStyle` names), its ramp font as Bloom's `variant`; a nested one is a
 * React Native span inside it, so it inherits the type it does not set.
 */
function drawText(
  node: Node,
  p: Plan,
  ctx: Context,
  layerKey: string,
  flex: string,
  box: () => Resolved,
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
): ReactElement {
  const traits = ctx.env.text;
  const span = ctx.inText ? spanTraits(p) : undefined;
  const link = ownValue(p, 'link')?.value;
  const look = {
    noWrap: ownValue(p, 'noWrap') !== undefined,
    align: ownValue(p, 'textAlign')?.value,
    italic: ownValue(p, 'italic') !== undefined,
    underline: ownValue(p, 'underline') !== undefined,
    strikethrough: ownValue(p, 'strikethrough') !== undefined,
    textCase: ownValue(p, 'textCase')?.value,
    link: link !== undefined,
  };
  const textStyleName = span === undefined ? ownValue(p, 'textStyle')?.value : undefined;
  const lookKey = `${look.noWrap ? 'nw' : ''}|${look.align ?? ''}|${look.italic ? 'i' : ''}|${look.underline ? 'u' : ''}|${look.strikethrough ? 's' : ''}|${look.textCase ?? ''}|${look.link ? 'a' : ''}`;
  const spanKey = span === undefined ? '' : [...span].sort().join(',');
  const blockquote = textStyleName === 'blockquote';
  const props = hostProps(behaviour, key);
  delete props.focusable;
  const lines = ownValue(p, 'lines')?.value;
  const truncation = ownValue(p, 'truncation')?.value;
  if (lines !== undefined) props.numberOfLines = lines;
  if (lines !== undefined || truncation !== undefined) props.ellipsizeMode = truncation ?? 'tail';
  const selectable = ownValue(p, 'selectable')?.value;
  if (selectable !== undefined) props.selectable = selectable;
  if (link !== undefined) {
    props.role = 'link';
    props.onPress = p.onPress ?? linkPress(link);
    if (IS_WEB) {
      props.href = link;
      if (/^https?:/i.test(link)) props.hrefAttrs = LINK_TARGET;
    }
  }
  const variant = span === undefined && !blockquote ? textVariant(traits) : undefined;
  if (variant !== undefined) props.variant = variant;
  let runs = renderRuns((node.props as TextProps).runs, ctx);
  if (blockquote) {
    // Bloom's quotation is a box around its own text: the box takes the
    // layers, and what the chain sets for the text is a span inside it.
    const own = textStyle(traits, look, spanTraits(p));
    if (Object.keys(own).length > 0) {
      const inner = cachedStyle('host', `TQ|${ctx.env.key}|${spanKey}|${lookKey}`, () => own);
      runs = [drawHost(RNText, inner, {}, ...runs)];
    }
    return drawHost(
      Blockquote,
      cachedStyle('component', `Q|${layerKey}|${flex}`, box),
      props,
      ...runs,
    );
  }
  const host = span !== undefined ? RNText : textStyleName ? TEXT_HOSTS[textStyleName] : BloomText;
  const out = cachedStyle(
    'host',
    `T|${ctx.env.key}|${span === undefined ? '' : `s:${spanKey}`}|${lookKey}|${layerKey}|${flex}`,
    () => Object.assign(textStyle(traits, look, span), box()),
  );
  return drawHost(host, out, props, ...runs);
}

/** A web link to another site opens beside the app, as Bloom's inline link does. */
const LINK_TARGET = Object.freeze({ target: '_blank', rel: 'noopener noreferrer' });

/**
 * A button's content: its first `Icon` before any `Text` is the leading glyph,
 * an `Icon` after a `Text` the trailing one, and the `Text` runs its label.
 */
function buttonContent(children: readonly Child[]): {
  icon: IconProps['icon'] | undefined;
  glyph: Node | undefined;
  label: string | undefined;
  trailing: IconProps['icon'] | undefined;
} {
  let icon: IconProps['icon'] | undefined;
  let glyph: Node | undefined;
  let label: string | undefined;
  let trailing: IconProps['icon'] | undefined;
  for (const child of flatten(children)) {
    if (child.kind === 'icon') {
      if (label !== undefined) trailing ??= (child.props as IconProps).icon;
      else if (icon === undefined) {
        icon = (child.props as IconProps).icon;
        glyph = child;
      }
    }
    if (child.kind === 'text') {
      const text = (child.props as TextProps).runs
        .filter((run) => typeof run === 'string' || typeof run === 'number')
        .join('');
      label = label === undefined ? text : `${label} ${text}`;
    }
  }
  return { icon, glyph, label, trailing };
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
  const inner: Context = ctx.inText ? ctx : { ...ctx, inText: true };
  for (const run of runs) {
    if (typeof run === 'string' || typeof run === 'number') out.push(String(run));
    else out.push(isNode(run) ? renderNode(run, inner, undefined) : null);
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
