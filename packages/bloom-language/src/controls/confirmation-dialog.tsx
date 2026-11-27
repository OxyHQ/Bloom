import type { ReactElement, ReactNode } from 'react';

import type { Binding } from '../binding';
import { Node, type Child, type MenuActionsView, type MenuChild } from '../node';
import type { ENUMS } from '../generated/spec.generated';
import type { PresentedNode } from './overlays';

export type ConfirmationDialogKind = 'confirmationDialog';
/** Whether the dialog shows its title: the platform's choice, or always, or never. */
export type TitleVisibility = (typeof ENUMS.titleVisibility)[number];

/**
 * SwiftUI's `confirmationDialog`: a title, a message, and the actions it
 * offers, presented from the view that asks (`.confirmationDialog(isPresented,
 * ConfirmationDialog(...))`). Its rows are menu rows (`Item`), tagged or with
 * their handlers; every one dismisses it, and dismissing it (outside, back,
 * Escape, or the system's own cancel) is its cancel.
 */
export interface ConfirmationDialogView extends PresentedNode {
  /** Keys the view among its siblings (a list's item, a branch): its identity. */
  id(value: string | number): ConfirmationDialogView;
  /** The text under the title. */
  message(value: string): ConfirmationDialogView;
  /** Whether the title shows: `automatic` (the platform's choice), `visible` or `hidden`. */
  titleVisibility(value: TitleVisibility): ConfirmationDialogView;
  /** What its tagged rows do, as a `Menu`'s: an `actions()` view, run only when a row is chosen. */
  actions(value: MenuActionsView): ConfirmationDialogView;
  /** An explicit cancel row, with this label, where the platform draws none of its own. */
  cancelLabel(value: string): ConfirmationDialogView;
  testID(value: string): ConfirmationDialogView;
}

/** A confirmation dialog's title and its rows (`Item`s). */
export function ConfirmationDialog(title: string, ...rows: MenuChild[]): ConfirmationDialogView {
  return new Node('confirmationDialog', { title }, rows as readonly Child[]);
}

/** What each platform's confirmation host is handed. */
export interface ConfirmationHostProps {
  /** The view that presents it, as drawn: the dialog grows out of it where the platform can. */
  presenting: ReactElement;
  isPresented: Binding<boolean>;
  dialog: Node;
  /** Draws a language child (a row's glyph) where the view is. */
  render: (child: Child) => ReactNode;
}

/** A confirmation dialog's own values. */
export function confirmationValues(dialog: Node): {
  title: string;
  message: string | undefined;
  visibility: TitleVisibility;
  actions: Child | undefined;
  cancelLabel: string | undefined;
  testID: string | undefined;
} {
  const own: Record<string, unknown> = {};
  for (const modifier of dialog.modifiers)
    own[modifier.kind] = (modifier as { value?: unknown }).value;
  return {
    title: (dialog.props as { title: string }).title,
    message: own.message as string | undefined,
    visibility: (own.titleVisibility as TitleVisibility | undefined) ?? 'automatic',
    actions: own.actions as Child | undefined,
    cancelLabel: own.cancelLabel as string | undefined,
    testID: own.testID as string | undefined,
  };
}
