/**
 * A `screen()` body drawn as a Bloom `Screen`: the body's root view is its
 * content, and the root's screen modifiers are its chrome. The header is
 * Bloom's PageHeader (on iOS, inside a native stack, the system navigation
 * bar), a header node of the screen's own, or none; each `.sheet()` is a
 * sheet over it (see sheet-bloom.tsx: Bloom's Dialog or BottomSheet, the system
 * sheet on iOS).
 *
 * Nothing it reaches imports expo-router (iOS's header asks for it lazily, in a
 * `try`, as the language's root does): it is also
 * `@oxy.so/bloom-language/screen-host`, for a navigator that is not
 * expo-router's (the Bloom router of a Bloom build). A test walks its imports
 * (__tests__/screen-host.test.tsx).
 */
import {
  type ComponentProps,
  createElement,
  type ReactElement,
  type ReactNode,
  useMemo,
} from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@oxy.so/bloom/screen';
import { BloomColorScope } from '@oxy.so/bloom/theme';

import { Header } from '../primitives';
import {
  isNode,
  Node,
  type Child,
  type HeadingLevel,
  type Modifier,
  type ReselectTop,
  type ScreenFooter,
  type ScreenHeader,
  type ViewNodeProps,
} from '../node';
import { valuesOf } from '../platform/values';
import { GROUP_MODIFIERS } from '../generated/spec.generated';
import { ink, flexStyle, type RoleRef } from '../style';
import { isSurfaceFill, surfaced, themeColor, withSurface } from '../paint';
import { useTheme } from '@oxy.so/bloom/theme';
import type { InkToken } from '../tokens';
import { toElement } from '../render';
import {
  resolveSpace,
  type ChromePlacement,
  type FlexName,
  type ColorPreset,
  type NavigationScope,
  type ScreenKind,
  type ScreenScroll,
  type ScrollEdge,
  type SpaceToken,
  type TitleDisplay,
} from '../tokens';
import { useSystemBar } from './screen-header';
import { SheetHost } from './sheet-host';

interface ScreenChrome {
  header: Node | null;
  custom: boolean;
  footer: Extract<Modifier, { kind: 'footer' }> | undefined;
  action: Extract<Modifier, { kind: 'floatingAction' }> | undefined;
  values: Record<string, unknown>;
  sheets: Extract<Modifier, { kind: 'sheet' }>[];
  onReselect: (() => void) | undefined;
  /** The root's testID, which names the screen (Bloom Screen's own). */
  testID: string | undefined;
  /** The root without it: the screen's content. */
  content: Child;
}

/** The chrome a body's root declares. */
function chromeOf(root: Child, back: (() => void) | undefined): ScreenChrome {
  const chrome: ScreenChrome = {
    header: null,
    custom: false,
    footer: undefined,
    action: undefined,
    values: {},
    sheets: [],
    onReselect: undefined,
    testID: undefined,
    content: root,
  };
  if (!isNode(root)) return chrome;
  const values = valuesOf(root);
  chrome.values = values;
  for (const modifier of root.modifiers) {
    if (modifier.kind === 'sheet') chrome.sheets.push(modifier);
    else if (modifier.kind === 'footer') chrome.footer = modifier;
    else if (modifier.kind === 'floatingAction') chrome.action = modifier;
    else if (modifier.kind === 'testID') chrome.testID = modifier.value;
  }
  if (chrome.testID !== undefined) {
    chrome.content = new Node(
      root.kind,
      root.props,
      root.children,
      root.modifiers.filter((modifier) => modifier.kind !== 'testID'),
    );
  }
  chrome.onReselect = values.onReselect as (() => void) | undefined;
  const header = values.header as ScreenHeader | undefined;
  if (header === false) return chrome;
  if (header !== undefined && typeof header !== 'string') {
    chrome.header = header as Node;
    // A Header is the system bar on iOS in a native stack; `.inPage()` keeps it the Screen's own.
    chrome.custom = header.kind !== 'header' || valuesOf(header as Node).inPage === true;
    return chrome;
  }
  let composed = Header(values.title as string | undefined).presentation(header ?? 'floating');
  const display = values.titleDisplay as TitleDisplay | undefined;
  if (display) composed = composed.titleDisplay(display);
  if (values.subtitle !== undefined) composed = composed.subtitle(values.subtitle as string);
  if (values.toolbar) composed = composed.toolbar(...(values.toolbar as Child[]));
  if (values.toolbarLeading)
    composed = composed.toolbarLeading(...(values.toolbarLeading as Child[]));
  if ('onBack' in values)
    composed = composed.onBack(values.onBack as (() => void) | null | undefined);
  else if (back) composed = composed.onBack(back);
  if (values.backLabel !== undefined) composed = composed.backLabel(values.backLabel as string);
  if (values.headingLevel !== undefined) {
    composed = composed.headingLevel(values.headingLevel as HeadingLevel);
  }
  if (values.scrollEdge !== undefined)
    composed = composed.scrollEdge(values.scrollEdge as ScrollEdge);
  chrome.header = composed as unknown as Node;
  return chrome;
}

