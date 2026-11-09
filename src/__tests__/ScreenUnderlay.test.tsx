import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { Screen } from '../screen';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function style(node: { props: { style?: unknown } }): Record<string, unknown> {
  return Object.assign({}, ...([] as unknown[]).concat(node.props.style ?? []).flat(4));
}

function mount() {
  return render(
    <BloomThemeProvider mode="light">
      <Screen
        testID="screen"
        scroll="none"
        bottomBar={<Text>composer</Text>}
        underlay={<Text>field</Text>}
      >
        <Text>thread</Text>
      </Screen>
    </BloomThemeProvider>,
  );
}

describe('Screen underlay', () => {
  it('fills the whole screen box, is never interactive, and sits behind everything', () => {
    const view = mount();
    const layer = view.getByTestId('screen-underlay');
    expect(style(layer)).toMatchObject({ position: 'absolute', inset: 0, overflow: 'hidden' });
    expect(layer.props.pointerEvents).toBe('none');
    expect(view.getByText('field')).toBeTruthy();
  });

  it('is not part of the content area, which stops above an inset bottom bar', () => {
    const view = mount();
    const content = view.getByTestId('screen-content');
    // Inside the content it would stop where the bar begins; as the screen's own layer it does not.
    expect(content.findAll((node) => node.props.testID === 'screen-underlay')).toHaveLength(0);
    expect(
      view.getByTestId('screen').findAll((n) => n.props.testID === 'screen-underlay').length,
    ).toBeGreaterThan(0);
  });

  it('is drawn before the content and the bar, so they paint above it', () => {
    const view = mount();
    const root = view.getByTestId('screen');
    const order = (root.children as unknown[]).flatMap((child) =>
      typeof child === 'object' && child !== null && 'props' in child
        ? [(child as { props: { testID?: string } }).props.testID]
        : [],
    );
    expect(order.indexOf('screen-underlay')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('screen-underlay')).toBeLessThan(order.indexOf('screen-content'));
  });

  it('draws nothing when there is none', () => {
    const view = render(
      <BloomThemeProvider mode="light">
        <Screen testID="screen" scroll="none">
          <View />
        </Screen>
      </BloomThemeProvider>,
    );
    expect(view.queryByTestId('screen-underlay')).toBeNull();
  });
});
