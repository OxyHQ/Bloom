import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomScope, useBloomAppearance } from '../appearance';
import type { BloomAppearanceProps } from '../appearance/types';

function Probe({ id, ...props }: BloomAppearanceProps & { id: string }) {
  const value = useBloomAppearance(props, { size: 'md', tone: 'neutral' });
  return <Text testID={id}>{value.size}:{value.tone}</Text>;
}
it('resolves explicit props, nested scopes, inherited scope and family defaults independently', () => {
  const view = render(<>
    <Probe id="outside" />
    <BloomScope size="lg" tone="success">
      <Probe id="inherited" />
      <BloomScope size="sm"><Probe id="nested" /><Probe id="explicit" size="xs" tone="danger" /></BloomScope>
      <Probe id="sibling" />
    </BloomScope>
  </>);
  for (const [id,text] of Object.entries({outside:'md:neutral',inherited:'lg:success',nested:'sm:success',explicit:'xs:danger',sibling:'lg:success'})) {
    expect(view.getByTestId(id).props.children.join('')).toBe(text);
  }
});
it('updates the subtree when scope configuration changes', () => {
  const view = render(<BloomScope tone="success"><Probe id="probe" /></BloomScope>);
  view.rerender(<BloomScope tone="danger"><Probe id="probe" /></BloomScope>);
  expect(view.getByTestId('probe').props.children.join('')).toBe('md:danger');
});
