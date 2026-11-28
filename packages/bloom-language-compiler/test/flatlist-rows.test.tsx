/**
 * A closure given to a TS component's callback prop that Bloom cannot type (`FlatList`'s
 * `renderItem`) and that gives a Bloom view: the view crosses as a React element. Raw, React threw
 * "Objects are not valid as a React child".
 */
import { toElement } from '@oxy.so/bloom-language';
import TestRenderer, { act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The runtime's React Native stand-in has no FlatList: one that draws what `renderItem` gives,
// as React Native's does (a Bloom node there is not a React child).
jest.mock('react-native', () => {
  const actual = jest.requireActual('react-native');
  const React = jest.requireActual('react');
  type Props = {
    data: unknown[];
    renderItem: (info: { item: unknown; index: number }) => unknown;
    keyExtractor: (item: unknown, index: number) => string;
  };
  return {
    ...actual,
    FlatList: ({ data, renderItem, keyExtractor }: Props) =>
      React.createElement(
        'FlatList',
        null,
        data.map((item, index) =>
          React.createElement(
            React.Fragment,
            { key: keyExtractor(item, index) },
            renderItem({ item, index }),
          ),
        ),
      ),
  };
});

// Required, not imported: see bloom.cost.test.tsx.
const { Titles } = require('./bloom/flatlist-rows.bloom') as {
  Titles: (props: { titles: string[] }) => Parameters<typeof toElement>[0];
};

it("draws a Bloom view a FlatList's renderItem gives", () => {
  let r!: TestRenderer.ReactTestRenderer;
  act(() => {
    r = TestRenderer.create(toElement(Titles({ titles: ['Bloom', 'Swift'] })));
  });
  const texts = r.root
    .findAll((node) => typeof node.type === 'string' && typeof node.props.children === 'string')
    .map((node) => node.props.children);
  expect(texts).toEqual(['Bloom', 'Swift']);
});
