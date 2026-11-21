/**
 * The settings pages' own rows, each Bloom's (`@oxy.so/bloom/settings-modal`):
 * a section of rows, a value, a compact select, and the text and date fields
 * that commit what they edit. A row's value is a `Binding`, as an input's is.
 */
import {
  SettingsDateField as BloomSettingsDateField,
  SettingsSection as BloomSettingsSection,
  SettingsSelect as BloomSettingsSelect,
  SettingsTextField as BloomSettingsTextField,
  SettingsValueField,
  type SettingsTextFieldProps,
} from '@oxy.so/bloom/settings-modal';
import type { BloomSize } from '@oxy.so/bloom/appearance';

import type { Binding } from '../binding';
import { Node, type Child, type IconComponent, type ViewModifiers, type ViewNode } from '../node';
import { resolveSpace, type SpaceToken } from '../tokens';
import { defined } from '../chrome/defined';
import type { ControlRenderer } from './draw';

/** Settings rows: a section, a value, a select, a text field and a date field. */
export type SettingsKind =
  | 'settingsSection'
  | 'settingsValue'
  | 'settingsSelect'
  | 'settingsTextField'
  | 'settingsDateField';

/** The keyboards a settings text field offers (Bloom's `keyboardType`). */
export type SettingsKeyboard = NonNullable<SettingsTextFieldProps['keyboardType']>;
/** What a settings text field autofills (Bloom's `autoComplete`). */
export type SettingsAutofill = NonNullable<SettingsTextFieldProps['autoComplete']>;
/** A choice of a `SettingsSelect`: Bloom's `items`. */
export interface SettingsChoice<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** Bloom `SettingsSection`: a label over a card of rows, with a trailing action. */
export interface SettingsSectionView extends ViewModifiers<SettingsSectionView> {
  /** A muted line under the label. */
  description(value: string): SettingsSectionView;
  /** An action at the header's end, bottom-aligned with the label (Bloom's `action`). */
  trailing(...value: Child[]): SettingsSectionView;
  /** The label's inset (12 by default; Bloom's Tools page uses 8). */
  inset(value: SpaceToken): SettingsSectionView;
}
/** Bloom `SettingsValueField`: a value in a row's field, with its glyph. */
export interface SettingsValueView extends ViewModifiers<SettingsValueView> {
  icon(value: IconComponent): SettingsValueView;
  /** In the secondary ink (a truncated device id). */
  muted(value?: boolean): SettingsValueView;
}
/** Bloom `SettingsSelect`: a row's compact choice of one of a few values. */
export interface SettingsSelectView extends ViewModifiers<SettingsSelectView> {
  /** Padded to sit inside a row (default); `false` keeps a field's size. */
  compact(value?: boolean): SettingsSelectView;
  /** The trigger's size; the nearest Bloom scope's by default. */
  size(value: BloomSize): SettingsSelectView;
  disabled(value?: boolean): SettingsSelectView;
  /** The web dropdown's width; the native sheet sizes itself. */
  width(value: SpaceToken): SettingsSelectView;
}
/** Bloom `SettingsTextField`: it edits a draft and commits it on submit or blur. */
export interface SettingsTextFieldView extends ViewNode {
  icon(value: IconComponent): SettingsTextFieldView;
  placeholder(value: string): SettingsTextFieldView;
  keyboard(value: SettingsKeyboard): SettingsTextFieldView;
  /** What the system autofills it with. */
  contentType(value: SettingsAutofill): SettingsTextFieldView;
  disabled(value?: boolean): SettingsTextFieldView;
  /** The modal's saved toast on a commit (shown by default). */
  savedToast(value?: boolean): SettingsTextFieldView;
  testID(value: string): SettingsTextFieldView;
}
/** Bloom `SettingsDateField`: a date, picked in a calendar. */
export interface SettingsDateFieldView extends ViewNode {
  minDate(value: Date): SettingsDateFieldView;
  maxDate(value: Date): SettingsDateFieldView;
  /** How the date reads; the locale's long date by default. */
  dateFormat(value: (date: Date) => string): SettingsDateFieldView;
  /** The modal's saved toast on a change (shown by default). */
  savedToast(value?: boolean): SettingsDateFieldView;
  testID(value: string): SettingsDateFieldView;
}

