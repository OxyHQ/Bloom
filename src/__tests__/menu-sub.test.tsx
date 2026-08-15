/**
 * The sub-menu trio, which is the one part of the menu row vocabulary that
 * presents differently per platform.
 *
 * TWO things are gated here, and they fail in opposite directions:
 *
 *  - The NATIVE presentation, rendered. jest resolves `.tsx` and never
 *    `.web.tsx` (`moduleFileExtensions` names neither), so what a suite renders
 *    IS the native file — an inline disclosure that shows its content in place.
 *  - The WIRING, as a source scan. Which presentation a family ships is decided
 *    by which factory its platform fork passes to `createMenuRows`, and getting
 *    that backwards produces a component that renders perfectly and behaves like
 *    the other platform. No rendered assertion can see it: a jest run only ever
 *    reaches the native file, so a `.web.tsx` passing `createInlineMenuSub`
 *    would leave every suite green and ship a web flyout that is not one.
 *
 * The web presentation itself — position, hover intent, keyboard, Escape order —
 * is verified in a real browser by `scripts/verify-submenu-flyout.mjs`. jest can
 * see none of it.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
} from '../dropdown-menu';
import { MenuSurfaceProvider } from '../floating/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const SRC = path.resolve(__dirname, '..');

function renderSub(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <MenuSurfaceProvider value={{ close: jest.fn(), presentation: 'sheet' }}>
        {ui}
      </MenuSurfaceProvider>
    </BloomThemeProvider>,
  );
}

describe('the native sub-menu is an inline disclosure', () => {
  function subMenu() {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>Send to…</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Email</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  it('renders nothing for the content until the trigger is pressed', () => {
    const { queryByText } = renderSub(subMenu());
    expect(queryByText('Send to…')).toBeTruthy();
    expect(queryByText('Email')).toBeNull();
  });

  it('reveals the content IN PLACE on press, and hides it again', () => {
    const { getByText, queryByText } = renderSub(subMenu());
    fireEvent.press(getByText('Send to…'));
    expect(queryByText('Email')).toBeTruthy();
    fireEvent.press(getByText('Send to…'));
    expect(queryByText('Email')).toBeNull();
  });

  it('announces the disclosure state as aria-expanded', () => {
    const { getByLabelText, getByText } = renderSub(subMenu());
    // `aria-expanded`, not `accessibilityState.expanded`: react-native-web never
    // reads the latter, so a trigger setting only that announces nothing on web.
    // Addressed by LABEL because `Item` maps `role="menuitem"` onto
    // `accessibilityRole="button"`, which a role query cannot distinguish from
    // the rows beside it.
    expect(getByLabelText('Send to…').props['aria-expanded']).toBe(false);
    fireEvent.press(getByText('Send to…'));
    expect(getByLabelText('Send to…').props['aria-expanded']).toBe(true);
  });

  it('honours `defaultOpen`', () => {
    const { queryByText } = renderSub(
      <DropdownMenuSub defaultOpen>
        <DropdownMenuSubTrigger>Send to…</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuItem>Email</DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuSub>,
    );
    expect(queryByText('Email')).toBeTruthy();
  });
});

describe('every menu family wires the presentation its platform ships', () => {
  /**
   * The families that build rows. Derived from the tree rather than listed, so a
   * fourth menu family joins this gate by existing — a hand-maintained list is
   * a gate that skips whatever is missing from it.
   */
  function familyFiles(): string[] {
    const found: string[] = [];
    for (const dir of readdirSync(SRC, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      // `floating/` DEFINES the factory and `__tests__/` is this file; a family
      // is a directory that CALLS it.
      if (dir.name === 'floating' || dir.name === '__tests__') continue;
      for (const name of readdirSync(path.join(SRC, dir.name))) {
        if (!/\.tsx$/.test(name) || name.includes('.stories.')) continue;
        const file = path.join(SRC, dir.name, name);
        if (readFileSync(file, 'utf8').includes('createMenuRows(')) found.push(file);
      }
    }
    return found.sort();
  }

  const files = familyFiles();

  it('finds every file that builds a row set', () => {
    // Vacuity floor: three families, each with a native file and a web fork. A
    // scan that found nothing would otherwise satisfy every `every` below.
    expect(files.length).toBe(6);
  });

  it.each([
    ['native', /\.web\.tsx$/, false, 'createInlineMenuSub'],
    ['web', /\.web\.tsx$/, true, 'createFlyoutMenuSub'],
  ])('a %s fork passes %s', (_label, webPattern, isWeb, factory) => {
    const subset = files.filter((f) => webPattern.test(f) === isWeb);
    expect(subset.length).toBe(3);
    for (const file of subset) {
      const source = readFileSync(file, 'utf8');
      expect(source).toContain(`createMenuRows('`);
      // The factory has to be both IMPORTED and PASSED. Naming it in an import
      // alone would typecheck and ship the other presentation.
      expect(source).toMatch(new RegExp(`import \\{ ${factory} \\} from`));
      expect(source).toMatch(new RegExp(`createMenuRows\\('\\w+', ${factory}\\)`));
    }
  });

  it('no family passes the OTHER platform its factory', () => {
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const wrong = /\.web\.tsx$/.test(file) ? 'createInlineMenuSub' : 'createFlyoutMenuSub';
      expect(source).not.toContain(wrong);
    }
  });
});
