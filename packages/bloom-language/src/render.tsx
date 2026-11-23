import {
  cloneElement,
  createContext,
  createElement,
  Fragment,
  useContext,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Platform,
  Pressable,
  Text as RNText,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Avatar as BloomAvatar } from '@oxy.so/bloom/avatar';
import { AvatarGroup as BloomAvatarGroup } from '@oxy.so/bloom/avatar-group';
import { Badge as BloomBadge } from '@oxy.so/bloom/badge';
import { AvatarPresence } from '@oxy.so/bloom/chat-indicators';
import { IconCircle as BloomIconCircle } from '@oxy.so/bloom/icon-circle';
import { Loading as BloomLoading } from '@oxy.so/bloom/loading';
import * as BloomSkeleton from '@oxy.so/bloom/skeleton';
import { hoverGroupProps, SubtleHover } from '@oxy.so/bloom/subtle-hover';
import { Button as BloomButton } from '@oxy.so/bloom/button';
import { EngagementAction, EngagementBar, EngagementGroup } from '@oxy.so/bloom/engagement-bar';
import { BloomImage } from '@oxy.so/bloom/image';
import { Fab as BloomFab } from '@oxy.so/bloom/fab';
import { BlurIsland } from '@oxy.so/bloom/blur';
import { useScreenVisible } from '@oxy.so/bloom/screen';
import { Sticker } from '@oxy.so/bloom/sticker';
import { Surface } from '@oxy.so/bloom/surface';
import { AspectRatio as BloomAspectRatio } from '@oxy.so/bloom/aspect-ratio';
import { ConcentricView } from '@oxy.so/bloom/concentric';
import { Divider as BloomDivider } from '@oxy.so/bloom/divider';
import { Fill as BloomFill } from '@oxy.so/bloom/fill';
import {
  Border as ShapeBorder,
  Fill as ShapeFill,
  Image as ShapeImage,
} from '@oxy.so/bloom/shapes';
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
  Node,
  type NodeKind,
  type ActionProps,
  type AvatarGroupProps,
  type AvatarProps,
  type BadgeProps as BadgeNodeProps,
  type FrameSpec,
  type SkeletonProps,
  type Child,
  type EmbedProps,
  type IconComponent,
  type IconProps,
  type ImageProps,
  type MenuProps,
  type LottieProps,
  type Modifier,
  type Press,
  type PressHandler,
  type ShapeProps,
  type StackProps,
  type TextProps,
  type TextRun,
  type ViewNode,
  type ViewNodeProps,
} from './node';
import {
  ENVIRONMENT,
  ENVIRONMENT_TAKERS,
  LAYER_RANK,
  OWN_ASPECT_RATIO,
  OPACITY,
  TONE_ROLE,
} from './generated/spec.generated';
import { regular, type GlassTransition, type GlassValue } from './glass';
import type { Namespace } from './motion/namespace';
import { opacity } from './motion/transition';
import { getPlatformGlass } from './platform/glass-host';
import type { GlassMember } from './platform/glass-host.types';
import { ConfirmationHost } from './platform/confirmation-host';
import { type InsetRoom, insetsOf, NO_INSETS, SafeAreaInsets } from './chrome/safe-area-inset';
import { MenuHost } from './platform/menu-host';
import { DropdownMenuHost } from './platform/menu-dropdown';
import { HeaderHost } from './platform/header-host';
import { BottomBarHost } from './platform/bottom-bar-host';
import { ScrollViewHost } from './chrome/scroll-view-host';
import { SidebarHost } from './chrome/sidebar-host';
import { RailHost } from './chrome/rail-host';
import { PageFooterHost } from './chrome/page-footer-host';
import { CommandHost } from './chrome/command-host';
import { SettingsHost } from './chrome/settings-host';
import {
  AutoHideBarHost,
  ResizeHandleHost,
  ScrollAreaHost,
  ScrollSurfaceHost,
  StickySectionHost,
  ToolbarHost,
} from './chrome/layout-hosts';
import {
  GEOMETRY_KINDS,
  PLACE_KINDS,
  STACK_KINDS,
  geometryOf,
  type GeometryModifier,
  addToLayers,
  addVariantToLayers,
  applyPlacement,
  flexOnly,
  cachedStyle,
  emptyPlacement,
  foregroundOf,
  ink,
  isAppColor,
  isLayerModifier,
  joinVariants,
  layerStyle,
  role,
  layerVariants,
  layoutOf,
  layoutStyle,
  overlayStyle,
  placeStyle,
  placeVariants,
  stackStyle,
  textStyle,
  textVariant,
  textVariants,
  type Layer,
  type LayerModifier,
  type PlaceModifier,
  type Placement,
  type Resolved,
  type StyleValue,
  SIDE_RADII,
  type StackModifier,
  type StyleOut,
  type Target,
  type VariantStyles,
} from './style';
import { Reporting, ReportedState, StateHost } from './state-host';
import { CONTROLS } from './controls';
import type { ControlDraw, ControlRenderer } from './controls/draw';
import { drawDialog, presentAround } from './controls/overlays';
import {
  STATES,
  both,
  compareLive,
  termsOf,
  settle,
  varies,
  warnNotVaried,
  type LiveCondition,
  type Planned,
} from './variants';
import {
  Conditioned,
  GEOMETRY_KEYS,
  type ListColor,
  isSurfaceFill,
  paintedLeaf,
  paintsSurface,
  surfaced,
  composeGeometry,
  type Geometry,
  type GeometryKey,
  type Paint,
  type PaintVariant,
} from './paint';
import {
  DURATION,
  HIT_SLOP,
  isFontFamily,
  resolveAvatarSize,
  resolveCorner,
  resolveFont,
  resolveBorderWidth,
  resolveLength,
  resolveSpace,
  type ShapeName,
  type AvatarSizeToken,
  type FrameLength,
  type CornerName,
  type SpaceToken,
  resolveIconSize,
  tokenKey,
  type AppToken,
  type AvatarSizeName,
  type ColorName,
  type ColorToken,
  type ListMarker,
  type IconSizeToken,
  type InkToken,
  type PhysicalEdge,
  type Role,
  type TextStyleName,
} from './tokens';
import { deriveEnv, EnvContext, materialEnv, ROOT_ENV, type Env } from './env';
import { inheritedModifiers } from './environment';
import type { TextTraits } from './style';
import { SafeAreaPadded } from './safe-area';
import { adoptLanguageSheet, languageSheets } from './web-sheet';
import {
  MotionWrapper,
  Presence,
  animatedHost,
  isMotionValue,
  type MotionValue,
  type Transform,
} from '@oxy.so/bloom/motion';
import {
  AnimationContext,
  GestureMotionNode,
  MotionNode,
  PressMotionNode,
  ThemedMotion,
  scopeOf,
  type AnimationScope,
  type MotionPlan,
  type Outer,
} from './motion/motion-node';
import { NumericRoll, TextRoll } from './motion/text-roll';
import { DepthStack } from './depth-stack';
import { resolveAnchor, resolveDelay, resolveRotation, resolveScale } from './motion/tokens';
import { PRESS_HOST_STYLE, ServerStyleSheet } from '@oxy.so/bloom/styles';

const IS_WEB = Platform.OS === 'web';

/** A host or Bloom component, as `draw` takes it. */
type Host = unknown;

/** The language's own pressable hosts. */
const PRESSABLE_HOSTS: ReadonlySet<Host> = new Set([Pressable, TouchableOpacity]);
const pressHostOuts = new WeakMap<StyleOut, StyleOut>();

/**
 * A pressable host's style on the web, with Bloom's press host class: a
 * state's selector reads it to leave a hover or a press inside a pressable to
 * that pressable, as react-native-web's Pressable does (the spec's
 * `variants.selectors`). Built once per style.
 */
function pressHostOut(host: Host, out: StyleOut): StyleOut {
  if (PRESS_HOST_STYLE === undefined || !PRESSABLE_HOSTS.has(host)) return out;
  let marked = pressHostOuts.get(out);
  if (marked === undefined) {
    marked = Object.freeze({
      ...out,
      style: out.style === undefined ? PRESS_HOST_STYLE : [out.style, PRESS_HOST_STYLE].flat(),
    });
    pressHostOuts.set(out, marked);
    pressHostOuts.set(marked, marked);
  }
  return marked;
}

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
  checkbox: 'checkbox',
  radio: 'radio',
  tab: 'tab',
  radiogroup: 'radiogroup',
  tablist: 'tablist',
  list: 'list',
  alert: 'alert',
  progressbar: 'progressbar',
  imagebutton: 'imagebutton',
  summary: 'summary',
};

/** What sets the environment of what is inside: the text traits, and the environment values. */
const ENV_KINDS: ReadonlySet<string> = new Set([...ENVIRONMENT, 'environment']);

/** Marks the props of a box drawn by a `StateHost`: its value says whether the box is pressable. */
const STATEFUL = '$$stateful';

/** A style with nothing to draw: for a host that takes only props. */
const NO_OUT: StyleOut = Object.freeze({ style: undefined, paint: undefined });

/** The nodes the language draws with React Native's own hosts; every other kind is a Bloom component. */
const DRAWN_BY_HOSTS: ReadonlySet<string> = new Set([
  'stack',
  'zstack',
  'spacer',
  'text',
  'icon',
  'embed',
  'view',
]);

/** One pass over a node's modifiers: what it draws with, sorted by what it affects. */
interface Plan {
  layers: Layer[];
  /** What places the view in its parent (its outermost box). */
  place: Placement;
  env: Modifier[];
  /** The text traits variants change, for the environment of what is inside. */
  envVariants: [Planned, Modifier][];
  /** What variants change of a stack's own layout. */
  hostVariants: [Planned, StackModifier][];
  /** The states the view's variants answer: its outermost box tracks them (`StateHost`). */
  states: LiveCondition[];
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
  /** How far a press reaches: one slop on every side, or each side's (React Native's `Insets`). */
  hitSlop: number | HitSlopInsets | undefined;
  testID: string | undefined;
  id: string | number | undefined;
  own: Map<Modifier['kind'], Modifier>;
  /**
   * A Button or FAB on glass: the glass draws its fill, tinted `controlTint`
   * when the glass has no tint. `reports`: the states the glass's variants
   * answer, which the control reports to the box around the glass.
   */
  control: { tint: ColorName | undefined; reports: readonly LiveCondition[] } | undefined;
  /** Present when the node has a motion modifier: it is then drawn by `MotionNode`. */
  motion: MotionPlan | undefined;
  /** Its glass's identity in a glass group (`.glassID()`, `.glassUnion()`, `.glassTransition()`). */
  glassMember: GlassMember | undefined;
}

/** A number per namespace, so an id is unique to its namespace as a string (a glass's key in its group). */
const namespaceNumbers = new WeakMap<Namespace, number>();
let namespaceCount = 0;

function namespaced(prefix: string, id: string, namespace: Namespace): string {
  let number = namespaceNumbers.get(namespace);
  if (number === undefined) {
    namespaceCount += 1;
    number = namespaceCount;
    namespaceNumbers.set(namespace, number);
  }
  return `${prefix}:${number}:${id}`;
}

/** A glass's identity in its group, from its chain; `undefined` with none. */
function glassMemberOf(modifiers: readonly Modifier[]): GlassMember | undefined {
  let member: GlassMember | undefined;
  for (const modifier of modifiers) {
    if (modifier.kind === 'glassID')
      member = { ...member, id: namespaced('bloom-glass', modifier.id, modifier.namespace) };
    else if (modifier.kind === 'glassUnion')
      member = { ...member, union: namespaced('bloom-union', modifier.id, modifier.namespace) };
    else if (modifier.kind === 'glassTransition')
      member = { ...member, transition: modifier.value };
  }
  return member;
}

const MOTION_KINDS: ReadonlySet<string> = new Set([
  'scale',
  'offset',
  'rotation',
  'animation',
  'animatesColors',
  'transition',
  'keyframes',
  'repeatForever',
  'delay',
  'anchor',
  'matchedGeometry',
  'glassID',
  'glassTransition',
  'pressScale',
  'drag',
  'swipe',
  'pinch',
  'onDoubleTap',
]);

/** Resting transforms (and the same by component), interned by key so a moving host's style keeps its identity. */
const transforms = new Map<string, { geometry: Geometry; transform: Transform }>();

