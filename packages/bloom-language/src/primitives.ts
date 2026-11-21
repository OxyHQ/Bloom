import type { ReactNode } from 'react';
import type { AvatarGroupItem } from '@oxy.so/bloom/avatar-group';
import type { BloomImageSource } from '@oxy.so/bloom/image';

import type { ShapeName } from './tokens';

import {
  Node,
  type ActionBarView,
  type ActionGroupView,
  type ActionOptions,
  type ActionView,
  type AvatarOptions,
  type AvatarGroupView,
  type AvatarView,
  type BadgeView,
  type IconCircleView,
  type LoadingView,
  type SkeletonGroupView,
  type SkeletonShape,
  type SkeletonView,
  type BottomBarView,
  type ButtonGroupView,
  type ScrollViewNode,
  type ShapeProps,
  type ShapeView,
  type ButtonView,
  type Child,
  type EmbedView,
  type FabView,
  type HeaderView,
  type MenuChild,
  type MenuActionTable,
  type MenuActionsView,
  type MenuContentView,
  type AspectRatioView,
  type DividerView,
  type FillView,
  type GridView,
  type MenuItemView,
  type MenuSectionView,
  type MenuSubmenuView,
  type MenuView,
  type TabView,
  type IconComponent,
  type IconView,
  type ImageView,
  type LottieView,
  type SpacerView,
  type StackView,
  type TextRun,
  type TextView,
} from './node';

const NO_CHILDREN: readonly Child[] = [];
const HORIZONTAL = { axis: 'horizontal' } as const;
const VERTICAL = { axis: 'vertical' } as const;
const DEPTH = { axis: 'depth' } as const;

/** Children side by side, in reading order. */
export function HStack(...children: Child[]): StackView {
  return new Node('stack', HORIZONTAL, children);
}

/** Children top to bottom. */
export function VStack(...children: Child[]): StackView {
  return new Node('stack', VERTICAL, children);
}

/** Children over one another: the first sets the size, the rest cover it, later ones on top. */
export function ZStack(...children: Child[]): StackView {
  return new Node('stack', DEPTH, children);
}

/** Takes the free space along its stack's axis. */
export function Spacer(): SpacerView {
  return new Node('spacer', null, NO_CHILDREN);
}

/** Text. Runs are joined in order; a nested `Text` is an inline span with its own modifiers. */
export function Text(...runs: TextRun[]): TextView {
  return new Node('text', { runs }, NO_CHILDREN);
}

/** A Bloom icon component (`RiHeartLine`, `ReplyIcon`…), drawn at a size token in the current foreground. */
export function Icon(icon: IconComponent): IconView {
  return new Node('icon', { icon }, NO_CHILDREN);
}

/** Bloom `Avatar`. `source` is a URL or a file id the app's `ImageResolver` resolves. */
export function Avatar(source: string | null | undefined, options: AvatarOptions = {}): AvatarView {
  return new Node('avatar', { source, options }, NO_CHILDREN);
}

/**
 * Bloom `AvatarGroup`: its members (Bloom's `AvatarGroupItem`: `uri`, `name`,
 * `initials`…), first on top.
 */
export function AvatarGroup(items: readonly AvatarGroupItem[]): AvatarGroupView {
  return new Node('avatarGroup', { items }, NO_CHILDREN);
}

/** Bloom `Badge`: a count or a label (a dot with none, `.dot()`). Attach it with `.badge(Badge(…))`. */
export function Badge(content?: string | number): BadgeView {
  return new Node('badge', { content }, NO_CHILDREN);
}

/** Bloom `IconCircle`: an icon on a tinted disc. */
export function IconCircle(icon: IconComponent): IconCircleView {
  return new Node('iconCircle', { icon }, NO_CHILDREN);
}

/** Bloom `Loading`: a spinner; a `Text` is what it says beside or below it. */
export function Loading(text?: TextView): LoadingView {
  return new Node('loading', null, text === undefined ? NO_CHILDREN : [text]);
}

/** A Bloom skeleton shape, sized by its frame (a `text` line by its font). */
export function Skeleton(shape: SkeletonShape): SkeletonView {
  return new Node('skeleton', { shape }, NO_CHILDREN);
}

/** Bloom `Skeleton.Region`: the shapes of what is loading, announced once. */
export function SkeletonGroup(...children: Child[]): SkeletonGroupView {
  return new Node('skeletonGroup', null, children);
}

