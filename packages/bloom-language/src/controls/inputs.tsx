import {
  type ComponentRef,
  createElement,
  type ReactElement,
  type RefObject,
  useEffect,
  useRef,
} from 'react';
import type { TextInput } from 'react-native';
import type { BloomSize, BloomTone } from '@oxy.so/bloom/appearance';
import { Checkbox as BloomCheckbox } from '@oxy.so/bloom/checkbox';
import { Field as BloomField } from '@oxy.so/bloom/field';
import { Label as BloomLabel } from '@oxy.so/bloom/label';
import { RadioGroup as BloomRadioGroup } from '@oxy.so/bloom/radio';
import { Search as BloomSearch, type SearchToken } from '@oxy.so/bloom/search';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@oxy.so/bloom/select';
import { Switch } from '@oxy.so/bloom/switch';
import {
  TextField as BloomTextField,
  TextFieldGhost,
  TextFieldIcon,
  TextFieldInput,
  TextFieldPrefix,
  TextFieldSuffix,
} from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';
import { useThemePaint } from '@oxy.so/bloom/theme';

import type { Binding } from '../binding';
import { COLORS, type ENUMS } from '../generated/spec.generated';
import {
  type ButtonView,
  type Child,
  type IconComponent,
  isNode,
  Node,
  type ViewModifiers,
  type ViewNode,
} from '../node';
import type { ColorName } from '../tokens';
import { boxAs, type ControlDraw, type ControlRenderer, lastOf, slot } from './draw';

/** Inputs: text fields, toggles, pickers and search. */
export type InputKind =
  | 'textField'
  | 'textEditor'
  | 'field'
  | 'label'
  | 'toggle'
  | 'checkbox'
  | 'radioGroup'
  | 'segmented'
  | 'picker'
  | 'option'
  | 'optionGroup'
  | 'search';

/** The keyboard a text input asks for (React Native's `keyboardType`). */
export type Keyboard = (typeof ENUMS.keyboard)[number];
/** Which letters the keyboard capitalises (`autoCapitalize`). */
export type Autocapitalize = (typeof ENUMS.autocapitalize)[number];
/** What the input holds, for autofill (`autoComplete`). */
export type ContentType = (typeof ENUMS.contentType)[number];
/** The return key's label (`returnKeyType`). */
export type SubmitLabel = (typeof ENUMS.submitLabel)[number];
export type TextareaResize = (typeof ENUMS.textareaResize)[number];
export type LabelSize = (typeof ENUMS.labelSize)[number];
export type RadioStyle = (typeof ENUMS.radioStyle)[number];
export type SegmentedStyle = (typeof ENUMS.segmentedStyle)[number];
export type SearchCollapse = (typeof ENUMS.searchCollapse)[number];

/** A picker's selection: its value (none yet, for a picker with a placeholder) and its setter. */
export type Selection<V extends string> = readonly [value: V | undefined, set: (value: V) => void];

// ── Nodes ────────────────────────────────────────────────────────

interface TextFieldProps {
  readonly text: Binding<string>;
  readonly label: string;
  readonly secure: boolean;
}
interface TextEditorProps {
  readonly text: Binding<string>;
  readonly label: string | undefined;
}
interface FieldProps {
  readonly label: string | undefined;
}
interface LabelProps {
  readonly text: string;
}
interface ToggleProps {
  readonly isOn: Binding<boolean>;
}
interface CheckboxProps {
  readonly isOn: Binding<boolean>;
  readonly label: string | undefined;
}
interface ChoiceProps<V extends string = string> {
  readonly selection: Binding<V> | Selection<V>;
}
interface OptionProps {
  readonly value: string;
  readonly label: string;
}
interface OptionGroupProps {
  readonly label: string;
}
interface SearchProps {
  readonly text: Binding<string>;
}

/** The text-input modifiers every text input takes. */
interface TextInputModifiers<Self> {
  /** The keyboard it asks for. */
  keyboard(value: Keyboard): Self;
  autocapitalize(value: Autocapitalize): Self;
  autocorrect(value: boolean): Self;
  /** Takes the keyboard's focus when it appears. */
  autoFocus(): Self;
  /**
   * Whether it holds the keyboard's focus: focusing or leaving it writes the
   * binding, and setting the binding focuses or blurs it.
   */
  focused(value: Binding<boolean>): Self;
}

