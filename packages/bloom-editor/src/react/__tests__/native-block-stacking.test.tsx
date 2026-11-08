/** @jest-environment jsdom */
// This guards the platform styling contract. Fabric focus/IME and native host
// identity are verified separately by the physical Android fixture.
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Platform } from 'react-native';
import { EditorStore, documentFromSnapshot } from '../../model';
import { BlockEditor } from '../BlockEditor';
import { EditorController } from '../controller';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it.each(['android', 'ios', 'web'] as const)(
  'keeps native block stacking stable while retaining web overlay stacking (%s)',
  (platform) => {
    const os = jest.replaceProperty(Platform, 'OS', platform);
    let id = 0;
    const nextId = () => `b${++id}`;
    const store = new EditorStore({
      newId: nextId,
      document: documentFromSnapshot(
        [{ type: 'paragraph', text: [{ text: 'Before linked after' }] }],
        nextId,
      ),
    });
    const controller = new EditorController(store);
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      act(() => root.render(<BlockEditor store={store} controller={controller} slashItems={[]} />));
      const block = document.getElementById('bloom-block-b1')!;
      const row = block.firstElementChild!;
      const before = [getComputedStyle(block).zIndex, getComputedStyle(row).zIndex];
      act(() => controller.ui.set({ focused: 'b1' }));
      const focused = [getComputedStyle(block).zIndex, getComputedStyle(row).zIndex];
      expect(focused).toEqual(platform === 'web' ? ['1', '1'] : before);
      act(() => controller.ui.set({ focused: null }));
      expect([getComputedStyle(block).zIndex, getComputedStyle(row).zIndex]).toEqual(before);
    } finally {
      act(() => root.unmount());
      host.remove();
      os.restore();
    }
  },
);
