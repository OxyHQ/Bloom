import {
  createElement,
  Fragment,
  type ComponentType,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Platform, Pressable, Text as RNText, View, type ViewStyle } from 'react-native';
import { styled } from 'react-native-css';
import { Avatar as BloomAvatar } from '@oxy.so/bloom/avatar';
import { Button as BloomButton } from '@oxy.so/bloom/button';
import { EngagementAction, EngagementBar, EngagementGroup } from '@oxy.so/bloom/engagement-bar';
import { Image as ShapeImage } from '@oxy.so/bloom/shapes';
import { Surface } from '@oxy.so/bloom/surface';
import { useThemePaint, type ThemeColors } from '@oxy.so/bloom/theme';

import {
  isNode,
  type Node,
  type ActionProps,
  type AvatarProps,
  type Child,
  type EmbedProps,
  type GlassSpec,
  type IconProps,
  type ImageProps,
  type Modifier,
  type PressHandler,
  type Role,
  type ShrinkPriority,
  type StackProps,
  type TextProps,
  type TextRun,
  type ViewNodeProps,
} from './node';
import {
  addToLayers,
  cached,
  flexStyle,
  isLayerModifier,
  layerStyle,
  stackStyle,
  styleCacheFor,
  textStyle,
  type Layer,
  type StyleCache,
} from './style';
import {
  HIT_SLOP_SCALE,
  resolveAvatarSize,
  resolveColor,
  resolveIconSize,
  tokenKey,
  type AvatarSizeName,
  type IconSizeToken,
} from './tokens';
import { deriveEnv, ROOT_ENV, type Env } from './env';

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
    switch (modifier.kind) {
      case 'grow':
        result.grow = true;
        break;
      case 'shrink':
        result.shrink = modifier.value;
        break;
      case 'foreground':
      case 'font':
      case 'weight':
      case 'leading':
        result.env.push(modifier);
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
        result.hitSlop = HIT_SLOP_SCALE[modifier.value];
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

function mergedStyle(cache: StyleCache, key: string, parts: () => ViewStyle[]): ViewStyle {
  return cached(cache, key, () => Object.assign({}, ...parts()));
}

/** The style key of a node's flex placement, '' when it has none. */
function flexKey(p: Plan): string {
  return p.grow || p.shrink ? `grow:${p.grow ? 1 : 0}:${p.shrink ?? ''}` : '';
}

interface Context {
  cache: StyleCache;
  env: Env;
}

// ── Hosts ────────────────────────────────────────────────────────

/**
 * Draws one node: its host element with the innermost layer merged into the
 * host's own style, then each further layer as a view around it. The press,
 * hover and accessibility props go on the outermost box; `grow`/`shrink` too.
 */
function renderNode(node: Node, ctx: Context, key: string | number | undefined): ReactNode {
  const p = plan(node);
  const env = p.env.length > 0 ? deriveEnv(ctx.env, p.env) : ctx.env;
  const inner: Context = env === ctx.env ? ctx : { cache: ctx.cache, env };
  const reactKey = p.id ?? key;
  const layers = p.layers;
  // A glass layer is a Surface, which the host cannot be; so the host takes
  // the innermost layer only when that layer is plain.
  const hostTakesLayer = layers.length > 0 && !(layers[0] as Layer).glass;
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
    const styleKey = `L|${layer.key}|${outermost ? flex : ''}`;
    const style = mergedStyle(ctx.cache, styleKey, () => [
      layerStyle(ctx.cache.colors, layer),
      outermost ? flexStyle(p.grow, p.shrink) : {},
    ]);
    element = wrapLayer(
      layer,
      style,
      ctx.cache.colors,
      element,
      outermost ? behaviour : undefined,
      p,
      outermost ? reactKey : undefined,
    );
  }
  return element;
}

function wrapLayer(
  layer: Layer,
  style: ViewStyle,
  colors: ThemeColors,
  child: ReactNode,
  behaviour: Record<string, unknown> | undefined,
  p: Plan,
  key: string | number | undefined,
): ReactElement {
  if (layer.glass) {
    const glass = layer.modifiers.find((m) => m.kind === 'glass') as { value: GlassSpec };
    const corner = style.borderRadius;
    const surface = draw(
      Surface,
      {
        style,
        fill: glass.value.tint ? resolveColor(colors, glass.value.tint) : undefined,
        radius: typeof corner === 'number' ? corner : undefined,
        ...(behaviour && !p.pressable ? behaviour : {}),
        key: behaviour && p.pressable ? undefined : key,
      },
      child,
    );
    return behaviour && p.pressable ? draw(hostFor(p), { ...behaviour, key }, surface) : surface;
  }
  return draw(behaviour ? hostFor(p) : View, { ...behaviour, style, key }, child);
}

