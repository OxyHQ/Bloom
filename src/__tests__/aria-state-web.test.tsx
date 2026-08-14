/**
 * @jest-environment jsdom
 */

// Every stateful Bloom control, checked against the DOM it actually produces.
//
// The bug this suite exists for: `Checkbox` announced no state on web. It set
// `accessibilityState={{checked}}` — the React Native answer, and the one every
// other control here used too — but react-native-web's `createDOMProps` never
// reads `accessibilityState`. It reads the `aria-*` props. So the box was drawn
// checked while assistive technology saw a `role="checkbox"` with no state at
// all, and the same was true of tab strips, radio options, accordions, sliders
// and toggles across the library.
//
// It survived because the existing suites assert on PROPS: `accessibilityState`
// was set, so they passed, and no prop-level assertion can tell you what
// react-native-web does with it afterwards. These tests render through the REAL
// react-native-web into jsdom and read the emitted ATTRIBUTES, which is the only
// place the difference is visible.
//
// The cross-platform contract, verified against both runtimes in node_modules:
//   - react-native-web `createDOMProps` reads `aria-*`, ignores
//     `accessibilityState` (it appears nowhere in that module).
//   - React Native's `Pressable`/`View` fold `aria-busy|checked|disabled|
//     expanded|selected` and `aria-value{min,max,now,text}` BACK into
//     `accessibilityState`/`accessibilityValue`, with the `aria-*` value
//     winning. So `aria-*` is the one spelling both platforms honour.
//   - EXCEPT `aria-pressed`, which React Native has no concept of (its
//     `AccessibilityState` is disabled/selected/checked/busy/expanded only).
//     Toggles with `role="button"` therefore set BOTH: `accessibilityState`
//     for native, `aria-pressed` for web. ARIA scopes these states by role —
//     `aria-selected` would be invalid on a button, as `aria-pressed` would be
//     on a tab — which is why the spelling differs per control rather than
//     being one blanket substitution.
//   - `aria-disabled` on a `Pressable` is a special case: react-native-web's
//     `Pressable` appends its own from the `disabled` prop AFTER the caller's
//     props, so a caller-supplied `aria-disabled` is overwritten there and the
//     `disabled` PROP is the only spelling that works. On a plain `View` there
//     is no such prop, so `aria-disabled` is the only one that works.

import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// The whole point is what react-native-web puts in the DOM, so this suite runs
// against the REAL RNW. Under the repo-wide `react-native` mock every assertion
// below would read a prop straight back off a stub element and pass whether or
// not the fix is present — the exact vacuity that let this ship.
jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Text } from 'react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Checkbox } from '../checkbox/Checkbox';
import { Switch } from '../switch/Switch';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../accordion';
import { Chip } from '../chip';
import { Item } from '../item';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { Button } from '../button/Button';
import { Slider } from '../slider';
import { InputGroup } from '../input-group';
import { SettingsListItem } from '../settings-list/SettingsList';
import { FrostedIconButton } from '../frosted-icon-button';
import { CompositionBar } from '../composition-bar';
import { Radio, RadioGroup } from '../radio';
import { StatBar } from '../stat-bar';
import { DotGridMeter } from '../dot-grid-meter';
import { DialogLargeTitle, useDialogHeaderController } from '../dialog/DialogHeader';
// Both Select forks by explicit filename: jest has no platform-extension
// resolution, so a bare `'../select'` would only ever exercise the native one
// and the web fork could drift back unnoticed.
import {
  Select as WebSelect,
  SelectItem as WebSelectItem,
  SelectItemText as WebSelectItemText,
} from '../select/index.web';
import {
  Select as NativeSelect,
  SelectItem as NativeSelectItem,
  SelectItemText as NativeSelectItemText,
} from '../select/index';
import { TabBar, TabBarButton } from '../tab-bar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

/** The DOM node react-native-web rendered for `testID`. */
function byTestId(c: HTMLElement, id: string): HTMLElement {
  const el = c.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(`No element rendered for testID "${id}"`);
  }
  return el;
}

/** The first node carrying `role`, which is what a screen reader would find. */
function byRole(c: HTMLElement, role: string): HTMLElement {
  const el = c.querySelector(`[role="${role}"]`);
  if (!(el instanceof HTMLElement)) {
    throw new Error(
      `No element with role="${role}" in DOM:\n${c.innerHTML.slice(0, 600)}`,
    );
  }
  return el;
}

