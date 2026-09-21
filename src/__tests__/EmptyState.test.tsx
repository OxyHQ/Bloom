/**
 * @jest-environment jsdom
 *
 * `EmptyState` through the REAL react-native-web.
 *
 * The properties this file exists for are the ones a prop-level test cannot
 * see, and they are the reasons the family exists at all:
 *
 *   - the whole block is ONE named `group`, so a screen reader reaching an
 *     empty list is told the situation rather than handed a heading, a
 *     paragraph and a button with nothing joining them;
 *   - the glyph is HIDDEN from assistive technology — it repeats the title, and
 *     an unnamed image between a heading and its paragraph announces nothing;
 *   - `illustration` is read for PRESENCE, so an explicit `null` beats an
 *     `icon` that arrived from a default;
 *   - the two rungs are a real geometry difference, asserted as resolved
 *     padding rather than as the prop that was passed.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { EmptyState, joinEmptyStateName } from '../empty-state';
import { EMPTY_STATE_GEOMETRY } from '../empty-state/constants';
import { RiInbox2Line } from '../icons/remix/RiInbox2Line';
import { byTestId, click, mount, queryTestId, root$, setupHarness } from './support/commerce-harness';

setupHarness();

const TID = 'empty';

function block(props: Partial<React.ComponentProps<typeof EmptyState>> = {}) {
  return (
    <EmptyState
      icon={RiInbox2Line}
      title="Nothing in this folder"
      description="Mail you file here will show up in this list."
      testID={TID}
      {...props}
    />
  );
}

describe('the block is one named group', () => {
  it('names itself with the title and the line, joined', () => {
    mount(block());
    const group = byTestId(TID);
    expect(group.getAttribute('role')).toBe('group');
    expect(group.getAttribute('aria-label')).toBe(
      'Nothing in this folder. Mail you file here will show up in this list.',
    );
  });

  it('lets a caller name it instead', () => {
    mount(block({ accessibilityLabel: 'Empty inbox' }));
    expect(byTestId(TID).getAttribute('aria-label')).toBe('Empty inbox');
  });

  it('names itself with whichever half it has', () => {
    expect(joinEmptyStateName(['A title', undefined])).toBe('A title');
    expect(joinEmptyStateName([undefined, 'A line'])).toBe('A line');
    expect(joinEmptyStateName([undefined, ''])).toBeUndefined();
  });

  it('draws the title as a level-3 heading, not as a paragraph', () => {
    mount(block());
    const title = byTestId(`${TID}-title`);
    expect(title.getAttribute('role')).toBe('heading');
    expect(title.getAttribute('aria-level')).toBe('3');
    expect(title.textContent).toBe('Nothing in this folder');
  });
});

describe('the mark', () => {
  it('hides the bare glyph from assistive technology', () => {
    mount(block());
    const mark = byTestId(`${TID}-mark`);
    const hidden = mark.querySelector('[aria-hidden="true"]');
    expect(hidden).not.toBeNull();
    expect(hidden!.querySelector('svg')).not.toBeNull();
  });

  it('draws the tinted disc at the rung the variant asks for', () => {
    mount(block({ media: 'circle' }));
    const disc = byTestId(`${TID}-mark`).firstElementChild as HTMLElement;
    // `IconCircle`'s two rungs are 52 (`lg`) and 64 (everything else), and the
    // comfortable variant asks for `xl`.
    expect(getComputedStyle(disc).width).toBe('64px');
    expect(EMPTY_STATE_GEOMETRY.comfortable.circle).toBe('xl');
  });

  it('draws NO mark when `illustration` is explicitly null, even with an icon', () => {
    mount(block({ illustration: null }));
    expect(queryTestId(`${TID}-mark`)).toBeNull();
  });

  it('draws no mark when there is no icon and no illustration', () => {
    mount(block({ icon: undefined }));
    expect(queryTestId(`${TID}-mark`)).toBeNull();
  });

  it('lets an illustration beat the icon', () => {
    mount(block({ illustration: <div data-testid="brand" /> }));
    expect(byTestId(`${TID}-mark`).querySelector('[data-testid="brand"]')).not.toBeNull();
    expect(byTestId(`${TID}-mark`).querySelector('svg')).toBeNull();
  });
});

describe('the two rungs are a geometry, not a name', () => {
  it('gives the screen rung more air than the panel rung', () => {
    mount(block());
    const comfortable = getComputedStyle(byTestId(TID)).paddingTop;
    expect(comfortable).toBe(`${EMPTY_STATE_GEOMETRY.comfortable.paddingVertical}px`);

    mount(block({ variant: 'compact' }));
    const compact = getComputedStyle(byTestId(TID)).paddingTop;
    expect(compact).toBe(`${EMPTY_STATE_GEOMETRY.compact.paddingVertical}px`);
    expect(parseInt(comfortable, 10)).toBeGreaterThan(parseInt(compact, 10));
  });

  it('holds a band open when asked, and not otherwise', () => {
    mount(block({ minHeight: 160 }));
    expect(getComputedStyle(byTestId(TID)).minHeight).toBe('160px');
    mount(block());
    expect(getComputedStyle(byTestId(TID)).minHeight).not.toBe('160px');
  });
});

describe('the actions', () => {
  it('renders at most two, named by their labels, in order', () => {
    const calls: string[] = [];
    mount(
      block({
        action: { label: 'Write a message', onPress: () => calls.push('primary') },
        secondaryAction: { label: 'Refresh', onPress: () => calls.push('secondary') },
      }),
    );
    const buttons = Array.from(root$().querySelectorAll('[role="button"]')) as HTMLElement[];
    expect(buttons.map((b) => b.textContent)).toEqual(['Write a message', 'Refresh']);
    click(buttons[0]!);
    click(buttons[1]!);
    expect(calls).toEqual(['primary', 'secondary']);
  });

  it('draws no action row at all when there is nothing to do', () => {
    mount(block());
    expect(queryTestId(`${TID}-actions`)).toBeNull();
    expect(root$().querySelectorAll('[role="button"]').length).toBe(0);
  });

  it('lets an action name itself differently from its words', () => {
    mount(block({ action: { label: 'Refresh', accessibilityLabel: 'Refresh this folder' } }));
    const button = root$().querySelector('[role="button"]') as HTMLElement;
    expect(button.getAttribute('aria-label')).toBe('Refresh this folder');
    expect(button.textContent).toBe('Refresh');
  });
});

describe('the slots between and below', () => {
  it('stretches `children` to the block width rather than centring it', () => {
    mount(block({ children: <div data-testid="strip" /> }));
    const content = byTestId(`${TID}-content`);
    expect(content.querySelector('[data-testid="strip"]')).not.toBeNull();
    expect(getComputedStyle(content).alignSelf).toBe('stretch');
  });

  it('draws the footer under the actions', () => {
    mount(
      block({
        action: { label: 'Do it' },
        footer: <div data-testid="note" />,
      }),
    );
    const actions = byTestId(`${TID}-actions`);
    const footer = byTestId(`${TID}-footer`);
    // `compareDocumentPosition` rather than an index: the block's children are
    // conditional, so a position is the only stable statement of "after".
    expect(actions.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('draws neither slot when neither was given', () => {
    mount(block());
    expect(queryTestId(`${TID}-content`)).toBeNull();
    expect(queryTestId(`${TID}-footer`)).toBeNull();
  });
});