/** The outermost box's host: pressable when the view takes presses or hovers, a hover group's class host on the web. */
function hostFor(p: Plan): ComponentType<Record<string, unknown>> {
  if (p.pressable) return IS_WEB && p.hoverGroup ? HoverGroupPressable : (Pressable as never);
  return IS_WEB && p.hoverGroup ? HoverGroupView : (View as never);
}

function hostProps(
  behaviour: Record<string, unknown> | undefined,
  style: object | undefined,
  key: string | number | undefined,
): Record<string, unknown> {
  const props: Record<string, unknown> = behaviour ? { ...behaviour } : {};
  if (style !== undefined) props.style = style;
  if (key !== undefined) props.key = key;
  return props;
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
  const { cache } = ctx;
  const layerKey = layer?.key ?? '';
  const layerAndFlex = (): ViewStyle[] => [
    layer ? layerStyle(cache.colors, layer) : {},
    flex ? flexStyle(p.grow, p.shrink) : {},
  ];

  switch (node.kind) {
    case 'stack': {
      const { axis } = node.props as StackProps;
      const spacing = ownValue(p, 'spacing')?.value;
      const align = ownValue(p, 'align')?.value;
      const styleKey = `S|${axis}|${spacing === undefined ? '' : tokenKey(spacing)}|${align ?? ''}|${layerKey}|${flex}`;
      const style = mergedStyle(cache, styleKey, () => [
        stackStyle(axis, spacing, align),
        ...layerAndFlex(),
      ]);
      const children =
        axis === 'depth'
          ? renderDepthChildren(node.children, ctx)
          : renderChildren(node.children, ctx);
      const host = behaviour ? hostFor(p) : View;
      return draw(host, hostProps(behaviour, style, key), ...children);
    }
    case 'spacer': {
      const style = mergedStyle(cache, `SP|${layerKey}|${flex}`, () => [
        { flex: 1 },
        ...layerAndFlex(),
      ]);
      return draw(behaviour ? hostFor(p) : View, hostProps(behaviour, style, key));
    }
    case 'text': {
      const style = cached(
        cache,
        `T|${ctx.env.key}|${ownValue(p, 'noWrap') ? 'nw' : ''}|${layerKey}|${flex}`,
        () =>
          Object.assign(
            textStyle(cache.colors, ctx.env.text, ownValue(p, 'noWrap') !== undefined, IS_WEB),
            ...layerAndFlex(),
          ),
      );
      const lines = ownValue(p, 'lines')?.value;
      const props = hostProps(behaviour, style, key);
      if (lines !== undefined) {
        props.numberOfLines = lines;
        props.ellipsizeMode = 'tail';
      }
      if (behaviour?.focusable !== undefined) delete props.focusable;
      return draw(RNText, props, ...renderRuns((node.props as TextProps).runs, ctx));
    }
    case 'icon': {
      const size = resolveIconSize(
        (ownValue(p, 'size')?.value as IconSizeToken | undefined) ?? 'md',
      );
      const bare = !layer && !flex && !behaviour;
      const glyph = draw((node.props as IconProps).icon, {
        width: size,
        height: size,
        fill: resolveColor(cache.colors, ctx.env.text.foreground ?? 'foreground'),
        key: bare ? key : undefined,
      });
      if (bare) return glyph;
      const style = mergedStyle(cache, `I|${layerKey}|${flex}`, layerAndFlex);
      const host = behaviour ? hostFor(p) : View;
      return draw(host, hostProps(behaviour, style, key), glyph);
    }
    case 'avatar': {
      const { source, options } = node.props as AvatarProps;
      const size = ownValue(p, 'size')?.value as AvatarSizeName | undefined;
      const style =
        layer || flex ? mergedStyle(cache, `A|${layerKey}|${flex}`, layerAndFlex) : undefined;
      const props = hostProps(behaviour, style, key);
      delete props.focusable;
      return draw(BloomAvatar, {
        ...props,
        source,
        variant: options.variant,
        account: options.account,
        size: size === undefined ? undefined : resolveAvatarSize(size),
      });
    }
    case 'image': {
      const { source, alt } = node.props as ImageProps;
      const size = resolveAvatarSize(
        (ownValue(p, 'size')?.value as AvatarSizeName | undefined) ?? 'md',
      );
      const bare = !layer && !flex && !behaviour;
      const image = draw(ShapeImage, { source, alt, size, key: bare ? key : undefined });
      if (bare) return image;
      const style = mergedStyle(cache, `IM|${layerKey}|${flex}`, layerAndFlex);
      const host = behaviour ? hostFor(p) : View;
      return draw(host, hostProps(behaviour, style, key), image);
    }
    case 'button': {
      const style =
        layer || flex ? mergedStyle(cache, `B|${layerKey}|${flex}`, layerAndFlex) : undefined;
      const props = hostProps(behaviour, style, key);
      delete props.focusable;
      const { icon, label } = buttonContent(node.children);
      const shape = ownValue(p, 'shape')?.value;
      return draw(BloomButton, {
        ...props,
        appearance: ownValue(p, 'style')?.value,
        tone: ownValue(p, 'tint')?.value,
        size: ownValue(p, 'size')?.value,
        leadingIcon: icon,
        iconOnly:
          icon !== undefined && label === undefined && shape !== undefined ? true : undefined,
        children: label,
      });
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
      const style =
        layer || flex ? mergedStyle(cache, `AB|${layerKey}|${flex}`, layerAndFlex) : undefined;
      return draw(
        EngagementBar,
        {
          key,
          style,
          testID: p.testID,
          size: ownValue(p, 'size')?.value,
          formatCount: ownValue(p, 'countFormat')?.value,
          trailing: trailing ? renderChildren(trailing, ctx) : undefined,
        },
        ...renderChildren(node.children, ctx),
      );
    }
    case 'actionGroup': {
      const style =
        layer || flex ? mergedStyle(cache, `AG|${layerKey}|${flex}`, layerAndFlex) : undefined;
      return draw(
        EngagementGroup,
        { key, style, testID: p.testID },
        ...renderChildren(node.children, ctx),
      );
    }
    case 'embed': {
      const { content } = node.props as EmbedProps;
      const element =
        typeof content === 'function'
          ? content((child) => renderChild(child, ctx, undefined))
          : content;
      if (!layer && !flex && !behaviour) {
        return key === undefined ? (element as ReactElement) : draw(Fragment, { key }, element);
      }
      const style = mergedStyle(cache, `E|${layerKey}|${flex}`, layerAndFlex);
      const host = behaviour ? hostFor(p) : View;
      return draw(host, hostProps(behaviour, style, key), element);
    }
    case 'view': {
      const { component, args } = node.props as ViewNodeProps;
      if (!layer && !flex && !behaviour) return draw(component, { args, env: ctx.env, key });
      const body = draw(component, { args, env: ctx.env });
      const style = mergedStyle(cache, `V|${layerKey}|${flex}`, layerAndFlex);
      const host = behaviour ? hostFor(p) : View;
      return draw(host, hostProps(behaviour, style, key), body);
    }
  }
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

const DEPTH_LAYER: ViewStyle = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 };

