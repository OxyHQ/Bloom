import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Dialog } from '../dialog/Dialog';
import { Popover, PopoverContent } from '../popover/Popover';
import { hostNodes, resolvedStyle } from './support/rendered-style';

it.each(['center', 'end', 'bottom'] as const)(
  'paints the authored flat fill on native %s without surface optics',
  (placement) => {
    const api = render(
      <BloomThemeProvider>
        <Dialog
          placement={placement}
          material="flat"
          open
          panelStyle={{ backgroundColor: '#f3d7b6' }}
        >
          <Text>Flat body</Text>
        </Dialog>
      </BloomThemeProvider>,
    );
    expect(api.getByText('Flat body')).toBeTruthy();
    const nodes = hostNodes(api.toJSON());
    expect(
      nodes.filter(
        (n) => n.type === 'LinearGradient' && /^bloom-surface.*-sheen$/.test(String(n.props.id)),
      ),
    ).toHaveLength(0);
    expect(nodes.some((n) => resolvedStyle(n.props.style).backgroundColor === '#f3d7b6')).toBe(
      true,
    );
  },
);

it('forwards flat material to the native popover sheet', () => {
  const api = render(
    <BloomThemeProvider>
      <Popover open>
        <PopoverContent material="flat" style={{ backgroundColor: '#f3d7b6' }}>
          <Text>Flat popover</Text>
        </PopoverContent>
      </Popover>
    </BloomThemeProvider>,
  );
  expect(api.getByText('Flat popover')).toBeTruthy();
  const nodes = hostNodes(api.toJSON());
  expect(
    nodes.filter(
      (n) => n.type === 'LinearGradient' && /^bloom-surface.*-sheen$/.test(String(n.props.id)),
    ),
  ).toHaveLength(0);
  const panel = nodes.find((n) => resolvedStyle(n.props.style).maxWidth === 500);
  expect(resolvedStyle(panel?.props.style).backgroundColor).toBe('#f3d7b6');
});
