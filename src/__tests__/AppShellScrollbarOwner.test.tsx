import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { AppShell } from '../app-shell';
import { ScrollBar } from '../layout';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { mockWindowSize } from './support/window-size';

it('keeps the document indicator claim while the shell changes between document and bounded modes', () => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  mockWindowSize({ width: 1440, height: 900 });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
  );
  try {
    const view = render(<AppShell scroll="document" />, { wrapper });
    const bar = () =>
      view.UNSAFE_getAllByType(ScrollBar).filter((node) => node.props.target === 'document');
    expect(bar()).toHaveLength(1);
    expect(bar()[0]?.props.scrollbar).toBe('scroll');
    view.rerender(<AppShell scroll="fixed" />);
    expect(bar()).toHaveLength(1);
    expect(bar()[0]?.props.scrollbar).toBe('never');
    view.rerender(<AppShell scroll="document" />);
    expect(bar()).toHaveLength(1);
    expect(bar()[0]?.props.scrollbar).toBe('scroll');
    view.unmount();
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
    jest.restoreAllMocks();
  }
});
