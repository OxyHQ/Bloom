/**
 * A `screen()` body drawn as a Bloom `Screen`: the body's root view is its
 * content, and the root's screen modifiers are its chrome. The header is
 * Bloom's PageHeader (on iOS, inside a native stack, the system navigation
 * bar), a header node of the screen's own, or none; each `.sheet()` is a
 * sheet over it (see sheet-bloom.tsx: Bloom's Dialog or BottomSheet, the system
 * sheet on iOS).
 */
import type { ReactNode } from 'react';
import { Screen } from '@oxy.so/bloom/screen';

import { Header } from '../primitives';
import {
  isNode,
  Node,
  type Child,
  type HeadingLevel,
  type Modifier,
  type ScreenFooter,
  type ScreenHeader,
} from '../node';
import { valuesOf } from '../platform/values';
import { toElement } from '../render';
import {
  resolveSpace,
  type ChromePlacement,
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
function chromeOf(root: Child): ScreenChrome {
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
    chrome.custom = header.kind !== 'header';
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
  if (values.backLabel !== undefined) composed = composed.backLabel(values.backLabel as string);
  if (values.headingLevel !== undefined) {
    composed = composed.headingLevel(values.headingLevel as HeadingLevel);
  }
  if (values.scrollEdge !== undefined)
    composed = composed.scrollEdge(values.scrollEdge as ScrollEdge);
  chrome.header = composed as unknown as Node;
  return chrome;
}

export function ScreenHost({ root }: { root: Child }) {
  const chrome = chromeOf(root);
  const system = useSystemBar() && chrome.header !== null && !chrome.custom;
  const header = chrome.header ? toElement(chrome.header) : undefined;
  const footer = chrome.footer;
  const footerOptions = footer?.options as ScreenFooter | undefined;
  const action = chrome.action;
  const values = chrome.values;
  const clearance = values.contentClearance as SpaceToken | undefined;
  return (
    <>
      <Screen
        testID={chrome.testID}
        kind={values.screenKind as ScreenKind | undefined}
        scroll={values.screenScroll as ScreenScroll | undefined}
        documentScroll={values.documentScroll as boolean | undefined}
        header={system ? undefined : header}
        headerPlacement={values.headerPlacement as ChromePlacement | undefined}
        underlay={values.underlay ? toElement(values.underlay as Child) : undefined}
        primaryAction={action ? toElement(action.content) : undefined}
        primaryActionPlacement={action?.options?.placement}
        primaryActionVisibility={action?.options?.visibility}
        contentClearance={clearance === undefined ? undefined : resolveSpace(clearance)}
        navigationScope={values.navigationScope as NavigationScope | undefined}
        reselect={chrome.onReselect ? { refresh: chrome.onReselect } : undefined}
        bottomBar={footer ? toElement(footer.content) : undefined}
        bottomBarPlacement={footerOptions?.placement}
        bottomBarKeyboardBehavior={footerOptions?.keyboard}
      >
        {toElement(chrome.content)}
      </Screen>
      {system ? header : null}
      {sheetsOf(chrome.sheets)}
    </>
  );
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
