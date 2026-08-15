/**
 * `Combobox` is a `Select` you can type into, and the typing is where it earns
 * its own family: the query filters the list, the list narrows, and picking an
 * option must report the VALUE rather than the label the user happened to see.
 *
 * The panel — search field and options — lives inside `PopoverContent`, so it
 * does not exist until the trigger is pressed. Every test therefore opens it
 * first; a test that asserted against the closed state would be asserting
 * against a component that has not rendered.
 *
 * The states worth pinning are the ones a hand-rolled filter gets wrong: a
 * query matching nothing must SAY so rather than render an empty box (which
 * reads as a broken popover), and the query must be optionally CONTROLLED so a
 * consumer driving it from a URL or a debounce is not fighting internal state.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PortalProvider, PortalOutlet } from '../portal';
import { Combobox } from '../combobox';
import type { ComboboxOption } from '../combobox';

const OPTIONS: ComboboxOption[] = [
  { value: 'mention', label: 'Mention', description: 'Social' },
  { value: 'homiio', label: 'Homiio', description: 'Housing' },
  { value: 'allo', label: 'Allo' },
];

function renderCombobox(props: Partial<React.ComponentProps<typeof Combobox>> = {}) {
  const onValueChange = jest.fn();
  const utils = render(
    <BloomThemeProvider mode="light" colorPreset="oxy">
      <PortalProvider>
        <Combobox
          options={OPTIONS}
          value={null}
          onValueChange={onValueChange}
          placeholder="Pick an app"
          testID="cb"
          {...props}
        />
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  return { ...utils, onValueChange };
}

/** Open the panel by pressing the trigger, which is the only thing rendered first. */
function open(utils: ReturnType<typeof renderCombobox>, triggerLabel: string) {
  fireEvent.press(utils.getByText(triggerLabel));
}

describe('Combobox', () => {
  it('shows the placeholder on the trigger while nothing is selected', () => {
    const utils = renderCombobox();
    expect(utils.getByText('Pick an app')).toBeTruthy();
  });

  it('shows the selected option LABEL on the trigger, never its value', () => {
    // The value is an opaque id to the user; showing it is the usual symptom of
    // a combobox rendering `value` straight into the field.
    const utils = renderCombobox({ value: 'homiio' });
    expect(utils.getByText('Homiio')).toBeTruthy();
    expect(utils.queryByText('homiio')).toBeNull();
  });

  it('renders no panel until the trigger is pressed', () => {
    const utils = renderCombobox();
    expect(utils.queryByText('Mention')).toBeNull();
    open(utils, 'Pick an app');
    expect(utils.getByText('Mention')).toBeTruthy();
  });

  it('reports the option VALUE, not the label, when one is picked', () => {
    const utils = renderCombobox();
    open(utils, 'Pick an app');
    fireEvent.press(utils.getByText('Homiio'));
    expect(utils.onValueChange).toHaveBeenCalledWith('homiio');
  });

  it('filters on label and on description, case-insensitively', () => {
    const byLabel = renderCombobox({ query: 'ALL' });
    open(byLabel, 'Pick an app');
    expect(byLabel.getByText('Allo')).toBeTruthy();
    expect(byLabel.queryByText('Homiio')).toBeNull();

    const byDescription = renderCombobox({ query: 'housing' });
    open(byDescription, 'Pick an app');
    expect(byDescription.getByText('Homiio')).toBeTruthy();
    expect(byDescription.queryByText('Allo')).toBeNull();
  });

  it('says there are no results rather than rendering an empty panel', () => {
    const utils = renderCombobox({ query: 'zzzz', emptyText: 'Nothing here' });
    open(utils, 'Pick an app');
    expect(utils.getByText('Nothing here')).toBeTruthy();
  });

  it('honours a caller-supplied filter over its own', () => {
    const utils = renderCombobox({
      query: 'x',
      filter: (option) => option.value === 'allo',
    });
    open(utils, 'Pick an app');
    // The default filter would reject every option for the query "x"; the
    // caller's keeps one, so a silently-ignored `filter` shows up as an empty
    // list rather than as a passing test.
    expect(utils.getByText('Allo')).toBeTruthy();
    expect(utils.queryByText('Mention')).toBeNull();
  });

  it('notifies the caller of query changes so a controlled query can keep up', () => {
    const onQueryChange = jest.fn();
    const utils = renderCombobox({ query: '', onQueryChange });
    open(utils, 'Pick an app');
    const [field] = utils.getAllByPlaceholderText('Search');
    if (field === undefined) throw new Error('the panel rendered no search field');
    fireEvent.changeText(field, 'men');
    expect(onQueryChange).toHaveBeenCalledWith('men');
  });

  it('does not open when disabled', () => {
    const utils = renderCombobox({ disabled: true });
    open(utils, 'Pick an app');
    expect(utils.queryByText('Mention')).toBeNull();
  });
});
