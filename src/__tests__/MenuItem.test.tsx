/**
 * @jest-environment jsdom
 *
 * `MenuItemRow` and `MenuItemOptions` through the REAL react-native-web.
 *
 * The three properties this file exists for are all invisible to a prop-level
 * test. The quantity is drawn ONCE — a suite that asserted "the stepper is
 * there" would pass with a badge beside it saying the same number. A pressable
 * row's add control is a SIBLING of the row, which is a DOM-shape question
 * (`<button>` inside `<button>`) that only a rendered tree can answer. And a
 * group at its cap disables what you cannot add rather than evicting what you
 * already chose, which is a property of the emitted `aria-disabled`.
 */
import React, { useState } from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { MenuItemOptions, MenuItemRow } from '../menu-item';
import { MENU_ITEM_SPICE_MAX } from '../menu-item/constants';
import {
  composeMenuItemName,
  describeOptionRule,
  optionDisabled,
  optionGroupRule,
  optionSubtitle,
  spiceLevel,
  toggleOptionSelection,
} from '../menu-item/shared';
import type { MenuItemOptionGroup, MenuItemRowProps } from '../menu-item';
import { byTestId, click, mount, queryTestId, setupHarness } from './support/commerce-harness';

setupHarness();

const SIZE: MenuItemOptionGroup = {
  id: 'size',
  title: 'Size',
  min: 1,
  max: 1,
  options: [
    { id: 'regular', label: 'Regular', price: 'Included' },
    { id: 'large', label: 'Large', description: 'Serves two', price: '+€4.00' },
  ],
};

const EXTRAS: MenuItemOptionGroup = {
  id: 'extras',
  title: 'Extras',
  max: 2,
  options: [
    { id: 'curd', label: 'Extra curd', price: '+€1.50' },
    { id: 'chilli', label: 'Chilli', price: '+€0.80' },
    { id: 'olives', label: 'Olives', price: '+€1.20' },
  ],
};

// ---------------------------------------------------------------------------
//  The rule
// ---------------------------------------------------------------------------

describe('a group’s rule is derived from min and max', () => {
  it.each([
    [{ min: 1, max: 1 }, 'Choose 1'],
    [{ min: 2, max: 2 }, 'Choose 2'],
    [{ min: 0, max: 3 }, 'Up to 3'],
    [{ min: 2, max: 4 }, 'Choose 2 to 4'],
    [{ min: 0, max: 1 }, 'Optional'],
    [{}, 'Optional'],
  ])('%j reads as "%s"', (group, expected) => {
    expect(describeOptionRule(group)).toBe(expected);
  });

  it('lets a group replace the English', () => {
    expect(describeOptionRule({ min: 1, max: 1, ruleLabel: 'Elige 1' })).toBe('Elige 1');
  });

  it('clamps a nonsense rule rather than drawing it', () => {
    expect(optionGroupRule({ min: 5, max: 2 })).toEqual({ min: 2, max: 2, multiple: true, required: true });
    expect(optionGroupRule({ min: -3, max: 0 })).toEqual({ min: 0, max: 1, multiple: false, required: false });
  });
});

describe('one press on an option', () => {
  const single = { multiple: false, max: 1 };
  const double = { multiple: true, max: 2 };

  it('REPLACES in a single-choice group', () => {
    expect(toggleOptionSelection(['regular'], 'large', single)).toEqual(['large']);
    expect(toggleOptionSelection(undefined, 'large', single)).toEqual(['large']);
  });

  it('toggles in a multi-choice group', () => {
    expect(toggleOptionSelection([], 'curd', double)).toEqual(['curd']);
    expect(toggleOptionSelection(['curd'], 'curd', double)).toEqual([]);
  });

  it('REFUSES at the cap rather than evicting the earliest choice', () => {
    expect(toggleOptionSelection(['curd', 'chilli'], 'olives', double)).toEqual(['curd', 'chilli']);
    // …and un-choosing still works at the cap, or the group would be stuck.
    expect(toggleOptionSelection(['curd', 'chilli'], 'curd', double)).toEqual(['chilli']);
  });

  it('disables what cannot be added, and only that', () => {
    expect(optionDisabled({ id: 'olives' }, ['curd', 'chilli'], double)).toBe(true);
    expect(optionDisabled({ id: 'curd' }, ['curd', 'chilli'], double)).toBe(false);
    expect(optionDisabled({ id: 'olives' }, ['curd'], double)).toBe(false);
    expect(optionDisabled({ id: 'olives' }, ['regular'], single)).toBe(false);
    expect(optionDisabled({ id: 'x', disabled: true }, [], double)).toBe(true);
  });
});

