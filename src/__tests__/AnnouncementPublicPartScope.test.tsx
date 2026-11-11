import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Announcement } from '../announcement';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

function Subject({ scope, nestedScope }: { scope?: BloomSize; nestedScope?: BloomSize }) {
  const announcement = (
    <Announcement
      title="Upgrade to Pro"
      actionLabel="Upgrade now"
      dismissible
      closeLabel="Hide announcement"
    />
  );
  return (
    <BloomThemeProvider mode="light" colorPreset="teal">
      <BloomScope size={scope}>
        {nestedScope ? <BloomScope size={nestedScope}>{announcement}</BloomScope> : announcement}
      </BloomScope>
    </BloomThemeProvider>
  );
}

it('keeps explicitly sized announcement controls stable under BloomScope', () => {
  const screen = render(<Subject />);
  const actionHeight = () => {
    let action = screen.getByText('Upgrade now');
    while (action.props.accessibilityRole !== 'button' && action.parent) action = action.parent;
    if (action.props.accessibilityRole !== 'button') {
      throw new Error('Announcement did not render its CTA Button');
    }
    return resolvedStyle(action.props.style).height;
  };
  const close = () => screen.getByLabelText('Hide announcement');
  const closeSize = () => {
    const glyph = close().findAll((node) => String(node.type) === 'Svg')[0];
    if (!glyph) throw new Error('Announcement did not render its close glyph');
    return { box: resolvedStyle(close().props.style).width, glyph: glyph.props.width };
  };

  expect(actionHeight()).toBe(32);
  expect(closeSize()).toEqual({ box: 20, glyph: 10.8 });
  expect(close().props.hitSlop).toEqual({ top: 10, bottom: 10, left: 10, right: 10 });
  screen.rerender(<Subject scope="xs" />);
  expect(actionHeight()).toBe(32);
  expect(closeSize()).toEqual({ box: 20, glyph: 10.8 });
  screen.rerender(<Subject scope="lg" />);
  expect(actionHeight()).toBe(32);
  expect(closeSize()).toEqual({ box: 20, glyph: 10.8 });
  screen.rerender(<Subject scope="xs" nestedScope="lg" />);
  expect(actionHeight()).toBe(32);
  expect(closeSize()).toEqual({ box: 20, glyph: 10.8 });
});