/** What the navigator drawing a screen hands it, beyond the screen's own view. */
export interface ScreenHostOptions {
  /**
   * The Back the screen's header offers when its root says none
   * (`.onBack()`): the navigator's own, for a screen pushed over another.
   * Omitted, the header's Back is Bloom's (`BloomProvider back`, a panel's
   * history) as it is for any Screen. A root's `.onBack()` wins, and
   * `.onBack(null)` shows none.
   */
  readonly back?: () => void;
  /**
   * A root that is a `view()` is drawn through: its body runs as the screen's
   * component and its body's root is the screen (its chrome the screen's), as
   * a SwiftUI view's `navigationTitle` is its navigation stack's. Modifiers on
   * the view itself come after its body's. A Bloom build's screens are views
   * (`struct PostScreen: View`), so the Bloom router draws them so. Without
   * it, a view is the Screen's content and its body's chrome draws nothing,
   * as under `screen()`.
   */
  readonly throughViews?: boolean;
}

/**
 * What a `screen()` body's branch draws: a Bloom `Screen` around its root, or
 * the root as it is when it is a surface of its own (`.ownScreen()`), or
 * nothing for `null`.
 *
 * ```ts
 * // a navigator of its own: each route's view as a Bloom screen
 * function Route({ route }) {
 *   return drawScreen(destination(route), { back: depth > 0 ? pop : undefined });
 * }
 * ```
 */
export function drawScreen(root: Child, options?: ScreenHostOptions): ReactNode {
  if (root === null || root === undefined || root === false) return null;
  if (options?.throughViews && isNode(root) && root.kind === 'view') {
    const view = root.props as ViewNodeProps;
    if (view.component !== undefined && view.body)
      return <ViewScreen body={view.body} props={view.props} outer={root} options={options} />;
  }
  if (!isNode(root) || valuesOf(root).ownScreen !== true)
    return <ScreenHost root={root} back={options?.back} />;
  const sheets: Extract<Modifier, { kind: 'sheet' }>[] = [];
  for (const modifier of root.modifiers) if (modifier.kind === 'sheet') sheets.push(modifier);
  // The root is the surface: what the Screen would take is dropped, what it would sit in is drawn.
  const content = new Node(
    root.kind,
    root.props,
    root.children,
    root.modifiers.filter((modifier) => !AROUND_A_SCREEN.has(modifier.kind)),
  );
  const surface = wrapped(root, toElement(content));
  return sheets.length === 0 ? (
    surface
  ) : (
    <>
      {surface}
      {sheetsOf(sheets)}
    </>
  );
}

/**
 * A `view()` drawn as a screen (`throughViews`): its body runs here, as the
 * view's component would run it, and its root is drawn as the screen, the
 * view's own modifiers after its body's.
 */
function ViewScreen({
  body,
  props,
  outer,
  options,
}: {
  body: NonNullable<Extract<ViewNodeProps, { component: object }>['body']>;
  props: object;
  outer: Node;
  options: ScreenHostOptions;
}): ReactNode {
  const built = body(props);
  const root = typeof built === 'function' ? built() : built;
  const drawn =
    outer.modifiers.length > 0 && isNode(root)
      ? new Node(root.kind, root.props, root.children, [...root.modifiers, ...outer.modifiers])
      : root;
  return drawScreen(drawn, options);
}

/**
 * A screen root's own modifiers (a `Group`'s, which is a screen's children:
 * its chrome and what it sits in), less its identity and test id, which are
 * the view's.
 */
const AROUND_A_SCREEN: ReadonlySet<string> = new Set(
  GROUP_MODIFIERS.filter((name) => name !== 'id' && name !== 'testID'),
);

/**
 * A screen's view as a Bloom `Screen`: its root's chrome (title, toolbar,
 * header, footer, sheets, …) drawn around its content. `drawScreen` is the
 * same with `.ownScreen()` and `null` roots answered first.
 */
