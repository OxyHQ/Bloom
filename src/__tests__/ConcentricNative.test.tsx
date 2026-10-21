import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { I18nManager } from 'react-native';
import { render } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { ConcentricView } from '../concentric';
import { Surface } from '../surface/Surface';
import { Card } from '../card/Card';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { StyledView } from '../styles/styled-primitives';
import { resolvedStyle } from './support/rendered-style';

jest.mock('react-native', () => ({
  ...jest.requireActual('../../__mocks__/react-native'),
  PlatformColor: (...names: string[]) => ({ semantic: names }),
}));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('nativewind', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () =>
  jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'),
);

beforeAll(async () => {
  const { compile: tailwind } = require('@tailwindcss/node') as typeof import('@tailwindcss/node');
  const compiler = await tailwind(
    `@import "tailwindcss/theme.css" layer(theme);\n@import "tailwindcss/utilities.css" layer(utilities);\n${readFileSync(join(__dirname, '../design-tokens/theme.css'), 'utf8')}`,
    { base: join(__dirname, '../..'), onDependency() {} },
  );
  const css = compiler.build([
    'rounded-[32px]',
    'rounded-full',
    'p-3',
    'p-1',
    'p-2',
    'border-2',
    'm-1',
    '-m-1',
    'rounded-concentric',
    'rounded-s-concentric',
    'ps-6',
    'pe-2',
    'pt-4',
    'pb-1',
  ]);
  StyleCollection.inject(compile(css).stylesheet());
});

it('resolves real Tailwind and native CSS classes through cumulative padded wrappers', () => {
  const screen = render(
    <ConcentricView className="rounded-[32px] p-3 border-2">
      <StyledView className="rounded-concentric" testID="utility" />
      <ConcentricView className="p-1">
        <ConcentricView className="p-2">
          <ConcentricView radius="concentric" className="-m-1" testID="nested" />
        </ConcentricView>
      </ConcentricView>
    </ConcentricView>,
  );
  expect(resolvedStyle(screen.getByTestId('utility').props.style).borderTopLeftRadius).toBe(18);
  expect(resolvedStyle(screen.getByTestId('nested').props.style).borderTopLeftRadius).toBe(10);
});

it('shares actual Surface and Card material geometry with inset children', () => {
  const screen = render(
    <BloomThemeProvider>
      <Surface radius={32} style={{ padding: 8, borderWidth: 2 }}>
        <Card radius="concentric" border="none" style={{ padding: 4 }} testID="card">
          <ConcentricView radius="concentric" testID="child" />
        </Card>
      </Surface>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(screen.getByTestId('card').props.style).borderTopLeftRadius).toBe(22);
  expect(resolvedStyle(screen.getByTestId('child').props.style).borderTopLeftRadius).toBe(18);
});

it('supports reset boundaries, unequal edges, negative margins and pill inheritance', () => {
  const screen = render(
    <ConcentricView
      radius={{ topStart: 32, topEnd: 20, bottomStart: 12, bottomEnd: 8 }}
      style={{ paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2 }}
    >
      <ConcentricView radius="concentric" style={{ margin: 2 }} testID="asymmetric" />
      <ConcentricView reset>
        <ConcentricView radius="concentric" testID="reset" />
      </ConcentricView>
      <ConcentricView radius={9999} style={{ padding: 16 }}>
        <ConcentricView radius="concentric" testID="pill" />
      </ConcentricView>
    </ConcentricView>,
  );
  expect(resolvedStyle(screen.getByTestId('asymmetric').props.style)).toMatchObject({
    borderTopLeftRadius: 24,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 0,
  });
  expect(resolvedStyle(screen.getByTestId('reset').props.style).borderTopLeftRadius).toBe(0);
  expect(resolvedStyle(screen.getByTestId('pill').props.style).borderTopLeftRadius).toBe(9999);
});

it('compiles logical corner consumers with asymmetric logical padding', () => {
  const screen = render(
    <ConcentricView radius={32} className="ps-6 pe-2 pt-4 pb-1">
      <StyledView className="rounded-s-concentric" testID="start" />
    </ConcentricView>,
  );
  expect(resolvedStyle(screen.getByTestId('start').props.style)).toMatchObject({
    borderStartStartRadius: 16,
    borderEndStartRadius: 28,
  });
});

it('gives class and prop owners identical margins without leaking auto markers to children', () => {
  const screen = render(
    <BloomThemeProvider>
      <ConcentricView radius={32} className="p-2 border-2">
        <ConcentricView className="rounded-concentric m-1 p-1" testID="class-owner">
          <ConcentricView className="p-1">
            <ConcentricView radius="concentric" testID="grandchild" />
          </ConcentricView>
        </ConcentricView>
        <ConcentricView radius="concentric" className="m-1 p-1" testID="prop-owner" />
        <Surface className="rounded-concentric m-1" testID="surface-class" />
        <Card className="rounded-concentric m-1" border="none" testID="card-class" />
      </ConcentricView>
    </BloomThemeProvider>,
  );
  for (const id of ['class-owner', 'prop-owner', 'surface-class', 'card-class']) {
    expect(resolvedStyle(screen.getByTestId(id).props.style).borderTopLeftRadius).toBe(18);
  }
  expect(resolvedStyle(screen.getByTestId('grandchild').props.style).borderTopLeftRadius).toBe(10);
});

it('maps logical owner classes and margins in RTL', () => {
  const wasRTL = I18nManager.isRTL;
  I18nManager.isRTL = true;
  try {
    const screen = render(
      <ConcentricView radius={32} className="ps-6 pe-2 pt-4 pb-1">
        <ConcentricView className="rounded-s-concentric m-1" testID="rtl" />
      </ConcentricView>,
    );
    expect(resolvedStyle(screen.getByTestId('rtl').props.style)).toMatchObject({
      borderTopRightRadius: 12,
      borderBottomRightRadius: 24,
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
    });
  } finally {
    I18nManager.isRTL = wasRTL;
  }
});

it('retains pill utility semantics through padded owners', () => {
  const screen = render(
    <ConcentricView className="rounded-full p-2">
      <ConcentricView radius="concentric" testID="utility-pill" />
    </ConcentricView>,
  );
  expect(
    resolvedStyle(screen.getByTestId('utility-pill').props.style).borderTopLeftRadius,
  ).toBeGreaterThanOrEqual(9999);
});
