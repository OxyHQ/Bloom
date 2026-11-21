/**
 * iOS: a `.sheet()` is the system sheet (SwiftUI's `sheet`, through
 * `@expo/ui`'s `BottomSheet`), its content a React view inside it. A
 * `BottomSheet` node's options become the presentation's: `dragIndicator` the
 * drag indicator, `interactiveDismissDisabled` the same, `sizing('fill')` the
 * large detent (otherwise the sheet fits its content). The system sheet has
 * no title bar: a `.sheet()`'s `title` names it for assistive technology only.
 * Without `@expo/ui`, Bloom's sheet (see sheet-bloom.tsx).
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
import { useRef, type ComponentType, type ReactNode } from 'react';
import { useTheme } from '@oxy.so/bloom/theme';

import type { Child, Modifier, Node } from '../node';
import { valuesOf } from '../platform/values';
import { toElement } from '../render';
import type { DragIndicator, SheetSizing } from '../tokens';
import {
  bottomSheetOf,
  SheetHost as BloomSheetHost,
  useSheetContent,
  type SheetHostProps,
} from './sheet-bloom';

type Detent = 'medium' | 'large' | { fraction: number } | { height: number };

interface SwiftUI {
  Host: ComponentType<{
    matchContents?: boolean;
    colorScheme?: 'light' | 'dark';
    children?: ReactNode;
  }>;
  BottomSheet: ComponentType<{
    isPresented: boolean;
    onIsPresentedChange: (isPresented: boolean) => void;
    fitToContents?: boolean;
    children?: ReactNode;
  }>;
  Group: ComponentType<{ modifiers?: unknown[]; children?: ReactNode }>;
  RNHostView: ComponentType<{ matchContents?: boolean; children: ReactNode }>;
}
interface Modifiers {
  presentationDetents: (detents: Detent[]) => unknown;
  presentationDragIndicator: (visibility: 'automatic' | 'visible' | 'hidden') => unknown;
  interactiveDismissDisabled: (isDisabled?: boolean) => unknown;
  accessibilityLabel: (label: string) => unknown;
}

let ui: { swift: SwiftUI; modifiers: Modifiers } | null | undefined;

function loadSwiftUI() {
  if (ui !== undefined) return ui;
  ui = null;
  try {
    const swift = require('@expo/ui/swift-ui') as SwiftUI;
    const modifiers = require('@expo/ui/swift-ui/modifiers') as Modifiers;
    ui = swift.BottomSheet && swift.RNHostView ? { swift, modifiers } : null;
  } catch {
    ui = null;
  }
  return ui;
}

export function SheetHost(props: SheetHostProps) {
  const loaded = loadSwiftUI();
  if (!loaded) return <BloomSheetHost {...props} />;
  return <SystemSheet {...props} swift={loaded.swift} modifiers={loaded.modifiers} />;
}

/** The presentation's own modifiers, from a `BottomSheet` node's options and the sheet's title. */
function presentationOf(sheet: Node | undefined, title: string | undefined, modifiers: Modifiers) {
  const out: unknown[] = [];
  const values = sheet ? valuesOf(sheet) : {};
  const indicator = values.dragIndicator as DragIndicator | undefined;
  if (indicator) out.push(modifiers.presentationDragIndicator(indicator));
  if (values.interactiveDismissDisabled === true) out.push(modifiers.interactiveDismissDisabled());
  if ((values.sizing as SheetSizing | undefined) === 'fill') {
    out.push(modifiers.presentationDetents(['large']));
  }
  const label = (values.label as string | undefined) ?? title;
  if (label) out.push(modifiers.accessibilityLabel(label));
  return { modifiers: out, fits: values.sizing !== 'fill' };
}

function bodyOf(shown: Child, sheet: Node | undefined): ReactNode {
  if (!sheet) return shown === null ? null : toElement(shown);
  let footer: Extract<Modifier, { kind: 'footer' }> | undefined;
  for (const modifier of sheet.modifiers) if (modifier.kind === 'footer') footer = modifier;
  return (
    <>
      {toElement(sheet.children)}
      {footer ? toElement(footer.content) : null}
    </>
  );
}

function SystemSheet({
  open,
  content,
  options,
  swift,
  modifiers,
}: SheetHostProps & { swift: SwiftUI; modifiers: Modifiers }) {
  const { isDark } = useTheme();
  const shown = useSheetContent(open, content);
  const sheet = bottomSheetOf(shown);
  const openRef = useRef(open);
  openRef.current = open;
  const presentation = presentationOf(sheet, options?.title, modifiers);
  const { Host, BottomSheet, Group, RNHostView } = swift;
  return (
    <Host matchContents colorScheme={isDark ? 'dark' : 'light'}>
      <BottomSheet
        isPresented={open}
        // The reader's swipe: the host's state still says open, so it is told.
        onIsPresentedChange={(presented) => {
          if (!presented && openRef.current) options?.onDismiss?.();
        }}
        fitToContents={presentation.fits}
      >
        <Group modifiers={presentation.modifiers}>
          <RNHostView matchContents>{bodyOf(shown, sheet)}</RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}
