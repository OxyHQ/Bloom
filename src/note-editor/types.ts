import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * Where the document stands with its store.
 *
 *   `saved`    everything the reader typed is somewhere else too
 *   `saving`   a write is in flight
 *   `offline`  the app cannot reach the store and is holding the change
 *   `error`    a write was REFUSED — the one state that is not going to fix itself
 *
 * `offline` and `error` are separate because they ask for different things from
 * the reader: one is "keep typing", the other is "stop and look".
 */
export type NoteSaveState = 'saved' | 'saving' | 'offline' | 'error';

/** The English words the header composes, for an app that is not in English. */
export interface NoteEditorHeaderLabels {
  saved?: string;
  saving?: string;
  offline?: string;
  error?: string;
  /** The word count, given the count. Default ``(n) => `${n} words` ``. */
  words?: (count: number) => string;
  /** Names the title input when there is no visible label. Default `"Title"`. */
  title?: string;
}

export interface NoteEditorHeaderProps {
  /** The document's title. Controlled — the app owns the text. */
  title: string;
  /** Called with every keystroke of the title. */
  onTitleChange?: (title: string) => void;
  /** Drawn in the title's place while it is empty. Default `"Untitled"`. */
  placeholder?: string;
  /**
   * Where the document stands with its store. Omitted, the header draws no
   * state word at all — which is right for a document that is not backed by
   * one.
   */
  saveState?: NoteSaveState;
  /** When the document was last written to, PRE-FORMATTED ("Edited 2 min ago"). */
  edited?: string;
  /** The body's length in words. The header formats it; the app counts it. */
  wordCount?: number;
  /** Stops the title being edited and dims it. */
  disabled?: boolean;
  /**
   * A read-only document: the title is not editable and NOT dimmed, because
   * nothing is broken — it is a published note, a shared one, a revision.
   */
  readOnly?: boolean;
  /** The trailing slot on the title line — a share button, a menu, a `ButtonGroup`. */
  actions?: ReactNode;
  /** Names the header region. Default `"Note"`. */
  accessibilityLabel?: string;
  labels?: NoteEditorHeaderLabels;
  style?: StyleProp<ViewStyle>;
  /** Overrides the title's own type. The header owns its size; this is for a display face. */
  titleStyle?: StyleProp<TextStyle>;
  testID?: string;
}

/** One formatting action in the toolbar. */
export interface NoteEditorAction {
  /** Stable key. Also the menu row's key. */
  key: string;
  /** The action in words. Names the icon-only button AND labels the overflow row. */
  label: string;
  /** The glyph, imported from its own subpath by the app. */
  icon: BloomIconComponent;
  /** Run the action. The editable surface is the app's, so what this does is too. */
  onPress: () => void;
  /**
   * A TOGGLE's state — bold is on, the block is a list. Setting it (even to
   * `false`) makes the action a toggle: it announces `aria-pressed` and
   * `accessibilityState.pressed`, and collapses into a CHECKABLE menu row.
   * Leave it `undefined` for a one-shot action (attach, link).
   */
  active?: boolean;
  disabled?: boolean;
  /**
   * Never collapse this one. Bold and the list styles usually earn it; attach
   * and link usually do not. More `alwaysVisible` actions than the row can hold
   * will overflow it — the toolbar cannot collapse what it was told to keep.
   */
  alwaysVisible?: boolean;
}

/** The English words the toolbar composes. */
export interface NoteEditorToolbarLabels {
  /** Names the overflow button. Default `"More formatting"`. */
  more?: string;
  /** Names the overflow menu surface. Default `"More formatting"`. */
  moreMenu?: string;
}

export interface NoteEditorToolbarProps {
  /** The actions, in the order they are drawn. */
  actions: ReadonlyArray<NoteEditorAction>;
  /** The `ButtonGroup` rung. Default `medium` (34px items); `small` is 30. */
  size?: 'medium' | 'small';
  /** Disables every action and the overflow, without each caller writing it per action. */
  disabled?: boolean;
  /** Names the toolbar. Required in substance — a row of glyphs has no name of its own. */
  accessibilityLabel: string;
  labels?: NoteEditorToolbarLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