/** A settings section: its label (none for an unlabelled card) and its rows. */
export function SettingsSection(label: string | undefined, ...rows: Child[]): SettingsSectionView {
  return new Node('settingsSection', { label }, rows) as unknown as SettingsSectionView;
}
/** A value shown in a settings row's field. */
export function SettingsValue(text: string): SettingsValueView {
  return new Node('settingsValue', { text }, []) as unknown as SettingsValueView;
}
/** A settings row's compact select: its name, the selection and its choices. */
export function SettingsSelect<T extends string>(
  label: string,
  selection: Binding<T>,
  items: ReadonlyArray<SettingsChoice<T>>,
): SettingsSelectView {
  return new Node(
    'settingsSelect',
    { label, selection, items },
    [],
  ) as unknown as SettingsSelectView;
}
/** A settings text field: its name and the committed text (a commit writes the binding). */
export function SettingsTextField(label: string, text: Binding<string>): SettingsTextFieldView {
  return new Node('settingsTextField', { label, text }, []) as unknown as SettingsTextFieldView;
}
/** A settings date field: its name and the date. */
export function SettingsDateField(label: string, date: Binding<Date>): SettingsDateFieldView {
  return new Node('settingsDateField', { label, date }, []) as unknown as SettingsDateFieldView;
}

function space(value: SpaceToken | undefined): number | undefined {
  return value === undefined ? undefined : resolveSpace(value);
}

/** The renderer of each kind in this family. */
export const SETTINGS: Partial<Record<SettingsKind, ControlRenderer>> = {
  settingsSection: (draw) => {
    const { label } = draw.node.props as { label: string | undefined };
    const trailing = draw.own('trailing')?.value as readonly Child[] | undefined;
    return draw.component(
      BloomSettingsSection,
      {
        ...draw.props(),
        ...defined({
          label,
          description: draw.own('description')?.value,
          action: trailing && trailing.length > 0 ? draw.render(trailing) : undefined,
          inset: space(draw.own('inset')?.value as SpaceToken | undefined),
          testID: draw.testID,
        }),
      },
      ...draw.children(draw.node.children),
    );
  },
  settingsValue: (draw) =>
    draw.component(
      SettingsValueField,
      {
        ...draw.props(),
        ...defined({
          icon: draw.own('icon')?.value,
          muted: draw.own('muted')?.value,
          testID: draw.testID,
        }),
      },
      (draw.node.props as { text: string }).text,
    ),
  settingsSelect: (draw) => {
    const { label, selection, items } = draw.node.props as {
      label: string;
      selection: Binding<string>;
      items: ReadonlyArray<SettingsChoice<string>>;
    };
    return draw.component(BloomSettingsSelect, {
      ...draw.props(),
      label,
      value: selection[0],
      onChange: selection[1],
      items,
      ...defined({
        compact: draw.own('compact')?.value,
        size: draw.own('size')?.value,
        disabled: draw.own('disabled')?.value,
        width: space(draw.own('width')?.value as SpaceToken | undefined),
        testID: draw.testID,
      }),
    });
  },
  settingsTextField: (draw) => {
    const { label, text } = draw.node.props as { label: string; text: Binding<string> };
    return draw.component(BloomSettingsTextField, {
      key: draw.key,
      label,
      value: text[0],
      onCommit: text[1],
      ...defined({
        icon: draw.own('icon')?.value,
        placeholder: draw.own('placeholder')?.value,
        keyboardType: draw.own('keyboard')?.value,
        autoComplete: draw.own('contentType')?.value,
        disabled: draw.own('disabled')?.value,
        showSavedToast: draw.own('savedToast')?.value,
        testID: draw.testID,
      }),
    });
  },
  settingsDateField: (draw) => {
    const { label, date } = draw.node.props as { label: string; date: Binding<Date> };
    return draw.component(BloomSettingsDateField, {
      key: draw.key,
      label,
      value: date[0],
      onChange: date[1],
      ...defined({
        minDate: draw.own('minDate')?.value,
        maxDate: draw.own('maxDate')?.value,
        formatDate: draw.own('dateFormat')?.value,
        showSavedToast: draw.own('savedToast')?.value,
        testID: draw.testID,
      }),
    });
  },
};