function motionPlan(node: Node, layers: readonly Layer[]): MotionPlan {
  const motion: MotionPlan = {
    transform: NO_TRANSFORM,
    transformKey: '',
    geometry: NO_GEOMETRY,
    anchor: undefined,
    animation: undefined,
    colors: false,
    surface: false,
    transition: undefined,
    keyframes: undefined,
    loop: undefined,
    delay: 0,
    matched: undefined,
    pressScale: false,
    bound: undefined,
    drag: undefined,
    swipe: undefined,
    pinch: undefined,
    doubleTap: undefined,
    glass: layers.some((layer) => layer.glass !== undefined),
    stable: false,
  };
  const bound: {
    translateX?: MotionValue;
    translateY?: MotionValue;
    rotate?: MotionValue;
    scale?: MotionValue;
  } = {};
  let translateX = 0;
  let translateY = 0;
  let rotate = 0;
  let scale = 1;
  let glassID: { id: string; namespace: Namespace } | undefined;
  let glassTransition: GlassTransition | undefined;
  for (const modifier of node.modifiers) {
    switch (modifier.kind) {
      case 'opacity':
        motion.stable = true;
        break;
      case 'scale':
        motion.stable = true;
        if (isMotionValue(modifier.value)) bound.scale = modifier.value;
        else if (typeof modifier.value === 'string') scale = resolveScale(modifier.value);
        break;
      case 'offset': {
        motion.stable = true;
        const { x, y } = modifier.value;
        if (isMotionValue(x)) bound.translateX = x;
        else if (typeof x === 'string' || isAppToken(x)) translateX = resolveSpace(x);
        if (isMotionValue(y)) bound.translateY = y;
        else if (typeof y === 'string' || isAppToken(y)) translateY = resolveSpace(y);
        break;
      }
      case 'rotation':
        motion.stable = true;
        if (isMotionValue(modifier.value)) bound.rotate = modifier.value;
        else if (typeof modifier.value === 'string') rotate = resolveRotation(modifier.value);
        break;
      case 'drag':
        motion.stable = true;
        motion.drag = { value: modifier.value, options: modifier.options };
        break;
      case 'swipe':
        motion.stable = true;
        motion.swipe = { direction: modifier.direction, onSwipe: modifier.onSwipe };
        break;
      case 'pinch':
        motion.stable = true;
        motion.pinch = { value: modifier.value, options: modifier.options };
        break;
      case 'onDoubleTap':
        motion.doubleTap = modifier.value;
        break;
      case 'animation':
        // What its box draws changes with the motion: the box is animated from the first render.
        if (changesBox(node.modifiers)) motion.stable = true;
        motion.animation = scopeOf(modifier.motion, modifier.value, modifier.gated);
        break;
      case 'animatesColors':
        // Its colours play with the animation in scope: the box is animated from the first render.
        motion.stable = true;
        motion.colors = true;
        motion.surface = node.modifiers.some(namesSurfaceFill);
        break;
      case 'transition':
        motion.stable = true;
        motion.transition = modifier.value;
        break;
      case 'keyframes':
        motion.keyframes = { value: modifier.value, trigger: modifier.trigger };
        break;
      case 'repeatForever':
        motion.loop = modifier.value;
        break;
      case 'delay':
        motion.delay = resolveDelay(modifier.value);
        break;
      case 'anchor':
        motion.anchor = resolveAnchor(modifier.value);
        break;
      case 'matchedGeometry':
        motion.stable = true;
        motion.matched = { id: modifier.id, namespace: modifier.namespace };
        break;
      case 'glassID':
        glassID = { id: modifier.id, namespace: modifier.namespace };
        break;
      case 'glassTransition':
        glassTransition = modifier.value;
        break;
      case 'pressScale':
        motion.stable = true;
        motion.pressScale = true;
        break;
    }
  }
  // A glass's identity is the engine's own motion: `materialize` fades the glass
  // in and out where it is, `matchedGeometry` (the default) grows it out of the
  // glass with its id. A transition or matched geometry the chain names wins.
  if (glassTransition === 'materialize') {
    motion.stable = true;
    motion.transition ??= opacity;
  } else if (glassID !== undefined) {
    motion.stable = true;
    motion.matched ??= glassID;
  }
  if (Object.keys(bound).length > 0 || motion.swipe !== undefined) {
    // Bound geometry: the one mapper writes the whole transform, the tokens as
    // constants beside the values.
    motion.bound = {
      translateX: bound.translateX ? [translateX, bound.translateX] : [translateX],
      translateY: bound.translateY ? [translateY, bound.translateY] : [translateY],
      rotate: bound.rotate ? [rotate, bound.rotate] : [rotate],
      scale: bound.scale ?? scale,
    };
    return motion;
  }
  const key = `${translateX}|${translateY}|${rotate}|${scale}`;
  if (key !== '0|0|0|1') {
    let resting = transforms.get(key);
    if (resting === undefined) {
      const geometry: { -readonly [K in GeometryKey]?: number } = {};
      if (translateX !== 0) geometry.translateX = translateX;
      if (translateY !== 0) geometry.translateY = translateY;
      if (rotate !== 0) geometry.rotate = rotate;
      if (scale !== 1) geometry.scale = scale;
      resting = {
        geometry: Object.freeze(geometry),
        transform: Object.freeze((composeGeometry(geometry) as { transform: Transform }).transform),
      };
      transforms.set(key, resting);
    }
    motion.transform = resting.transform;
    motion.geometry = resting.geometry;
    motion.transformKey = key;
  }
  return motion;
}

const NO_TRANSFORM: Transform = Object.freeze([]);
const NO_GEOMETRY: Geometry = Object.freeze({});

/** What a change of plays on a view's box under `.animation()`: its opacity and geometry (colours only with `.animatesColors()`). */
const ANIMATED_KINDS: ReadonlySet<string> = new Set(['opacity', 'scale', 'offset', 'rotation']);

/** Whether a chain draws something its box animates, at rest or in a variant. */
function changesBox(modifiers: readonly Modifier[]): boolean {
  return modifiers.some((modifier) =>
    modifier.kind === 'when' ? changesBox(modifier.modifiers) : ANIMATED_KINDS.has(modifier.kind),
  );
}

/** Whether a geometry modifier follows a `MotionValue` (on any axis). */
function followsValue(modifier: GeometryModifier): boolean {
  if (modifier.kind !== 'offset') return isMotionValue(modifier.value);
  return isMotionValue(modifier.value.x) || isMotionValue(modifier.value.y);
}

function isAppToken(value: unknown): value is AppToken<'space'> {
  return typeof value === 'object' && value !== null && 'scale' in value;
}

/** A FAB is on glass: the platform's, unless its chain names another. */
const FAB_GLASS: Modifier = { kind: 'glass', key: regular.key, value: regular };

/**
 * A Button's glass styles, as the chain they stand for: the button on glass
 * (Bloom's `material="shared"`, the glass drawing its fill), `glass` in the
 * neutral tone's `subtle` ink and `glassProminent` a `solid` one, whose fill
 * tints the glass (the accent by default). The glass comes first, as a FAB's
 * does, and a `.glass()` the chain names is the glass instead; a tint it names
 * comes later and wins.
 */
const GLASS_STYLES: Readonly<Record<string, readonly Modifier[]>> = {
  glass: [
    { kind: 'tint', key: 'tint:neutral', value: 'neutral' },
    { kind: 'style', key: 'style:subtle', value: 'subtle' },
  ],
  glassProminent: [
    { kind: 'tint', key: 'tint:accent', value: 'accent' },
    { kind: 'style', key: 'style:solid', value: 'solid' },
  ],
};

/** A button's chain with a glass style written out (see `GLASS_STYLES`). */
function glassStyled(modifiers: readonly Modifier[], onGlass: boolean): readonly Modifier[] {
  let style: string | undefined;
  for (const modifier of modifiers) if (modifier.kind === 'style') style = modifier.value;
  const styled = style === undefined ? undefined : GLASS_STYLES[style];
  if (styled === undefined) return modifiers;
  const [tint, appearance] = styled as [Modifier, Modifier];
  const out: Modifier[] = onGlass ? [tint] : [FAB_GLASS, tint];
  for (const modifier of modifiers)
    out.push(modifier.kind === 'style' && GLASS_STYLES[modifier.value] ? appearance : modifier);
  return out;
}

const DISABLED_TAKERS: ReadonlySet<string> = new Set(ENVIRONMENT_TAKERS.disabled.kinds);

/**
 * Whether a view's `.disabled()` reaches everything inside it: a stack's and
 * any view's that takes no `disabled` of its own do. A Bloom component that
 * takes one keeps it, so Bloom decides what its content does, as it does for
 * an app's JSX (a disabled `ChipRow` and its chips).
 */
function handsDownDisabled(kind: NodeKind): boolean {
  return kind === 'stack' || !DISABLED_TAKERS.has(kind);
}

