import React, { memo, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { WEB_POSITION_STICKY, type WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { WizardFooterProps } from './types';

/**
 * The action bar under a step of a multi-step flow.
 *
 *   bar      1px hairline on top (neutral-200, dark neutral-800), page
 *            background, py 16 px 24 (px 16 below 480 wide)
 *   left     "Back" — the underlined text action (body-semibold, text-primary);
 *            omitted with `onBack`, and the primary action stays on the right
 *   middle   an optional `status` line, caption-1-regular text-secondary,
 *            hidden below 480 wide
 *   right    primary `Button` at `large` ("Next", "Publish"); `loading` is the
 *            Button's own loading state
 *
 * Sticky on web through `position: sticky; bottom: 0` inside its scroll
 * container; on native by placement (render it after the `ScrollView`).
 */

const IS_WEB = Platform.OS === 'web';
const NARROW = 480;

function WizardFooterComponent({
  onBack,
  backLabel = 'Back',
  backDisabled = false,
  onNext,
  nextLabel = 'Next',
  nextDisabled = false,
  loading = false,
  status,
  sticky = true,
  style,
  testID,
}: WizardFooterProps) {
  const theme = useTheme();
  const { neutral } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [width, setWidth] = useState(0);
  const narrow = width > 0 && width < NARROW;
  const inset = narrow ? 16 : 24;

  const barStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: inset,
    paddingRight: inset,
    borderTopWidth: 1,
    borderTopColor: theme.isDark ? neutral[800] : neutral[200],
    backgroundColor: theme.colors.background,
    ...(IS_WEB && sticky ? { position: WEB_POSITION_STICKY, bottom: 0, zIndex: 1 } : null),
  };

  return (
    <View
      testID={testID}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[barStyle, style]}
    >
      {onBack ? (
        <View>
          <Button
            variant="link"
            linkTone="text"
            underline="rest"
            size="small"
            textVariant="body-semibold"
            style={{ paddingTop: 6, paddingBottom: 6, marginTop: -6, marginBottom: -6 }}
            onPress={onBack}
            disabled={backDisabled}
            testID={testID ? `${testID}-back` : undefined}
          >
            {backLabel}
          </Button>
        </View>
      ) : (
        <View />
      )}
      {status && !narrow ? (
        <Text
          variant="caption-1-regular"
          numberOfLines={1}
          accessibilityLiveRegion="polite"
          style={{ flexShrink: 1, color: theme.colors.textSecondary, textAlign: 'center' }}
        >
          {status}
        </Text>
      ) : null}
      <Button
        variant="primary"
        size="large"
        onPress={onNext}
        loading={loading}
        disabled={nextDisabled}
        accessibilityLabel={nextLabel}
        testID={testID ? `${testID}-next` : undefined}
      >
        {nextLabel}
      </Button>
    </View>
  );
}

export const WizardFooter = memo(WizardFooterComponent);
WizardFooter.displayName = 'WizardFooter';
