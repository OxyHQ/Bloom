import { useContext, type ComponentType, type ReactNode } from 'react';
import { PageHeader } from '../page-header/PageHeader';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { useCommonMessages } from '../locale/common-messages';
import { useTopEdgeInset } from '../layout/top-edge';
import { useTheme } from '../theme/use-theme';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import {
  SafeAreaConsumedContext,
  NO_CONSUMED_SAFE_AREA,
  WindowSafeAreaInsetsContext,
} from '../layout/safe-area-ownership';
import type { Button } from '../button';
import type { Screen, ScreenScrollView } from '../screen';
import { BREAKPOINTS } from '../styles/breakpoints';
import { useWindowBreakpoint } from '../hooks/use-width-class';
import { IS_WEB } from '../styles/platform';
import { DetailDialogSectionGroup } from './DetailDialogSection';
import { useDialogContext } from './context';
import type { DetailDialogProps, DialogProps } from './types';

type DetailPlatform = {
  Dialog: ComponentType<DialogProps>;
  Button: typeof Button;
  Screen: typeof Screen;
  ScreenScrollView: typeof ScreenScrollView;
  Motion: ComponentType<{ children: ReactNode }>;
};

/** One layout/material/scroll owner for product records and the board template. */
export function createDetailDialog({
  Dialog,
  Button,
  Screen,
  ScreenScrollView,
  Motion,
}: DetailPlatform) {
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
      <View style={styles.viewport}>
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
      </View>
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
    // Below `sm` the body's inset steps in from 24px to 16px.
    const compact = useWindowBreakpoint() === 'base';
    const body = (
      <View style={{ flexGrow: 1, ...(scrollable ? {} : { flex: 1, minHeight: 0 }) }}>
        <View
          style={[
            compact ? styles.bodyCompact : styles.body,
            scrollable ? undefined : { flex: 1, minHeight: 0 },
          ]}
        >
          {scrollable ? <DetailDialogSectionGroup>{children}</DetailDialogSectionGroup> : children}
        </View>
        {scrollFooter != null && <View style={styles.scrollFooter}>{scrollFooter}</View>}
      </View>
    );
    return (
      <Motion>
        <Screen
          style={{
            flex: 1,
            minHeight: 0,
            height: '100%',
            borderRadius: 24,
            overflow: 'hidden',
            backgroundColor: colors.card,
          }}
          testID={`${testID}-surface`}
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
      </Motion>
    );
  }
  function DetailDialog(props: DetailDialogProps) {
    const { width, height } = useWindowDimensions();
    const windowInsets = useContext(WindowSafeAreaInsetsContext);
    const triggerInsets = useContext(SafeAreaInsetsContext);
    const physical = windowInsets ?? triggerInsets ?? NO_CONSUMED_SAFE_AREA;
    const native = Platform.OS !== 'web';
    const compact = width < BREAKPOINTS.sm;
    const centered = props.mode === 'center' && !compact;
    const gap = compact ? 8 : 12;
    const targetWidth = Math.min(609, width - physical.left - physical.right - gap * 2);
    const centerY = centered ? (height - physical.top - physical.bottom) * 0.04 : gap;
    const nativeInset = {
      top: physical.top + centerY,
      bottom: physical.bottom + centerY,
      left: centered ? (width - targetWidth) / 2 : physical.left + gap,
      right: centered ? (width - targetWidth) / 2 : physical.right + gap,
    };
    return (
      <Dialog
        open={props.open}
        startOpen={props.startOpen}
        onClose={props.onClose}
        label={props.label}
        testID={props.testID}
        presentation="custom"
        exitDuration={560}
        placement="center"
        width={609}
        inset={native ? nativeInset : undefined}
        minSideGutter={0}
        maxWidth={609}
        contentPadding={0}
        scrollable={false}
        morph={false}
        containerStyle={{
          inset: 0,
          overflow: 'hidden',
          alignItems: centered ? 'center' : 'flex-end',
          justifyContent: centered ? 'center' : 'flex-start',
          padding: compact ? 8 : 12,
        }}
        panelStyle={
          native
            ? { backgroundColor: 'transparent' }
            : {
                width: '100%',
                maxWidth: 609,
                height: centered ? '92%' : '100%',
                maxHeight: '100%',
                backgroundColor: 'transparent',
              }
        }
      >
        <View style={styles.frame}>
          <SafeAreaConsumedContext.Provider value={native ? physical : NO_CONSUMED_SAFE_AREA}>
            <DetailContent {...props} />
          </SafeAreaConsumedContext.Provider>
        </View>
      </Dialog>
    );
  }
  DetailDialog.displayName = 'DetailDialog';
  return DetailDialog;
}

const styles = StyleSheet.create({
  viewport: { position: 'relative', minHeight: 0, flexGrow: 1, flexShrink: 1, flexBasis: '0%' },
  body: { paddingInline: 24 },
  bodyCompact: { paddingInline: 16 },
  scrollFooter: {
    marginTop: 'auto',
    flexDirection: 'column',
    gap: 10,
    paddingInline: 12,
    paddingBottom: 12,
  },
  // The dialog's 609px column, filling the panel; no focus outline on the web.
  frame: {
    height: '100%',
    width: '100%',
    maxWidth: 609,
    ...(IS_WEB ? { outlineStyle: 'none' as never } : null),
    flex: 1,
    minHeight: 0,
  },
});
