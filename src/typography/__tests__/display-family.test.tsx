import { render } from '@testing-library/react-native';
import type React from 'react';
import type { TextStyle } from 'react-native';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { resolvedStyle } from '../../__tests__/support/rendered-style';
import {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Subtitle,
  Text,
  Title,
  TypographyScope,
  type TypeScaleVariant,
} from '..';
import { TYPE_SCALE } from '../scale';

const face = (node: React.ReactElement) => {
  const { getByText } = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {node}
    </BloomThemeProvider>,
  );
  const style = resolvedStyle(getByText('Title').props.style);
  return { family: style.fontFamily, weight: style.fontWeight };
};

const family = (props: { variant?: TypeScaleVariant; style?: TextStyle }) =>
  face(<Text {...props}>Title</Text>).family;

/** The family CSS matching picks from BlomusModernus' 400 and 700 faces. */
const cutFor = (weight: string) =>
  Number(weight) > 500 ? 'BlomusModernus-Bold' : 'BlomusModernus';

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
      expect(family({ variant })).toMatch(/^BlomusModernus(?:-Bold)?$/);
  });

  it('keeps control labels and body copy in Inter', () => {
    for (const variant of ['headline-medium', 'body-regular', 'caption-1-regular'] as const)
      expect(family({ variant })).toBe('Inter');
    expect(family({})).toBe('Inter');
  });
});

describe('native draws the display cut the web’s font matching picks', () => {
  const displayVariants = (Object.keys(TYPE_SCALE) as TypeScaleVariant[]).filter((variant) =>
    /^(?:large-title|display-[1-4]|title-[123])-/.test(variant),
  );

  it('covers every display variant (positive control)', () => {
    expect(displayVariants).toHaveLength(32);
  });

  it.each(displayVariants)('%s', (variant) => {
    const { family: drawn, weight } = face(<Text variant={variant}>Title</Text>);
    const wanted = TYPE_SCALE[variant].fontWeight as string;
    expect(drawn).toBe(cutFor(wanted));
    // The variant's weight is kept: neither platform synthesizes below 900.
    expect(weight).toBe(wanted);
  });

  it('draws medium on the Regular cut and semibold on the Bold one (CSS: 500 → 400, 600 → 700)', () => {
    expect(family({ variant: 'display-1-medium' })).toBe('BlomusModernus');
    expect(family({ variant: 'display-1-semibold' })).toBe('BlomusModernus-Bold');
  });

  it('sets H1–H6 in the Bold cut at their own weights (800, then 600)', () => {
    expect(face(<H1>Title</H1>)).toEqual({ family: 'BlomusModernus-Bold', weight: '800' });
    for (const Heading of [H2, H3, H4, H5, H6]) {
      expect(face(<Heading>Title</Heading>)).toEqual({
        family: 'BlomusModernus-Bold',
        weight: '600',
      });
    }
  });

  it('follows a heading’s weight when a style gives its scale another', () => {
    expect(face(<H2 style={{ fontWeight: '400' }}>Title</H2>).family).toBe('BlomusModernus');
  });

  it('sets Title by its variant and Subtitle by its own', () => {
    expect(face(<Title>Title</Title>).family).toBe('BlomusModernus-Bold');
    expect(face(<Title variant="title-1-regular">Title</Title>).family).toBe('BlomusModernus');
    expect(face(<Subtitle>Title</Subtitle>).family).toBe('BlomusModernus');
    expect(face(<Subtitle variant="body-bold">Title</Subtitle>).family).toBe('BlomusModernus-Bold');
  });

  it('lets an inline fontWeight choose the cut, as it wins the cascade', () => {
    expect(family({ variant: 'display-1-bold', style: { fontWeight: '500' } })).toBe(
      'BlomusModernus',
    );
    expect(family({ variant: 'display-1-regular', style: { fontWeight: '600' } })).toBe(
      'BlomusModernus-Bold',
    );
  });

  it('asks for 700 on the Bold cut at 900, where Android alone would synthesize', () => {
    for (const fontWeight of ['900', 'black', 900] as const) {
      expect(face(<Text style={{ fontFamily: 'BlomusModernus', fontWeight }}>Title</Text>)).toEqual(
        { family: 'BlomusModernus-Bold', weight: '700' },
      );
    }
    for (const fontWeight of ['800', 'heavy'] as const) {
      expect(face(<Text style={{ fontFamily: 'BlomusModernus', fontWeight }}>Title</Text>)).toEqual(
        { family: 'BlomusModernus-Bold', weight: fontWeight },
      );
    }
  });

  it('leaves every other family alone, whatever its weight', () => {
    expect(face(<Text variant="headline-bold">Title</Text>)).toEqual({
      family: 'Inter',
      weight: '700',
    });
    expect(
      face(
        <Text style={{ fontFamily: 'JetBrains Mono', fontWeight: '700' }}>
          Title
        </Text>,
      ).family,
    ).toBe('JetBrains Mono');
    expect(
      face(
        <TypographyScope mode="system">
          <Text variant="display-1-bold">Title</Text>
        </TypographyScope>,
      ),
    ).toEqual({ family: expect.not.stringMatching(/BlomusModernus/), weight: '700' });
  });
});
