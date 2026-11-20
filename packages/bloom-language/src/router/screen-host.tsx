/**
 * A `screen()` body drawn as a Bloom `Screen`: the body's root view is its
 * content, and the root's screen modifiers are its chrome. The header is
 * Bloom's PageHeader (on iOS, inside a native stack, the system navigation
 * bar), a header node of the screen's own, or none; each `.sheet()` is Bloom's
 * Dialog, from the bottom and centred from `md` (Mention's responsive sheet).
 */
import { useRef, type ReactNode } from 'react';
import { Dialog } from '@oxy.so/bloom/dialog';
import { Screen } from '@oxy.so/bloom/screen';

import { Header } from '../primitives';
import {
  isNode,
  Node,
  type Child,
  type HeadingLevel,
  type Modifier,
  type ScreenHeader,
  type SheetOptions,
} from '../node';
import { valuesOf } from '../platform/values';
import { toElement } from '../render';
import type { TitleDisplay } from '../tokens';
import { useSystemBar } from './screen-header';

const SHEET_PLACEMENT = { base: 'bottom', md: 'center' } as const;

interface ScreenChrome {
  header: Node | null;
  custom: boolean;
  footer: Extract<Modifier, { kind: 'footer' }> | undefined;
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
    sheets: [],
    onReselect: undefined,
    testID: undefined,
    content: root,
  };
  if (!isNode(root)) return chrome;
  const values = valuesOf(root);
  for (const modifier of root.modifiers) {
    if (modifier.kind === 'sheet') chrome.sheets.push(modifier);
    else if (modifier.kind === 'footer') chrome.footer = modifier;
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
  chrome.header = composed as unknown as Node;
  return chrome;
}

export function ScreenHost({ root }: { root: Child }) {
  const chrome = chromeOf(root);
  const system = useSystemBar() && chrome.header !== null && !chrome.custom;
  const header = chrome.header ? toElement(chrome.header) : undefined;
  const footer = chrome.footer;
  return (
    <>
      <Screen
        testID={chrome.testID}
        scroll="auto"
        header={system ? undefined : header}
        reselect={chrome.onReselect ? { refresh: chrome.onReselect } : undefined}
        bottomBar={footer ? toElement(footer.content) : undefined}
        bottomBarPlacement={footer?.options?.placement}
        bottomBarKeyboardBehavior={footer?.options?.keyboard}
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
      <ScreenSheet
        key={`sheet${i}`}
        open={sheet.open}
        content={sheet.content}
        options={sheet.options}
      />,
    );
  }
  return out;
}

/** One `.sheet()`: its content is built while it is open, and stays as it was while it closes. */
function ScreenSheet({
  open,
  content,
  options,
}: {
  open: boolean;
  content: () => Child;
  options: SheetOptions | undefined;
}) {
  const shown = useRef<ReactNode>(null);
  if (open) shown.current = toElement(content());
  return (
    <Dialog
      open={open}
      onClose={options?.onDismiss}
      title={options?.title}
      placement={SHEET_PLACEMENT}
    >
      {shown.current}
    </Dialog>
  );
}
