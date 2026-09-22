/**
 * @jest-environment jsdom
 */

/**
 * The `Menubar` parts that are the SAME on both platforms.
 *
 * `Menubar`, `MenubarMenu` and `MenubarTrigger` live in `MenubarBase` so the
 * two forks hold only what actually diverges — the surface a menu opens into.
 * Nothing exercised them before: replacing `MENUBAR_CLASS` on the bar with a
 * sentinel left all 116 tests of `trigger-classname`, `overlay-stack-order`
 * and `aria-state-web` green, so the extraction shipped with nothing able to
 * report a regression in it.
 *
 * What is pinned here is the shared contract, not the chrome's exact values:
 *
 *  1. The bar announces itself as a `menubar` and carries its geometry class.
 *  2. At most ONE menu is open, and switching is a SINGLE state write — the
 *     reason the root owns "which value is open" instead of each menu owning a
 *     boolean (`context.ts`). A frame with nothing open is the defect.
 *  3. The trigger reports `aria-expanded` and `aria-haspopup`. On web
 *     `accessibilityState` is dropped entirely by react-native-web, so the
 *     flat `aria-*` props are the only ones that reach a screen reader.
 *  4. A caller's `className` reaches the node the parent lays out.
 */
import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { Menubar, MenubarMenu, MenubarTrigger } from '../menubar';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { classNamesOn, findHost, hostNodes } from './support/rendered-style';

function renderBar(ui: React.ReactNode) {
  return render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>);
}

function bar(children: React.ReactNode, props: Record<string, unknown> = {}) {
  return (
    <Menubar testID="bar" {...props}>
      {children}
    </Menubar>
  );
}

const twoMenus = (
  <>
    <MenubarMenu value="file">
      <MenubarTrigger testID="file-trigger" label="File">
        File
      </MenubarTrigger>
    </MenubarMenu>
    <MenubarMenu value="edit">
      <MenubarTrigger testID="edit-trigger" label="Edit">
        Edit
      </MenubarTrigger>
    </MenubarMenu>
  </>
);

describe('Menubar (shared across both platforms)', () => {
  it('announces the bar and carries its geometry class', () => {
    const tree = renderBar(bar(twoMenus));
    const node = findHost(tree.toJSON(), 'bar');
    expect(node).not.toBeNull();
    expect(node?.props.role).toBe('menubar');
    expect(node?.props['aria-label']).toBe('Menu bar');
    // `flex-row items-center gap-1 rounded-… border p-1` — the bar's own
    // geometry, which nothing else in the family supplies.
    expect(classNamesOn(node?.props.style).join(' ')).toContain('flex-row');
  });

  it('takes a caller className without losing the bar geometry', () => {
    const tree = renderBar(bar(twoMenus, { className: 'w-[321px]' }));
    const classes = classNamesOn(findHost(tree.toJSON(), 'bar')?.props.style).join(' ');
    expect(classes).toContain('w-[321px]');
    expect(classes).toContain('flex-row');
  });

  it('opens at most one menu, and switching is a single write', () => {
    const onValueChange = jest.fn();
    const tree = renderBar(bar(twoMenus, { onValueChange }));

    // By LABEL, not by testID: `TriggerSlot` puts `testID` on the wrapper it
    // measures the anchor from, and the press handler on the `Pressable`
    // inside it. Pressing the wrapper does nothing, silently.
    fireEvent.press(tree.getByLabelText('File'));
    expect(onValueChange).toHaveBeenLastCalledWith('file');

    // The defect this guards: closing then opening is TWO writes with a frame
    // of nothing open between them. Pressing a sibling must be one call, and
    // it must name the sibling — never `undefined` first.
    onValueChange.mockClear();
    fireEvent.press(tree.getByLabelText('Edit'));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith('edit');
  });

  it('closes the open menu when its own trigger is pressed again', () => {
    const onValueChange = jest.fn();
    const tree = renderBar(bar(twoMenus, { defaultValue: 'file', onValueChange }));
    fireEvent.press(tree.getByLabelText('File'));
    expect(onValueChange).toHaveBeenCalledWith(undefined);
  });

  it('reports expansion through the flat aria props, which are the ones web keeps', () => {
    const tree = renderBar(bar(twoMenus, { defaultValue: 'file' }));
    const open = tree.getByLabelText('File');
    const shut = tree.getByLabelText('Edit');
    expect(open.props['aria-expanded']).toBe(true);
    expect(shut.props['aria-expanded']).toBe(false);
    expect(open.props['aria-haspopup']).toBe('menu');
    // react-native-web drops `accessibilityState` entirely and reads only
    // `aria-*`, so a control that set just the former would render a role
    // carrying no state at all. This asserts the ATTRIBUTE, not the prop.
    expect(open.props.accessibilityState).toBeUndefined();
  });

  it('names a trigger, and puts the name on the node that handles the press', () => {
    const tree = renderBar(bar(twoMenus));
    const trigger = tree.getByLabelText('File');
    expect(trigger.props.accessibilityRole).toBe('button');
    // The anchor wrapper is a different node and carries neither — measuring
    // the wrapper is how a trigger test passes while the control is unnamed.
    expect(tree.getByTestId('file-trigger').props.accessibilityLabel).toBeUndefined();
  });

  it('hands the whole trigger to the caller under asChild', () => {
    const tree = renderBar(
      bar(
        <MenubarMenu value="file">
          <MenubarTrigger asChild testID="custom" label="File">
            <Text testID="custom-child">File</Text>
          </MenubarTrigger>
        </MenubarMenu>,
      ),
    );
    expect(tree.getByTestId('custom-child')).toBeTruthy();
    // The caller's element IS the trigger: it carries the handle, and Bloom's
    // own pressable chrome is not rendered beside it.
    expect(tree.getByLabelText('File').props['aria-haspopup']).toBe('menu');
    const classes = hostNodes(tree.toJSON()).flatMap((n) => classNamesOn(n.props.style));
    expect(classes.join(' ')).not.toContain('justify-center px-space-8');
  });
});