describe('an option’s price shares its one text column', () => {
  it('joins the description and the price, and survives either being absent', () => {
    expect(optionSubtitle({ description: 'Serves two', price: '+€4.00' })).toBe('Serves two · +€4.00');
    expect(optionSubtitle({ price: '+€4.00' })).toBe('+€4.00');
    expect(optionSubtitle({ description: 'Serves two' })).toBe('Serves two');
    expect(optionSubtitle({})).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
//  MenuItemOptions, rendered
// ---------------------------------------------------------------------------

function Options(props: Partial<React.ComponentProps<typeof MenuItemOptions>> = {}) {
  const [value, setValue] = useState<Record<string, readonly string[]>>(
    (props.value as Record<string, readonly string[]>) ?? {},
  );
  return (
    <MenuItemOptions
      groups={[SIZE, EXTRAS]}
      {...props}
      value={value}
      onValueChange={(groupId, ids) => setValue((v) => ({ ...v, [groupId]: ids }))}
      testID="o"
    />
  );
}

describe('the controls are Bloom’s own grouped choice', () => {
  it('renders a radiogroup for a single-choice group, named with its rule', () => {
    mount(<Options />);
    const group = byTestId('o-group-size-options');
    expect(group.getAttribute('role')).toBe('radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Size, Choose 1');
    expect(byTestId('o-group-size-option-regular').getAttribute('role')).toBe('radio');
  });

  it('renders checkboxes for a multi-choice group, inside a labelled group', () => {
    mount(<Options />);
    expect(byTestId('o-group-extras').getAttribute('role')).toBe('group');
    expect(byTestId('o-group-extras-option-curd').getAttribute('role')).toBe('checkbox');
  });

  it('draws the rule beside the question, where it is read before choosing', () => {
    mount(<Options />);
    expect(byTestId('o-group-extras').textContent).toContain('Up to 2');
  });
});

describe('the cap disables rather than evicting', () => {
  it('marks the third extra disabled once two are chosen, and leaves the chosen two alone', () => {
    mount(<Options value={{ extras: ['curd', 'chilli'] }} />);
    expect(byTestId('o-group-extras-option-olives').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('o-group-extras-option-curd').getAttribute('aria-disabled')).toBeNull();
    expect(byTestId('o-group-extras-option-curd').getAttribute('aria-checked')).toBe('true');
  });

  it('keeps the earliest choice when the capped one is pressed anyway', () => {
    mount(<Options value={{ extras: ['curd', 'chilli'] }} />);
    click(byTestId('o-group-extras-option-olives'));
    expect(byTestId('o-group-extras-option-curd').getAttribute('aria-checked')).toBe('true');
    expect(byTestId('o-group-extras-option-olives').getAttribute('aria-checked')).toBe('false');
  });
});

describe('a required group announces its error', () => {
  it('renders the message as an alert', () => {
    mount(
      <MenuItemOptions
        groups={[{ ...SIZE, error: 'Choose a size to carry on.' }]}
        value={{}}
        onValueChange={() => undefined}
        testID="o"
      />,
    );
    const alert = document.querySelector('[role="alert"]');
    expect(alert?.textContent).toBe('Choose a size to carry on.');
  });
});

describe('the running price', () => {
  it('rides on the button a reader presses, and is drawn byte for byte', () => {
    mount(
      <MenuItemOptions
        groups={[SIZE]}
        value={{}}
        onValueChange={() => undefined}
        total="1.234,56 €"
        onSubmit={() => undefined}
        testID="o"
      />,
    );
    expect(byTestId('o-submit').textContent).toBe('Add to basket · 1.234,56 €');
  });

  it('is a plain row when there is no action to put it on', () => {
    mount(
      <MenuItemOptions groups={[SIZE]} value={{}} onValueChange={() => undefined} total="€16.40" testID="o" />,
    );
    expect(queryTestId('o-submit')).toBeNull();
    expect(byTestId('o-total-amount').textContent).toBe('€16.40');
  });
});

// ---------------------------------------------------------------------------
//  MenuItemRow, rendered
// ---------------------------------------------------------------------------

describe('the quantity is drawn once', () => {
  it('is the stepper when the app can change it, and NO badge beside it', () => {
    mount(
      <MenuItemRow
        name="Ember flatbread"
        price="€12.50"
        quantity={2}
        onQuantityChange={() => undefined}
        testID="r"
      />,
    );
    expect(queryTestId('r-stepper')).not.toBeNull();
    expect(queryTestId('r-quantity')).toBeNull();
  });

  it('is the count over the photo when it cannot, and NO stepper', () => {
    mount(<MenuItemRow name="Ember flatbread" price="€12.50" quantity={2} testID="r" />);
    expect(byTestId('r-quantity').textContent).toBe('2');
    expect(queryTestId('r-stepper')).toBeNull();
  });

  it('is neither while nothing is in the basket', () => {
    mount(<MenuItemRow name="Ember flatbread" price="€12.50" onAdd={() => undefined} testID="r" />);
    expect(queryTestId('r-quantity')).toBeNull();
    expect(queryTestId('r-stepper')).toBeNull();
    expect(byTestId('r-add').getAttribute('aria-label')).toBe('Add Ember flatbread');
  });
});

describe('a pressable row and its control are siblings', () => {
  it('keeps the add control out of the row’s button', () => {
    mount(
      <MenuItemRow
        name="Ember flatbread"
        price="€12.50"
        onAdd={() => undefined}
        onPress={() => undefined}
        testID="r"
      />,
    );
    const row = byTestId('r');
    const add = byTestId('r-add');
    // `Item`'s own node is inside its Pressable; the control must not be.
    expect(row.contains(add)).toBe(false);
  });

  it('puts the control in the row’s trailing slot when the row does not press', () => {
    mount(<MenuItemRow name="Ember flatbread" price="€12.50" onAdd={() => undefined} testID="r" />);
    expect(byTestId('r').contains(byTestId('r-add'))).toBe(true);
  });
});

describe('the name owns its line', () => {
  it('is not a flex sibling of the marks', () => {
    mount(<MenuItemRow name="Kestrel chilli noodles" price="€13.80" spice={3} diets={['vegan']} testID="r" />);
    // Sharing a row with the flames drew three flames and NO name at 390: a
    // one-line `Text` is `nowrap` on web, so the fixed glyph run took what it
    // needed and the name collapsed to zero instead of truncating. jsdom has no
    // layout and cannot measure that; what it CAN hold is the arrangement that
    // made it possible, so this asserts the marks live in their own row.
    expect(byTestId('r-marks').contains(byTestId('r-spice'))).toBe(true);
    expect(byTestId('r-marks').contains(byTestId('r-name'))).toBe(false);
    expect(byTestId('r-name').parentElement).not.toBe(byTestId('r-spice').parentElement);
    // ONE wrapping row, not a row nested in a row: a nested wrapping row is a
    // single flex item that will not shrink below its content, and its pills
    // ran off the card's right edge at 390 instead of wrapping.
    expect(byTestId('r-spice').parentElement).toBe(byTestId('r-marks'));
    expect(byTestId('r-diet-vegan').parentElement).toBe(byTestId('r-marks'));
  });

  it('draws no marks row at all when there is nothing to mark', () => {
    mount(<MenuItemRow name="Plain" price="€1" testID="r" />);
    expect(queryTestId('r-marks')).toBeNull();
  });
});

describe('sold out', () => {
  it('removes every control and says so', () => {
    mount(
      <MenuItemRow
        name="Harbour pickles"
        price="€4.20"
        quantity={2}
        onQuantityChange={() => undefined}
        onAdd={() => undefined}
        onPress={() => undefined}
        unavailable
        testID="r"
      />,
    );
    expect(queryTestId('r-add')).toBeNull();
    expect(queryTestId('r-stepper')).toBeNull();
    expect(byTestId('r-unavailable').textContent).toBe('Sold out');
  });
});

describe('the marks', () => {
  it('clamps the heat and names it once, rather than leaving a glyph run silent', () => {
    expect(spiceLevel(0)).toBe(0);
    expect(spiceLevel(undefined)).toBe(0);
    expect(spiceLevel(9)).toBe(MENU_ITEM_SPICE_MAX);
    mount(<MenuItemRow name="Noodles" price="€1" spice={2} testID="r" />);
    expect(byTestId('r-spice').getAttribute('aria-label')).toBe('Spicy 2 of 3');
    expect(byTestId('r-spice').getAttribute('role')).toBe('img');
  });

  it('draws each diet once and hides the pills, which the name already carries', () => {
    mount(<MenuItemRow name="Stew" price="€1" diets={['vegan', 'vegan', 'halal']} testID="r" />);
    expect(byTestId('r-marks').getAttribute('aria-hidden')).toBe('true');
    expect(queryTestId('r-diet-vegan')).not.toBeNull();
    expect(byTestId('r-marks').childElementCount).toBe(2);
  });
});

describe('the row’s name is the row, minus the description', () => {
  it('says the diets, the heat, the price and the basket count, in reading order', () => {
    const dish: MenuItemRowProps = {
      name: 'Kestrel chilli noodles',
      description: 'Hand-pulled noodles, fermented chilli, peanuts.',
      diets: ['vegan'],
      spice: 3,
      price: '€13.80',
      originalPrice: '€16.00',
      quantity: 2,
    };
    const name = composeMenuItemName(dish);
    expect(name).toBe(
      'Kestrel chilli noodles, Vegan, Spicy 3 of 3, €13.80, originally €16.00, 2 in basket',
    );
    expect(name).not.toContain('Hand-pulled');
  });

  it('adds the sold-out word at the end', () => {
    expect(composeMenuItemName({ name: 'X', price: '€1', unavailable: true })).toBe('X, €1, Sold out');
  });
});
