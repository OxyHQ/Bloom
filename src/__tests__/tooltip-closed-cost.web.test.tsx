/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../portal', () => jest.requireActual('../portal/index.web'));

/**
 * Every icon button in a list carries a tooltip (a chat's message actions, a sidebar's rows), and
 * a closed one shows nothing. It used to resolve its menu palette (colour parsing and contrast
 * math), its surface material and its text colour on every render anyway: in a conversation of a
 * thousand messages that was the largest single cost of switching to it after layout. A closed
 * tooltip now reads no palette; an open one reads it as before.
 */
const paletteReads = jest.fn();
jest.mock('../floating/menu-palette', () => {
  const actual = jest.requireActual('../floating/menu-palette');
  return {
    ...actual,
    useMenuPalette: () => {
      paletteReads();
      return actual.useMenuPalette();
    },
  };
});

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip/Tooltip.web';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  paletteReads.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function tooltips(count: number, visible: boolean) {
  return (
    <BloomThemeProvider mode="light">
      {Array.from({ length: count }, (_, i) => (
        <Tooltip key={i} visible={visible} delay={0} onVisibleChange={() => {}}>
          <TooltipTrigger>
            <span>Copy</span>
          </TooltipTrigger>
          <TooltipTextBubble>Copy message</TooltipTextBubble>
        </Tooltip>
      ))}
    </BloomThemeProvider>
  );
}

it('reads no palette while closed', () => {
  act(() => root.render(tooltips(20, false)));
  expect(paletteReads).not.toHaveBeenCalled();
});

it('reads it once the bubble opens', () => {
  act(() => root.render(tooltips(1, true)));
  expect(paletteReads).toHaveBeenCalled();
});
