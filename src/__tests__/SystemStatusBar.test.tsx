import { render } from '@testing-library/react-native';
import { StatusBar } from 'react-native';
import { BloomProvider } from '../provider';
import { Screen } from '../screen';
import { BloomColorScope } from '../theme/color-scope';

const barStyle = (tree: ReturnType<typeof render>) =>
  tree.UNSAFE_getByType(StatusBar).props.barStyle;

it('follows the app theme', () => {
  const app = (mode: 'light' | 'dark') => (
    <BloomProvider mode={mode} fonts={false}>
      {null}
    </BloomProvider>
  );
  const tree = render(app('light'));
  expect(barStyle(tree)).toBe('dark-content');
  tree.rerender(app('dark'));
  expect(barStyle(tree)).toBe('light-content');
});

it('gives an active dark screen light content and releases it when it deactivates', () => {
  const app = (active: boolean) => (
    <BloomProvider mode="light" fonts={false}>
      <BloomColorScope mode="dark" asChild>
        <Screen active={active} />
      </BloomColorScope>
    </BloomProvider>
  );
  const tree = render(app(true));
  expect(barStyle(tree)).toBe('light-content');
  tree.rerender(app(false));
  expect(barStyle(tree)).toBe('dark-content');
});
