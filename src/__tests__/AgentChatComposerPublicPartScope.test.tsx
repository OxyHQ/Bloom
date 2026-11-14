import { render } from '@testing-library/react-native';
jest.mock('react-native-svg', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-svg');
  const React = jest.requireActual('react');
  const stub = (name: string) =>
    React.forwardRef((props: Record<string, unknown>, ref: unknown) =>
      React.createElement(name, { ref, ...props }, props.children),
    );
  return {
    ...actual,
    __esModule: true,
    default: actual.Svg,
    Filter: stub('Filter'),
    FeGaussianBlur: stub('FeGaussianBlur'),
  };
});
jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('../../__mocks__/react-native-reanimated');
  return {
    ...actual,
    __esModule: true,
    useFrameCallback: () => ({ setActive: jest.fn(), isActive: false, callbackId: 0 }),
  };
});

import { AgentChatComposer } from '../agent-chat';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ size }: { size?: 'xs' | 'lg' }) {
  const composer = <AgentChatComposer testID="composer" onAttach={() => undefined} />;
  return (
    <BloomThemeProvider mode="light">
      {size ? <BloomScope size={size}>{composer}</BloomScope> : composer}
    </BloomThemeProvider>
  );
}

it('keeps its authored pill and controls geometry independent from BloomScope on native', () => {
  const screen = render(<Subject />);
  const geometry = () => ({
    add: resolvedStyle(screen.getByTestId('composer-pill-add').props.style).height,
    send: resolvedStyle(screen.getByLabelText('Send message').props.style).height,
    field: resolvedStyle(screen.getByTestId('composer-pill-input').props.style).height,
  });
  const initial = geometry();
  expect(initial).toMatchObject({ add: 36, send: 36, field: 20 });
  screen.rerender(<Subject size="xs" />);
  expect(geometry()).toEqual(initial);
  screen.rerender(<Subject size="lg" />);
  expect(geometry()).toEqual(initial);
});
