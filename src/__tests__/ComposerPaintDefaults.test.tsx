import React from 'react';
import { render } from '@testing-library/react-native';
import { ComposerPill } from '../composer-panel';
import { ComposerLoaderPaintContext } from '../composer-loader/context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function scene(active: boolean | undefined, props: React.ComponentProps<typeof ComposerPill> = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ComposerLoaderPaintContext.Provider value={active}>
        <ComposerPill testID="pill" showVoice={false} {...props} />
      </ComposerLoaderPaintContext.Provider>
    </BloomThemeProvider>,
  );
}

it.each([
  [undefined, {}, true],
  [false, {}, false],
  [true, {}, false],
  [true, { surface: true }, true],
  [undefined, { surface: false }, false],
] as const)('resolves surface ownership for %s and %o', (active, props, expected) => {
  const view = scene(active, props);
  expect(
    view.UNSAFE_root.findAll(
      (node) => typeof node.type === 'function' && node.type.name === 'PillRoot',
    )[0]?.props.surface,
  ).toBe(expected);
});

it('explicit frosted false overrides the active loader; outside remains unchanged', () => {
  const outside = scene(undefined, { surface: false });
  const count = outside.UNSAFE_root.findAll(
    (node) =>
      typeof node.type === 'function' && node.type.name === 'FrostedChip' && node.props.shown,
  ).length;
  outside.unmount();
  const overridden = scene(true, { frosted: false });
  expect(
    overridden.UNSAFE_root.findAll(
      (node) =>
        typeof node.type === 'function' && node.type.name === 'FrostedChip' && node.props.shown,
    ),
  ).toHaveLength(count);
  overridden.unmount();
  const inherited = scene(true);
  expect(
    inherited.UNSAFE_root.findAll(
      (node) =>
        typeof node.type === 'function' && node.type.name === 'FrostedChip' && node.props.shown,
    ).length,
  ).toBeGreaterThan(count);
});

it('explicit frosted true remains available outside and under an inactive loader', () => {
  for (const active of [undefined, false]) {
    const view = scene(active, { frosted: true });
    expect(
      view.UNSAFE_root.findAll(
        (node) =>
          typeof node.type === 'function' && node.type.name === 'FrostedChip' && node.props.shown,
      ).length,
    ).toBeGreaterThan(0);
    view.unmount();
  }
});