/** A ZStack: the first child sets the size; each later one covers it, in order. */
function renderDepthChildren(children: readonly Child[], ctx: Context): ReactNode[] {
  return renderChildren(children, ctx).map((child, index) =>
    index === 0 || child === null
      ? child
      : draw(View, { style: DEPTH_LAYER, pointerEvents: 'box-none' }, child),
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

/** The boundary from JSX into the language: it reads the theme once for the tree under it. */
function LanguageRoot({ node }: RootProps): ReactNode {
  const colors = useThemePaint();
  return renderChild(node, { cache: styleCacheFor(colors), env: ROOT_ENV }, undefined);
}
LanguageRoot.displayName = 'BloomLanguage';

/**
 * A language tree as a React element, for JSX. A bare `view()` node mounts its
 * component directly (it reads the theme itself); anything else goes under one
 * boundary component.
 */
export function toElement(node: Child, key?: string | number): ReactElement {
  if (isNode(node) && node.kind === 'view' && node.modifiers.length === 0) {
    const { component, args } = node.props as ViewNodeProps;
    return draw(component, { args, env: ROOT_ENV, key });
  }
  return draw(LanguageRoot, { node, key });
}

/** What a `view()` component renders: its body, in the theme it read, under the environment it was given. */
export function renderBody(body: Child, colors: ThemeColors, env: Env): ReactNode {
  return renderChild(body, { cache: styleCacheFor(colors), env }, undefined);
}
