/** @jest-environment jsdom */
import { initialFocusWithin, tabbablesWithin } from '../overlay/modal-keyboard';
function rect(top: number, height: number) {
  return {
    top,
    bottom: top + height,
    left: 0,
    right: 400,
    width: 400,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}
afterEach(() => {
  document.body.replaceChildren();
});
it('focuses visible header chrome instead of an earlier DOM action below a long scroll viewport', () => {
  const panel = document.createElement('div');
  panel.tabIndex = -1;
  const pagination = document.createElement('button');
  const close = document.createElement('button');
  panel.append(pagination, close);
  document.body.append(panel);
  panel.getBoundingClientRect = () => rect(0, 800);
  pagination.getBoundingClientRect = () => rect(1800, 48);
  close.getBoundingClientRect = () => rect(0, 48);
  expect(initialFocusWithin(panel)).toBe(close);
  expect(tabbablesWithin(panel)).toEqual([pagination, close]);
});
it('uses the panel when all controls lie outside its viewport and leaves normal visible ordering unchanged', () => {
  const panel = document.createElement('div');
  const button = document.createElement('button');
  panel.append(button);
  document.body.append(panel);
  panel.getBoundingClientRect = () => rect(0, 800);
  button.getBoundingClientRect = () => rect(1000, 48);
  expect(initialFocusWithin(panel)).toBe(panel);
  button.getBoundingClientRect = () => rect(300, 48);
  expect(initialFocusWithin(panel)).toBe(button);
});