/**
 * A raster image, drawn by Bloom's `BloomImage`. `source` is a URL, a bundled
 * asset (`require()`) or a URI descriptor; `alt` names it for assistive technology.
 */
export function Image(source: BloomImageSource | null | undefined, alt?: string): ImageView {
  return new Node('image', { source, alt }, NO_CHILDREN);
}

/** Bloom `Button`. An `Icon` child is its glyph; `Text` children are its label. */
export function Button(...children: Child[]): ButtonView {
  return new Node('button', null, children);
}

/** One of Bloom's silhouettes (`circle`, `squircle`, `heart`…), filled, stroked or holding an image. */
export function Shape(name: ShapeName): ShapeView {
  return new Node('shape', { name } satisfies ShapeProps, []);
}

/** Bloom `Button.Group`: its `Button`s joined on one material. */
export function ButtonGroup(...buttons: Child[]): ButtonGroupView {
  return new Node('buttonGroup', null, buttons);
}

/** Bloom `EngagementAction`: one glyph (and count) in an action bar. `label` names it for assistive technology. */
export function Action(
  icon: IconComponent,
  label: string,
  options: ActionOptions = {},
): ActionView {
  return new Node('action', { icon, label, options }, NO_CHILDREN);
}

/** Bloom `EngagementBar`: leading actions in reading order; `.trailing(...)` pushes the rest to the far edge. */
export function ActionBar(...children: Child[]): ActionBarView {
  return new Node('actionBar', null, children);
}

/** Bloom `EngagementGroup`: adjacent actions that read as one control. */
export function ActionGroup(...children: Child[]): ActionGroupView {
  return new Node('actionGroup', null, children);
}

/**
 * A React element inside a tree: a third-party component, or a Bloom/app
 * component the language has no node for yet. Pass a function to receive a
 * `render` that draws language nodes in the current environment, for an
 * element that takes them as children or props.
 */
export function Embed(
  content: ReactNode | ((render: (child: Child) => ReactNode) => ReactNode),
): EmbedView {
  return new Node('embed', { content }, NO_CHILDREN);
}

/**
 * Bloom `Fab`, on the platform's glass: the lens on Android and OxyOS,
 * `glassEffect` on iOS 26 (blur before it), Bloom's frosted material on the
 * web. An `Icon` child is its glyph; a `Text` child is its extended label.
 * `.glass(...)` sets the material; without it, the FAB is tinted with its own
 * solid fill.
 */
export function FAB(...children: Child[]): FabView {
  return new Node('fab', null, children);
}

/**
 * A menu: `trigger` opens it, and `rows` are what it presents. Each platform
 * presents it natively: the lens menu on Android and OxyOS, the system menu on
 * iOS, Bloom's menu on the web.
 *
 * ```ts
 * Menu(
 *   Button(Icon(RiMoreFill)).style('plain').shape('circle').label('More'),
 *   Item('Copy link').icon(RiLinkM).onPress(copy),
 *   Divider(),
 *   Item('Delete').icon(RiDeleteBinLine).destructive().onPress(remove),
 * )
 * ```
 *
 * Rows built from hooks, or costly to build, go in one `menu()` content,
 * built only while the menu is open.
 */
export function Menu(trigger: Child, ...rows: MenuChild[]): MenuView;
export function Menu(trigger: Child, content: MenuContentView): MenuView;
export function Menu(trigger: Child, ...rows: readonly unknown[]): MenuView {
  return new Node('menu', { trigger }, rows as Child[]);
}

/** A menu row: a title, and what choosing it does (`.onPress`). */
export function Item(title: string): MenuItemView {
  return new Node('menuItem', { title }, NO_CHILDREN);
}

/** A row that opens its own rows beside (or, on a phone, in place of) the menu. One level deep. */
export function Submenu(title: string, ...rows: MenuChild[]): MenuSubmenuView {
  return new Node('menuSubmenu', { title }, rows as Child[]);
}

/** Rows that belong together, set apart from the rows around them. */
export function Section(...rows: MenuChild[]): MenuSectionView {
  return new Node('menuSection', null, rows as Child[]);
}

/**
 * Bloom `Divider`: a line across its stack (vertical in an `HStack`), with an
 * optional label on it. In a menu, the line between rows.
 */