function plan(node: Node, env: Env): Plan {
  const result: Plan = {
    layers: [],
    place: emptyPlacement(),
    env: [],
    envVariants: [],
    hostVariants: [],
    states: [],
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
    motion: undefined,
    glassMember: undefined,
  };
  const onGlass = node.modifiers.some((modifier) => modifier.kind === 'glass');
  // What the environment sets on this kind of node comes first: its own chain wins.
  const inherited = inheritedModifiers(node.kind, env);
  const chained = inherited.length > 0 ? [...inherited, ...node.modifiers] : node.modifiers;
  const modifiers =
    node.kind === 'fab' && !onGlass
      ? [FAB_GLASS, ...chained]
      : node.kind === 'button'
        ? glassStyled(chained, onGlass)
        : chained;
  // A `disabled` variant answers the view's own `disabled()`, wherever it is chained.
  let disabled = false;
  for (const modifier of modifiers) if (modifier.kind === 'disabled') disabled = modifier.value;
  let moving = false;
  for (const modifier of modifiers) {
    if (MOTION_KINDS.has(modifier.kind)) {
      moving = true;
      continue;
    }
    // `identity` draws no glass: the chain keeps its shape without a material.
    if (modifier.kind === 'glass' && !modifier.value.drawn) continue;
    // A button group's glass is its own material (Bloom's `material="lens"`), not a layer around it.
    if (node.kind === 'buttonGroup' && modifier.kind === 'glass') {
      result.own.set('glass', modifier);
      continue;
    }
    // A card's corner curve is its own (Bloom's `cornerCurve`, beside its `radius`), not its box's.
    if (node.kind === 'card' && modifier.kind === 'cornerCurve') {
      result.own.set('cornerCurve', modifier);
      continue;
    }
    // An image's or a call grid's aspect ratio is its own (it sizes what it draws), not its box's.
    if (modifier.kind === 'aspectRatio' && OWN_ASPECT_RATIO.includes(node.kind)) {
      result.own.set('aspectRatio', modifier);
      continue;
    }
    // A card's clip is its own (Bloom's `clipContent`), not a box around it.
    if (node.kind === 'card' && modifier.kind === 'clipped') {
      result.own.set('clipped', modifier);
      continue;
    }
    if (isLayerModifier(modifier)) {
      addToLayers(result.layers, modifier);
      continue;
    }
    if (modifier.kind === 'when') {
      const condition = settle(modifier.condition, disabled);
      if (condition !== false) planVariant(result, condition, modifier.modifiers, disabled);
      continue;
    }
    if (ENV_KINDS.has(modifier.kind)) {
      result.env.push(modifier);
      continue;
    }
    // `disabled` is the view's own, and the environment of everything inside it,
    // except inside a Bloom component that takes it itself (see `handsDownDisabled`).
    if (modifier.kind === 'disabled' && handsDownDisabled(node.kind)) result.env.push(modifier);
    switch (modifier.kind) {
      case 'grow':
      case 'shrink':
      case 'alignSelf':
      case 'position':
      case 'zIndex':
      case 'hidden':
      case 'basis':
      case 'flex':
      case 'margin':
      case 'allowsHitTesting':
      case 'accessibilityOnly':
        applyPlacement(result.place, modifier);
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
        result.hitSlop = withHitSlop(result.hitSlop, modifier.edge, HIT_SLOP[modifier.value]);
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
    result.control = {
      tint: controlTint(node.kind, result),
      reports: glassStates(result.layers),
    };
  }
  if (result.layers.some((layer) => layer.glass !== undefined))
    result.glassMember = glassMemberOf(modifiers);
  // A view whose geometry varies is moving: its box draws the geometry (see `renderNode`).
  if (moving || result.place.variants.some(([, modifier]) => GEOMETRY_KINDS.has(modifier.kind)))
    result.motion = motionPlan(node, result.layers);
  return result;
}

type HitSlopInsets = { top?: number; bottom?: number; left?: number; right?: number };

/** Each side of a physical edge, as React Native's `Insets` names it. */
const HIT_SLOP_SIDES: Record<PhysicalEdge, readonly (keyof HitSlopInsets)[]> = {
  all: ['top', 'bottom', 'left', 'right'],
  top: ['top'],
  bottom: ['bottom'],
  horizontal: ['left', 'right'],
  vertical: ['top', 'bottom'],
  left: ['left'],
  right: ['right'],
};

/**
 * A hit slop with one more `.hitSlop()`: every side is one number (as Bloom
 * writes `hitSlop={8}`); a side of its own makes it React Native's insets,
 * with only the sides the chain names, a later one of a side over the earlier.
 */
function withHitSlop(
  current: number | HitSlopInsets | undefined,
  edge: PhysicalEdge,
  value: number,
): number | HitSlopInsets {
  if (edge === 'all') return value;
  const insets: HitSlopInsets =
    typeof current === 'number'
      ? { top: current, bottom: current, left: current, right: current }
      : { ...current };
  for (const side of HIT_SLOP_SIDES[edge]) insets[side] = value;
  return insets;
}

/**
 * A variant's modifiers, each where it overrides what the chain set before
 * it: a box modifier in the view that set the same thing last, a text trait
 * in the environment, a stack's layout on its host, a placement on its
 * outermost box.
 */
function planVariant(
  result: Plan,
  condition: Planned,
  modifiers: readonly Modifier[],
  disabled: boolean,
): void {
  for (const term of condition === null ? [] : termsOf(condition)) {
    if (STATES.has(term) && !result.states.includes(term)) result.states.push(term);
  }
  for (const modifier of modifiers) {
    if (modifier.kind === 'when') {
      // A variant inside a variant holds while both conditions do.
      const inner = settle(modifier.condition, disabled);
      if (inner !== false)
        planVariant(result, both(condition, inner), modifier.modifiers, disabled);
      continue;
    }
    if (!varies(modifier)) {
      // A condition that holds as the view renders (web, native, a platform,
      // disabled) is the chain's own: what no live variant changes applies as
      // if chained there (`when('web', (v) => v.noWrap())`).
      if (condition === null && heldAsOwn(result, modifier)) continue;
      warnNotVaried(modifier);
      continue;
    }
    if (GEOMETRY_KINDS.has(modifier.kind) && followsValue(modifier as GeometryModifier)) {
      warnOnce(
        'value-variant',
        '[Bloom language] a variant varies geometry by token: a MotionValue inside when() is left out.',
      );
      continue;
    }
    const mark = `;?${condition ?? ''}${modifier.key}`;
    if (isLayerModifier(modifier)) addVariantToLayers(result.layers, condition, modifier);
    else if (ENV_KINDS.has(modifier.kind)) result.envVariants.push([condition, modifier]);
    else if (PLACE_KINDS.has(modifier.kind)) {
      result.place.variants.push([condition, modifier as PlaceModifier]);
      result.place.key += mark;
    } else if (STACK_KINDS.has(modifier.kind)) {
      result.hostVariants.push([condition, modifier as StackModifier]);
    }
  }
}

/** Kinds the plan reads into fields of its own (presses, names): a held variant does not set them. */
const PLANNED_KINDS: ReadonlySet<string> = new Set([
  'onPress',
  'onLongPress',
  'hoverGroup',
  'onHover',
  'label',
  'hint',
  'role',
  'hitSlop',
  'testID',
  'id',
]);

/**
 * A modifier no live variant can change, under a condition that holds: a text
 * trait joins the environment, a stack's layout its own, any other the
 * chain's own modifiers. A box layer or a placement is left out (it stacks).
 */
function heldAsOwn(result: Plan, modifier: Modifier): boolean {
  if (isLayerModifier(modifier) || PLACE_KINDS.has(modifier.kind)) return false;
  if (PLANNED_KINDS.has(modifier.kind) || MOTION_KINDS.has(modifier.kind)) return false;
  if (ENV_KINDS.has(modifier.kind)) result.env.push(modifier);
  else if (STACK_KINDS.has(modifier.kind))
    result.hostVariants.push([null, modifier as StackModifier]);
  else result.own.set(modifier.kind, modifier);
  return true;
}

/** The style key of a stack's own variants, '' with none. */
function hostVariantKey(p: Plan): string {
  return p.hostVariants
    .map(([condition, modifier]) => `?${condition ?? ''}${modifier.key}`)
    .join(';');
}

/** A stack's layout variants: the ones that hold go into its layout, the live ones are styles under their condition. */
function hostVariants(p: Plan): VariantStyles {
  return joinVariants(
    p.hostVariants
      .filter(([condition]) => condition !== null)
      .map(([condition, modifier]) => [
        condition as LiveCondition,
        layoutStyle(layoutOf([modifier])),
      ]),
  );
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
 * `.accessibilityHidden()`: Android's and iOS's own props, hiding what is
 * inside too; the web's `aria-hidden` (react-native-web drops the native ones).
 */
const HIDDEN = Object.freeze(
  IS_WEB
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' },
);
const SHOWN = Object.freeze(
  IS_WEB ? {} : { accessibilityElementsHidden: false, importantForAccessibility: 'auto' },
);

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
  // Press feedback is Bloom's PressableScale, which a button is.
  else if (p.pressable && p.motion?.pressScale) props.accessibilityRole = 'button';
  const state = ownValue(p, 'accessibilityState')?.value;
  if (state !== undefined) props.accessibilityState = state;
  const value = ownValue(p, 'accessibilityValue')?.value;
  if (value !== undefined) props.accessibilityValue = value;
  const live = ownValue(p, 'liveRegion')?.value;
  if (live !== undefined) props.accessibilityLiveRegion = live;
  const hidden = ownValue(p, 'accessibilityHidden')?.value;
  if (hidden !== undefined) Object.assign(props, hidden ? HIDDEN : SHOWN);
  if (p.testID !== undefined) props.testID = p.testID;
  if (p.hitSlop !== undefined) props.hitSlop = p.hitSlop;
  // The escape hatches, on whichever host is outermost.
  const ref = ownValue(p, 'ref')?.value;
  if (ref !== undefined) props.ref = ref;
  const onLayout = ownValue(p, 'onLayout')?.value;
  if (onLayout !== undefined) props.onLayout = onLayout;
  if (p.pressable) {
    const fade = ownValue(p, 'pressFade');
    // A view whose press handler is absent stays the same host, out of the tab order
    // (a pressable is focusable by default). A press that fades is TouchableOpacity's,
    // whose focus is its own: on Android and iOS none without a press, on the web
    // focusable unless disabled, as the TouchableOpacity an app writes.
    if (fade !== undefined) props.onPress = p.onPress;
    else if (p.onPress === undefined && p.onLongPress === undefined) props.focusable = false;
    if (p.onPress) props.onPress = p.onPress;
    if (p.onLongPress) props.onLongPress = p.onLongPress;
    if (fade?.value !== undefined) props.activeOpacity = OPACITY[fade.value];
  }
  if (p.onHoverIn) props.onHoverIn = p.onHoverIn;
  if (p.onHoverOut) props.onHoverOut = p.onHoverOut;
  // A hover group's marker, so a descendant `SubtleHover` answers the pointer over it.
  if (IS_WEB && p.hoverGroup) Object.assign(props, hoverGroupProps);
  if (p.pressable && p.own.get('disabled')?.kind === 'disabled') {
    const disabled = ownValue(p, 'disabled')?.value;
    if (disabled) props.disabled = true;
  }
  // A box whose variants answer its state is drawn by a `StateHost` (drawHost).
  if (p.states.length > 0) props[STATEFUL] = p.pressable ? p.states : [];
  for (const _ in props) return props;
  return undefined;
}

/** The style key of a node's placement in its parent, '' when it has none. */
function flexKey(p: Plan): string {
  return p.place.key;
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
  /** The `.animation()` in scope, from this view or above it, across `view()` bodies. */
  animation: AnimationScope | undefined;
  /** The scope `AnimationContext` holds at this point of the React tree. */
  scoped: AnimationScope | undefined;
}

/**
 * Draws `host` with a resolved style: directly when the style is final, or
 * through a `Painted` leaf when the style names theme colours (native).
 */
function drawHost(
  host: Host,
  style: StyleOut,
  props: Record<string, unknown>,
  ...children: ReactNode[]
): ReactElement {
  const out = pressHostOut(host, style);
  if (STATEFUL in props) {
    const { [STATEFUL]: states, ...rest } = props;
    return draw(StateHost, { ...rest, host, out, states }, ...children);
  }
  // A moving box's motion style (`Outer`) comes after its own (a painted leaf
  // merges both after what it paints).
  if (out.style !== undefined)
    props.style = props.style === undefined ? out.style : [out.style, ...(props.style as [])];
  if (out.paint !== undefined)
    return draw(...paintedLeaf({ ...props, host, paint: out.paint }), ...children);
  return draw(host, props, ...children);
}

/**
 * The outermost box of a moving node (see `Outer`): drawn with `outer` on it,
 * as its host's animated twin on native. A Bloom component cannot take it, so
 * `drawNode` boxes one instead (`Outermost.used` stays false).
 */
interface Outermost {
  readonly outer: Outer;
  used: boolean;
}

function drawOutermost(
  box: Outermost | undefined,
  host: Host,
  style: StyleOut,
  props: Record<string, unknown>,
  ...children: ReactNode[]
): ReactElement {
  const out = pressHostOut(host, style);
  const animated = animatedHost(host) as Host | undefined;
  // A host with no animated twin (a Bloom component) moves in the box `drawNode` adds.
  if (box === undefined || animated === undefined) return drawHost(host, out, props, ...children);
  box.used = true;
  const { outer } = box;
  if (!outer.active) return drawHost(host, out, { ...props, ...outer.props }, ...children);
  // The animated twin takes the motion's style after its own, through the
  // leaf that paints it and the `StateHost` whose state its variants answer,
  // so a variant's change (a press's scale, a hover's fill) plays on it.
  return drawHost(animated, out, { ...props, ...outer.props, style: outer.style }, ...children);
}

/** `element` in a box of its own that carries `outer` (`style` first): how what cannot take it moves. */
function moveIn(outer: Outer, element: ReactNode, style?: Resolved): ReactElement {
  return draw(
    (animatedHost(View) ?? MotionWrapper) as Host,
    {
      ...outer.props,
      key: outer.playId,
      style: style === undefined ? outer.style : [style, ...outer.style],
    },
    element,
  );
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
    last.animation === ctx.animation &&
    last.scoped === ctx.scoped &&
    last.key === key &&
    last.inText === ctx.inText &&
    last.inRow === ctx.inRow
  ) {
    return last.element;
  }
  const p = plan(node, ctx.env);
  if (p.motion !== undefined) placeGeometry(p, p.motion, ctx.animation === undefined);
  const element =
    p.motion === undefined ? drawNode(node, p, ctx, key, undefined) : drawMoving(node, p, ctx, key);
  node.rendered = {
    env: ctx.env,
    provided: ctx.provided,
    animation: ctx.animation,
    scoped: ctx.scoped,
    key,
    inText: ctx.inText,
    inRow: ctx.inRow,
    element,
  };
  return element;
}

/**
 * Where a node's token geometry is drawn: by its outermost box, as part of
 * its placement, when its geometry rests with nothing to play it and no
 * `.animation()` above (as a view moved by hand is drawn: the node then takes
 * no motion at all), or when a variant changes it, so the variant overrides
 * only the components it sets (each component is a style value, and on the
 * web a custom property: style.ts, `webStyle`); the motion layer then plays
 * only its changes. Otherwise the motion layer draws it (`MotionNode`).
 *
 * A transform the one mapper writes (a `MotionValue`, a gesture, native press
 * feedback) takes no variant: its variants are left out.
 */
function placeGeometry(p: Plan, motion: MotionPlan, unscoped: boolean): void {
  const varied = new Set<GeometryKey>();
  for (const [, modifier] of p.place.variants) {
    if (GEOMETRY_KINDS.has(modifier.kind))
      for (const key of Object.keys(geometryOf(modifier as GeometryModifier)))
        varied.add(key as GeometryKey);
  }
  const mapped = motion.bound !== undefined || motion.drag !== undefined || motion.pressScale;
  if (varied.size > 0 && mapped) {
    warnOnce(
      'mapped-variant',
      '[Bloom language] geometry a MotionValue, a gesture or press feedback moves does not vary: its variants are left out.',
    );
    p.place.variants = p.place.variants.filter(
      ([, modifier]) => !GEOMETRY_KINDS.has(modifier.kind),
    );
    return;
  }
  const still = unscoped && restsStill(motion);
  if (!still && varied.size === 0) return;
  // A component a variant sets rests at its identity when the chain sets none.
  const geometry: { -readonly [K in GeometryKey]?: number } = {};
  for (const key of GEOMETRY_KEYS) if (varied.has(key)) geometry[key] = key === 'scale' ? 1 : 0;
  Object.assign(geometry, motion.geometry);
  p.place.geometry = geometry;
  p.place.anchor = motion.anchor;
  p.place.key += `;t:${motion.transformKey}|${[...varied].join(',')}|${motion.anchor ?? ''}`;
  // A varied geometry changes on the box, which is then animated from the first render.
  p.motion = still
    ? undefined
    : {
        ...motion,
        transform: NO_TRANSFORM,
        geometry: NO_GEOMETRY,
        anchor: undefined,
        stable: true,
      };
}

/** A node whose motion is its resting geometry alone: tokens, no value, nothing that plays. */
function restsStill(motion: MotionPlan): boolean {
  return (
    motion.animation === undefined &&
    motion.transition === undefined &&
    motion.keyframes === undefined &&
    motion.loop === undefined &&
    motion.matched === undefined &&
    !motion.pressScale &&
    motion.bound === undefined &&
    motion.drag === undefined &&
    motion.swipe === undefined &&
    motion.pinch === undefined &&
    motion.doubleTap === undefined
  );
}

/** Whether a modifier paints the surface fill (`.background('surfaceFill')`, `'surfaceFill/50'`). */
function namesSurfaceFill(modifier: Modifier): boolean {
  const value = (modifier as { value?: unknown }).value;
  return typeof value === 'string' && isSurfaceFill(value.split('/')[0] as ColorName);
}

/** A node with motion modifiers: `MotionNode` holds its motion state and draws it with `Outer`. */
function drawMoving(
  node: Node,
  p: Plan,
  ctx: Context,
  key: string | number | undefined,
): ReactElement {
  const motion = p.motion as MotionPlan;
  const component =
    motion.bound !== undefined ||
    motion.drag !== undefined ||
    motion.pinch !== undefined ||
    motion.doubleTap !== undefined
      ? GestureMotionNode
      : motion.pressScale
        ? PressMotionNode
        : MotionNode;
  // Native: a node that animates its colours reads the palette (`ThemedMotion`).
  const themed = motion.colors && !IS_WEB;
  const props = {
    key: p.id ?? key,
    motion,
    exit: p.id !== undefined && motion.transition !== undefined,
    scope: ctx.animation,
    content: (outer: Outer) => drawNode(node, p, ctx, undefined, outer),
  };
  return themed
    ? draw(...surfaced(ThemedMotion, { ...props, node: component }, motion.surface))
    : draw(component, props);
}

/**
 * Draws one node: its host element with the innermost layer merged into the
 * host's own style, then each further layer as a view around it. The press,
 * hover and accessibility props go on the outermost box; `grow`/`shrink` too.
 */
