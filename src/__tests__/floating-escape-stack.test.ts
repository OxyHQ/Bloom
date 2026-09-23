/**
 * @jest-environment jsdom
 */

/**
 * `floating/escape-stack.ts` — which open surface Escape closes on web.
 *
 * The end-to-end case (a Select's list inside a Dialog) is in
 * `SelectKeyboard.web.test.tsx`; this pins the mechanism: innermost first
 * whatever the release order, a key a control inside a panel already stopped is
 * left alone, and nothing is listening once every surface has closed.
 */
import { hasOpenFloatingSurface, pushFloatingEscape } from '../floating/escape-stack';

function escape(target: EventTarget = document.body): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
}

describe('floating escape stack', () => {
  it('dismisses only the most recently opened surface', () => {
    const outer = jest.fn();
    const inner = jest.fn();
    const releaseOuter = pushFloatingEscape(outer);
    const releaseInner = pushFloatingEscape(inner);
    escape();
    expect(inner).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();
    releaseInner();
    escape();
    expect(outer).toHaveBeenCalledTimes(1);
    releaseOuter();
  });

  it('keeps the key from a document-level listener beneath it (a Dialog)', () => {
    const dialog = jest.fn();
    document.addEventListener('keydown', dialog);
    const release = pushFloatingEscape(jest.fn());
    escape();
    expect(dialog).not.toHaveBeenCalled();
    release();
    escape();
    expect(dialog).toHaveBeenCalledTimes(1);
    document.removeEventListener('keydown', dialog);
  });

  it('leaves a key a control inside the panel already stopped', () => {
    const panel = jest.fn();
    const release = pushFloatingEscape(panel);
    const field = document.createElement('input');
    document.body.appendChild(field);
    field.addEventListener('keydown', (event) => event.stopPropagation());
    escape(field);
    expect(panel).not.toHaveBeenCalled();
    field.remove();
    release();
  });

  it('a release from the middle removes that entry, not the top one', () => {
    const a = jest.fn();
    const b = jest.fn();
    const releaseA = pushFloatingEscape(a);
    const releaseB = pushFloatingEscape(b);
    releaseA();
    escape();
    expect(b).toHaveBeenCalledTimes(1);
    expect(a).not.toHaveBeenCalled();
    releaseB();
  });

  it('reports open surfaces, and stops listening once the last one closes', () => {
    expect(hasOpenFloatingSurface()).toBe(false);
    const dismiss = jest.fn();
    const release = pushFloatingEscape(dismiss);
    expect(hasOpenFloatingSurface()).toBe(true);
    release();
    expect(hasOpenFloatingSurface()).toBe(false);
    escape();
    expect(dismiss).not.toHaveBeenCalled();
  });
});
