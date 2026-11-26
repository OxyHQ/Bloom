// A headless stand-in for @oxy.so/bloom-language: the same chain API the emitted module calls,
// rendering each node to host elements (strings) so React reconciles a tree of the module's shape.
import { createElement, memo } from 'react';
// A chain node: its type, its arguments and its modifiers (each modifier returns a new node).
const proto = Object.create(Object.prototype);
function node(type, args, mods) {
  const n = Object.create(proto);
  n.type = type;
  n.args = args;
  n.mods = mods;
  return n;
}
function mod(n, name, v) {
  const m = Object.assign({}, n.mods);
  m[name] = v;
  return node(n.type, n.args, m);
}
for (const name of [
  'spacing',
  'style',
  'size',
  'wrapControl',
  'description',
  'trailing',
  'label',
  'tint',
  'onPress',
  'id',
])
  proto[name] = function (v) {
    return mod(this, name, v);
  };
const make =
  (type) =>
  (...args) =>
    node(type, args, {});
export const VStack = make('VStack');
export const Loading = make('Loading');
export const SettingsSection = make('SettingsSection');
export const GroupedSection = make('GroupedSection');
export const GroupedSectionItem = make('GroupedSectionItem');
export const Toggle = make('Toggle');
export const Button = make('Button');
export const Text = make('Text');
export const Embed = (el) => ({ embed: el });
export function toast() {}
function render(n, k) {
  if (n == null || n === false) return null;
  if (n.embed !== undefined) return n.embed;
  if (Object.getPrototypeOf(n) !== proto) return String(n);
  const m = n.mods;
  switch (n.type) {
    case 'Text':
      return createElement('RCTText', { key: k }, n.args[0]);
    case 'Loading':
      return createElement('ActivityIndicator', { key: k, size: m.size });
    case 'Toggle': {
      const [value, set] = n.args[0];
      return createElement('RCTSwitch', {
        key: k,
        value,
        onValueChange: set,
        accessibilityLabel: m.label,
      });
    }
    case 'Button':
      return createElement(
        'Pressable',
        { key: k, onPress: m.onPress, accessibilityLabel: m.label },
        createElement('View', { style: { padding: 8 } }, render(n.args[0], 0)),
      );
    case 'GroupedSectionItem':
      return createElement(
        'View',
        { key: k, style: { flexDirection: 'row' } },
        createElement(
          'View',
          { style: { flex: 1 } },
          createElement('RCTText', null, n.args[0]),
          m.description != null
            ? createElement('RCTText', { style: { opacity: 0.7 } }, m.description)
            : null,
        ),
        render(m.trailing, 1),
      );
    case 'SettingsSection':
      return createElement(
        'View',
        { key: k },
        createElement('RCTText', null, n.args[0]),
        render(n.args[1], 1),
      );
    default:
      return createElement(
        'View',
        { key: k, style: { gap: m.spacing } },
        n.args.map((c, i) => render(c, i)),
      );
  }
}
export function view(fn) {
  (globalThis.__viewFns ||= []).push(fn);
  const C = (props) => render(fn(props), 0);
  return memo(C);
}
