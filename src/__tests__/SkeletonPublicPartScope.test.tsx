import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import * as Skeleton from '../skeleton';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

const sizes = [
  [undefined, 36],
  ['xs', 24],
  ['sm', 32],
  ['md', 36],
  ['lg', 44],
] as const;

function shapes(testID: string) {
  return (
    <Skeleton.Region label="Loading" testID={testID}>
      <Skeleton.Row>
        <Skeleton.Col>
          <Skeleton.Box width={60} height={18} />
          <Skeleton.Circle size={24} />
          <Skeleton.Pill size={20} />
          <Skeleton.Text style={{ width: 80, lineHeight: 20 }} />
          <Button testID={`${testID}-action`}>
            <Text>Open</Text>
          </Button>
        </Skeleton.Col>
      </Skeleton.Row>
    </Skeleton.Region>
  );
}

it.each(sizes)(
  'Skeleton shapes keep caller geometry and layout wrappers delegate %s scope',
  (size, height) => {
    const tree = render(
      <BloomThemeProvider fonts={false}>
        {size ? <BloomScope size={size}>{shapes('loading')}</BloomScope> : shapes('loading')}
      </BloomThemeProvider>,
    );
    const all = tree.UNSAFE_root.findAll(() => true);
    const dimensions = all.map((node) => resolvedStyle(node.props.style));
    expect(dimensions).toContainEqual(expect.objectContaining({ width: 60, height: 18 }));
    expect(dimensions).toContainEqual(expect.objectContaining({ width: 24, height: 24 }));
    expect(dimensions.some((style) => style.width === 20 * 1.618 && style.height === 20)).toBe(
      true,
    );
    expect(dimensions.some((style) => style.height === 14)).toBe(true);
    expect(resolvedStyle(tree.getByTestId('loading-action').props.style).height).toBe(height);
  },
);

it('Skeleton Region, Row and Col preserve nearest child scope through a portal', () => {
  const tree = render(
    <BloomThemeProvider fonts={false}>
      <PortalProvider>
        <BloomScope size="xs">
          <Skeleton.Region testID="loading">
            <Skeleton.Row>
              <Skeleton.Col>
                <Skeleton.Box width={60} height={18} />
                <Skeleton.Circle size={24} />
                <Skeleton.Pill size={20} />
                <Skeleton.Text style={{ width: 80, lineHeight: 20 }} />
                <Portal>
                  <Button testID="loading-action">
                    <Text>Open</Text>
                  </Button>
                </Portal>
              </Skeleton.Col>
            </Skeleton.Row>
          </Skeleton.Region>
        </BloomScope>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(tree.getByTestId('loading-action').props.style).height).toBe(24);
});
