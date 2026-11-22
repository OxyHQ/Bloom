import { createElement, useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

import { mount, only, quietRenderer } from './support/mount';
import { Embed, List, ScrollArea, Text, VirtualList } from '../index';
import { toElement } from '../render';
import { resolveSpace } from '../tokens';

quietRenderer();

/** Says the bottom of the safe area it reads. */
function Probe() {
  const insets = useContext(SafeAreaInsetsContext);
  return createElement('Probe', { bottom: insets?.bottom });
}

describe('safe-area insets on a scroll', () => {
  it('the content reads a safe area raised by the room the pinned view takes', () => {
    const r = mount(
      toElement(
        ScrollArea(Embed(createElement(Probe))).safeAreaInset('bottom', Text('Composer'), 'md'),
      ),
    );
    // Before the pinned view is measured, the room is its spacing.
    expect(only(r, 'Probe').props.bottom).toBe(resolveSpace('md'));
  });

  it('a virtual list makes room for a pinned view in its content', () => {
    const r = mount(
      toElement(
        VirtualList(['a', 'b'], ({ item }) => Text(item)).safeAreaInset(
          'bottom',
          Text('Composer'),
          'md',
        ),
      ),
    );
    const padded = r.root.findAll(
      (node) =>
        (node.props.contentContainerStyle as { paddingBottom?: number } | undefined)
          ?.paddingBottom === resolveSpace('md'),
    );
    expect(padded.length).toBeGreaterThan(0);
  });

  it('a list that scrolls makes room in its scroller’s content', () => {
    const r = mount(toElement(List([]).scrollable().safeAreaInset('top', Text('Filters'), 'md')));
    const padded = r.root.findAll(
      (node) =>
        (node.props.contentContainerStyle as { paddingTop?: number } | undefined)?.paddingTop ===
        resolveSpace('md'),
    );
    expect(padded.length).toBeGreaterThan(0);
  });
});
