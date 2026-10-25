/**
 * @jest-environment jsdom
 *
 * The attachment grid is explicit rows. One wrapping row of Buttons measured
 * wrong on Android: Yoga gave its first line the whole sheet and the second
 * line 8dp, so the fifth and sixth items were clipped out of reach. jsdom lays
 * nothing out, so what is pinned here is the structure that cannot fail that
 * way: no wrapping container, `columns` cells per row, and a label that takes
 * two lines rather than an ellipsis.
 */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Button } from '../button/Button.web';
import { AttachmentMenu } from '../chat-composer/AttachmentMenu.web';
import type { AttachmentMenuItem } from '../chat-composer/types';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { resetOverlayStack } from '../overlay/stack';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ITEMS: AttachmentMenuItem[] = [
  'Photos and videos',
  'Camera',
  'Document',
  'Location',
  'Contact',
  'Poll',
].map((label, i) => ({ id: `item-${i}`, label, icon: RiAddLine }));

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  resetOverlayStack();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  resetOverlayStack();
});

function cell(label: string): HTMLElement {
  const found = document.querySelector<HTMLElement>(`[aria-label="${label}"]`);
  if (!found) throw new Error(`no cell named ${label}`);
  return found;
}

/** The row a cell sits in. */
function rowOf(label: string): HTMLElement {
  const row = cell(label).parentElement;
  if (!row) throw new Error(`${label} has no row`);
  return row;
}

describe('AttachmentMenu grid', () => {
  beforeEach(() => {
    act(() => {
      root.render(
        <BloomThemeProvider mode="light">
          <AttachmentMenu open onOpenChange={() => {}} items={ITEMS}>
            <Button>Attach</Button>
          </AttachmentMenu>
        </BloomThemeProvider>,
      );
    });
  });

  it('lays out `columns` cells per row, the short last row keeping the columns', () => {
    const firstRow = rowOf('Photos and videos');
    for (const label of ['Camera', 'Document', 'Location']) {
      expect(cell(label).parentElement).toBe(firstRow);
    }
    const secondRow = rowOf('Contact');
    expect(secondRow).not.toBe(firstRow);
    expect(cell('Poll').parentElement).toBe(secondRow);
    expect(cell('Poll').style.width).toBe('25%');
  });

  it('never wraps a row', () => {
    for (const label of ['Photos and videos', 'Contact']) {
      const row = rowOf(label);
      expect(row.style.flexWrap).not.toBe('wrap');
      expect(row.parentElement?.style.flexWrap).not.toBe('wrap');
    }
  });

  it('gives a long label two centred lines instead of an ellipsis', () => {
    const label = Array.from(cell('Photos and videos').querySelectorAll<HTMLElement>('*')).find(
      (node) => node.textContent === 'Photos and videos' && node.children.length === 0,
    );
    expect(label?.style.textAlign).toBe('center');
    expect(label?.style.getPropertyValue('-webkit-line-clamp')).toBe('2');
  });
});
