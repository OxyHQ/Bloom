import React, { memo, useInsertionEffect, useState } from 'react';
import { View } from 'react-native';

import { PageFooter } from '../page-footer';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { dataHook } from '../styles/data-hook';

import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { WizardFooterProps } from './types';
import { useCommonMessages } from '../locale/common-messages';
import { IS_WEB } from '../styles/platform';

/**
 * The action bar under a step of a multi-step flow.
 *
 *   bar      1px hairline on top (neutral-200, dark neutral-800), page
 *            background, py 16; the sides are PageFooter's page gutter
 *            (16, 24 from `sm`), so the bar lines up with the content above
 *   left     "Back" — the underlined text action (body-semibold, text-primary);
 *            omitted with `onBack`, and the primary action stays on the right
 *   middle   an optional `status` line, caption-1-regular text-secondary,
 *            hidden below 480 wide
 *   right    primary `Button` at `large` ("Next", "Publish"); `loading` is the
 *            Button's own loading state
 *
 * PageFooter owns placement, occupied bottom edges and native safe area.
 * Screen.bottomBar owns positioning when this footer is composed into its slot.
 */

const NARROW = 480;
const WIZARD_FOOTER_CSS = `
@container bloom-wizard-footer (width < ${NARROW}px) {
  [data-bloom-wizard-footer-status] { display: none !important; }
}
`;

export function createWizardFooter({
  Button,
  LinkButton,
}: {
  Button: typeof import('../button')['Button'];
  LinkButton: typeof import('../button')['LinkButton'];
}) {
  function WizardFooterComponent({
    onBack,
    backLabel: backLabelProp,
    backDisabled = false,
    onNext,
    nextLabel: nextLabelProp,
    nextDisabled = false,
    loading = false,
    status,
    sticky = true,
    style,
    testID,
  }: WizardFooterProps) {
    const common = useCommonMessages();
    const backLabel = backLabelProp ?? common.back;
    const nextLabel = nextLabelProp ?? common.next;
    const theme = useTheme();
    const [narrow, setNarrow] = useState(false);
    useInsertionEffect(() => {
      if (IS_WEB) adoptStyleSheet('bloom-wizard-footer-layout', WIZARD_FOOTER_CSS);
    }, []);

    const barStyle: WebCssStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      paddingTop: 16,
      paddingBottom: 16,
    };

    const frameStyle: WebCssStyle = {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      ...(IS_WEB ? { containerType: 'inline-size', containerName: 'bloom-wizard-footer' } : {}),
    };

    return (
      <PageFooter
        testID={testID}
        position={sticky ? 'sticky' : 'inline'}
        scrim="none"
        // The horizontal inset is PageFooter's own (16, 24 from `sm`), the same
        // gutter the page content uses; only the vertical padding is the
        // wizard's, supplied by the bar below.
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 0 }}
        style={[frameStyle, style]}
      >
        <View
          {...dataHook('bloomWizardFooterRow')}
          onLayout={
            IS_WEB
              ? undefined
              : (event) => {
                  const width = event.nativeEvent.layout.width;
                  if (Number.isFinite(width)) setNarrow(width > 0 && width < NARROW);
                }
          }
          style={barStyle}
        >
          {onBack ? (
            <View>
              <LinkButton
                linkTone="text"
                underline="rest"
                size="sm"
                textVariant="body-semibold"
                style={{ paddingTop: 6, paddingBottom: 6, marginTop: -6, marginBottom: -6 }}
                onPress={onBack}
                disabled={backDisabled}
                testID={testID ? `${testID}-back` : undefined}
              >
                {backLabel}
              </LinkButton>
            </View>
          ) : (
            <View />
          )}
          {status && !narrow ? (
            <Text
              {...dataHook('bloomWizardFooterStatus')}
              variant="caption-1-regular"
              numberOfLines={1}
              accessibilityLiveRegion="polite"
              style={{ flexShrink: 1, color: theme.colors.textSecondary, textAlign: 'center' }}
            >
              {status}
            </Text>
          ) : null}
          <Button
            size="lg"
            onPress={onNext}
            loading={loading}
            disabled={nextDisabled}
            accessibilityLabel={nextLabel}
            testID={testID ? `${testID}-next` : undefined}
            tone="accent"
            appearance="solid"
          >
            {nextLabel}
          </Button>
        </View>
      </PageFooter>
    );
  }

  const WizardFooter = memo(WizardFooterComponent);
  WizardFooter.displayName = 'WizardFooter';
  return WizardFooter;
}
