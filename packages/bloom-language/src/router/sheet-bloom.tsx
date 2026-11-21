/**
 * A `.sheet()` on Android, OxyOS and the web (and on iOS without `@expo/ui`):
 * Bloom's `Dialog` from the bottom and centred from `md` (Mention's
 * responsive sheet), or, when the content is a `BottomSheet` node, Bloom's
 * `BottomSheet` with that node's options. Its content is built while it is
 * open and stays as it was while it closes.
 */
import { useEffect, useRef } from 'react';
import { BottomSheet, type BottomSheetRef } from '@oxy.so/bloom/bottom-sheet';
import { Dialog } from '@oxy.so/bloom/dialog';

import {
  isNode,
  type Child,
  type Modifier,
  type Node,
  type Progress,
  type SheetFooter,
  type SheetOptions,
} from '../node';
import { valuesOf } from '../platform/values';
import { toElement } from '../render';
import type { DragIndicator, SheetMaterial, SheetSizing } from '../tokens';

const SHEET_PLACEMENT = { base: 'bottom', md: 'center' } as const;

export interface SheetHostProps {
  open: boolean;
  content: () => Child;
  options: SheetOptions | undefined;
}

/** The content while open, and what it last was while it closes. */
export function useSheetContent(open: boolean, content: () => Child): Child {
  const shown = useRef<Child>(null);
  if (open) shown.current = content();
  return shown.current;
}

/** The `BottomSheet` node a sheet's content is, if it is one. */
export function bottomSheetOf(content: Child): Node | undefined {
  return isNode(content) && content.kind === 'bottomSheet' ? content : undefined;
}

export function SheetHost({ open, content, options }: SheetHostProps) {
  const shown = useSheetContent(open, content);
  const sheet = bottomSheetOf(shown);
  if (sheet) return <BloomBottomSheet open={open} node={sheet} onDismiss={options?.onDismiss} />;
  return (
    <Dialog
      open={open}
      onClose={options?.onDismiss}
      title={options?.title}
      placement={SHEET_PLACEMENT}
    >
      {shown === null ? null : toElement(shown)}
    </Dialog>
  );
}

/**
 * Bloom's `BottomSheet`, held open by `open` as Bloom's own Dialog holds it:
 * the sheet mounts with its open state, presents and dismisses as `open`
 * changes, and a close the sheet made itself (a drag, the backdrop, back)
 * tells the host, whose state still says open.
 */
function BloomBottomSheet({
  open,
  node,
  onDismiss,
}: {
  open: boolean;
  node: Node;
  onDismiss: (() => void) | undefined;
}) {
  const ref = useRef<BottomSheetRef>(null);
  const openRef = useRef(open);
  openRef.current = open;
  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);
  const values = valuesOf(node);
  let footer: Extract<Modifier, { kind: 'footer' }> | undefined;
  for (const modifier of node.modifiers) if (modifier.kind === 'footer') footer = modifier;
  const dismissDisabled = values.interactiveDismissDisabled as boolean | undefined;
  return (
    <BottomSheet
      ref={ref}
      open={open}
      onDismiss={() => {
        if (openRef.current) onDismiss?.();
      }}
      detached={values.detached as boolean | undefined}
      showHandle={sheetHandle(values.dragIndicator as DragIndicator | undefined)}
      material={values.material as SheetMaterial | undefined}
      scrollable={values.scrollable as boolean | undefined}
      sizing={values.sizing as SheetSizing | undefined}
      enablePanDownToClose={dismissDisabled === undefined ? undefined : !dismissDisabled}
      onDismissAttempt={values.onDismissAttempt as (() => boolean) | undefined}
      manualActivation={values.manualActivation as boolean | undefined}
      footer={footer ? toElement(footer.content) : undefined}
      footerBehavior={(footer?.options as SheetFooter | undefined)?.behavior}
      animatedProgress={values.progress as Progress | undefined}
      accessibilityLabel={values.label as string | undefined}
    >
      {toElement(node.children)}
    </BottomSheet>
  );
}

function sheetHandle(indicator: DragIndicator | undefined): boolean | undefined {
  return indicator === undefined ? undefined : indicator === 'visible';
}
