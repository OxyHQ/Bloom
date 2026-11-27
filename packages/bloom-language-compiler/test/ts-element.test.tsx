/**
 * A tree of TS components alone, given where TS takes a React element, is the element the TS
 * wrote: TS reads its props (`render(close).props.children.props.title`, Mention's sheet tests),
 * and it mounts no `LanguageRoot` or `Embed` layers.
 */
import type { ReactElement } from 'react';
import { Suspense } from 'react';

// Required, not imported: see bloom.cost.test.tsx.
const { panelElement } = require('./bloom/ts-element.bloom') as {
  panelElement: (label: string) => ReactElement<{ children: ReactElement<{ title: string }> }>;
};

it('gives TS the element it wrote', () => {
  const element = panelElement('Published by');
  expect(element.type).toBe(Suspense);
  expect(element.props.children.props.title).toBe('Published by');
});
