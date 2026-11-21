import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { useState } from 'react';

import type { Binding } from '../binding';
import {
  Checkbox,
  type CheckboxView,
  Field,
  type FieldView,
  Label,
  type LabelView,
  Option,
  type OptionView,
  Picker,
  type PickerView,
  RadioGroup,
  type RadioGroupView,
  Search,
  type SearchView,
  Segmented,
  type SegmentedView,
  TextEditor,
  type TextEditorView,
  TextField,
  type TextFieldView,
  Toggle,
  type ToggleView,
} from '../controls/inputs';
import type { NODE_MODIFIERS } from '../generated/spec.generated';
import { toElement } from '../render';
import { view } from '../view';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const consoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    consoleError(...args);
  });
});

function mount(element: React.ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

describe('inputs', () => {
  it('each input view exposes exactly the modifiers the spec gives its kind', () => {
    type MethodsOf<T> = {
      [K in keyof T]-?: T[K] extends (...args: never[]) => unknown ? K : never;
    }[keyof T];
    type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
    type Of<K extends keyof typeof NODE_MODIFIERS> = (typeof NODE_MODIFIERS)[K][number];
    // A type error here means a node interface and spec/language.json disagree.
    const checks: [
      Same<MethodsOf<TextFieldView>, Of<'textField'>>,
      Same<MethodsOf<TextEditorView>, Of<'textEditor'>>,
      Same<MethodsOf<FieldView>, Of<'field'>>,
      Same<MethodsOf<LabelView>, Of<'label'>>,
      Same<MethodsOf<ToggleView>, Of<'toggle'>>,
      Same<MethodsOf<CheckboxView>, Of<'checkbox'>>,
      Same<MethodsOf<RadioGroupView>, Of<'radioGroup'>>,
      Same<MethodsOf<SegmentedView>, Of<'segmented'>>,
      Same<MethodsOf<PickerView>, Of<'picker'>>,
      Same<MethodsOf<OptionView>, Of<'option'>>,
      Same<MethodsOf<SearchView>, Of<'search'>>,
    ] = [true, true, true, true, true, true, true, true, true, true, true];
    expect(checks.every(Boolean)).toBe(true);
  });

  it('a binding is read as the value and written by the control', () => {
    const Screen = view(function Screen() {
      const isOn = useState(false);
      return Toggle(isOn).label('Wi-Fi');
    });
    const renderer = mount(toElement(Screen()));
    const toggle = renderer.root.findByType('Switch' as never);
    expect(toggle.props.checked).toBe(false);
    expect(toggle.props.accessibilityLabel).toBe('Wi-Fi');
    act(() => toggle.props.onCheckedChange(true));
    expect(renderer.root.findByType('Switch' as never).props.checked).toBe(true);
  });

  it('a text field writes what is typed through its binding', () => {
    const Screen = view(function Screen() {
      return TextField(useState(''), 'Name').placeholder('Ada').keyboard('email-address');
    });
    const renderer = mount(toElement(Screen()));
    const input = renderer.root.findByType('TextFieldInput' as never);
    expect(input.props).toMatchObject({
      label: 'Name',
      placeholder: 'Ada',
      keyboardType: 'email-address',
    });
    act(() => input.props.onValueChange('Ada'));
    expect(renderer.root.findByType('TextFieldInput' as never).props.value).toBe('Ada');
  });

  it('a picker’s options are its rows, flattened and in order', () => {
    const fruits = ['apple', 'pear'] as const;
    const renderer = mount(
      toElement(
        RadioGroup(
          ['apple', () => {}],
          fruits.map((fruit) => Option(fruit, fruit.toUpperCase())),
          false,
          Option('fig', 'Fig').disabled().description('Dried'),
        ).label('Fruit'),
      ),
    );
    const group = renderer.root.findByType('RadioGroup' as never);
    expect(group.props.label).toBe('Fruit');
    expect(group.props.options).toEqual([
      { value: 'apple', label: 'APPLE' },
      { value: 'pear', label: 'PEAR' },
      { value: 'fig', label: 'Fig', description: 'Dried', disabled: true },
    ]);
  });

  it('a search removes a token through its binding', () => {
    const tokens = [
      { key: 'pdf', label: 'PDF' },
      { key: 'mine', label: 'Mine' },
    ];
    const setTokens = jest.fn();
    const renderer = mount(
      toElement(
        Search(['', () => {}])
          .collapsible()
          .tokens([tokens, setTokens]),
      ),
    );
    const search = renderer.root.findByType('Search' as never);
    expect(search.props.presentation).toBe('collapsible');
    act(() => search.props.onRemoveToken('pdf'));
    expect(setTokens).toHaveBeenCalledWith([{ key: 'mine', label: 'Mine' }]);
  });

  it('builds every input', () => {
    const text: Binding<string> = ['', () => {}];
    const nodes = [
      TextEditor(text, 'Bio').rows(4),
      Field('Email', TextField(text, 'Email')).error('Required'),
      Label('Email').required(),
      Checkbox([true, () => {}], 'Remember me'),
      Segmented(['a', () => {}], Option('a', 'A'), Option('b', 'B')).tabs(),
      Picker([undefined, () => {}], Option('a', 'A')).placeholder('Pick one'),
    ];
    for (const node of nodes) expect(() => mount(toElement(node))).not.toThrow();
  });
});