export function Divider(label?: Child): DividerView {
  return new Node('divider', null, label === undefined ? NO_CHILDREN : [label]);
}

/** Bloom `Fill`: its children cover the whole of the view it is in. */
export function Fill(...children: Child[]): FillView {
  return new Node('fill', null, children);
}

/**
 * Bloom `AspectRatio`: the width of its parent and the height `ratio` (width
 * over height) gives it, so a media well keeps its size before it loads.
 */
export function AspectRatio(ratio: number, ...children: Child[]): AspectRatioView {
  return new Node('ratio', { ratio }, children);
}

/** Bloom `ResponsiveGrid`: its cells in as many equal columns as fit. */
export function Grid(...cells: Child[]): GridView {
  return new Node('grid', null, cells);
}

/** A tab of a `BottomBar`: its label and glyph. Its `.id()` is what the bar selects. */
export function Tab(label: string, icon: IconComponent): TabView {
  return new Node('tab', { label, icon }, NO_CHILDREN);
}

/** The bottom bar: its tabs, in order. */
export function BottomBar(
  ...tabs: (TabView | false | null | undefined | readonly TabView[])[]
): BottomBarView {
  return new Node('bottomBar', null, tabs as Child[]);
}

/** The page header, or the navigation bar (`.presentation('navigation')`), titled `title`. */
export function Header(title?: string): HeaderView {
  return new Node('header', { title }, NO_CHILDREN);
}

/**
 * The screen's scroller (Bloom `ScreenScrollView`): its children are the
 * content, in a column, bound to the screen's header fade, bottom bar fold,
 * reselect and keyboard.
 *
 * ```ts
 * ScrollView(Text(title).font('title-1'), Text(body))
 *   .contentMargins('md')
 *   .spacing('sm')
 *   .refreshable(refresh)
 * ```
 */
export function ScrollView(...children: Child[]): ScrollViewNode {
  return new Node('scrollView', null, children);
}

/**
 * Makes the rows of a menu from a body that takes one props object, as a
 * React component does. The body runs only while its menu is open, inside
 * the component that presents the menu, so it may call hooks and read what a
 * closed menu should not pay for.
 *
 * ```ts
 * const PostMenu = menu(function PostMenu({ post }: { post: Post }) {
 *   const actions = usePostActions(post);
 *   return actions.map((action) => Item(action.label).icon(action.icon).onPress(action.run));
 * });
 * Menu(trigger, PostMenu({ post }))
 * ```
 */
export function menu<P extends object = Record<string, never>>(
  body: (props: P) => MenuChild,
): (...props: Record<string, never> extends P ? [props?: P] : [props: P]) => MenuContentView {
  return (...args) => new Node('menuContent', { body, props: args[0] ?? NO_PROPS }, NO_CHILDREN);
}

/**
 * What a menu's tagged rows do, from a body that takes one props object. The
 * body may call hooks: it runs only when a row is chosen, in a component
 * mounted for that choice where the menu is placed, and returns each tag's
 * action. The rows themselves stay plain data (`Item(title).tag(name)`), so a
 * closed menu costs no hook and no closure, and the system menu on iOS can be
 * given them before it opens.
 *
 * ```ts
 * const PostActions = actions(function PostActions({ post }: { post: Post }) {
 *   const router = useRouter();
 *   return { open: () => router.push(`/p/${post.id}`), copy: () => copyLink(post) };
 * });
 * Menu(MORE, Item('Open').tag('open'), Item('Copy link').icon(RiLinkM).tag('copy'))
 *   .actions(PostActions({ post }))
 * ```
 */
export function actions<P extends object = Record<string, never>>(
  body: (props: P) => MenuActionTable,
): (...props: Record<string, never> extends P ? [props?: P] : [props: P]) => MenuActionsView {
  return (...args) => new Node('menuActions', { body, props: args[0] ?? NO_PROPS }, NO_CHILDREN);
}

const NO_PROPS = Object.freeze({});

/**
 * A Lottie animation (a URL), drawn by Bloom's `Sticker`: the one Lottie path,
 * paused while its screen is not in front. `.fallback(Image(still, label))` is
 * the still it shows while loading, where it cannot play, and under reduced
 * motion; `.frame({ width })` its square edge.
 */
export function Lottie(source: string): LottieView {
  return new Node('lottie', { source }, NO_CHILDREN);
}