/** Bloom `TextFieldInput` in its `TextField` shell. */
export interface TextFieldView
  extends ViewModifiers<TextFieldView>,
    TextInputModifiers<TextFieldView> {
  placeholder(value: string): TextFieldView;
  size(value: BloomSize): TextFieldView;
  disabled(value?: boolean): TextFieldView;
  /** Painted as wrong (the error ring) and announced as invalid. */
  invalid(value?: boolean): TextFieldView;
  /** The label sits in the field and floats above the text once there is some. */
  floatingLabel(): TextFieldView;
  /** A `SecureField` the reader can show and hide again. */
  revealable(): TextFieldView;
  /** A glyph before the text. */
  icon(value: IconComponent): TextFieldView;
  /** A glyph after the text (and after a suffix). */
  trailingIcon(value: IconComponent): TextFieldView;
  /** The rest of a suggested text, drawn faintly after what is typed (Bloom's `TextFieldGhost`). */
  completion(value: string): TextFieldView;
  /** Text before the input (a currency, a protocol). */
  prefix(value: string): TextFieldView;
  /** Text after the input (a unit, a domain). */
  suffix(value: string): TextFieldView;
  contentType(value: ContentType): TextFieldView;
  submitLabel(value: SubmitLabel): TextFieldView;
  /** The return key's action. */
  onSubmit(value: () => void): TextFieldView;
  maxLength(value: number): TextFieldView;
}

/** Bloom `Textarea`: text over several lines. */
export interface TextEditorView
  extends ViewModifiers<TextEditorView>,
    TextInputModifiers<TextEditorView> {
  placeholder(value: string): TextEditorView;
  /** The hint under the field. */
  description(value: string): TextEditorView;
  size(value: BloomSize): TextEditorView;
  disabled(value?: boolean): TextEditorView;
  invalid(value?: boolean): TextEditorView;
  required(value?: boolean): TextEditorView;
  /** Its height in lines. */
  rows(value: number): TextEditorView;
  /** Grows with its text, up to `maxRows` lines. */
  autoResize(maxRows?: number): TextEditorView;
  resize(value: TextareaResize): TextEditorView;
  maxLength(value: number): TextEditorView;
  /** The count of characters against `maxLength`. */
  showCount(): TextEditorView;
}

/** Bloom `Field`: a label, its control, a description and an error, associated for assistive technology. */
export interface FieldView extends ViewModifiers<FieldView> {
  description(value: string): FieldView;
  /** The error under the control; the control is announced as invalid. */
  error(value: string | null | undefined): FieldView;
  required(value?: boolean): FieldView;
  disabled(value?: boolean): FieldView;
}

/** Bloom `Label`: a form label. */
export interface LabelView extends ViewModifiers<LabelView> {
  size(value: LabelSize): LabelView;
  required(value?: boolean): LabelView;
  disabled(value?: boolean): LabelView;
}

/** Bloom `Switch`. Name it with `.label()`: a switch draws no words. */
export interface ToggleView extends ViewModifiers<ToggleView> {
  size(value: BloomSize): ToggleView;
  tint(value: BloomTone): ToggleView;
  disabled(value?: boolean): ToggleView;
}

/** Bloom `Checkbox`, its label beside the box. */
export interface CheckboxView extends ViewModifiers<CheckboxView> {
  description(value: string): CheckboxView;
  size(value: BloomSize): CheckboxView;
  tint(value: BloomTone): CheckboxView;
  disabled(value?: boolean): CheckboxView;
  /** The state, at full strength, without taking input. */
  readOnly(): CheckboxView;
  /** Neither on nor off: some of what it stands for is. */
  indeterminate(value?: boolean): CheckboxView;
}

/** Bloom `RadioGroup`: one of its options. `.label()` names the group. */
export interface RadioGroupView extends ViewModifiers<RadioGroupView> {
  style(value: RadioStyle): RadioGroupView;
  size(value: BloomSize): RadioGroupView;
  tint(value: BloomTone): RadioGroupView;
  disabled(value?: boolean): RadioGroupView;
}

