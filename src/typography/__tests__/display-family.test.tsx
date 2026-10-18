import { render } from '@testing-library/react-native';
import React from 'react';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { resolvedStyle } from '../../__tests__/support/rendered-style';
import { Text, type TypeScaleVariant } from '..';

const family = (props: { variant?: TypeScaleVariant; className?: string }) => {
  const { getByText } = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <Text {...props}>Title</Text>
    </BloomThemeProvider>,
  );
  return resolvedStyle(getByText('Title').props.style).fontFamily;
};

describe('the big titles are set in BlomusModernus', () => {
  it('sets large-title and display-1 … display-4 in the display family, at every weight', () => {
    for (const variant of [
      'title-1-bold',
      'title-2-medium',
      'title-3-regular',
      'large-title-regular',
      'large-title-bold',
      'display-1-semibold',
      'display-2-regular',
      'display-3-medium',
      'display-4-bold',
    ] as const)
      expect(family({ variant })).toBe('BlomusModernus');
  });

  it('keeps control labels and body copy in Inter', () => {
    for (const variant of ['headline-medium', 'body-regular', 'caption-1-regular'] as const)
      expect(family({ variant })).toBe('Inter');
    expect(family({})).toBe('Inter');
  });

  it('follows a title sized by className: text-3xl and up, or an explicit font-display', () => {
    expect(family({ className: 'text-4xl text-center' })).toBe('BlomusModernus');
    expect(family({ className: 'text-center md:text-5xl' })).toBe('BlomusModernus');
    expect(family({ className: 'font-display' })).toBe('BlomusModernus');
    expect(family({ className: 'text-3xl' })).toBe('BlomusModernus');
  });

  it('leaves text sized below that in Inter, and does not read a longer class as a size', () => {
    expect(family({ className: 'text-2xl' })).toBe('Inter');
    expect(family({ className: 'text-xl font-medium' })).toBe('Inter');
    expect(family({ className: 'text-4xl-custom' })).toBe('Inter');
    expect(family({ className: 'my-text-4xl' })).toBe('Inter');
  });
});

describe('an explicit font-mono className sets JetBrains Mono', () => {
  it('beats the inline family, at any breakpoint or state', () => {
    expect(family({ className: 'font-mono' })).toBe('JetBrains Mono');
    expect(family({ className: 'text-xs font-mono text-muted-foreground' })).toBe('JetBrains Mono');
    expect(family({ className: 'md:font-mono' })).toBe('JetBrains Mono');
  });

  it('beats a family implied by size or variant: an explicit family is the request', () => {
    expect(family({ className: 'text-4xl font-mono' })).toBe('JetBrains Mono');
    expect(family({ variant: 'display-1-bold', className: 'font-mono' })).toBe('JetBrains Mono');
  });

  it('does not read a longer class as font-mono', () => {
    expect(family({ className: 'font-monospace-x' })).toBe('Inter');
    expect(family({ className: 'my-font-mono' })).toBe('Inter');
  });
});