function drawNode(
  node: Node,
  p: Plan,
  ctx: Context,
  key: string | number | undefined,
  outer: Outer | undefined,
): ReactNode {
  const traits =
    p.env.length > 0 || p.envVariants.length > 0
      ? deriveEnv(ctx.env, p.env, p.envVariants)
      : ctx.env;
  // Inside an island its controls share its material; a glass inside it ends that.
  const env = p.layers.some((layer) => layer.blur)
    ? materialEnv(traits, true)
    : p.layers.some((layer) => layer.glass !== undefined)
      ? materialEnv(traits, false)
      : traits;
  if (p.navigation !== undefined) p.onPress = navigationPress(env, p.navigation);
  const animation = p.motion?.animation ?? ctx.animation;
  // What the node's children render in: its environment, its animation scope, and no row (a stack sets its own).
  const inner: Context =
    env === ctx.env && animation === ctx.animation && !ctx.inRow
      ? ctx
      : { env, provided: ctx.provided, animation, scoped: ctx.scoped, inText: ctx.inText };
  const reactKey = p.id ?? key;
  if (node.kind === 'skeleton') return drawSkeleton(node, p, inner, reactKey);
  if (node.kind === 'dialog') return drawPresentedDialog(node, p, inner, reactKey);
  // A group draws no view of its own: its children, where it is, as if they were there.
  if (node.kind === 'group')
    return draw(Fragment, { key: reactKey }, ...renderChildren(node.children, ctx));
  const layers = p.layers;
  // A Bloom component's hit testing on the web is a view of its own around it:
  // react-native-web drops an inline `pointerEvents`. (Its variants are its own
  // style: `serialize`.)
  const ownBox = IS_WEB && !DRAWN_BY_HOSTS.has(node.kind) && p.place.allowsHitTesting !== undefined;
  if (ownBox && layers.length === 0) addVariantToLayers(layers, null, EMPTY_PADDING);
  // A glass layer is a Surface and a blur layer an island, which the host cannot
  // be, and an overlay layer holds its views beside the host; so the host takes
  // the innermost layer only when that layer is plain.
  // A safe-area layer is the host when the host is a plain column or row, which pads itself by the insets.
  const hostTakesLayer =
    !ownBox &&
    layers.length > 0 &&
    (layers[0] as Layer).glass === undefined &&
    !(layers[0] as Layer).blur &&
    !(layers[0] as Layer).concentric &&
    ((layers[0] as Layer).safeArea === 0 ||
      (node.kind === 'stack' && behaviourProps(p) === undefined)) &&
    (layers[0] as Layer).overlays.length === 0;
  const hostLayer = hostTakesLayer ? (layers[0] as Layer) : undefined;
  const wrappers = hostTakesLayer ? layers.slice(1) : layers;
  const outermostIsHost = wrappers.length === 0;
  const flex = flexKey(p);
  const behaviour = behaviourProps(p);
  // A control on glass keeps its own press, focus and name: the glass only draws its fill.
  const hostBehaves = outermostIsHost || p.control !== undefined;
  const box: Outermost | undefined = outer === undefined ? undefined : { outer, used: false };

  let element = renderHost(
    node,
    p,
    inner,
    hostLayer,
    outermostIsHost ? flex : '',
    hostBehaves ? behaviour : undefined,
    outermostIsHost ? reactKey : undefined,
    ctx.inRow === true,
    outermostIsHost ? box : undefined,
  );

  for (let i = 0; i < wrappers.length; i++) {
    let layer = wrappers[i] as Layer;
    const outermost = i === wrappers.length - 1;
    const flexOf = outermost ? flex : '';
    const material = materialPadding(layer);
    if (material !== undefined) {
      // The varied padding is a view of its own inside the material, which takes the variants.
      const { inner } = material;
      element = drawHost(
        View,
        cachedStyle(
          'host',
          `L|${inner.key}|`,
          () => layerStyle(inner),
          () => layerVariants(inner),
        ),
        {},
        element,
      );
      layer = material.outer;
    }
    element = wrapLayer(
      layer,
      flexOf,
      p,
      withOverlays(layer, element, inner),
      outermost && !hostBehaves ? behaviour : undefined,
      outermost ? reactKey : undefined,
      outermost ? box : undefined,
    );
  }
  // A Bloom component (a Surface, an Avatar, a bare glyph) takes no motion of
  // its own: it moves in one box, there only while something plays on it.
  if (box !== undefined && !box.used && box.outer.active)
    element = moveIn(box.outer, element, flex ? flexOnly(p.place) : undefined);
  const badge = ownValue(p, 'badge')?.value;
  if (isNode(badge) && badge.kind === 'badge') {
    // An attached badge is Bloom's Badge around the view, at its placement.
    element = draw(
      BloomBadge,
      { ...badgeProps(badge, plan(badge, ctx.env)), key: reactKey },
      element,
    );
  }
  // A confirmation dialog grows out of the view where the platform can: its host is around it.
  const confirmation = ownValue(p, 'confirmationDialog')?.value;
  if (confirmation !== undefined)
    element = draw(ConfirmationHost, {
      key: reactKey,
      presenting: element,
      isPresented: confirmation.isPresented,
      dialog: confirmation.content,
      render: (child: Child) => renderChild(child, inner, undefined),
    });
  const alert = ownValue(p, 'alert')?.value;
  const dialog = ownValue(p, 'dialog')?.value;
  const popover = ownValue(p, 'popover')?.value;
  const cover = ownValue(p, 'fullScreenCover')?.value;
  if (alert === undefined && dialog === undefined && popover === undefined && cover === undefined)
    return element;
  // What the view presents: an anchored popover around it; an alert, a dialog
  // or a full-screen cover beside it.
  return presentAround(
    element as ReactElement,
    { alert, dialog, popover, cover },
    (children) => renderChildren(children, inner),
    reactKey,
  );
}

function boxStyle(layer: Layer | undefined, flex: string, p: Plan): Resolved {
  const style = layerStyle(layer);
  return flex ? Object.assign(style, placeStyle(p.place)) : style;
}

/** A box's live variants: its layer's, and its place's when it is the outermost box. */
function boxVariants(layer: Layer | undefined, flex: string, p: Plan): VariantStyles {
  return joinVariants(layerVariants(layer), flex ? placeVariants(p.place) : undefined);
}

/**
 * A material (a glass, an island, a concentric box) is a Bloom component, which
 * takes its style as an object, so nothing varies it on the web. Its padding
 * can vary all the same: a padding is the same room on a view just inside the
 * material, so a varied one moves there with its variants (`outer` is the
 * material without it). What else varies on a material is left out, said once
 * in development.
 */
function materialPadding(layer: Layer): { outer: Layer; inner: Layer } | undefined {
  if (layer.glass === undefined && !layer.blur && !layer.concentric) return undefined;
  const live = layer.variants.filter(([condition]) => condition !== null);
  if (live.length === 0) return undefined;
  const takes = (modifier: LayerModifier) =>
    modifier.kind === 'padding' || GLASS_VARIES.has(modifier.kind);
  if (live.some(([, modifier]) => !takes(modifier)))
    warnOnce(
      'material-variant',
      '[Bloom language] a material (a glass, an island, a concentric box) varies its padding, frame, border, corner and fill: its other variants are left out (a material is never faded).',
    );
  if (!live.some(([, modifier]) => modifier.kind === 'padding')) return undefined;
  const isPadding = (modifier: LayerModifier) => modifier.kind === 'padding';
  const inner: Layer = {
    modifiers: layer.modifiers.filter(isPadding),
    variants: layer.variants.filter(([, modifier]) => isPadding(modifier)),
    key: `${layer.key}|inside`,
    rank: LAYER_RANK.padding,
    edges: layer.edges,
    glass: undefined,
    concentric: false,
    curve: undefined,
    blur: false,
    safeArea: 0,
    overlays: [],
    corners: 0,
    follows: [],
  };
  const outer: Layer = {
    ...layer,
    modifiers: layer.modifiers.filter((modifier) => !isPadding(modifier)),
    variants: layer.variants.filter(([, modifier]) => !isPadding(modifier)),
    key: `${layer.key}|around`,
    edges: 0,
  };
  return { outer, inner };
}

/** What a material varies besides its padding (a view just inside it): its own frame, border, corner and fill. */
const GLASS_VARIES: ReadonlySet<string> = new Set(['frame', 'border', 'corner', 'background']);

/** What a glass's live variants change, each where the material takes it. */
interface GlassVariants {
  /** Its frame and border: the material's own style. */
  readonly style: VariantStyles;
  /** Its corner (the radius it clips to) and fill (its tint), as the material's props. */
  readonly props: readonly (readonly [LiveCondition, { radius?: number; fill?: ColorToken }])[];
  /** Whether one answers the view's state: the box around the glass then tracks it. */
  readonly stateful: boolean;
}

const glassVariantsByKey = new Map<string, GlassVariants>();

/**
 * A glass's live variants (its padding is a view inside it, `materialPadding`).
 * A glass is the platform's material, which takes its corner and fill as props
 * and is never faded: a frame or a border varies its style, a corner its
 * radius (one radius: a corner of some sides, or concentric, is left out), a
 * fill its tint. Built once per layer.
 */
function glassVariants(layer: Layer): GlassVariants {
  let varied = glassVariantsByKey.get(layer.key);
  if (varied !== undefined) return varied;
  const live = layer.variants.filter(
    (entry): entry is [LiveCondition, LayerModifier] => entry[0] !== null,
  );
  const props = new Map<LiveCondition, { radius?: number; fill?: ColorToken }>();
  for (const [condition, modifier] of live) {
    if (modifier.kind === 'corner') {
      if (modifier.side !== 'all' || modifier.value === 'concentric' || layer.concentric) {
        warnOnce(
          'glass-corner-variant',
          '[Bloom language] a material’s corner varies as one radius: a corner of some sides, or concentric (a concentric box’s own radius), is left out of when().',
        );
        continue;
      }
      props.set(condition, { ...props.get(condition), radius: resolveCorner(modifier.value) });
    } else if (modifier.kind === 'background' && layer.glass !== undefined) {
      if (isAppColor(modifier.value)) {
        // A glass is tinted by a role, at rest and in a variant: the platforms' glasses take one.
        warnOnce(
          'glass-app-color-variant',
          '[Bloom language] a glass’s tint is a colour role: an app colour is left out of when().',
        );
        continue;
      }
      props.set(condition, { ...props.get(condition), fill: modifier.value });
    }
  }
  // A glass's fill is its tint (a prop); an island's and a concentric box's is their style's.
  const inStyle = (modifier: LayerModifier) =>
    modifier.kind === 'frame' ||
    modifier.kind === 'border' ||
    (modifier.kind === 'background' && layer.glass === undefined);
  varied = {
    style: layerVariants({ ...layer, variants: live.filter(([, modifier]) => inStyle(modifier)) }),
    props: [...props].sort(([a], [b]) => compareLive(a, b)),
    stateful: live.some(
      ([condition, modifier]) =>
        GLASS_VARIES.has(modifier.kind) && termsOf(condition).some((term) => STATES.has(term)),
    ),
  };
  glassVariantsByKey.set(layer.key, varied);
  return varied;
}

/** A material's varied corner as its `radius` prop, under each condition that varies it. */
function radiusVariants(varied: GlassVariants): (readonly [LiveCondition, VariedProps])[] {
  return varied.props.flatMap(([condition, { radius }]) =>
    radius === undefined ? [] : [[condition, { props: { radius } }] as const],
  );
}

/** A padding of nothing: what opens the view of its own a Bloom component's hit testing takes on the web. */
const EMPTY_PADDING = Object.freeze({
  kind: 'padding',
  key: 'p:all:none',
  edge: 'all',
  value: 'none',
}) as Extract<Modifier, { kind: 'padding' }>;

/**
 * What an overlay layer's view holds: its view backgrounds, the content as
 * drawn so far, then its overlays, each a box over the whole of it (SwiftUI's
 * `background(alignment:)` and `overlay(alignment:)`). Each box lets touches
 * through to what is under it, outside its own content.
 */
function withOverlays(layer: Layer, child: ReactNode, ctx: Context): ReactNode | ReactNode[] {
  if (layer.overlays.length === 0) return child;
  const box = (overlay: Layer['overlays'][number]) =>
    drawHost(
      View,
      cachedStyle('host', `OV|${overlay.alignment}`, () => overlayStyle(overlay.alignment)),
      { pointerEvents: 'box-none' },
      renderNode(overlay.content as Node, ctx, undefined),
    );
  return [
    ...layer.overlays.filter((overlay) => overlay.behind).map(box),
    child,
    ...layer.overlays.filter((overlay) => !overlay.behind).map(box),
  ];
}

function wrapLayer(
  layer: Layer,
  flex: string,
  p: Plan,
  content: ReactNode | ReactNode[],
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
  box: Outermost | undefined,
): ReactElement {
  const styleKey = `L|${layer.key}|${flex}`;
  const glass = layer.glass;
  const children = Array.isArray(content) ? (content as ReactNode[]) : [content as ReactNode];
  if (glass !== undefined) {
    // The glass's corner is its radius (it clips itself), not a style of its host.
    const { corner, resolved } = materialRadius(boxStyle(layer, flex, p));
    const radius = typeof corner === 'number' ? corner : undefined;
    const surfaceRadius = layer.concentric ? 'concentric' : radius;
    const varied = glassVariants(layer);
    const outer = behaviour && !p.pressable ? behaviour : null;
    const ownKey = behaviour && p.pressable ? undefined : key;
    // A variant of the material that answers the view's state reads it from the
    // box around the glass, which then tracks it in JS (on the web too).
    const around = varied.stateful ? AROUND : NO_OUT;
    const PlatformGlass = getPlatformGlass();
    if (PlatformGlass !== null) {
      // The platform draws the glass (the lens, Liquid Glass, the system blur).
      const out = cachedStyle(
        'host',
        `${styleKey}|${p.control ? 'c' : ''}`,
        () => (p.control ? Object.assign({ alignSelf: 'flex-start' }, resolved) : resolved),
        () => varied.style,
      );
      const props: Record<string, unknown> = {
        ...outer,
        glass,
        radius,
        fallbackTint: p.control?.tint,
        interactive: glass.interactiveSaid ?? (p.pressable || p.control !== undefined),
        member: p.glassMember,
        key: ownKey,
      };
      // A fill that varies is the glass's tint, the token as the platform's glass takes it.
      const paint = variedPaint(`G|${styleKey}|${p.control ? 'c' : ''}|P`, out, NO_ROLES, () =>
        varied.props.map(([condition, { radius, fill }]) => [
          condition,
          {
            props: {
              ...(radius === undefined ? null : { radius }),
              ...(fill === undefined ? null : { fill: role(fill) }),
            },
          },
        ]),
      );
      // A tint of the surface fill reads it where the glass is drawn (`OnSurface`); no other glass does.
      const tintsSurface =
        isSurfaceFill(glass.tintColor) ||
        isSurfaceFill(p.control?.tint) ||
        varied.props.some(([, { fill }]) => fill !== undefined && isSurfaceFill(role(fill).role));
      const [glassHost, glassProps] = surfaced(PlatformGlass, props, tintsSurface);
      const drawn = drawHost(glassHost, paint ? painted(out, paint) : out, glassProps, ...children);
      if (p.control?.reports.length) return draw(ReportedState, { key }, drawn);
      return behaviour && p.pressable
        ? drawOutermost(box, hostFor(p), around, { ...behaviour, key }, drawn)
        : drawn;
    }
    const out = cachedStyle(
      'component',
      styleKey,
      () => resolved,
      () => varied.style,
    );
    const props: Record<string, unknown> = {
      radius: surfaceRadius,
      ...(layer.curve ? { cornerCurve: layer.curve } : null),
      ...(glass.sheen ? null : { sheen: false }),
      ...outer,
      key: ownKey,
    };
    // Surface's fill is a colour painted from a role: the glass's own (or the
    // control's), and the one a variant names while it holds.
    const fill = glass.fillRole ?? p.control?.tint;
    const opacity = glass.fillRole === undefined ? undefined : glass.fillOpacity;
    const paint = variedPaint(
      `G|${styleKey}|${fill ?? ''}|${opacity ?? ''}`,
      out,
      fill === undefined
        ? NO_ROLES
        : [opacity === undefined ? ['fill', fill] : ['fill', fill, opacity]],
      () =>
        varied.props.map(([condition, { radius, fill: varying }]) => [
          condition,
          {
            props: radius === undefined ? undefined : { radius },
            propRoles: varying === undefined ? undefined : [propRole('fill', varying)],
          },
        ]),
    );
    const surface = drawHost(Surface, paint ? painted(out, paint) : out, props, ...children);
    // A control's glass varies with the control's state, which it reports to a box around the glass.
    if (p.control?.reports.length) return draw(ReportedState, { key }, surface);
    return behaviour && p.pressable
      ? drawOutermost(box, hostFor(p), around, { ...behaviour, key }, surface)
      : surface;
  }
  if (layer.blur) {
    // Bloom's floating island: its material, its shadow and its clip; a capsule
    // unless the layer's corner names the radius.
    const { corner, resolved } = materialRadius(boxStyle(layer, flex, p));
    const varied = glassVariants(layer);
    const out = cachedStyle(
      'material',
      styleKey,
      () => resolved,
      () => varied.style,
    );
    const outer = behaviour && !p.pressable ? behaviour : null;
    const paint = variedPaint(`I|${styleKey}`, out, NO_ROLES, () => radiusVariants(varied));
    const island = drawHost(
      BlurIsland,
      paint ? painted(out, paint) : out,
      {
        ...(typeof corner === 'number' ? { radius: corner } : null),
        ...(layer.curve ? { cornerCurve: layer.curve } : null),
        ...outer,
        key: behaviour && p.pressable ? undefined : key,
      },
      ...children,
    );
    return behaviour && p.pressable
      ? drawOutermost(
          box,
          hostFor(p),
          varied.stateful ? AROUND : NO_OUT,
          { ...behaviour, key },
          island,
        )
      : island;
  }
  if (layer.concentric) {
    // Bloom's concentric geometry: the radius of the shape it sits in, less the inset.
    const varied = glassVariants(layer);
    const out = cachedStyle(
      'component',
      styleKey,
      () => boxStyle(layer, flex, p),
      () => varied.style,
    );
    const outer = behaviour && !p.pressable ? behaviour : null;
    const view = drawHost(
      ConcentricView,
      out,
      { ...outer, radius: 'concentric', key: behaviour && p.pressable ? undefined : key },
      ...children,
    );
    return behaviour && p.pressable
      ? drawOutermost(
          box,
          hostFor(p),
          varied.stateful ? AROUND : NO_OUT,
          { ...behaviour, key },
          view,
        )
      : view;
  }
  const out = cachedStyle(
    'host',
    styleKey,
    () => boxStyle(layer, flex, p),
    () => boxVariants(layer, flex, p),
  );
  if (layer.safeArea !== 0) {
    // A view padded by the device's safe area, which it reads as it renders; a press is a host around it.
    const outer = behaviour && !p.pressable ? behaviour : null;
    const padded = drawHost(
      SafeAreaPadded,
      out,
      { ...outer, ...safeAreaProps(layer), key: behaviour && p.pressable ? undefined : key },
      ...children,
    );
    return behaviour && p.pressable
      ? drawOutermost(box, hostFor(p), AROUND, { ...behaviour, key }, padded)
      : padded;
  }
  return drawOutermost(box, behaviour ? hostFor(p) : View, out, { ...behaviour, key }, ...children);
}