/** Bloom `SegmentedControl`: one of its options, side by side. `.label()` names it. */
export interface SegmentedView extends ViewModifiers<SegmentedView> {
  style(value: SegmentedStyle): SegmentedView;
  size(value: BloomSize): SegmentedView;
  disabled(value?: boolean): SegmentedView;
  /** It switches what is shown below it: announced as tabs, not as a choice. */
  tabs(): SegmentedView;
}

/** Bloom `Select`: one of its options, from a list it opens. `.label()` names it. */
export interface PickerView extends ViewModifiers<PickerView> {
  /** Shown while nothing is chosen. */
  placeholder(value: string): PickerView;
  size(value: BloomSize): PickerView;
  disabled(value?: boolean): PickerView;
}

/** One option of a `RadioGroup`, a `Segmented` or a `Picker`. */
export interface OptionView<V extends string = string> extends ViewNode {
  /** A line under the label (a radio option's). */
  description(value: string): OptionView<V>;
  disabled(value?: boolean): OptionView<V>;
  testID(value: string): OptionView<V>;
  /** A mark before the label in a picker's row, and in its trigger while it is the one chosen. */
  leadingView(...value: Child[]): OptionView<V>;
  /** A swatch radio's colour (`RadioGroup(...).style('swatch')`). */
  tint(value: ColorName): OptionView<V>;
  /** The chosen swatch's centre dot, readable on its colour (white by default). */
  foreground(value: ColorName): OptionView<V>;
}
/** A picker's options under a heading (Bloom's `SelectGroup` and `SelectLabel`). */
export type OptionGroupView<V extends string = string> = ViewNode & { readonly __options?: V };
export type OptionChild<V extends string> =
  | OptionView<V>
  | OptionGroupView<V>
  | false
  | null
  | undefined
  | readonly OptionChild<V>[];

/** Bloom `Search`: a search field, or a button that opens one. */
export interface SearchView extends ViewModifiers<SearchView>, TextInputModifiers<SearchView> {
  placeholder(value: string): SearchView;
  size(value: BloomSize): SearchView;
  disabled(value?: boolean): SearchView;
  /** A button that opens the field (`'auto'`: a field where there is room). */
  collapsible(value?: SearchCollapse): SearchView;
  /** Whether a collapsible search is open. */
  presented(value: Binding<boolean>): SearchView;
  /** Filters drawn as tokens before the text; removing one takes it out. */
  tokens(value: Binding<readonly SearchToken[]>): SearchView;
  submitLabel(value: SubmitLabel): SearchView;
  onSubmit(value: () => void): SearchView;
  /** The collapsed search's button: a `Button`'s style, tint, size and test id (Search owns its glyph and name). */
  trigger(value: ButtonView): SearchView;
  /** An action at the field's end (a voice search). */
  trailing(...value: Child[]): SearchView;
}

const NO_CHILDREN: readonly Child[] = [];

/** A one-line text input: Bloom's `TextFieldInput` in its `TextField` shell. `label` names it. */
export function TextField(text: Binding<string>, label: string): TextFieldView {
  return new Node(
    'textField',
    { text, label, secure: false } satisfies TextFieldProps,
    NO_CHILDREN,
  );
}

/** A text input whose text is hidden (`secureTextEntry`); `.revealable()` lets the reader show it. */
export function SecureField(text: Binding<string>, label: string): TextFieldView {
  return new Node('textField', { text, label, secure: true } satisfies TextFieldProps, NO_CHILDREN);
}

/** Text over several lines: Bloom's `Textarea`, with its label above when given. */
export function TextEditor(text: Binding<string>, label?: string): TextEditorView {
  return new Node('textEditor', { text, label } satisfies TextEditorProps, NO_CHILDREN);
}

/** Bloom `Field`: `label` above its control, a description and an error below. */
export function Field(label: string | undefined, ...content: Child[]): FieldView {
  return new Node('field', { label } satisfies FieldProps, content);
}

/** Bloom `Label`: a form label. */
export function Label(text: string): LabelView {
  return new Node('label', { text } satisfies LabelProps, NO_CHILDREN);
}

/** An on/off switch: Bloom's `Switch`. */
export function Toggle(isOn: Binding<boolean>): ToggleView {
  return new Node('toggle', { isOn } satisfies ToggleProps, NO_CHILDREN);
}

/** Bloom `Checkbox`, with its label beside the box when given. */
export function Checkbox(isOn: Binding<boolean>, label?: string): CheckboxView {
  return new Node('checkbox', { isOn, label } satisfies CheckboxProps, NO_CHILDREN);
}

