import type { ComponentType, ReactNode } from 'react';
import { PageHeader } from '../page-header/PageHeader';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useCommonMessages } from '../locale/common-messages';
import { useTopEdgeInset } from '../layout/top-edge';
import { useTheme } from '../theme/use-theme';
import { useWindowDimensions } from 'react-native';
import type { Button } from '../button';
import type { Screen, ScreenScrollView } from '../screen';
import { BREAKPOINTS } from '../styles/breakpoints';
import { StyledView } from '../styles/styled-primitives';
import { DetailDialogSectionGroup } from './DetailDialogSection';
import { useDialogContext } from './context';
import type { DetailDialogProps, DialogProps } from './types';

type Platform = {
  Dialog: ComponentType<DialogProps>;
  Button: typeof Button;
  Screen: typeof Screen;
  ScreenScrollView: typeof ScreenScrollView;
  Motion: ComponentType<{ children: ReactNode }>;
};

/** One layout/material/scroll owner for product records and the board template. */
export function createDetailDialog({ Dialog, Button, Screen, ScreenScrollView, Motion }: Platform) {
  function BodyViewport({
    body,
    scrollable,
    testID,
  }: {
    body: ReactNode;
    scrollable: boolean;
    testID: string;
  }) {
    const top = useTopEdgeInset();
    return (
      <StyledView className="relative min-h-0 flex-1">
        {scrollable ? (
          <ScreenScrollView
            testID={`${testID}-scroll`}
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={{ flexGrow: 1, paddingTop: top }}
          >
            {body}
          </ScreenScrollView>
        ) : (
          body
        )}
      </StyledView>
    );
  }
  function DetailContent({
    header,
    subtitle,
    actions,
    children,
    scrollFooter,
    footer,
    footerKeyboardBehavior = 'visible',
    closeLabel,
    contentKind = 'document',
    scrollable = true,
    testID = 'detail-dialog',
  }: DetailDialogProps) {
    const { close } = useDialogContext();
    const { colors } = useTheme();
    const common = useCommonMessages();
    const body = (
      <StyledView style={{ flexGrow: 1, ...(scrollable ? {} : { flex: 1, minHeight: 0 }) }}>
        <StyledView
          className="px-6 max-sm:px-4"
          style={scrollable ? undefined : { flex: 1, minHeight: 0 }}
        >
          {scrollable ? <DetailDialogSectionGroup>{children}</DetailDialogSectionGroup> : children}
        </StyledView>
        {scrollFooter != null && (
          <StyledView className="mt-auto flex flex-col gap-2.5 px-3 pb-3">
            {scrollFooter}
          </StyledView>
        )}
      </StyledView>
    );
    return (
      <Motion>
        <StyledView
          style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: colors.card,
          }}
          testID={`${testID}-surface`}
        >
          <Screen
            kind={contentKind}
            scroll={scrollable ? 'content' : 'none'}
            navigationScope="isolated"
            headerPlacement={scrollable ? 'overlay' : 'inset'}
            header={
              <PageHeader
                testID={`${testID}-header`}
                title={header}
                subtitle={subtitle}
                actions={
                  <>
                    {actions}
                    <Button
                      appearance="outline"
                      tone="neutral"
                      iconOnly
                      icon={<RiCloseLine />}
                      accessibilityLabel={closeLabel ?? common.close}
                      onPress={() => close()}
                    />
                  </>
                }
              />
            }
            bottomBar={footer}
            bottomBarKeyboardBehavior={footerKeyboardBehavior}
          >
            <BodyViewport body={body} scrollable={scrollable} testID={testID} />
          </Screen>
        </StyledView>
      </Motion>
    );
  }
  function DetailDialog(props: DetailDialogProps) {
    const { width } = useWindowDimensions();
    const compact = width < BREAKPOINTS.sm;
    const centered = props.mode === 'center' && !compact;
    return (
      <Dialog
        open={props.open}
        onClose={props.onClose}
        label={props.label}
        testID={props.testID}
        presentation="custom"
        exitDuration={560}
        placement="center"
        width={609}
        maxWidth={609}
        contentPadding={0}
        scrollable={false}
        morph={false}
        containerClassName="fixed inset-0 z-100 flex items-stretch justify-end overflow-hidden p-3 max-sm:p-2"
        containerStyle={{
          alignItems: centered ? 'center' : 'flex-end',
          justifyContent: centered ? 'center' : 'flex-start',
          padding: compact ? 8 : 12,
        }}
        panelStyle={{
          width: '100%',
          maxWidth: 609,
          height: centered ? '92%' : '100%',
          maxHeight: '100%',
          backgroundColor: 'transparent',
        }}
      >
        <StyledView
          className="h-full w-full max-w-[609px] outline-none"
          style={{ flex: 1, minHeight: 0 }}
        >
          <DetailContent {...props} />
        </StyledView>
      </Dialog>
    );
  }
  DetailDialog.displayName = 'DetailDialog';
  return DetailDialog;
}