function allByRole(c: HTMLElement, role: string): HTMLElement[] {
  return Array.from(c.querySelectorAll(`[role="${role}"]`)).filter(
    (el): el is HTMLElement => el instanceof HTMLElement,
  );
}

// ---------------------------------------------------------------------------

describe('Checkbox (the reported defect)', () => {
  it('emits aria-checked="true" when checked', () => {
    const c = mount(<Checkbox checked onCheckedChange={() => {}} label="Sync" testID="cb" />);
    const el = byTestId(c, 'cb');
    expect(el.getAttribute('role')).toBe('checkbox');
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('emits aria-checked="false" when unchecked — absent is not the same as false', () => {
    // An omitted attribute leaves the control stateless to assistive tech,
    // which is what shipped. "false" is a positive statement of unchecked.
    const c = mount(
      <Checkbox checked={false} onCheckedChange={() => {}} label="Sync" testID="cb" />,
    );
    expect(byTestId(c, 'cb').getAttribute('aria-checked')).toBe('false');
  });

  it('emits aria-checked="mixed" when indeterminate', () => {
    const c = mount(
      <Checkbox checked={false} indeterminate onCheckedChange={() => {}} label="S" testID="cb" />,
    );
    expect(byTestId(c, 'cb').getAttribute('aria-checked')).toBe('mixed');
  });

  it('emits aria-disabled when disabled', () => {
    const c = mount(
      <Checkbox checked onCheckedChange={() => {}} label="Sync" disabled testID="cb" />,
    );
    expect(byTestId(c, 'cb').getAttribute('aria-disabled')).toBe('true');
  });

  it('tracks a state change across a re-render', () => {
    const c = mount(<Checkbox checked={false} onCheckedChange={() => {}} label="S" testID="cb" />);
    expect(byTestId(c, 'cb').getAttribute('aria-checked')).toBe('false');
    mount(<Checkbox checked onCheckedChange={() => {}} label="S" testID="cb" />);
    expect(byTestId(c, 'cb').getAttribute('aria-checked')).toBe('true');
  });
});

describe('Switch', () => {
  it('emits role="switch" with aria-checked', () => {
    const c = mount(<Switch value onValueChange={() => {}} testID="sw" />);
    const el = byTestId(c, 'sw');
    expect(el.getAttribute('role')).toBe('switch');
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('emits aria-checked="false" when off', () => {
    const c = mount(<Switch value={false} onValueChange={() => {}} testID="sw" />);
    expect(byTestId(c, 'sw').getAttribute('aria-checked')).toBe('false');
  });

  it('emits aria-disabled when disabled', () => {
    // Regression: the switch guarded presses internally but never passed
    // `disabled` to its Pressable, so web announced a disabled switch as
    // operable. react-native-web overwrites a caller's `aria-disabled` on a
    // Pressable, so the prop is the only route.
    const c = mount(<Switch value onValueChange={() => {}} disabled testID="sw" />);
    expect(byTestId(c, 'sw').getAttribute('aria-disabled')).toBe('true');
  });
});

describe('Accordion', () => {
  it('Accordion trigger emits aria-expanded reflecting the open item', () => {
    const c = mount(
      <Accordion type="single" value="a" onValueChange={() => {}}>
        <AccordionItem value="a">
          <AccordionTrigger>Open one</AccordionTrigger>
          <AccordionContent>
            <Text>body</Text>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Closed one</AccordionTrigger>
          <AccordionContent>
            <Text>body</Text>
          </AccordionContent>
        </AccordionItem>
      </Accordion>,
    );
    const triggers = allByRole(c, 'button');
    expect(triggers).toHaveLength(2);
    expect(triggers[0]?.getAttribute('aria-expanded')).toBe('true');
    expect(triggers[1]?.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('role="button" toggles use aria-pressed', () => {
  // ARIA defines the toggle state of a button as `aria-pressed`; `aria-selected`
  // is not valid on that role. React Native has no `aria-pressed`, so these
  // components keep `accessibilityState={{selected}}` for native alongside it.
  it('Chip emits aria-pressed when selected', () => {
    const c = mount(
      <Chip onPress={() => {}} selected testID="chip">
        Filter
      </Chip>,
    );
    expect(byTestId(c, 'chip').getAttribute('aria-pressed')).toBe('true');
  });

  it('Chip emits aria-pressed="false" when unselected', () => {
    const c = mount(
      <Chip onPress={() => {}} selected={false} testID="chip">
        Filter
      </Chip>,
    );
    expect(byTestId(c, 'chip').getAttribute('aria-pressed')).toBe('false');
  });

  it('FrostedIconButton emits aria-pressed, matching its .web fork', () => {
    const c = mount(
      <FrostedIconButton accessibilityLabel="Back" icon={<Text>x</Text>} active testID="fib" />,
    );
    expect(byTestId(c, 'fib').getAttribute('aria-pressed')).toBe('true');
  });

  it('CompositionBar marks the selected segment with aria-pressed', () => {
    const c = mount(
      <CompositionBar
        categories={[
          { key: 'a', name: 'Alpha', amount: 3, color: '#111111' },
          { key: 'b', name: 'Beta', amount: 1, color: '#222222' },
        ]}
        selectedKey="b"
        onSelect={() => {}}
        hintLabel="Tap a segment"
      />,
    );
    const segments = allByRole(c, 'button');
    expect(segments).toHaveLength(2);
    expect(segments[0]?.getAttribute('aria-pressed')).toBe('false');
    expect(segments[1]?.getAttribute('aria-pressed')).toBe('true');
  });
});

// `Item` puts `testID` on its inner content View, so these query the node that
// actually carries the role — which is the one a screen reader reads.
describe('Item selection is spelled per its role', () => {
  it('a pressable row defaults to a button toggle: aria-pressed', () => {
    const c = mount(<Item title="Row" onPress={() => {}} selected />);
    expect(byRole(c, 'button').getAttribute('aria-pressed')).toBe('true');
  });

  it('role="option" gets aria-selected, which is what ARIA allows there', () => {
    const c = mount(<Item title="Row" role="option" onPress={() => {}} selected />);
    const el = byRole(c, 'option');
    expect(el.getAttribute('aria-selected')).toBe('true');
    // `aria-pressed` is not valid on `option` and must not be emitted too.
    expect(el.hasAttribute('aria-pressed')).toBe(false);
  });

  it('role="radio" gets aria-checked, which is what ARIA allows there', () => {
    // The role a single-choice list needs, and the one `Select`'s two forks
    // spell by hand. Both platforms have it, so it also travels on
    // `accessibilityRole` rather than being web-only like `option`.
    const c = mount(<Item title="Row" role="radio" onPress={() => {}} selected />);
    const el = byRole(c, 'radio');
    expect(el.getAttribute('aria-checked')).toBe('true');
    expect(el.hasAttribute('aria-selected')).toBe(false);
    expect(el.hasAttribute('aria-pressed')).toBe(false);
  });

  it('a row with no selection state emits neither attribute', () => {
    const c = mount(<Item title="Row" onPress={() => {}} />);
    const el = byRole(c, 'button');
    expect(el.hasAttribute('aria-pressed')).toBe(false);
    expect(el.hasAttribute('aria-selected')).toBe(false);
  });

  it('a non-pressable disabled row emits aria-disabled', () => {
    // This branch renders a View, which has no `disabled` prop for
    // react-native-web to derive the attribute from.
    const c = mount(<Item title="Row" disabled />);
    expect(c.querySelector('[aria-disabled="true"]')).not.toBeNull();
  });
});

describe('SegmentedControl spells the active state for its role', () => {
  it('type="tabs" emits aria-selected on role="tab"', () => {
    const c = mount(
      <SegmentedControl label="View" type="tabs" value="one" onChange={() => {}}>
        <SegmentedControlItem value="one" testID="seg-one">
          <Text>One</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="two" testID="seg-two">
          <Text>Two</Text>
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    expect(byTestId(c, 'seg-one').getAttribute('role')).toBe('tab');
    expect(byTestId(c, 'seg-one').getAttribute('aria-selected')).toBe('true');
    expect(byTestId(c, 'seg-two').getAttribute('aria-selected')).toBe('false');
  });

  it('type="radio" emits aria-checked on role="radio", not aria-selected', () => {
    // ARIA gives `radio` a checked state; `aria-selected` is invalid there, so
    // one blanket spelling for both modes would be wrong for this one.
    const c = mount(
      <SegmentedControl label="View" type="radio" value="two" onChange={() => {}}>
        <SegmentedControlItem value="one" testID="seg-one">
          <Text>One</Text>
        </SegmentedControlItem>
        <SegmentedControlItem value="two" testID="seg-two">
          <Text>Two</Text>
        </SegmentedControlItem>
      </SegmentedControl>,
    );
    const two = byTestId(c, 'seg-two');
    expect(two.getAttribute('role')).toBe('radio');
    expect(two.getAttribute('aria-checked')).toBe('true');
    expect(two.hasAttribute('aria-selected')).toBe(false);
    expect(byTestId(c, 'seg-one').getAttribute('aria-checked')).toBe('false');
  });
});

describe('Button', () => {
  it('emits aria-busy while loading, matching Button.web', () => {
    const c = mount(
      <Button loading testID="btn">
        Saving
      </Button>,
    );
    expect(byTestId(c, 'btn').getAttribute('aria-busy')).toBe('true');
  });

  it('emits aria-disabled while loading, from the disabled prop', () => {
    const c = mount(
      <Button loading testID="btn">
        Saving
      </Button>,
    );
    expect(byTestId(c, 'btn').getAttribute('aria-disabled')).toBe('true');
  });

  it('emits no aria-busy when idle', () => {
    const c = mount(<Button testID="btn">Save</Button>);
    expect(byTestId(c, 'btn').hasAttribute('aria-busy')).toBe(false);
  });
});

describe('Slider', () => {
  it('emits the value as aria-value* — the object form reached web as nothing', () => {
    // react-native-web has no handling for `accessibilityValue` at all, so the
    // slider announced its role and no value whatsoever.
    const c = mount(
      <Slider value={40} min={0} max={100} onValueChange={() => {}} testID="sl" />,
    );
    const el = byTestId(c, 'sl');
    expect(el.getAttribute('role')).toBe('slider');
    expect(el.getAttribute('aria-valuenow')).toBe('40');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('100');
  });

  it('emits aria-disabled when disabled', () => {
    const c = mount(
      <Slider value={0} min={0} max={10} onValueChange={() => {}} disabled testID="sl" />,
    );
    expect(byTestId(c, 'sl').getAttribute('aria-disabled')).toBe('true');
  });
});

// ARIA gives `role="radio"` a checked state, not a selected one. Both forks are
// asserted from one place so the platforms cannot drift apart again.
describe.each([
  ['web', WebSelect, WebSelectItem, WebSelectItemText] as const,
  ['native', NativeSelect, NativeSelectItem, NativeSelectItemText] as const,
])('SelectItem (%s fork) through react-native-web', (_p, Select, SelectItem, SelectItemText) => {
  it('emits aria-checked reflecting the current value', () => {
    const c = mount(
      <Select value="a">
        <SelectItem value="a" label="Option A">
          <SelectItemText>Option A</SelectItemText>
        </SelectItem>
        <SelectItem value="b" label="Option B">
          <SelectItemText>Option B</SelectItemText>
        </SelectItem>
      </Select>,
    );
    const options = allByRole(c, 'radio');
    expect(options).toHaveLength(2);
    expect(options[0]?.getAttribute('aria-checked')).toBe('true');
    expect(options[1]?.getAttribute('aria-checked')).toBe('false');
  });
});

describe('TabBar', () => {
  it('emits aria-selected on the focused tab', () => {
    const items = [
      { name: 'home', label: 'Home', icon: <Text>h</Text> },
      { name: 'search', label: 'Search', icon: <Text>s</Text> },
    ];
    const c = mount(
      <TabBar activeIndex={1}>
        {items.map((item, index) => (
          <TabBarButton key={item.name} item={item} index={index} />
        ))}
      </TabBar>,
    );
    const tabs = allByRole(c, 'tab');
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.getAttribute('aria-selected')).toBe('false');
    expect(tabs[1]?.getAttribute('aria-selected')).toBe('true');
  });
});

describe('Radio', () => {
  it('emits role="radio" with aria-checked', () => {
    const c = mount(
      <Radio value="daily" selected onSelect={() => {}} label="Daily" testID="r" />,
    );
    const el = byTestId(c, 'r');
    expect(el.getAttribute('role')).toBe('radio');
    expect(el.getAttribute('aria-checked')).toBe('true');
  });

  it('emits aria-checked="false" when not chosen — absent is not the same as false', () => {
    const c = mount(
      <Radio value="daily" selected={false} onSelect={() => {}} label="Daily" testID="r" />,
    );
    expect(byTestId(c, 'r').getAttribute('aria-checked')).toBe('false');
  });

  it('emits aria-disabled when disabled', () => {
    const c = mount(
      <Radio value="daily" selected onSelect={() => {}} label="Daily" disabled testID="r" />,
    );
    expect(byTestId(c, 'r').getAttribute('aria-disabled')).toBe('true');
  });

  it('RadioGroup names itself and marks exactly one option', () => {
    // A `radiogroup` with no accessible name announces a list of options and
    // nothing about what is being chosen, and "2 of 4" is only announced when
    // the options sit inside one.
    const c = mount(
      <RadioGroup
        label="Digest frequency"
        value="weekly"
        onValueChange={() => {}}
        options={[
          { value: 'daily', label: 'Daily' },
          { value: 'weekly', label: 'Weekly' },
        ]}
      />,
    );
    const group = byRole(c, 'radiogroup');
    expect(group.getAttribute('aria-label')).toBe('Digest frequency');
    const options = allByRole(c, 'radio');
    expect(options).toHaveLength(2);
    expect(options[0]?.getAttribute('aria-checked')).toBe('false');
    expect(options[1]?.getAttribute('aria-checked')).toBe('true');
  });
});

// `Slider` above was fixed on its own and its three siblings were not, because
// joining this suite is a step somebody has to remember. `aria-state-source-
// census.test.ts` is the half that fails by default; these are the three it
// found, asserted against the DOM react-native-web actually emits.
describe('progressbars announce their value', () => {
  it('StatBar', () => {
    const c = mount(<StatBar label="Storage" value={30} max={120} testID="sb" />);
    const el = byRole(c, 'progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('30');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('120');
    // A progressbar with no label announces a number and nothing about what it
    // measures, so the bar's own label travels with it.
    expect(el.getAttribute('aria-label')).toBe('Storage');
  });

  it('DotGridMeter', () => {
    const c = mount(<DotGridMeter filled={3} total={10} testID="dg" />);
    const el = byTestId(c, 'dg');
    expect(el.getAttribute('role')).toBe('progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('3');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('10');
  });

  it('DotGridMeter clamps the announced value to the total', () => {
    const c = mount(<DotGridMeter filled={99} total={10} testID="dg" />);
    expect(byTestId(c, 'dg').getAttribute('aria-valuenow')).toBe('10');
  });

  it('the dialog header wizard step', () => {
    // The controller holds shared values, so it has to be created inside a
    // component rather than beside the assertion.
    function WizardHeader(): React.ReactElement {
      const controller = useDialogHeaderController();
      return (
        <DialogLargeTitle
          controller={controller}
          header={{ title: 'Set up', progress: { step: 2, total: 4 } }}
        />
      );
    }
    const c = mount(<WizardHeader />);
    const el = byRole(c, 'progressbar');
    expect(el.getAttribute('aria-valuenow')).toBe('2');
    expect(el.getAttribute('aria-valuemin')).toBe('0');
    expect(el.getAttribute('aria-valuemax')).toBe('4');
  });
});

describe('View-based containers emit aria-disabled', () => {
  it('InputGroup', () => {
    const c = mount(
      <InputGroup disabled testID="ig">
        <Text>field</Text>
      </InputGroup>,
    );
    expect(byTestId(c, 'ig').getAttribute('aria-disabled')).toBe('true');
  });

  it('SettingsListItem without onPress', () => {
    const c = mount(<SettingsListItem title="Wi-Fi" disabled />);
    // The row renders a View wrapping the content; the disabled state belongs
    // on whichever node carries the a11y role.
    expect(c.querySelector('[aria-disabled="true"]')).not.toBeNull();
  });
});