/** One choice of a picker: its value and what it says. */
export function Option<V extends string>(value: V, label: string): OptionView<V> {
  return new Node('option', { value, label } satisfies OptionProps, NO_CHILDREN);
}

/** Options under `label` in a picker's list. */
export function OptionGroup<V extends string>(
  label: string,
  ...options: OptionChild<V>[]
): OptionGroupView<V> {
  return new Node('optionGroup', { label } satisfies OptionGroupProps, options as Child[]);
}

/** Bloom `RadioGroup`: the selection is one of its options' values. */
export function RadioGroup<V extends string>(
  selection: Binding<V> | Selection<V>,
  ...options: OptionChild<V>[]
): RadioGroupView {
  return new Node('radioGroup', { selection } satisfies ChoiceProps<V>, options as Child[]);
}

/** Bloom `SegmentedControl`: the selection is one of its options' values. */
export function Segmented<V extends string>(
  selection: Binding<V>,
  ...options: OptionChild<V>[]
): SegmentedView {
  return new Node('segmented', { selection } satisfies ChoiceProps<V>, options as Child[]);
}

/** Bloom `Select`: the selection is one of its options' values, or none yet. */
export function Picker<V extends string>(
  selection: Selection<V>,
  ...options: OptionChild<V>[]
): PickerView {
  return new Node('picker', { selection } satisfies ChoiceProps<V>, options as Child[]);
}

/** Bloom `Search`: a search field over `text`. */
export function Search(text: Binding<string>): SearchView {
  return new Node('search', { text } satisfies SearchProps, NO_CHILDREN);
}

// ── Rendering ────────────────────────────────────────────────────

interface OptionOf {
  readonly node: Node;
  readonly props: OptionProps;
  /** The heading of the group it is in, if any. */
  readonly group: string | undefined;
}

/** A picker's options, in order (groups and arrays flattened, absent ones left out). */
function optionsOf(children: readonly Child[], group?: string): OptionOf[] {
  const out: OptionOf[] = [];
  for (const child of children) {
    if (Array.isArray(child)) out.push(...optionsOf(child, group));
    else if (isNode(child) && child.kind === 'optionGroup')
      out.push(...optionsOf(child.children, (child.props as OptionGroupProps).label));
    else if (isNode(child) && child.kind === 'option')
      out.push({ node: child, props: child.props as OptionProps, group });
  }
  return out;
}

/** An option's own value modifier (an option takes no box). */
function optionValue<K extends 'description' | 'disabled' | 'testID'>(
  node: Node,
  kind: K,
): string | boolean | undefined {
  return (lastOf(node, kind) as { value: string | boolean } | undefined)?.value;
}

/** The props an input's focus binding gives it: its ref, and handlers that write the binding. */
interface FocusProps {
  readonly ref: RefObject<ComponentRef<typeof TextInput> | null>;
  readonly onFocus: () => void;
  readonly onBlur: () => void;
}

/**
 * An input whose focus is a binding: focusing or leaving it writes the binding,
 * and a change of the binding focuses or blurs the input. Draws only the input.
 */
function FocusBound({
  focused: [isFocused, setFocused],
  draw,
}: {
  focused: Binding<boolean>;
  draw: (focus: FocusProps) => ReactElement;
}): ReactElement {
  const ref = useRef<ComponentRef<typeof TextInput>>(null);
  useEffect(() => {
    const input = ref.current;
    if (input === null || input.isFocused() === isFocused) return;
    if (isFocused) input.focus();
    else input.blur();
  }, [isFocused]);
  return draw({ ref, onFocus: () => setFocused(true), onBlur: () => setFocused(false) });
}

/** `draw` with the input's focus bound when the node has `.focused()`, as it is otherwise. */
function withFocus(
  d: ControlDraw,
  draw: (focus: Partial<FocusProps>) => ReactElement,
): ReactElement {
  const focused = d.own('focused')?.value;
  if (focused === undefined) return draw({});
  return createElement(FocusBound, { key: d.key, focused, draw });
}

/**
 * The text-input props the language's modifiers set, as React Native names
 * them; only those set, so a component's own defaults (Search's) stay.
 */
