/** @jest-environment jsdom */
import { wrapTab } from '../overlay/modal-keyboard';

afterEach(() => document.body.replaceChildren());
function fixture() {
  const before = document.createElement('button');
  const panel = document.createElement('div'); panel.tabIndex = -1;
  const first = document.createElement('button');
  const last = document.createElement('button');
  panel.append(first, last); document.body.append(before, panel);
  return { before, panel, first, last };
}
function tab(shiftKey = false) { return new KeyboardEvent('keydown', { key: 'Tab', shiftKey, cancelable: true }); }

it.each([false, true])('keeps an empty modal on its panel for Tab (reverse=%s)', reverse => {
  const { panel, first, last } = fixture();
  first.focus(); first.disabled = true; last.setAttribute('aria-disabled', 'true');
  const focus = jest.spyOn(panel, 'focus');
  const event = tab(reverse);
  expect(wrapTab(event, panel)).toBe(true);
  expect(event.defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(panel);
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(wrapTab(tab(!reverse), panel)).toBe(true);
  expect(document.activeElement).toBe(panel);
});

it.each([false, true])('recovers after focus was lost and resumes available controls (reverse=%s)', reverse => {
  const { before, panel, first, last } = fixture();
  first.hidden = true; last.setAttribute('inert', ''); before.focus();
  expect(wrapTab(tab(reverse), panel)).toBe(true);
  expect(document.activeElement).toBe(panel);
  first.hidden = false; last.removeAttribute('inert');
  expect(wrapTab(tab(reverse), panel)).toBe(true);
  expect(document.activeElement).toBe(reverse ? last : first);
});

it('preserves ordinary traversal and wraps only the active boundary', () => {
  const { panel, first, last } = fixture(); first.focus();
  const forward = tab(); expect(wrapTab(forward, panel)).toBe(false);
  expect(forward.defaultPrevented).toBe(false);
  expect(wrapTab(tab(true), panel)).toBe(true); expect(document.activeElement).toBe(last);
  expect(wrapTab(tab(), panel)).toBe(true); expect(document.activeElement).toBe(first);
  expect(wrapTab(new KeyboardEvent('keydown', { key: 'Enter' }), panel)).toBe(false);
  expect(wrapTab(tab(), null)).toBe(false);
});
