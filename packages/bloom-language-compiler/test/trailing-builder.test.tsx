/**
 * A TS function component drawn with a trailing builder renders the builder's
 * lines as its children (or as the one node prop it declares in their place),
 * never as the arguments of a plain call whose nodes are dropped.
 */
import { type ComposedView, toElement } from '@oxy.so/bloom-language';
import type TestRenderer from 'react-test-renderer';

import { measured } from './support/fibers';

// Required, not imported: see bloom.cost.test.tsx.
const { Actions } = require('./bloom/trailing-builder.bloom') as {
  Actions: (props: { liked: boolean }) => ComposedView;
};

/** The strings drawn below the host with `testID`. */
function texts(renderer: TestRenderer.ReactTestRenderer, testID: string): string[] {
  const host = renderer.root.find(
    (node) => node.props.testID === testID && typeof node.type === 'string',
  );
  return host
    .findAll(
      (node) => typeof node.type === 'string' && node.children.every((c) => typeof c === 'string'),
    )
    .flatMap((node) => node.children as string[]);
}

it("draws a TS component's trailing builder as its children", () => {
  measured(toElement(Actions({ liked: true })), (renderer) => {
    expect(texts(renderer, 'bar')).toEqual(['Reply', 'Boost', 'Liked']);
    expect(texts(renderer, 'slot')).toEqual(['Inside']);
  });
});