function textInputProps(d: ControlDraw): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [kind, prop] of TEXT_INPUT_PROPS) {
    const modifier = d.own(kind);
    if (modifier !== undefined) props[prop] = kind === 'autoFocus' ? true : modifier.value;
  }
  return props;
}
const TEXT_INPUT_PROPS = [
  ['keyboard', 'keyboardType'],
  ['autocapitalize', 'autoCapitalize'],
  ['autocorrect', 'autoCorrect'],
  ['contentType', 'autoComplete'],
  ['submitLabel', 'returnKeyType'],
  ['onSubmit', 'onSubmitEditing'],
  ['autoFocus', 'autoFocus'],
  ['maxLength', 'maxLength'],
] as const;

const textField: ControlRenderer = (d) => {
  const { text, label, secure } = d.node.props as TextFieldProps;
  const size = d.own('size')?.value as BloomSize | undefined;
  const invalid = d.own('invalid')?.value;
  const disabled = d.own('disabled')?.value;
  const icon = d.own('icon')?.value;
  const trailingIcon = d.own('trailingIcon')?.value;
  const prefix = d.own('prefix')?.value;
  const suffix = d.own('suffix')?.value;
  const completion = d.own('completion')?.value;
  // The shell is what an app writes around the input; a bare `TextFieldInput`
  // draws the same shell itself. The box is the shell's.
  return withFocus(d, ({ ref, onFocus, onBlur }) =>
    d.component(
      BloomTextField,
      { key: d.key, size, invalid, disabled },
      icon === undefined ? null : <TextFieldIcon icon={icon} />,
      prefix === undefined ? null : <TextFieldPrefix label={prefix}>{prefix}</TextFieldPrefix>,
      completion === undefined ? null : (
        <TextFieldGhost value={completion}>{text[0]}</TextFieldGhost>
      ),
      <TextFieldInput
        inputRef={ref}
        onFocus={onFocus}
        onBlur={onBlur}
        label={label}
        value={text[0]}
        onValueChange={text[1]}
        placeholder={d.own('placeholder')?.value}
        invalid={invalid}
        disabled={disabled}
        floatingLabel={d.own('floatingLabel') === undefined ? undefined : true}
        secureTextEntry={secure ? true : undefined}
        revealable={d.own('revealable') === undefined ? undefined : true}
        accessibilityHint={d.hint}
        testID={d.testID}
        {...textInputProps(d)}
      />,
      suffix === undefined ? null : <TextFieldSuffix label={suffix}>{suffix}</TextFieldSuffix>,
      trailingIcon === undefined ? null : <TextFieldIcon icon={trailingIcon} position="trailing" />,
    ),
  );
};

const textEditor: ControlRenderer = (d) => {
  const { text, label } = d.node.props as TextEditorProps;
  return withFocus(d, ({ ref, onFocus, onBlur }) =>
    d.component(Textarea, {
      key: d.key,
      inputRef: ref,
      onFocus,
      onBlur,
      label,
      value: text[0],
      onValueChange: text[1],
      placeholder: d.own('placeholder')?.value,
      hint: d.own('description')?.value,
      size: d.own('size')?.value,
      disabled: d.own('disabled')?.value,
      invalid: d.own('invalid')?.value,
      required: d.own('required')?.value,
      rows: d.own('rows')?.value,
      autoResize: d.own('autoResize') === undefined ? undefined : true,
      maxRows: d.own('autoResize')?.value,
      resize: d.own('resize')?.value,
      showCount: d.own('showCount') === undefined ? undefined : true,
      accessibilityHint: d.hint,
      testID: d.testID,
      ...textInputProps(d),
    }),
  );
};

const field: ControlRenderer = (d) =>
  d.component(
    BloomField,
    {
      key: d.key,
      label: (d.node.props as FieldProps).label,
      description: d.own('description')?.value,
      error: d.own('error')?.value,
      required: d.own('required')?.value,
      disabled: d.own('disabled')?.value,
      testID: d.testID,
    },
    ...d.children(d.node.children),
  );

const label: ControlRenderer = (d) =>
  d.component(
    BloomLabel,
    {
      key: d.key,
      size: d.own('size')?.value,
      required: d.own('required')?.value,
      disabled: d.own('disabled')?.value,
      testID: d.testID,
    },
    (d.node.props as LabelProps).text,
  );

