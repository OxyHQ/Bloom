/**
 * How `AvatarGroup` decides what to call a person, and why `??` is the wrong
 * operator for it.
 *
 * `displayName` is optional ecosystem-wide, and the API sends `''` and `'   '`
 * for it as well as omitting it. `??` falls through on `null`/`undefined` ONLY,
 * so under it a blank display name WINS over the handle behind it. The failure
 * is silent and it is not a blank circle: `Avatar` trims, correctly reads the
 * blank as "no name", and renders the DEFAULT AVATAR IMAGE — the one
 * placeholder that says nothing about who the person is, in the exact case
 * where the handle's initial was available all along.
 *
 * The org rule (`~/AGENTS.md`) is `displayName?.trim() || handle`, and every
 * assertion here is that rule read back off the rendered tree rather than off
 * the helper: a prop-level check would pass on a component that resolved the
 * name correctly and then handed it to the wrong slot.
 */
import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { AvatarGroup } from '../avatar-group';
import type { AvatarGroupItem } from '../avatar-group';

function renderGroup(items: AvatarGroupItem[]) {
  return render(
    <BloomThemeProvider>
      <AvatarGroup items={items} showInitials max={10} />
    </BloomThemeProvider>,
  );
}

interface HostNode {
  type: string;
  props: Record<string, unknown>;
  children?: unknown[];
}

/** Every host node of `type` in a rendered tree. */
function hostsOfType(tree: unknown, type: string): HostNode[] {
  const out: HostNode[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!node || typeof node !== 'object') return;
    const candidate = node as HostNode;
    if (candidate.type === type) out.push(candidate);
    if (candidate.children) walk(candidate.children);
  };
  walk(tree);
  return out;
}

describe('AvatarGroup identity resolution', () => {
  it('takes the display name when there is a real one', () => {
    const { getByText } = renderGroup([
      { id: '1', displayName: 'Ada Lovelace', username: 'ada' },
    ]);
    expect(getByText('A')).toBeTruthy();
  });

  it('falls through to the handle when displayName is ABSENT', () => {
    const { getByText } = renderGroup([{ id: '1', username: 'grace' }]);
    expect(getByText('G')).toBeTruthy();
  });

  it('falls through to the handle when displayName is an EMPTY STRING', () => {
    // The case `??` gets wrong. Before the fix this rendered a default avatar
    // image and no initial at all.
    const rendered = renderGroup([{ id: '1', displayName: '', username: 'hopper' }]);
    expect(rendered.getByText('H')).toBeTruthy();
    expect(hostsOfType(rendered.toJSON(), 'Image')).toHaveLength(0);
  });

  it('falls through to the handle when displayName is WHITESPACE ONLY', () => {
    // The other half of the same case — `'   '` is truthy, so `||` alone would
    // not have caught it either. `.trim()` is what does.
    const rendered = renderGroup([{ id: '1', displayName: '   ', username: 'zoe' }]);
    expect(rendered.getByText('Z')).toBeTruthy();
    expect(hostsOfType(rendered.toJSON(), 'Image')).toHaveLength(0);
  });

  it('prefers displayName over name, and name over the handle', () => {
    // The whole chain, so a fix that collapsed it to `displayName || username`
    // would be caught — `name` is a real field with real callers.
    expect(
      renderGroup([{ id: '1', displayName: 'Ada', name: 'Bea', username: 'cyd' }]).getByText('A'),
    ).toBeTruthy();
    expect(
      renderGroup([{ id: '2', displayName: '  ', name: 'Bea', username: 'cyd' }]).getByText('B'),
    ).toBeTruthy();
    expect(
      renderGroup([{ id: '3', displayName: '  ', name: '  ', username: 'cyd' }]).getByText('C'),
    ).toBeTruthy();
  });

  it('renders the neutral placeholder when NOTHING names the person', () => {
    // The honest terminal case, and the control for the two assertions above:
    // "no Image" only means "the initial rendered" if an Image is what appears
    // when it does not.
    const rendered = renderGroup([{ id: '1', displayName: '  ', username: '   ' }]);
    expect(hostsOfType(rendered.toJSON(), 'Image')).toHaveLength(1);
  });

  it('trims the handle in the accessibility label too', () => {
    // `item.username` of `'  '` is TRUTHY, so the untrimmed form announced
    // "Ada (@  )" — a label that reads a handle nobody has.
    const { getByLabelText } = render(
      <BloomThemeProvider>
        <AvatarGroup
          items={[{ id: '1', displayName: 'Ada', username: '  ' }]}
          showInitials
          onPressItem={() => {}}
        />
      </BloomThemeProvider>,
    );
    expect(getByLabelText('Ada')).toBeTruthy();
  });

  it('announces name and handle together when both are real', () => {
    const { getByLabelText } = render(
      <BloomThemeProvider>
        <AvatarGroup
          items={[{ id: '1', displayName: 'Ada Lovelace', username: 'ada' }]}
          showInitials
          onPressItem={() => {}}
        />
      </BloomThemeProvider>,
    );
    expect(getByLabelText('Ada Lovelace (@ada)')).toBeTruthy();
  });

  it('does not collapse two blank ids into one React key', () => {
    // `getItemKey` carried the identical `??` hazard with a different blast
    // radius: a blank `id` yielded the key `''`, and two of them collide.
    //
    // Asserting that both cells RENDER does not catch this — measured: with the
    // fix reverted both initials still appear, because React warns about the
    // duplicate key and renders the children anyway. The damage is
    // reconciliation on a later reorder, which this component never performs
    // itself, so the WARNING is the only signal available and it is what is
    // asserted. The render assertions stay as the vacuity floor: without them a
    // group that rendered nothing would also log no warning.
    const warn = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const rendered = renderGroup([
        { id: '', username: 'ada' },
        { id: '', username: 'bea' },
      ]);
      expect(rendered.getByText('A')).toBeTruthy();
      expect(rendered.getByText('B')).toBeTruthy();
      const duplicateKeyWarnings = warn.mock.calls
        .map((args) => args.map(String).join(' '))
        .filter((text) => text.includes('same key'));
      expect(duplicateKeyWarnings).toEqual([]);
    } finally {
      warn.mockRestore();
    }
  });
});
