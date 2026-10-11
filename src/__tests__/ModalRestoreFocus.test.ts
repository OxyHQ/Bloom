/** @jest-environment jsdom */
import { restoreFocusWhenAvailable } from '../overlay/modal-keyboard';
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
function setup() {
  const boundary = document.createElement('div');
  boundary.setAttribute('inert', '');
  const opener = document.createElement('button');
  boundary.append(opener);
  const panel = document.createElement('div');
  const action = document.createElement('button');
  panel.append(action);
  document.body.append(boundary, panel);
  action.focus();
  return { boundary, opener, panel, action };
}
afterEach(() => document.body.replaceChildren());
it('waits for the real inert release, then focuses without scrolling', async () => {
  const { boundary, opener, panel } = setup();
  const focus = jest.spyOn(opener, 'focus');
  restoreFocusWhenAvailable(opener, panel);
  expect(focus).not.toHaveBeenCalled();
  panel.remove();
  await flush();
  expect(focus).not.toHaveBeenCalled();
  boundary.removeAttribute('inert');
  await flush();
  expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  expect(document.activeElement).toBe(opener);
});
it('preserves focus a host moves deliberately while closing', async () => {
  const { boundary, opener, panel } = setup();
  const other = document.createElement('button');
  document.body.append(other);
  const focus = jest.spyOn(opener, 'focus');
  restoreFocusWhenAvailable(opener, panel);
  other.focus();
  boundary.removeAttribute('inert');
  await flush();
  expect(focus).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(other);
});
it('abandons a removed opener and honors cancellation before another presentation', async () => {
  const { boundary, opener, panel } = setup();
  const focus = jest.spyOn(opener, 'focus');
  const cancel = restoreFocusWhenAvailable(opener, panel);
  cancel();
  boundary.removeAttribute('inert');
  await flush();
  expect(focus).not.toHaveBeenCalled();
  boundary.setAttribute('inert', '');
  restoreFocusWhenAvailable(opener, panel);
  opener.remove();
  await flush();
  boundary.removeAttribute('inert');
  await flush();
  expect(focus).not.toHaveBeenCalled();
});