const toggle: ControlRenderer = (d) => {
  const [checked, setChecked] = (d.node.props as ToggleProps).isOn;
  return d.component(Switch, {
    key: d.key,
    checked,
    onCheckedChange: setChecked,
    size: d.own('size')?.value,
    tone: d.own('tint')?.value,
    disabled: d.own('disabled')?.value,
    accessibilityLabel: d.label,
    testID: d.testID,
  });
};

const checkbox: ControlRenderer = (d) => {
  const { isOn, label } = d.node.props as CheckboxProps;
  return d.component(BloomCheckbox, {
    key: d.key,
    checked: isOn[0],
    onCheckedChange: isOn[1],
    label,
    description: d.own('description')?.value,
    size: d.own('size')?.value,
    tone: d.own('tint')?.value,
    disabled: d.own('disabled')?.value,
    readOnly: d.own('readOnly') === undefined ? undefined : true,
    indeterminate: d.own('indeterminate')?.value,
    accessibilityLabel: d.label,
    testID: d.testID,
  });
};

/** A radio option as data, its swatch colours as roles the theme paints. */
interface RadioOptionOf {
  readonly value: string;
  readonly label: string;
  readonly description: string | undefined;
  readonly disabled: boolean | undefined;
  readonly testID: string | undefined;
  readonly tint?: ColorName;
  readonly foreground?: ColorName;
}

/**
 * Bloom's `RadioGroup` with its swatches' colours painted from the theme, as an
 * app reads them (`useThemePaint()`): the leaf that reads the theme for a
 * group whose options name colour roles. It draws only the group.
 */
function PaintedRadioGroup({
  options,
  ...props
}: Record<string, unknown> & { options: readonly RadioOptionOf[] }): ReactElement {
  const colors = useThemePaint();
  return createElement(BloomRadioGroup, {
    ...props,
    options: options.map(({ tint, foreground, ...option }) => ({
      ...option,
      color: tint === undefined ? undefined : colors[COLORS[tint].paint],
      foreground: foreground === undefined ? undefined : colors[COLORS[foreground].paint],
    })),
  });
}

const radioGroup: ControlRenderer = (d) => {
  const [value, setValue] = (d.node.props as ChoiceProps).selection;
  const options = optionsOf(d.node.children).map(({ node, props }): RadioOptionOf => {
    const tint = lastOf(node, 'tint')?.value as ColorName | undefined;
    const foreground = lastOf(node, 'foreground')?.value as ColorName | undefined;
    return {
      value: props.value,
      label: props.label,
      description: optionValue(node, 'description') as string | undefined,
      disabled: optionValue(node, 'disabled') as boolean | undefined,
      testID: optionValue(node, 'testID') as string | undefined,
      ...(tint === undefined ? null : { tint }),
      ...(foreground === undefined ? null : { foreground }),
    };
  });
  const painted = options.some(
    (option) => option.tint !== undefined || option.foreground !== undefined,
  );
  return d.component(painted ? PaintedRadioGroup : BloomRadioGroup, {
    key: d.key,
    label: d.label,
    value,
    onValueChange: setValue,
    options,
    variant: d.own('style')?.value,
    size: d.own('size')?.value,
    tone: d.own('tint')?.value,
    disabled: d.own('disabled')?.value,
    testID: d.testID,
  });
};

const segmented: ControlRenderer = (d) => {
  const [value, setValue] = (d.node.props as ChoiceProps).selection;
  return d.component(
    SegmentedControl,
    {
      key: d.key,
      label: d.label,
      type: d.own('tabs') === undefined ? 'radio' : 'tabs',
      value,
      onValueChange: setValue,
      variant: d.own('style')?.value,
      size: d.own('size')?.value,
      disabled: d.own('disabled')?.value,
      accessibilityHint: d.hint,
      testID: d.testID,
    },
    ...optionsOf(d.node.children).map(({ node, props }) => (
      <SegmentedControlItem
        key={props.value}
        value={props.value}
        disabled={optionValue(node, 'disabled') as boolean | undefined}
        testID={optionValue(node, 'testID') as string | undefined}
      >
        <SegmentedControlItemText>{props.label}</SegmentedControlItemText>
      </SegmentedControlItem>
    )),
  );
};

