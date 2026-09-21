import React from 'react';
jest.mock('react-native', () => ({ ...jest.requireActual('react-native'), Platform: { OS: 'android' }, BackHandler: { addEventListener: jest.fn() } }));
jest.mock('../hooks/use-accessibility-focus', () => ({ useAccessibilityFocus: () => require('react').useRef(null) }));
import { BackHandler } from 'react-native';
import { render } from '@testing-library/react-native';
import { usePanelInteraction } from '../ai-chat/use-panel-interaction';
import { acquireOverlayRank, registerOverlayRank, releaseOverlayRank, resetOverlayStack } from '../overlay/stack';
function Harness({ open = true, close }: { open?: boolean; close: () => void }) {
  usePanelInteraction(open, true, close); return null;
}
it('Android back closes the panel, yields to an inner overlay, and unregisters', () => {
  const remove = jest.fn(); let back: (() => boolean | null | undefined) | undefined;
  const spy = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_name, callback) => {
    back = callback; return { remove };
  });
  const close = jest.fn(); const screen = render(<Harness close={close} />);
  const rank = acquireOverlayRank(); registerOverlayRank(rank);
  expect(back?.()).toBe(false); expect(close).not.toHaveBeenCalled();
  releaseOverlayRank(rank); expect(back?.()).toBe(true); expect(close).toHaveBeenCalledTimes(1);
  screen.rerender(<Harness open={false} close={close} />); expect(remove).toHaveBeenCalledTimes(1);
  spy.mockRestore(); resetOverlayStack();
});