export function ScreenHost({ root, back }: { root: Child } & ScreenHostOptions) {
  const chrome = chromeOf(root, back);
  // Undecided (the navigator is read after the first render): no header yet, in the page or the bar.
  const bar = useSystemBar();
  const system = bar === true && chrome.header !== null && !chrome.custom;
  const header = chrome.header ? toElement(chrome.header) : undefined;
  const footer = chrome.footer;
  const footerOptions = footer?.options as ScreenFooter | undefined;
  const action = chrome.action;
  const values = chrome.values;
  const clearance = values.contentClearance as SpaceToken | undefined;
  const headerHeight = values.initialHeaderHeight as SpaceToken | undefined;
  const footerHeight = values.initialFooterHeight as SpaceToken | undefined;
  const top = values.reselectTop as ReselectTop | undefined;
  const reselect =
    chrome.onReselect || top
      ? { refresh: chrome.onReselect, isAtTop: top?.isAtTop, scrollToTop: top?.scrollToTop }
      : undefined;
  const background = values.screenBackground as InkToken | undefined;
  const props: ComponentProps<typeof Screen> = {
    testID: chrome.testID,
    kind: values.screenKind as ScreenKind | undefined,
    scroll: values.screenScroll as ScreenScroll | undefined,
    documentScroll: values.documentScroll as boolean | undefined,
    header: bar === undefined || system ? undefined : header,
    headerPlacement: values.headerPlacement as ChromePlacement | undefined,
    underlay: values.underlay ? toElement(values.underlay as Child) : undefined,
    primaryAction: action ? toElement(action.content) : undefined,
    primaryActionPlacement: action?.options?.placement,
    primaryActionVisibility: action?.options?.visibility,
    contentClearance: clearance === undefined ? undefined : resolveSpace(clearance),
    navigationScope: values.navigationScope as NavigationScope | undefined,
    colorPreset: values.colorPreset as ColorPreset | undefined,
    seed: values.seed as string | undefined,
    active: values.screenActive as boolean | undefined,
    replacesBottomBar: values.replacesBottomBar as boolean | undefined,
    headerHeight: headerHeight === undefined ? undefined : resolveSpace(headerHeight),
    bottomBarHeight: footerHeight === undefined ? undefined : resolveSpace(footerHeight),
    reselect,
    bottomBar: footer ? toElement(footer.content) : undefined,
    bottomBarPlacement: footerOptions?.placement,
    bottomBarKeyboardBehavior: footerOptions?.keyboard,
    children: toElement(chrome.content),
  };
  const painted = background === undefined ? undefined : ink(background);
  // A fill of its own is drawn by the leaf that reads the theme, `OnSurface` when it is the surface fill.
  const screen =
    painted === undefined
      ? createElement(Screen, props)
      : draw(
          ...surfaced(
            ScreenFill,
            { ...props, painted },
            typeof painted !== 'string' && isSurfaceFill(painted.role),
          ),
        );
  return (
    <>
      {wrapped(root, screen)}
      {system ? header : null}
      {sheetsOf(chrome.sheets)}
    </>
  );
}

/** `createElement` over a leaf chosen at render (`surfaced`), with the props assembled for it. */
const draw = createElement as (type: unknown, props: Record<string, unknown>) => ReactElement;

/**
 * A Screen with a fill of its own (`.screenBackground()`): its colour as Bloom's
 * theme gives it (the surface fill handed in `OnSurface`), the leaf that reads
 * the theme, so a theme switch re-renders it and not the content handed in.
 */
function ScreenFill({
  painted,
  surface,
  ...props
}: ComponentProps<typeof Screen> & { painted: RoleRef | string; surface?: string }): ReactElement {
  const fill = themeColor(withSurface(useTheme().colors, surface), painted);
  const style = useMemo(() => ({ backgroundColor: fill }), [fill]);
  return <Screen {...props} style={style} />;
}

/** What `.keyboardAvoiding()` draws: React Native's own fill and, on iOS, a padding (elsewhere the view resizes). */
const KEYBOARD_FILL = { flex: 1 } as const;
const KEYBOARD_BEHAVIOR = Platform.OS === 'ios' ? 'padding' : 'height';
/** A flex token's fill, as `.flex()` writes it, once per token. */
const fills = new Map<FlexName, object>();
function flexFill(name: FlexName): object {
  let fill = fills.get(name);
  if (fill === undefined) {
    const style = {};
    flexStyle(style, name);
    fill = Object.freeze(style);
    fills.set(name, fill);
  }
  return fill;
}

/**
 * The Screen inside what the root's `.colorScope()`, `.keyboardAvoiding()`
 * and `.provider()` draw around it, in chain order: each wraps the ones
 * before it, as SwiftUI's modifiers do. Its header and sheets stay beside it.
 */
function wrapped(root: Child, screen: ReactElement): ReactElement {
  if (!isNode(root)) return screen;
  let out = screen;
  for (const modifier of root.modifiers) {
    if (modifier.kind === 'colorScope')
      out = (
        <BloomColorScope mode={modifier.value} asChild>
          {out}
        </BloomColorScope>
      );
    else if (modifier.kind === 'keyboardAvoiding')
      out = (
        <KeyboardAvoidingView
          style={modifier.value === undefined ? KEYBOARD_FILL : flexFill(modifier.value)}
          behavior={KEYBOARD_BEHAVIOR}
        >
          {out}
        </KeyboardAvoidingView>
      );
    else if (modifier.kind === 'provider' && modifier.value !== undefined) {
      const { component, props } = modifier.value;
      out = createElement(component, props, out);
    }
  }
  return out;
}

/** Each `.sheet()` modifier, in order: a sheet's place among them is its identity. */
function sheetsOf(sheets: readonly Extract<Modifier, { kind: 'sheet' }>[]): ReactNode[] {
  const out: ReactNode[] = [];
  for (let i = 0; i < sheets.length; i++) {
    const sheet = sheets[i] as Extract<Modifier, { kind: 'sheet' }>;
    out.push(
      <SheetHost
        key={`sheet${i}`}
        open={sheet.open}
        content={sheet.content}
        options={sheet.options}
      />,
    );
  }
  return out;
}
