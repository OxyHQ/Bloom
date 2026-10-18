import React from 'react';
import { StyleSheet } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text, Title, Subtitle, H1 } from '../typography';
import { Button } from '../button';
import type { TypeScaleVariant } from '../typography';

it('uses the display family for all semantic title variants while body and control labels stay sans', () => {
  const variants: TypeScaleVariant[] = [
    'title-1-semibold',
    'title-2-medium',
    'title-3-bold',
    'display-4-regular',
    'large-title-medium',
  ];
  const screen = render(
    <BloomThemeProvider>
      <H1 testID="reference">Heading</H1>
      {variants.map((variant) => (
        <Text key={variant} variant={variant} testID={variant}>
          {variant}
        </Text>
      ))}
      <Title testID="title" variant="headline-medium">
        Small title
      </Title>
      <Subtitle testID="subtitle">Subtitle</Subtitle>
      <Text testID="accessible-heading" role="heading">
        Named heading
      </Text>
      <Text testID="body" variant="body-regular">
        Body
      </Text>
      <Text testID="headline" variant="headline-medium">
        Control text
      </Text>
      <Button>Continue</Button>
    </BloomThemeProvider>,
  );
  const family = (id: string) => StyleSheet.flatten(screen.getByTestId(id).props.style).fontFamily;
  const display = family('reference');
  for (const id of [...variants, 'title', 'subtitle', 'accessible-heading'])
    expect(family(id)).toBe(display);
  expect(family('body')).not.toBe(display);
  expect(family('headline')).toBe(family('body'));
  expect(StyleSheet.flatten(screen.getByText('Continue').props.style).fontFamily).toBe(
    family('body'),
  );
});
