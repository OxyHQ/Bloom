/**
 * The display cut follows a weight that only a className gives, on NATIVE.
 *
 * Runs the actual react-native-css compiler and native resolver, not the web
 * runtime ordinary suites see (which forwards the class as a string and
 * resolves nothing). On a device the utilities become a style that reaches the
 * text node ahead of Bloom's inline family, so the cut can only be chosen there.
 */
import { render } from '@testing-library/react-native';
import type React from 'react';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { resolvedStyle } from '../../__tests__/support/rendered-style';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { H1, Text } from '..';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual(
    '../../../node_modules/react-native-css/dist/commonjs/native-internal/index.js',
  ),
);

beforeEach(() => {
  StyleCollection.styles.clear();
  // The window is 375 wide (the repo's react-native mock): `sm:` applies,
  // `lg:` does not.
  const css = compile(`
    .text-4xl { font-size: 36px; line-height: 40px; }
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    .font-black { font-weight: 900; }
    @media (min-width: 320px) { .sm\\:font-bold { font-weight: 700; } }
    @media (min-width: 1024px) { .lg\\:font-bold { font-weight: 700; } }
  `);
  StyleCollection.inject(css.stylesheet());
});

const face = (node: React.ReactElement) => {
  const { getByText } = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {node}
    </BloomThemeProvider>,
  );
  const style = resolvedStyle(getByText('Title').props.style);
  return { family: style.fontFamily, weight: style.fontWeight };
};

it('resolves the utilities natively (positive control)', () => {
  expect(face(<Text className="text-4xl font-medium">Title</Text>)).toEqual({
    family: 'BlomusModernus',
    weight: 500,
  });
});

it.each([
  ['text-4xl font-semibold', 'BlomusModernus-Bold'],
  ['font-display font-bold', 'BlomusModernus-Bold'],
  ['text-4xl font-black', 'BlomusModernus-Bold'],
  ['font-display', 'BlomusModernus'],
  ['text-4xl sm:font-bold', 'BlomusModernus-Bold'],
  ['text-4xl lg:font-bold', 'BlomusModernus'],
])('%s draws %s', (className, family) => {
  expect(face(<Text className={className}>Title</Text>).family).toBe(family);
});

it('lets a className weight replace a display variant’s, as on the web', () => {
  expect(
    face(
      <Text variant="display-1-regular" className="font-bold">
        Title
      </Text>,
    ).family,
  ).toBe('BlomusModernus-Bold');
  expect(
    face(
      <Text variant="display-1-bold" className="font-medium">
        Title
      </Text>,
    ).family,
  ).toBe('BlomusModernus');
});

it('lets an inline fontWeight beat the utility, as inline style beats a class', () => {
  expect(
    face(
      <Text className="text-4xl font-bold" style={{ fontWeight: '400' }}>
        Title
      </Text>,
    ).family,
  ).toBe('BlomusModernus');
});

it('follows a heading’s className weight once the scale gives way', () => {
  expect(face(<H1 className="text-4xl font-semibold">Title</H1>).family).toBe(
    'BlomusModernus-Bold',
  );
  expect(face(<H1 className="text-4xl font-medium">Title</H1>).family).toBe('BlomusModernus');
});

it('leaves Inter text alone under the same utilities', () => {
  expect(face(<Text className="font-bold">Title</Text>)).toEqual({ family: 'Inter', weight: 700 });
});