/** What `SafeAreaPadded` pads a layer by: its sides, and its own top and bottom padding, which the insets add to. */
function safeAreaProps(layer: Layer): { safeArea: number; own: { top: number; bottom: number } } {
  const style = layerStyle(layer);
  return {
    safeArea: layer.safeArea,
    own: {
      top: typeof style.paddingTop === 'number' ? style.paddingTop : 0,
      bottom: typeof style.paddingBottom === 'number' ? style.paddingBottom : 0,
    },
  };
}

/** A web list's row: a list item around the child, which draws the list's marker before it. */
function listItem(child: ReactNode): ReactNode {
  if (child === null || child === undefined || typeof child === 'boolean') return child;
  const { key } = child as ReactElement;
  return drawHost(
    View,
    cachedStyle('host', 'LI', () => ({ display: 'list-item' })),
    {
      role: 'listitem',
      key: key ?? undefined,
    },
    child,
  );
}

/**
 * A button group's glass is Bloom's lens group: the platform's lens where the
 * device has one, its shared Surface elsewhere. The group's material has no
 * tint and no clear variant, so those are left out, said once in development.
 */
function groupMaterial(glass: GlassValue | undefined): 'lens' | undefined {
  if (glass === undefined) return undefined;
  if (glass.key !== regular.key)
    warnOnce(
      'group-glass',
      '[Bloom language] a ButtonGroup’s glass is its lens material: .glass() alone; a clear or tinted glass is drawn as .glass().',
    );
  return 'lens';
}

/**
 * A material's radius: a glass and an island clip themselves to one radius,
 * so the layer's corner is that radius, not a style of their host. A corner of
 * some sides only has no such radius: it is left out, said once in development.
 */
function materialRadius(style: Resolved): { corner: StyleValue | undefined; resolved: Resolved } {
  const { borderRadius: corner, overflow: _clip, ...resolved } = style;
  for (const key of SIDE_RADII) {
    if (!(key in resolved)) continue;
    delete resolved[key];
    warnOnce(
      'side-radius',
      '[Bloom language] a glass or an island takes one radius: a corner of some sides only (.corner(r, side)) is left out on it.',
    );
  }
  return { corner, resolved };
}

const warned = new Set<string>();
function warnOnce(id: string, message: string): void {
  if (process.env.NODE_ENV === 'production' || warned.has(id)) return;
  warned.add(id);
  console.warn(message);
}

/** A shape's side with no `size()`: 40, Bloom's avatar default. */
const SHAPE_SIDE: SpaceToken = '4xl';

/** A shape's paint: what the last of `fill`, `stroke` and `image` in its chain says (a fill in the foreground by default). */
function shapeElement(
  node: Node,
  name: ShapeName,
  size: number,
  key: string | number | undefined,
): ReactElement {
  let last: Extract<Modifier, { kind: 'fill' | 'stroke' | 'image' }> | undefined;
  for (const modifier of node.modifiers) {
    if (modifier.kind === 'fill' || modifier.kind === 'stroke' || modifier.kind === 'image')
      last = modifier;
  }
  if (last?.kind === 'image')
    return draw(ShapeImage, { key, shape: name, size, source: last.source, alt: last.alt });
  if (last?.kind === 'stroke') {
    return draw(
      ...paintedLeaf({
        key,
        host: ShapeBorder,
        shape: name,
        size,
        width: resolveBorderWidth(last.width),
        paint: tokenPaint('colors', last.value),
      }),
    );
  }
  return draw(
    ...paintedLeaf({
      key,
      host: ShapeFill,
      shape: name,
      size,
      paint: tokenPaint('color', last?.value ?? 'foreground'),
    }),
  );
}

const tokenPaints = new Map<string, Paint>();

/** One prop painted from a colour token (a role at an opacity included), on a host with no style. */
function tokenPaint(prop: string, token: ColorToken): Paint {
  const id = `${prop}|${token}`;
  let paint = tokenPaints.get(id);
  if (paint === undefined) {
    const ref = role(token);
    paint = {
      style: undefined,
      styleRoles: [],
      propRoles: [ref.opacity === undefined ? [prop, ref.role] : [prop, ref.role, ref.opacity]],
    };
    tokenPaints.set(id, paint);
  }
  return paint;
}

/**
 * Bloom's Button with its `colors` pair as two props, so a `Painted` leaf can
 * paint each from its role. One pair object per colour pair, so the button's
 * props compare equal across renders.
 */
const pairs = new Map<string, { background: string; foreground: string }>();
function PairedButton({
  background,
  foreground,
  ...props
}: Record<string, unknown> & { background: string; foreground: string }): ReactElement {
  const id = `${background}|${foreground}`;
  let colors = pairs.get(id);
  if (colors === undefined) {
    colors = Object.freeze({ background, foreground });
    pairs.set(id, colors);
  }
  return draw(BloomButton, { ...props, colors });
}

/** A paired button's paint: its style, and its fill and label from their roles. */
function pairPaint(
  styleKey: string,
  out: StyleOut,
  [background, foreground]: readonly [ColorToken, ColorToken],
): Paint {
  return variedPaint(
    `${styleKey}|pair|${background}|${foreground}`,
    out,
    [propRole('background', background), propRole('foreground', foreground)],
    NO_VARIANTS,
  ) as Paint;
}

const NO_STYLE_OUT: StyleOut = Object.freeze({ style: undefined, paint: undefined });

/** A component's style out drawn with `paint` (its style and the props painted from roles). */
function painted(out: StyleOut, paint: Paint): StyleOut {
  return { style: undefined, paint, ...(out.object ? { object: true } : null) };
}

/** One prop painted from a colour token (a role at an opacity included). */
function propRole(prop: string, token: ColorToken): readonly [string, ColorName, number?] {
  const { role: name, opacity } = role(token);
  return opacity === undefined ? [prop, name] : [prop, name, opacity];
}

/** One colour of a painted list: a role (at an opacity), or an app's own colour. */
function listColor(token: InkToken): ListColor {
  const ref = ink(token);
  if (typeof ref === 'string') return ref;
  return ref.opacity === undefined ? [ref.role] : [ref.role, ref.opacity];
}

const NO_ROLES: Paint['propRoles'] = Object.freeze([]);

/** What a variant changes of a component's props: values as they are, and props painted from roles. */
interface VariedProps {
  readonly props?: Readonly<Record<string, unknown>>;
  readonly propRoles?: Paint['propRoles'];
}

const variedPaints = new Map<string, Paint | null>();

/**
 * A component's style (painted on native, and its live variants) plus props
 * painted from roles (a glass Surface's `fill`, an image's `tintColor`), and
 * what live variants change of its props, each under its condition beside the
 * style's (a glass's radius and fill). `undefined` when it adds nothing to the
 * style. Built once per `id`.
 */
function variedPaint(
  id: string,
  out: StyleOut,
  propRoles: Paint['propRoles'],
  variants: () => readonly (readonly [LiveCondition, VariedProps])[],
  propLists?: Paint['propLists'],
): Paint | undefined {
  let paint = variedPaints.get(id);
  if (paint === undefined) {
    const varied = variants();
    if (propRoles.length === 0 && varied.length === 0 && propLists === undefined) paint = null;
    else {
      const base = out.paint ?? {
        style: out.style as object | undefined,
        styleRoles: [],
        propRoles: [],
      };
      const byCondition = new Map<LiveCondition, PaintVariant>();
      for (const variant of base.variants ?? []) byCondition.set(variant.condition, variant);
      for (const [condition, extra] of varied) {
        const current = byCondition.get(condition) ?? { condition, style: {}, styleRoles: [] };
        byCondition.set(condition, {
          ...current,
          props: { ...current.props, ...extra.props },
          propRoles: [...(current.propRoles ?? []), ...(extra.propRoles ?? [])],
        });
      }
      const list = [...byCondition.values()].sort((a, b) => compareLive(a.condition, b.condition));
      paint = {
        style: base.style,
        styleRoles: base.styleRoles,
        propRoles,
        ...(list.length > 0 ? { variants: list } : null),
        ...(propLists === undefined ? null : { propLists }),
      };
    }
    variedPaints.set(id, paint);
  }
  return paint ?? undefined;
}

const NO_VARIANTS = () => [];

/** A component's style plus one prop painted from a role. */
function propPaint(
  styleKey: string,
  out: StyleOut,
  prop: string,
  role: ColorName,
  opacity?: number,
): Paint {
  return variedPaint(
    `${styleKey}|${prop}|${role}|${opacity ?? ''}`,
    out,
    [opacity === undefined ? [prop, role] : [prop, role, opacity]],
    NO_VARIANTS,
  ) as Paint;
}

/**
 * The outermost box's host: pressable when the view takes presses or hovers,
 * React Native's `TouchableOpacity` when its press fades it (`.pressFade()`).
 */
