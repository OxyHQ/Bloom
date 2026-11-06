import { fireEvent, render, screen } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BottomPromo } from '../bottom-promo';

const insets = { top: 0, right: 0, bottom: 34, left: 0 };

describe('BottomPromo', () => {
  it('shows the centred copy and presses the full-width action', () => {
    const onAction = jest.fn();
    render(
      <BloomThemeProvider>
        <SafeAreaInsetsContext.Provider value={insets}>
          <BottomPromo
            testID="promo"
            title="Don’t miss what’s happening"
            description="People on Mention are the first to know."
            actionLabel="Sign In"
            onAction={onAction}
          />
        </SafeAreaInsetsContext.Provider>
      </BloomThemeProvider>,
    );

    expect(screen.getByText('Don’t miss what’s happening')).toBeTruthy();
    expect(screen.getByText('People on Mention are the first to know.')).toBeTruthy();
    fireEvent.press(screen.getByText('Sign In'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
