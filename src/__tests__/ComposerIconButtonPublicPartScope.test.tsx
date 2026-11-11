import { Platform, Pressable } from 'react-native';
import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { ComposerIconButton } from '../chat-composer/ComposerIconButton';
import type { BloomIconComponent } from '../icons/icon-component';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const TestIcon: BloomIconComponent = () => null;
const originalPlatform = Platform.OS;
afterEach(() => {
  Platform.OS = originalPlatform;
});

it.each(['ios', 'android'] as const)(
  '%s keeps its numeric box and touch target across scopes',
  (os) => {
    Platform.OS = os;
    const target = os === 'android' ? 48 : 44;
    for (const scope of ['xs', 'sm', 'md', 'lg'] as const) {
      for (const size of [28, 32, 36]) {
        const screen = render(
          <BloomThemeProvider mode="light">
            <BloomScope size={scope}>
              <ComposerIconButton
                icon={TestIcon}
                accessibilityLabel="Attach"
                size={size}
                testID="composer-icon"
              />
            </BloomScope>
          </BloomThemeProvider>,
        );
        const style = resolvedStyle(screen.getByTestId('composer-icon').props.style);
        const hitSlop = screen.UNSAFE_getByType(Pressable).props.hitSlop;
        const inset = (target - size) / 2;

        expect(style.width).toBe(size);
        expect(style.height).toBe(size);
        expect(hitSlop).toEqual({ top: inset, bottom: inset, left: inset, right: inset });
        expect(size + hitSlop.top + hitSlop.bottom).toBeGreaterThanOrEqual(target);
        expect(size + hitSlop.left + hitSlop.right).toBeGreaterThanOrEqual(target);
        screen.unmount();
      }
    }
  },
);