/** A picker's option as Bloom's list item: its value, label, state, mark and group. */
interface PickerItem extends OptionProps {
  readonly disabled: boolean | undefined;
  readonly leading: ReactElement | undefined;
  readonly group: string | undefined;
}

/**
 * A picker's row in Bloom's list: its mark, the indicator, then the label. The
 * first row of a group carries the group's heading, as Bloom's grouped select
 * draws it (`SelectContent` keeps a flat list of items).
 */
function pickerRow(item: PickerItem, index: number, items: readonly PickerItem[]): ReactElement {
  const row = (
    <SelectItem
      value={item.value}
      label={item.label}
      disabled={item.disabled}
      leading={item.leading}
    >
      <SelectItemIndicator />
      <SelectItemText>{item.label}</SelectItemText>
    </SelectItem>
  );
  if (item.group === undefined || items[index - 1]?.group === item.group) return row;
  return (
    <SelectGroup>
      <SelectLabel>{item.group}</SelectLabel>
      {row}
    </SelectGroup>
  );
}

/** The trigger's mark: the chosen option's, as `SelectValue` takes a mark that follows the value. */
const chosenMark = (item: unknown) => (item as PickerItem | undefined)?.leading ?? null;

const picker: ControlRenderer = (d) => {
  const [value, setValue] = (d.node.props as ChoiceProps).selection;
  const placeholder = d.own('placeholder')?.value;
  const items = optionsOf(d.node.children).map(({ node, props, group }): PickerItem => {
    const leading = lastOf(node, 'leadingView')?.value;
    return {
      ...props,
      disabled: optionValue(node, 'disabled') as boolean | undefined,
      leading: leading === undefined ? undefined : (slot(d, leading) as ReactElement),
      group,
    };
  });
  const marked = items.some((item) => item.leading !== undefined);
  return (
    <Select
      key={d.key}
      value={value}
      onValueChange={setValue}
      size={d.own('size')?.value as BloomSize | undefined}
      disabled={d.own('disabled')?.value}
    >
      {d.component(
        SelectTrigger,
        { label: d.label, testID: d.testID },
        <SelectValue placeholder={placeholder} leading={marked ? chosenMark : undefined} />,
        <SelectIcon />,
      )}
      <SelectContent
        label={d.label}
        items={items}
        renderItem={(item, index) => pickerRow(item, index, items)}
      />
    </Select>
  );
};

const search: ControlRenderer = (d) => {
  const [value, setValue] = (d.node.props as SearchProps).text;
  const collapsible = d.own('collapsible');
  const presented = d.own('presented')?.value;
  const tokens = d.own('tokens')?.value;
  const trigger = d.own('trigger')?.value;
  // Search's box is its outer view (`containerStyle`); its `style` is the input's.
  return withFocus(d, ({ ref, onFocus, onBlur }) =>
    d.component(boxAs(BloomSearch, 'containerStyle'), {
      key: d.key,
      ref,
      onFocus,
      onBlur,
      value,
      onValueChange: setValue,
      label: d.label,
      placeholder: d.own('placeholder')?.value,
      size: d.own('size')?.value as BloomSize | undefined,
      disabled: d.own('disabled')?.value,
      presentation: collapsible === undefined ? undefined : (collapsible.value ?? 'collapsible'),
      open: presented?.[0],
      onOpenChange: presented?.[1],
      tokens: tokens?.[0],
      onRemoveToken:
        tokens === undefined
          ? undefined
          : (key: string) => tokens[1](tokens[0].filter((token) => token.key !== key)),
      triggerProps: trigger === undefined ? undefined : triggerProps(trigger),
      trailing: slot(d, d.own('trailing')?.value),
      testID: d.testID,
      ...textInputProps(d),
    }),
  );
};

/** A collapsed search's button, read from a `Button` node: its look and test id. */
function triggerProps(button: ViewNode): Record<string, unknown> {
  const node = button as Node;
  return {
    appearance: lastOf(node, 'style')?.value,
    tone: lastOf(node, 'tint')?.value,
    size: lastOf(node, 'size')?.value,
    testID: lastOf(node, 'testID')?.value,
  };
}

/** The renderer of each kind in this family. */
export const INPUTS: Partial<Record<InputKind, ControlRenderer>> = {
  textField,
  textEditor,
  field,
  label,
  toggle,
  checkbox,
  radioGroup,
  segmented,
  picker,
  search,
};