function hostFor(p: Plan): Host {
  if (!p.pressable) return View;
  return p.own.has('pressFade') ? TouchableOpacity : Pressable;
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

const iconVariantPaints = new Map<string, Paint>();

/**
 * An icon's glyph, filled with the foreground it is drawn in. A foreground a
 * live variant changes is answered where every other variant is: on the web by
 * CSS (the glyph paints `currentColor`, and its colour is a class under each
 * condition), on native by a `Conditioned` leaf that fills it from the
 * environment.
 */
function iconGlyph(
  icon: IconComponent,
  env: Env,
  size: number,
  key: string | number | undefined,
): ReactElement {
  const color = foregroundOf(env.text);
  // In the order they apply, as every other host's variants are.
  const live = (env.text.variants ?? [])
    .flatMap(([condition, changed]) =>
      changed.foreground === undefined ? [] : [[condition, changed.foreground] as const],
    )
    .sort(([a], [b]) => compareLive(a, b));
  // An app's own colour is the glyph's fill as it is, on every platform.
  const own = isAppColor(color) ? color.value : undefined;
  if (live.length === 0)
    return own !== undefined
      ? draw(icon, { fill: own, width: size, height: size, key })
      : draw(
          ...paintedLeaf({
            host: icon,
            paint: iconPaint(color as ColorToken),
            width: size,
            height: size,
            key,
          }),
        );
  if (IS_WEB) {
    const out = cachedStyle(
      'host',
      `IC|${env.key}`,
      () => ({ color: ink(color) }),
      () => joinVariants(live.map(([condition, varied]) => [condition, { color: ink(varied) }])),
    );
    return drawHost(icon, out, { fill: 'currentColor', width: size, height: size, key });
  }
  let paint = iconVariantPaints.get(env.key);
  if (paint === undefined) {
    // A variant's ink is a role the leaf paints, or an app's own colour as it is.
    const fill = (varied: InkToken): Pick<PaintVariant, 'propRoles' | 'props'> => {
      if (isAppColor(varied)) return { props: { fill: varied.value } };
      const { role: name, opacity } = role(varied);
      return { propRoles: [opacity === undefined ? ['fill', name] : ['fill', name, opacity]] };
    };
    paint = {
      ...(own === undefined
        ? iconPaint(color as ColorToken)
        : { style: undefined, styleRoles: [], propRoles: [] }),
      variants: live.map(([condition, varied]) => ({
        condition,
        style: {},
        styleRoles: [],
        ...fill(varied),
      })),
    };
    iconVariantPaints.set(env.key, paint);
  }
  // An app colour at rest is the glyph's own fill; a variant that holds paints over it.
  const leaf = (props: Record<string, unknown>) =>
    draw(...surfaced(Conditioned, { host: icon, paint, ...props }, paintsSurface(paint)));
  if (own !== undefined) return leaf({ fill: own, width: size, height: size, key });
  return leaf({ width: size, height: size, key });
}

/** A stack's style: its layout, then its box (the innermost layer and its flex), with their variants. */
function stackOut(
  p: Plan,
  axis: StackProps['axis'],
  layer: Layer | undefined,
  flex: string,
  marker: ListMarker | undefined,
): StyleOut {
  const layout = {
    spacing: ownValue(p, 'spacing')?.value,
    horizontalSpacing: ownValue(p, 'horizontalSpacing')?.value,
    verticalSpacing: ownValue(p, 'verticalSpacing')?.value,
    childSpacing: ownValue(p, 'childSpacing')?.value,
    align: ownValue(p, 'align')?.value,
    justify: ownValue(p, 'justify')?.value,
    wrap: ownValue(p, 'wrap')?.value,
    axis: ownValue(p, 'axis')?.value,
  };
  const styleKey = `S|${axis}|${layout.spacing === undefined ? '' : tokenKey(layout.spacing)}|${ownValue(p, 'horizontalSpacing')?.key ?? ''}|${ownValue(p, 'verticalSpacing')?.key ?? ''}|${ownValue(p, 'childSpacing')?.key ?? ''}|${layout.align ?? ''}|${layout.justify ?? ''}|${layout.wrap ?? ''}|${layout.axis ?? ''}|${marker ?? ''}|${hostVariantKey(p)}|${layer?.key ?? ''}|${flex}`;
  return cachedStyle(
    'host',
    styleKey,
    () => {
      // A layout variant that holds is the layout's own value.
      for (const [condition, modifier] of p.hostVariants) {
        if (condition === null)
          for (const [key, value] of Object.entries(layoutOf([modifier])))
            if (value !== undefined) (layout as Record<string, unknown>)[key] = value;
      }
      const style = Object.assign(stackStyle(axis, layout), boxStyle(layer, flex, p));
      if (marker !== undefined) style.listStyleType = marker;
      return style;
    },
    () => joinVariants(hostVariants(p), boxVariants(layer, flex, p)),
  );
}

/**
 * A scroll view whose content is laid out in a view of its own
 * (`.contentView()`): Bloom's view inside the content container, styled as a
 * vertical stack of the content view's modifiers is (`stackOut`), which the
 * scroll view hands Bloom as that view's style.
 */
function drawScrollContent(
  modifiers: readonly Modifier[],
  props: Record<string, unknown>,
  children: readonly Child[],
  ctx: Context,
): ReactElement {
  const content = plan(new Node('stack', CONTENT_VIEW, children, modifiers), ctx.env);
  if (content.layers.length > 1)
    throw new Error(
      'bloom-language: a scroll view’s content view is one view; give its modifiers in layer order (padding before frame)',
    );
  const out = stackOut(content, 'vertical', content.layers[0], flexKey(content), undefined);
  return drawHost(
    ScrollViewHost,
    out,
    { ...props, contentView: true },
    ...renderChildren(children, ctx),
  );
}
const CONTENT_VIEW: StackProps = { axis: 'vertical' };

/** The language's scrolls, each Bloom's own: the screen's, a scroll of its own, and one on a surface. */
/** The lists whose content makes room for views pinned at their edges. */
const INSET_LISTS: ReadonlySet<string> = new Set(['list', 'virtualList']);

const SCROLL_HOSTS = {
  scrollView: ScrollViewHost,
  scrollArea: ScrollAreaHost,
  scrollSurface: ScrollSurfaceHost,
} as const;
/** The states a control's glass varies with (`hovered`, `focused`, `pressed`), in no order. */
function glassStates(layers: readonly Layer[]): LiveCondition[] {
  const states = new Set<LiveCondition>();
  for (const layer of layers) {
    if (layer.glass === undefined) continue;
    for (const [condition, modifier] of layer.variants) {
      if (condition === null || !GLASS_VARIES.has(modifier.kind)) continue;
      for (const term of termsOf(condition))
        if (STATES.has(term)) states.add(term as LiveCondition);
    }
  }
  return [...states];
}

/** A Button and a FAB on a glass that varies with their state: each reports it to the box around the glass. */
function ReportingButton(props: Record<string, unknown>): ReactElement {
  return draw(Reporting, { host: BloomButton, ...props });
}
function ReportingFab(props: Record<string, unknown>): ReactElement {
  return draw(Reporting, { host: BloomFab, ...props });
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
  /** The node's outermost box when it moves and its host is it (see `Outermost`). */
  box: Outermost | undefined,
): ReactElement {
  const layerKey = layer?.key ?? '';
  const boxOf = (target: Target, prefix: string): StyleOut =>
    cachedStyle(
      target,
      `${prefix}|${layerKey}|${flex}`,
      () => boxStyle(layer, flex, p),
      () => boxVariants(layer, flex, p),
    );
  // A box whose variants answer its state is drawn by a `StateHost` (drawHost).
  const boxed = layer !== undefined || flex !== '' || p.states.length > 0;

  switch (node.kind) {
    case 'stack': {
      const { axis } = node.props as StackProps;
      // Web: an HTML list, each child a row behind the marker. Native has no markers.
      const marker = IS_WEB ? ownValue(p, 'listMarker')?.value : undefined;
      const out = stackOut(p, axis, layer, flex, marker);
      const row: Context = axis === 'horizontal' ? { ...ctx, inRow: true } : ctx;
      let children = renderChildren(node.children, row);
      if (marker !== undefined)
        children = children.map((child) =>
          Array.isArray(child) ? child.map(listItem) : listItem(child),
        );
      const wash = ownValue(p, 'hoverHighlight');
      if (wash !== undefined) {
        // A coordinated highlight (`active` given) shows on every platform; the pointer's only on the web.
        children.unshift(
          draw(SubtleHover, wash.value === undefined ? {} : { active: wash.value, native: true }),
        );
      }
      const padded = layer !== undefined && layer.safeArea !== 0;
      const host = behaviour ? hostFor(p) : padded ? SafeAreaPadded : View;
      const props = hostProps(behaviour, key);
      if (marker !== undefined) props.role = 'list';
      if (padded) Object.assign(props, safeAreaProps(layer));
      return drawOutermost(box, host, out, props, ...children);
    }
    case 'zstack': {
      const out = cachedStyle(
        'host',
        `Z|${layerKey}|${flex}`,
        () => Object.assign({ position: 'relative' }, boxStyle(layer, flex, p)),
        () => boxVariants(layer, flex, p),
      );
      const children: ReactNode[] = [
        draw(DepthStack, {
          alignment: ownValue(p, 'alignment')?.value ?? 'center',
          children: renderChildren(node.children, ctx),
        }),
      ];
      const wash = ownValue(p, 'hoverHighlight');
      if (wash !== undefined) {
        children.unshift(
          draw(SubtleHover, wash.value === undefined ? {} : { active: wash.value, native: true }),
        );
      }
      return drawOutermost(
        box,
        behaviour ? hostFor(p) : View,
        out,
        hostProps(behaviour, key),
        ...children,
      );
    }
    case 'spacer': {
      const out = cachedStyle(
        'host',
        `SP|${layerKey}|${flex}`,
        () => Object.assign({ flex: 1 }, boxStyle(layer, flex, p)),
        () => boxVariants(layer, flex, p),
      );
      return drawOutermost(box, behaviour ? hostFor(p) : View, out, hostProps(behaviour, key));
    }
    case 'text':
      return drawText(
        node,
        p,
        ctx,
        layerKey,
        flex,
        () => boxStyle(layer, flex, p),
        () => boxVariants(layer, flex, p),
        behaviour,
        key,
        box,
      );
    case 'icon': {
      const size = resolveIconSize(
        (ownValue(p, 'size')?.value as IconSizeToken | undefined) ?? 'md',
      );
      const bare = !boxed && !behaviour;
      const glyph = iconGlyph(
        (node.props as IconProps).icon,
        ctx.env,
        size,
        bare ? key : undefined,
      );
      if (bare) return glyph;
      const host = behaviour ? hostFor(p) : View;
      return drawOutermost(box, host, boxOf('host', 'I'), hostProps(behaviour, key), glyph);
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
      return drawHost(host, boxOf('component', 'A'), props);
    }
    case 'avatarGroup': {
      const size = ownValue(p, 'size')?.value as AvatarSizeToken | undefined;
      const spacing = ownValue(p, 'spacing')?.value;
      return pressAround(p, behaviour, key, (props) => {
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
        return drawHost(BloomAvatarGroup, boxOf('component', 'AG'), props);
      });
    }
    case 'badge':
      return pressAround(p, behaviour, key, (own) => {
        const props = { ...own, ...badgeProps(node, p) };
        if (!boxed) return draw(BloomBadge, props);
        return drawHost(BloomBadge, boxOf('component', 'BD'), props);
      });
    case 'iconCircle':
      return pressAround(p, behaviour, key, (props) => {
        props.icon = (node.props as IconProps).icon;
        props.size = ownValue(p, 'size')?.value;
        if (!boxed) return draw(BloomIconCircle, props);
        return drawHost(BloomIconCircle, boxOf('component', 'IC'), props);
      });
    case 'loading': {
      const { label } = buttonContent(node.children);
      return pressAround(p, behaviour, key, (props) => {
        Object.assign(props, {
          variant: ownValue(p, 'style')?.value,
          size: ownValue(p, 'size')?.value,
          tone: ownValue(p, 'tint')?.value,
          text: label,
        });
        if (!boxed) return draw(BloomLoading, props);
        return drawHost(BloomLoading, boxOf('component', 'LD'), props);
      });
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
        boxOf('component', 'SR'),
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
      const out = cachedStyle(
        'component',
        styleKey,
        () => {
          const style = boxStyle(layer, imageFlex, p);
          if (aspectRatio !== undefined) style.aspectRatio = aspectRatio;
          return style;
        },
        () => boxVariants(layer, imageFlex, p),
      );
      const { source, alt } = node.props as ImageProps;
      const crossFade = ownValue(p, 'crossFade')?.value;
      const props: Record<string, unknown> = interactive ? {} : hostProps(behaviour, key);
      Object.assign(props, {
        source,
        alt,
        contentFit: ownValue(p, 'contentFit')?.value,
        transition: crossFade === undefined ? undefined : DURATION[crossFade],
        onLoad: ownValue(p, 'onLoad')?.value,
        onError: ownValue(p, 'onError')?.value,
      });
      const tint = ownValue(p, 'tint')?.value as ColorName | undefined;
      const image = drawHost(
        BloomImage,
        tint === undefined ? out : painted(out, propPaint(styleKey, out, 'tintColor', tint)),
        props,
      );
      if (!interactive) return image;
      const placement = cachedStyle('host', `IMP|${flex}`, () => boxStyle(undefined, flex, p));
      return drawOutermost(box, hostFor(p), placement, hostProps(behaviour, key), image);
    }
    case 'button': {
      const props = hostProps(behaviour, key);
      delete props.focusable;
      const { icon, glyph, label, trailing, content, leadingView, trailingView } = buttonContent(
        node.children,
      );
      const shape = ownValue(p, 'shape')?.value;
      const iconOnly =
        !content &&
        icon !== undefined &&
        label === undefined &&
        shape !== undefined &&
        shape !== 'fit';
      // A glyph in an ink of its own (`Icon(X).foreground(role)`) is drawn as
      // it is; otherwise the button tints its icon with its tone.
      const inked = glyph?.modifiers.some((modifier) => modifier.kind === 'foreground');
      Object.assign(props, {
        appearance: ownValue(p, 'style')?.value,
        tone: ownValue(p, 'tint')?.value,
        size: ownValue(p, 'size')?.value,
        leadingIcon: inked || content ? undefined : icon,
        icon: inked && glyph && !content ? renderNode(glyph, ctx, undefined) : undefined,
        trailingIcon: content ? undefined : trailing,
        // A view beside the label (an avatar glyph, a custom mark): Bloom's `leading` and `trailing`.
        leading: leadingView === undefined ? undefined : renderNode(leadingView, ctx, undefined),
        trailing: trailingView === undefined ? undefined : renderNode(trailingView, ctx, undefined),
        // `null`: no spinner while loading (the label or glyph stays).
        loadingIndicator: loadingIndicatorOf(ownValue(p, 'loadingIndicator')?.value, ctx),
        // A circle is Bloom's square icon button; a pill, its wide one; fit
        // grows with its content, never narrower than it is tall.
        iconOnly: iconOnly ? true : undefined,
        wide: iconOnly && shape === 'pill' ? true : undefined,
        grow: shape === 'fit' ? true : undefined,
        linkTone: ownValue(p, 'linkTone')?.value,
        inverted: ownValue(p, 'inverted')?.value,
        density: ownValue(p, 'density')?.value,
        // Content that is a view (a spinner, a glyph in a `Group`) is the button's children as drawn.
        children: content ? renderChildren(node.children, ctx) : label,
        disabled: ownValue(p, 'disabled')?.value,
        loading: ownValue(p, 'loading')?.value,
        pressed: ownValue(p, 'pressed')?.value,
        href: ownValue(p, 'link')?.value,
        numberOfLines: ownValue(p, 'lines')?.value,
        underline: ownValue(p, 'underline') === undefined ? undefined : 'rest',
        iconSize: iconSizeOf(ownValue(p, 'iconSize')?.value),
        stopPropagation: ownValue(p, 'stopPropagation')?.value,
        // A trigger's open state is Bloom's own prop on a Button (it writes its own accessibility state).
        'aria-expanded': ownValue(p, 'accessibilityState')?.value.expanded,
        material: p.control || ctx.env.island ? 'shared' : undefined,
      });
      const colors = ownValue(p, 'colors')?.value;
      if (colors !== undefined) {
        // A paired fill and label, painted from their roles: Bloom's `colors`.
        const out = boxOf('component', 'B');
        return drawHost(
          PairedButton,
          painted(out, pairPaint(`B|${layerKey}|${flex}`, out, colors)),
          props,
        );
      }
      const button = p.control?.reports.length ? ReportingButton : BloomButton;
      if (button === ReportingButton) props.reports = p.control?.reports;
      // Its ink at rest and under the pointer, painted from their roles: Bloom's `color` and `hoverColor`.
      const inks = buttonInks(p);
      if (inks.length > 0) {
        const out = boxed ? boxOf('component', 'B') : NO_STYLE_OUT;
        const paint = variedPaint(
          `B|ink|${boxed ? `${layerKey}|${flex}` : ''}|${inks.map((ink) => ink.join(':')).join(',')}`,
          out,
          inks,
          NO_VARIANTS,
        ) as Paint;
        return drawHost(button, painted(out, paint), props);
      }
      if (!boxed) return draw(button, props);
      return drawHost(button, boxOf('component', 'B'), props);
    }
    case 'shape': {
      // A silhouette at a fixed side takes no style: its box is a view around it.
      const { name } = node.props as ShapeProps;
      const size = resolveSpace(
        (ownValue(p, 'size')?.value as SpaceToken | undefined) ?? SHAPE_SIDE,
      );
      const drawn = shapeElement(node, name, size, behaviour || boxed ? undefined : key);
      if (!boxed && !behaviour) return drawn;
      const host = behaviour ? hostFor(p) : View;
      return drawHost(host, boxOf('host', 'SH'), hostProps(behaviour, key), drawn);
    }
    case 'buttonGroup': {
      const children = renderChildren(node.children, ctx);
      return pressAround(p, behaviour, key, (props) => {
        if (props.accessibilityLabel === undefined) delete props.accessibilityLabel;
        Object.assign(props, {
          orientation: ownValue(p, 'axis')?.value,
          size: ownValue(p, 'size')?.value,
          dividers: ownValue(p, 'dividers')?.value,
          separated: ownValue(p, 'separated')?.value,
          material: groupMaterial(ownValue(p, 'glass')?.value),
        });
        if (!boxed) return draw(BloomButton.Group, props, ...children);
        return drawHost(BloomButton.Group, boxOf('component', 'BG'), props, ...children);
      });
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
        material: p.control || ctx.env.island ? 'shared' : undefined,
      });
      const fab = p.control?.reports.length ? ReportingFab : BloomFab;
      if (fab === ReportingFab) props.reports = p.control?.reports;
      if (!boxed) return draw(fab, props);
      return drawHost(fab, boxOf('component', 'F'), props);
    }
    case 'menu': {
      // `.menuStyle('dropdown')`: Bloom's own dropdown on every platform, its look as the JSX an app writes.
      const host = ownValue(p, 'menuStyle')?.value === 'dropdown' ? DropdownMenuHost : MenuHost;
      const menu = draw(host, {
        key: boxed ? undefined : key,
        trigger: namedTrigger((node.props as MenuProps).trigger, p.label),
        rows: node.children,
        actions: ownValue(p, 'actions')?.value,
        label: p.label,
        presented: ownValue(p, 'presented')?.value,
        testID: p.testID,
        render: (child: Child) => renderChild(child, ctx, undefined),
      });
      if (!boxed) return menu;
      return drawHost(View, boxOf('host', 'M'), hostProps(undefined, key), menu);
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
    case 'scrollView':
    case 'scrollArea':
    case 'scrollSurface': {
      const props = {
        key: boxed ? undefined : key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      };
      const content = node.kind === 'scrollView' ? ownValue(p, 'contentView') : undefined;
      // The content's children keep their places as a stack's do.
      const host = SCROLL_HOSTS[node.kind];
      const scroll = (room?: InsetRoom) =>
        content === undefined
          ? draw(host, { ...props, room }, ...renderChildren(node.children, ctx))
          : drawScrollContent(content.modifiers, { ...props, room }, node.children, ctx);
      // Views pinned at its edges: the content makes room for them (SwiftUI's safe area insets).
      const insets = insetsOf(node);
      const scroller =
        insets.length === 0
          ? scroll()
          : draw(SafeAreaInsets, {
              key: boxed ? undefined : key,
              insets,
              render: props.render,
              scroller: scroll,
            });
      // Box modifiers are a view around the scroller, as SwiftUI's.
      if (!boxed) return scroller;
      return drawHost(View, boxOf('host', 'SV'), hostProps(undefined, key), scroller);
    }
    // Rows and tabs are read by the menu or the bar that holds them; on their own they draw nothing.
    case 'menuItem':
    case 'menuSubmenu':
    case 'menuSection':
    case 'menuContent':
    case 'menuActions':
    case 'tab':
    // A bottom sheet is a `.sheet()`'s content, drawn by the sheet that presents it.
    case 'bottomSheet':
    // A sidebar's and a rail's rows are read by the column that holds them.
    case 'navItem':
    case 'sidebarMode':
    case 'treeSection':
    case 'treeFolder':
    case 'treeItem':
    case 'railItem':
    case 'commandItem':
    case 'commandGroup':
    case 'settingsGroup':
    case 'settingsItem':
    // An app layout's panels and destinations are read by the layout.
    case 'panel':
    case 'destination':
      return null as unknown as ReactElement;
    case 'command':
      return draw(CommandHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    case 'toolbarView':
      return draw(
        ToolbarHost,
        {
          key,
          node,
          render: (child: Child) => renderChild(child, ctx, undefined),
          press: (value: Press | undefined) => pressOf(value, ctx.env),
        },
        ...renderChildren(node.children, ctx),
      );
    case 'autoHideBar':
      return draw(
        AutoHideBarHost,
        {
          key,
          node,
          render: (child: Child) => renderChild(child, ctx, undefined),
          press: (value: Press | undefined) => pressOf(value, ctx.env),
        },
        ...renderChildren(node.children, ctx),
      );
    case 'resizeHandle':
      return draw(ResizeHandleHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    case 'stickySection':
      return draw(
        StickySectionHost,
        {
          key,
          node,
          render: (child: Child) => renderChild(child, ctx, undefined),
          press: (value: Press | undefined) => pressOf(value, ctx.env),
        },
        ...renderChildren(node.children, ctx),
      );
    case 'settings':
      return draw(SettingsHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    case 'sidebar':
      return draw(SidebarHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    case 'rail':
      return draw(RailHost, {
        key,
        node,
        render: (child: Child) => renderChild(child, ctx, undefined),
        press: (value: Press | undefined) => pressOf(value, ctx.env),
      });
    case 'pageFooter':
      return draw(
        PageFooterHost,
        {
          key,
          node,
          render: (child: Child) => renderChild(child, ctx, undefined),
          press: (value: Press | undefined) => pressOf(value, ctx.env),
        },
        ...renderChildren(node.children, ctx),
      );
    // Navigators are drawn by the router's layout(); placed in a view, they draw nothing.
    case 'appLayout':
    case 'navStack':
    case 'route':
    case 'tabView':
      return null as unknown as ReactElement;
    case 'divider': {
      const tint = ownValue(p, 'tint')?.value as ColorName | undefined;
      const spacing = ownValue(p, 'spacing')?.value;
      const axis = ownValue(p, 'axis')?.value as 'horizontal' | 'vertical' | undefined;
      const [label] = node.children;
      const content = dividerLabel(label, ctx);
      const out = boxOf('component', 'DV');
      return pressAround(p, behaviour, key, (props) => {
        Object.assign(props, {
          variant: ownValue(p, 'lineStyle')?.value,
          align: ownValue(p, 'align')?.value,
          // Across its stack: vertical in a row, unless its own `.axis()` says which way it runs.
          vertical: (axis === undefined ? inRow : axis === 'vertical') || undefined,
          spacing: spacing === undefined ? undefined : resolveSpace(spacing),
        });
        return drawHost(
          BloomDivider,
          tint === undefined
            ? out
            : painted(out, propPaint(`DV|${layerKey}|${flex}`, out, 'color', tint)),
          props,
          content,
        );
      });
    }
    case 'fill':
      return drawContainer(BloomFill, {}, node, p, ctx, boxOf('component', 'FL'), behaviour, key);
    case 'ratio':
      return drawContainer(
        BloomAspectRatio,
        { ratio: (node.props as { ratio: number }).ratio },
        node,
        p,
        ctx,
        boxOf('component', 'AR'),
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
          stretchItems: ownValue(p, 'stretchItems')?.value,
        },
        node,
        p,
        ctx,
        boxOf('component', 'G'),
        behaviour,
        key,
      );
    }
    case 'action': {
      const { icon, label, options } = node.props as ActionProps;
      const props: Record<string, unknown> = {
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
        hitSlop: p.hitSlop,
        accessibilityActions: options.accessibilityActions,
        onAccessibilityAction: options.onAccessibilityAction,
        testID: p.testID,
      };
      // The action's own pressable takes its press, hover and focus, which its box tracks for its state variants.
      if (behaviour !== undefined && STATEFUL in behaviour) props[STATEFUL] = behaviour[STATEFUL];
      if (!boxed) return draw(EngagementAction, props);
      return drawHost(EngagementAction, boxOf('component', 'EA'), props);
    }
    case 'actionBar': {
      const trailing = ownValue(p, 'trailing')?.value;
      const props: Record<string, unknown> = {
        key,
        testID: p.testID,
        size: ownValue(p, 'size')?.value,
        orientation: ownValue(p, 'axis')?.value,
        tone: ownValue(p, 'tint')?.value,
        showZeroCounts: ownValue(p, 'showZeroCounts')?.value,
        formatCount: ownValue(p, 'countFormat')?.value,
        trailing: trailing ? renderChildren(trailing, ctx) : undefined,
      };
      const children = renderChildren(node.children, ctx);
      if (!boxed) return draw(EngagementBar, props, ...children);
      return drawHost(EngagementBar, boxOf('component', 'AB'), props, ...children);
    }
    case 'actionGroup': {
      const props: Record<string, unknown> = { key, testID: p.testID };
      const children = renderChildren(node.children, ctx);
      if (!boxed) return draw(EngagementGroup, props, ...children);
      return drawHost(EngagementGroup, boxOf('component', 'AG'), props, ...children);
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
      return drawOutermost(box, host, boxOf('host', 'E'), hostProps(behaviour, key), element);
    }
    case 'lottie': {
      const { source } = node.props as LottieProps;
      const fallback = ownValue(p, 'fallback')?.value;
      const still =
        isNode(fallback) && fallback.kind === 'image' ? (fallback.props as ImageProps) : undefined;
      const frame = layer?.modifiers.find((modifier) => modifier.kind === 'frame') as
        | Extract<Modifier, { kind: 'frame' }>
        | undefined;
      const width = frame?.value.width;
      const edge = width === undefined ? undefined : resolveLength(width);
      // A frame that only sets the square's edge is the sticker's size, not a box around it.
      const sized =
        layer !== undefined &&
        layer.variants.length === 0 &&
        flex === '' &&
        p.states.length === 0 &&
        layer.modifiers.every((modifier) => modifier === frame) &&
        Object.keys(frame?.value ?? {}).every((side) => side === 'width');
      const boxedSticker = boxed && !sized;
      const sticker = draw(LottieHost, {
        key: boxedSticker || behaviour ? undefined : key,
        animation: typeof source === 'string' ? source : undefined,
        fallback: still?.source,
        accessibilityLabel: still?.alt,
        size: typeof edge === 'number' ? edge : undefined,
        loop: ownValue(p, 'loop') !== undefined,
        paused: ownValue(p, 'paused')?.value ?? false,
        decorative: ownValue(p, 'decorative') === undefined ? undefined : true,
      });
      if (!boxedSticker && !behaviour) return sticker;
      const host = behaviour ? hostFor(p) : View;
      const out = sized ? NO_STYLE_OUT : boxOf('host', 'L');
      return drawOutermost(box, host, out, hostProps(behaviour, key), sticker);
    }
    case 'view': {
      if (!boxed && !behaviour) return viewElement(node, ctx, key);
      const host = behaviour ? hostFor(p) : View;
      return drawOutermost(
        box,
        host,
        boxOf('host', 'V'),
        hostProps(behaviour, key),
        viewElement(node, ctx, undefined),
      );
    }
    default: {
      const control: ControlRenderer | undefined = CONTROLS[node.kind as NodeKind];
      if (control === undefined) throw new Error(`bloom-language: no renderer for ${node.kind}`);
      const controlDraw: ControlDraw = {
        node,
        own: (kind) => ownValue(p, kind),
        label: p.label,
        hint: p.hint,
        testID: p.testID,
        text: ctx.env.text,
        key,
        props: () => {
          const props = hostProps(behaviour, key);
          delete props.focusable;
          return props;
        },
        component: (host, props, ...children) =>
          boxed
            ? drawHost(host, boxOf('component', node.kind), props, ...children)
            : draw(host, props, ...children),
        painted: (host, props, colors, ...children) => {
          const roles: (readonly [string, ColorName, number?])[] = [];
          const lists: (readonly [string, readonly ListColor[]])[] = [];
          const listKeys: string[] = [];
          for (const [prop, token] of Object.entries(colors)) {
            if (token === undefined) continue;
            if (typeof token === 'string') roles.push(propRole(prop, token));
            else {
              lists.push([prop, token.map(listColor)]);
              listKeys.push(`${prop}:${token.map(tokenKey).join('+')}`);
            }
          }
          const out = boxed ? boxOf('component', node.kind) : NO_STYLE_OUT;
          const paint = variedPaint(
            `C|${node.kind}|${boxed ? `${layerKey}|${flex}` : ''}|${roles.map((r) => r.join(':')).join(',')}|${listKeys.join(',')}`,
            out,
            roles,
            NO_VARIANTS,
            lists.length === 0 ? undefined : lists,
          );
          return drawHost(
            host,
            paint === undefined ? out : painted(out, paint),
            props,
            ...children,
          );
        },
        around: (element) =>
          boxed
            ? drawHost(View, boxOf('host', node.kind), hostProps(undefined, key), element)
            : element,
        pressAround: (drawn) => pressAround(p, behaviour, key, drawn),
        render: (child) => renderChild(child, ctx, undefined),
        children: (children) => renderChildren(children, ctx),
        press: (value) => pressOf(value, ctx.env),
        role: p.role,
      };
      // Views pinned at a list's edges: the list makes room for them (SwiftUI's safe area insets).
      const insets = INSET_LISTS.has(node.kind) ? insetsOf(node) : NO_INSETS;
      if (insets.length === 0) return control(controlDraw);
      return draw(SafeAreaInsets, {
        key,
        insets,
        render: controlDraw.render,
        scroller: (room: InsetRoom) => control({ ...controlDraw, room }),
      });
    }
  }
}

/**
 * `Dialog(...).presented(binding)`: Bloom's Dialog in place, drawn as
 * `.dialog(binding, Dialog(...))` draws it beside its view. Every modifier of
 * a dialog is its own (`drawDialog` reads them), so none is a box around it.
 */
function drawPresentedDialog(
  node: Node,
  p: Plan,
  inner: Context,
  key: string | number | undefined,
): ReactElement {
  const presented = ownValue(p, 'presented');
  if (presented === undefined)
    throw new Error('bloom-language: a Dialog is a view only with .presented(isPresented)');
  return drawDialog(
    { isPresented: presented.value, content: node },
    (children) => renderChildren(children, inner),
    key,
  );
}

/**
 * A `view()` node: its component with the props it was called with, under
 * an `EnvContext` provider only when the environment here differs from the
 * one already provided, and an `AnimationContext` one only when the
 * animation scope does.
 */
function viewElement(node: Node, ctx: Context, key: string | number | undefined): ReactElement {
  const { component, props } = node.props as ViewNodeProps;
  let element: ReactElement = draw(component, props as Record<string, unknown>);
  if (ctx.env !== ctx.provided) element = draw(EnvContext.Provider, { value: ctx.env }, element);
  // The `.animation()` in scope reaches the body, as it reaches the nodes of this one.
  if (ctx.animation !== ctx.scoped)
    element = draw(AnimationContext.Provider, { value: ctx.animation }, element);
  return key === undefined ? element : cloneElement(element, { key });
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
/**
 * A Bloom component's press, hover and focus when it takes none of its own
 * (a Badge, an IconCircle, a Loading, a Divider, an AvatarGroup, a button
 * group): a language host around it takes them, and its box tracks the
 * states in JavaScript on every platform, so the variants in the component's
 * own style (a `Conditioned` leaf) answer them.
 */
const AROUND: StyleOut = Object.freeze({
  style: undefined,
  paint: undefined,
  object: true,
  anchor: true,
});

/** `drawn` with its press on a host around it when the view is pressable; its props otherwise, as before. */
function pressAround(
  p: Plan,
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
  drawn: (props: Record<string, unknown>) => ReactElement,
): ReactElement {
  if (!p.pressable || behaviour === undefined) {
    const props = hostProps(behaviour, key);
    delete props.focusable;
    return drawn(props);
  }
  const { testID, ...rest } = behaviour;
  const element = drawn(testID === undefined ? {} : { testID });
  return drawHost(hostFor(p), AROUND, { ...rest, key }, element);
}

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
  return outer ? drawHost(hostFor(p), AROUND, { ...rest, key }, element) : element;
}

/** A Badge node's props for Bloom's Badge, standalone or attached. */
function badgeProps(node: Node, p: Plan): Record<string, unknown> {
  return {
    content: (node.props as BadgeNodeProps).content,
    variant: ownValue(p, 'style')?.value,
    tone: ownValue(p, 'tint')?.value,
    color: ownValue(p, 'color')?.value,
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
  const length = (token: FrameLength | undefined) =>
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
  boxVaried: () => VariantStyles,
  behaviour: Record<string, unknown> | undefined,
  key: string | number | undefined,
  outermost: Outermost | undefined,
): ReactElement {
  const raw = (node.props as TextProps).raw === true;
  // React Native's own Text (RawText) inherits nothing of the language's environment
  // (no family, size or ink); a span, and RawText, write only what their own chain
  // names. A face for a text that names none is the app bundler's (app-preset's
  // `baseFont`), which reaches this Text as it reaches the app's own.
  const traits = raw ? deriveEnv(ROOT_ENV, p.env).text : ctx.env.text;
  const span = ctx.inText || raw ? spanTraits(p) : undefined;
  const link = ownValue(p, 'link')?.value;
  const look = {
    noWrap: ownValue(p, 'noWrap') !== undefined,
    align: ownValue(p, 'textAlign')?.value,
    italic: ownValue(p, 'italic') !== undefined,
    underline: ownValue(p, 'underline') !== undefined,
    strikethrough: ownValue(p, 'strikethrough') !== undefined,
    textCase: ownValue(p, 'textCase')?.value,
    link: link !== undefined,
    tabular: ownValue(p, 'monospacedDigit') !== undefined,
    wordBreak: ownValue(p, 'wordBreak')?.value,
    ellipsis: ownValue(p, 'truncation')?.value === 'tail' && ownValue(p, 'lines') === undefined,
  };
  const textStyleName = span === undefined ? ownValue(p, 'textStyle')?.value : undefined;
  const lookKey = `${look.noWrap ? 'nw' : ''}|${look.align ?? ''}|${look.italic ? 'i' : ''}|${look.underline ? 'u' : ''}|${look.strikethrough ? 's' : ''}|${look.textCase ?? ''}|${look.link ? 'a' : ''}|${look.tabular ? 'tn' : ''}|${look.wordBreak ?? ''}|${look.ellipsis ? 'el' : ''}`;
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
      cachedStyle('component', `Q|${layerKey}|${flex}`, box, boxVaried),
      props,
      ...runs,
    );
  }
  const host = span !== undefined ? RNText : textStyleName ? TEXT_HOSTS[textStyleName] : BloomText;
  const out = cachedStyle(
    'host',
    `T|${ctx.env.key}|${span === undefined ? '' : `s:${spanKey}`}|${raw ? 'r' : ''}|${lookKey}|${layerKey}|${flex}`,
    () => Object.assign(textStyle(traits, look, span), box()),
    () => joinVariants(textVariants(traits), boxVaried()),
  );
  const roll = ownValue(p, 'contentTransition');
  const plain = (node.props as TextProps).runs;
  if (
    roll !== undefined &&
    plain.every((run) => typeof run === 'string' || typeof run === 'number')
  ) {
    // The roll draws the text host itself, once at rest and twice while it
    // rolls, so it takes this node's outermost box (at rest).
    if (outermost !== undefined) outermost.used = true;
    // A fresh copy for each host: drawing one writes its style into its props.
    const hostOnly = (): Record<string, unknown> => {
      const { key: _key, ...rest } = props;
      return rest;
    };
    const rollProps = {
      key,
      text: plain.join(''),
      direction: roll.direction,
      scope: ctx.animation,
      draw: (text: string, rolling: Outer | undefined) => {
        if (rolling === undefined) return drawOutermost(outermost, host, out, hostOnly(), text);
        const at: Outermost = { outer: rolling, used: false };
        const drawn = drawOutermost(at, host, out, hostOnly(), text);
        return at.used ? drawn : moveIn(rolling, drawn);
      },
    };
    if (roll.value === 'roll') return draw(TextRoll, rollProps);
    // A numeric roll's row takes the text's box; each piece its type alone.
    const glyph = cachedStyle(
      'host',
      `TG|${ctx.env.key}|${lookKey}`,
      () => textStyle(traits, look, undefined),
      () => textVariants(traits),
    );
    const rowOut = cachedStyle(
      'host',
      `TR|${layerKey}|${flex}`,
      () => Object.assign({ flexDirection: 'row' }, box()),
      boxVaried,
    );
    const pieceProps: Record<string, unknown> = { ...HIDDEN_PIECE };
    if (variant !== undefined) pieceProps.variant = variant;
    return draw(NumericRoll, {
      ...rollProps,
      row: (text: string, ...pieces: ReactNode[]) =>
        drawOutermost(
          outermost,
          View,
          rowOut,
          { ...hostOnly(), accessible: true, role: 'text', accessibilityLabel: text },
          ...pieces,
        ),
      piece: (text: string, rolling: Outer | undefined) => {
        const drawn = drawHost(host, glyph, { ...pieceProps }, text);
        return rolling === undefined ? drawn : moveIn(rolling, drawn);
      },
    });
  }
  return drawOutermost(outermost, host, out, props, ...runs);
}

/** A piece of a numeric roll: the row it is in names the whole text. */
const HIDDEN_PIECE = Object.freeze({
  'aria-hidden': true,
  importantForAccessibility: 'no-hide-descendants',
  accessibilityElementsHidden: true,
  selectable: false,
});

/** A web link to another site opens beside the app, as Bloom's inline link does. */
const LINK_TARGET = Object.freeze({ target: '_blank', rel: 'noopener noreferrer' });

/**
 * A button's content: its first `Icon` before any `Text` is the leading glyph,
 * an `Icon` after a `Text` the trailing one, and the `Text` runs its label.
 */
/**
 * A Button's inks as Bloom's `color` and `hoverColor`, each from a colour
 * role: `.foreground()` (its ink at rest, the last one chained) and
 * `.hoverForeground()`.
 */
function buttonInks(p: Plan): (readonly [string, ColorName, number?])[] {
  const inks: (readonly [string, ColorName, number?])[] = [];
  let rest: Modifier | undefined;
  for (const modifier of p.env) if (modifier.kind === 'foreground') rest = modifier;
  const restValue = (rest as { value?: unknown } | undefined)?.value;
  if (typeof restValue === 'string') inks.push(propRole('color', restValue as ColorToken));
  const hover = ownValue(p, 'hoverForeground')?.value;
  if (hover !== undefined) inks.push(propRole('hoverColor', hover));
  return inks;
}

/** A button's `.loadingIndicator()`: `null` draws none, a view is drawn in the spinner's place. */
function loadingIndicatorOf(value: ViewNode | null | undefined, ctx: Context): ReactNode {
  if (value === undefined || value === null) return value;
  return renderNode(value as Node, ctx, undefined);
}

/** A glyph size token as the points Bloom's `iconSize` takes. */
function iconSizeOf(token: IconSizeToken | undefined): number | undefined {
  return token === undefined ? undefined : resolveIconSize(token);
}

function buttonContent(children: readonly Child[]): {
  icon: IconProps['icon'] | undefined;
  glyph: Node | undefined;
  label: string | undefined;
  trailing: IconProps['icon'] | undefined;
  /**
   * A child that is neither an `Icon` nor a `Text` (a `Loading`, a `Group`
   * around a glyph) and no label: a `Button` then draws its children as its
   * content, as views, and reads none as its glyph or label.
   */
  content: boolean;
  /** With a label, the view before it and the view after it (Bloom's `leading` and `trailing`). */
  leadingView: Node | undefined;
  trailingView: Node | undefined;
} {
  let icon: IconProps['icon'] | undefined;
  let glyph: Node | undefined;
  let label: string | undefined;
  let trailing: IconProps['icon'] | undefined;
  const nodes = flatten(children);
  for (const child of nodes) {
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
  const views = nodes.some((child) => child.kind !== 'icon' && child.kind !== 'text');
  // With a label, a view before it is the leading one and a view after it the trailing one.
  let leadingView: Node | undefined;
  let trailingView: Node | undefined;
  if (views && label !== undefined) {
    let seenLabel = false;
    for (const child of nodes) {
      if (child.kind === 'text') seenLabel = true;
      else if (child.kind !== 'icon') {
        if (seenLabel) trailingView ??= child;
        else leadingView ??= child;
      }
    }
  }
  return {
    icon,
    glyph,
    label,
    trailing,
    content: views && label === undefined,
    leadingView,
    trailingView,
  };
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
    if (Array.isArray(child)) out.push(draw(Presence, { items: renderList(child, ctx) }));
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
  const animation = useContext(AnimationContext);
  return renderChild(node, { env, provided: env, animation, scoped: animation }, undefined);
}
LanguageRoot.displayName = 'BloomLanguage';

/** Whether a `LanguageStyles` around this point writes the sheets into server-rendered HTML. */
const SheetsWritten = createContext(false);

/**
 * The web: the language's sheets in server-rendered HTML, for an app that
 * renders on a server with Bloom's `ssrStyles` (which `ServerStyleSheet`
 * reads). It goes around the app once, as the router's `layout()` does
 * itself: it draws `children`, then the generated sheet and each variant
 * sheet the tree drew, so the page is styled before it hydrates. One inside
 * another writes nothing; without a server policy, and once hydrated,
 * `ServerStyleSheet` writes nothing and adopts the same sheets the renderer
 * does. Native draws `children`.
 */
export function LanguageStyles({ children }: { children?: ReactNode }): ReactNode {
  const written = useContext(SheetsWritten);
  if (!IS_WEB || written) return children;
  return draw(SheetsWritten.Provider, { value: true }, children, draw(LanguageSheets, null));
}

function LanguageSheets(): ReactNode {
  return languageSheets().map(([id, css]) => draw(ServerStyleSheet, { key: id, id, css }));
}

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

/** What a `view()` component renders: its body, under the environment and animation scope it is placed in. */
export function renderBody(
  body: Child,
  env: Env,
  animation: AnimationScope | undefined,
): ReactNode {
  return renderChild(body, { env, provided: env, animation, scoped: animation }, undefined);
}

interface LottieHostProps {
  animation: string | undefined;
  fallback: string | undefined;
  accessibilityLabel: string | undefined;
  size: number | undefined;
  loop: boolean;
  paused: boolean;
  decorative: true | undefined;
}

/**
 * `Lottie()`: Bloom's `Sticker`, the one Lottie path (lottie-react-native on
 * native, dotLottie on the web, both loaded lazily), paused while its screen
 * is not in front.
 */
function LottieHost({ paused, fallback, ...props }: LottieHostProps): ReactNode {
  const visible = useScreenVisible();
  return draw(Sticker, { ...props, fallback: fallback ?? '', paused: paused || !visible });
}
LottieHost.displayName = 'BloomLottie';
