import type { ReactNode } from 'react';
import type { BloomImageSource } from '@oxy.so/bloom/image';

import {
  Node,
  type ActionBarView,
  type ActionGroupView,
  type ActionOptions,
  type ActionView,
  type AvatarOptions,
  type AvatarView,
  type BottomBarView,
  type ButtonView,
  type Child,
  type EmbedView,
  type FabView,
  type HeaderView,
  type MenuChild,
  type MenuActionTable,
  type MenuActionsView,
  type MenuContentView,
  type MenuDividerView,
  type MenuItemView,
  type MenuSectionView,
  type MenuSubmenuView,
  type MenuView,
  type TabView,
  type IconComponent,
  type IconView,
  type ImageView,
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

/** A line between rows. */
export function Divider(): MenuDividerView {
  return new Node('menuDivider', null, NO_CHILDREN);
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
