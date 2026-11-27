import { createElement, type ReactElement } from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';

import * as Testing from '../testing';
import type * as Language from './support/language.generated';

// An app's suite sees the language's own types; the double is what runs.
const L = Testing as unknown as typeof Language;

function mount(element: ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(element);
  });
  return renderer;
}

describe('@oxy.so/bloom-language/testing', () => {
  it('has every constructor the language exports, from the root and from every family', () => {
    const { entries } = require('../../spec/entries.generated.json') as {
      entries: Record<string, string[]>;
    };
    const double = Testing as unknown as Record<string, unknown>;
    for (const names of Object.values(entries))
      for (const name of names) expect([name, typeof double[name]]).toEqual([name, 'function']);
  });

  it('draws a chain as DOM a test reads: its text, press, name, role and test id', () => {
    const onPress = jest.fn();
    const root = mount(
      L.toElement(
        L.VStack(
          L.Text('Inbox').font('headline'),
          L.Button(L.Text('Archive')).onPress(onPress).label('Archive thread').testID('archive'),
          L.Card(L.Text('Body')).role('summary'),
        ).padding('md'),
      ),
    );
    const button = root.root.findByProps({ 'data-testid': 'archive' });
    expect(button.type).toBe('button');
    expect(button.props['aria-label']).toBe('Archive thread');
    act(() => button.props.onClick());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(root.root.findByProps({ 'data-node': 'Card' }).props.role).toBe('summary');
    expect(JSON.stringify(root.toJSON())).toContain('Inbox');
  });

  it('binds a toggle and a field, and draws the compiler’s root and a view()', () => {
    const set = jest.fn();
    const submit = jest.fn();
    const Row = L.view(({ on }: { on: boolean }) => L.Toggle([on, set]).label('Notify'));
    const root = mount(
      createElement(
        'div',
        null,
        L.toElement(Row({ on: true })),
        createElement(L.LanguageRoot, {
          build: () => L.TextField(['hi', set], 'Search').onSubmit(submit),
        }),
      ),
    );
    const [toggle, field] = root.root.findAllByType('input');
    expect(toggle?.props.checked).toBe(true);
    act(() => toggle?.props.onChange({ target: { checked: false } }));
    expect(set).toHaveBeenCalledWith(false);
    expect(field?.props).toMatchObject({ value: 'hi', 'aria-label': 'Search' });
    act(() => field?.props.onKeyDown({ key: 'Enter' }));
    expect(submit).toHaveBeenCalledTimes(1);
  });
});
