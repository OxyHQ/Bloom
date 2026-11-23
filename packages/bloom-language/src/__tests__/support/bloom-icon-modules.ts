import { createElement } from 'react';

/**
 * Every `@oxy.so/bloom/icons/Ri*` module at once: each named export is a
 * stand-in icon of that name, the same component on every import, so a table
 * keyed by icon component (the SF Symbols table) finds it.
 */
const icons = new Map<string, unknown>();

function icon(name: string) {
  let found = icons.get(name);
  if (found === undefined) {
    found = (props: Record<string, unknown>) => createElement(name, props);
    icons.set(name, found);
  }
  return found;
}

module.exports = new Proxy(
  {},
  {
    get: (_target, name) => (name === '__esModule' ? true : icon(String(name))),
  },
);
