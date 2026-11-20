// A reference interpreter for Bloom chains: what the runtime does when no
// compiler ran. A chain is plain data (a node plus an ordered modifier list);
// rendering resolves every modifier's token, then creates the elements.
//
// Provisional node format, to align with packages/bloom-language once it lands.
import { jsx, jsxs } from 'react/jsx-runtime';
import { BloomText } from '@oxy.so/bloom-language/compiled';
import { View } from 'react-native';

const SPACE = { none: 0, xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };
const TYPE = {
  caption: { fontSize: 11, lineHeight: 14, fontWeight: '400' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  subtitle: { fontSize: 17, lineHeight: 24, fontWeight: '500' },
};
const WEIGHT = { regular: '400', medium: '500', semibold: '600', bold: '700' };

const RESOLVE = {
  padding: (style, token) => {
    style.padding = SPACE[token];
  },
  spacing: (style, token) => {
    style.gap = SPACE[token];
  },
  font: (style, token) => {
    Object.assign(style, TYPE[token]);
  },
  weight: (style, token) => {
    style.fontWeight = WEIGHT[token];
  },
};

class Node {
  constructor(kind, children, modifiers) {
    this.kind = kind;
    this.children = children;
    this.modifiers = modifiers;
  }
  with(name, token) {
    return new Node(this.kind, this.children, [...this.modifiers, { name, token }]);
  }
  padding(token) {
    return this.with('padding', token);
  }
  spacing(token) {
    return this.with('spacing', token);
  }
  font(token) {
    return this.with('font', token);
  }
  weight(token) {
    return this.with('weight', token);
  }
}

export const HStack = (...children) => new Node('HStack', children, []);
export const VStack = (...children) => new Node('VStack', children, []);
export const Text = (content) => new Node('Text', [content], []);

const BASE = {
  HStack: () => ({ flexDirection: 'row', alignItems: 'center' }),
  VStack: () => ({ flexDirection: 'column' }),
  Text: () => ({}),
};
const TEXT_COLORS = { color: 'foreground' };

export function render(node) {
  if (!(node instanceof Node)) return node;
  const style = BASE[node.kind]();
  for (const modifier of node.modifiers) RESOLVE[modifier.name](style, modifier.token);
  const children = node.children.map(render);
  const props = node.kind === 'Text' ? { style, colors: TEXT_COLORS } : { style };
  const host = node.kind === 'Text' ? BloomText : View;
  return children.length > 1
    ? jsxs(host, { ...props, children })
    : jsx(host, { ...props, children: children[0] });
}
