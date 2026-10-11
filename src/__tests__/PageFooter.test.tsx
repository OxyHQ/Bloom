import React from 'react';
import { Platform, Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BloomScope } from '../appearance';
import { Button } from '../button';
import { PageFooter, PageFooterProvider, usePageFooterInset } from '../page-footer';
import { BottomEdgeProvider, useBottomEdgeInset, useClaimBottomEdge } from '../layout/bottom-edge';
import { SurfaceLevelProvider } from '../styles/surface-levels';
import { SCRIM_STOPS } from '../page-header/EdgeScrim';
import { resolvedStyle } from './support/rendered-style';

const insets = { top: 0, right: 0, bottom: 34, left: 0 };
const originalOS = Platform.OS;
afterEach(() => {
  (Platform as { OS: string }).OS = originalOS;
});

function Claim({ height }: { height: number }) {
  useClaimBottomEdge(height);
  return null;
}
function Clearance({ id = 'clearance' }: { id?: string }) {
  return <Text testID={id}>{usePageFooterInset()}</Text>;
}
function GlobalClearance() {
  return <Text testID="global">{useBottomEdgeInset()}</Text>;
}
function Providers({ children }: React.PropsWithChildren) {
  return (
    <BloomThemeProvider>
      <SafeAreaInsetsContext.Provider value={insets}>
        <BottomEdgeProvider>
          <PageFooterProvider>{children}</PageFooterProvider>
        </BottomEdgeProvider>
      </SafeAreaInsetsContext.Provider>
    </BloomThemeProvider>
  );
}
function layout(node: Parameters<typeof fireEvent>[0], width: number, height: number) {
  fireEvent(node, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width, height } } });
}

describe('PageFooter', () => {
  it('stacks above navigation without publishing into the registry it reads', () => {
    const screen = render(
      <Providers>
        <Claim height={98} />
        <GlobalClearance />
        <Clearance />
        <PageFooter testID="footer" safeArea actions={<Button>Reply</Button>} />
      </Providers>,
    );
    expect(resolvedStyle(screen.getByTestId('footer').props.style)).toMatchObject({
      position: 'absolute',
      bottom: 98,
      paddingBottom: 0,
    });
    layout(screen.getByTestId('footer-row'), 390, 72);
    expect(screen.getByTestId('clearance').props.children).toBe(170);
    expect(screen.getByTestId('global').props.children).toBe(98);
    screen.rerender(
      <Providers>
        <Claim height={110} />
        <GlobalClearance />
        <Clearance />
        <PageFooter testID="footer" safeArea actions={<Button>Reply</Button>} />
      </Providers>,
    );
    expect(screen.getByTestId('clearance').props.children).toBe(182);
    expect(screen.getByTestId('global').props.children).toBe(110);
  });

  it('keeps document positioning inside the native bounded frame', () => {
    (Platform as { OS: string }).OS = 'ios';
    const screen = render(
      <Providers>
        <PageFooter position="document" testID="footer" />
      </Providers>,
    );
    expect(resolvedStyle(screen.getByTestId('footer').props.style).position).toBe('absolute');
    expect(screen.queryByTestId('footer-anchor')).toBeNull();
  });

  it('uses safe bottom once on native and allows the shell to own it', () => {
    (Platform as { OS: string }).OS = 'ios';
    const screen = render(
      <Providers>
        <Clearance />
        <PageFooter testID="footer" />
      </Providers>,
    );
    expect(resolvedStyle(screen.getByTestId('footer').props.style).paddingBottom).toBe(34);
    expect(screen.getByTestId('clearance').props.children).toBe(90);
    screen.rerender(
      <Providers>
        <Clearance />
        <PageFooter testID="footer" safeArea={false} />
      </Providers>,
    );
    expect(resolvedStyle(screen.getByTestId('footer').props.style).paddingBottom).toBe(0);
    expect(screen.getByTestId('clearance').props.children).toBe(56);
    screen.rerender(
      <Providers>
        <Clearance />
        <PageFooter testID="footer" bottomInset={98} />
      </Providers>,
    );
    expect(screen.getByTestId('clearance').props.children).toBe(154);
    expect(resolvedStyle(screen.getByTestId('footer').props.style).paddingBottom).toBe(0);
  });

  it('does not add the web safe area unless asked, and accepts zero for a reserved frame', () => {
    (Platform as { OS: string }).OS = 'web';
    const screen = render(
      <Providers>
        <Claim height={98} />
        <Clearance />
        <PageFooter testID="footer" bottomInset={0} />
      </Providers>,
    );
    expect(resolvedStyle(screen.getByTestId('footer').props.style)).toMatchObject({
      bottom: 0,
      paddingBottom: 0,
    });
    expect(screen.getByTestId('clearance').props.children).toBe(56);
  });

  it('releases clearance when reply mode removes the footer, then measures the new footer', () => {
    const screen = render(
      <Providers>
        <Clearance />
        <PageFooter testID="footer" bottomInset={80} safeArea={false} />
      </Providers>,
    );
    layout(screen.getByTestId('footer-row'), 390, 100);
    expect(screen.getByTestId('clearance').props.children).toBe(180);
    screen.rerender(
      <Providers>
        <Clearance />
        <View testID="reply-composer" />
      </Providers>,
    );
    expect(screen.getByTestId('clearance').props.children).toBe(0);
    screen.rerender(
      <Providers>
        <Clearance />
        <PageFooter testID="footer" bottomInset={80} safeArea={false} />
      </Providers>,
    );
    expect(screen.getByTestId('clearance').props.children).toBe(136);
  });

  it('isolates panes even when they share a navigation bar', () => {
    const screen = render(
      <BloomThemeProvider>
        <BottomEdgeProvider>
          <Claim height={98} />
          <PageFooterProvider>
            <Clearance id="left" />
            <PageFooter testID="a" safeArea={false} />
          </PageFooterProvider>
          <PageFooterProvider>
            <Clearance id="right" />
            <PageFooter testID="b" safeArea={false} bottomInset={0} />
          </PageFooterProvider>
        </BottomEdgeProvider>
      </BloomThemeProvider>,
    );
    layout(screen.getByTestId('a-row'), 320, 100);
    layout(screen.getByTestId('b-row'), 900, 60);
    expect(screen.getByTestId('left').props.children).toBe(198);
    expect(screen.getByTestId('right').props.children).toBe(60);
  });

  it('measures wrapped action rows and preserves their callbacks and inherited sizes', () => {
    const onReply = jest.fn();
    const onReplyAll = jest.fn();
    const onForward = jest.fn();
    const screen = render(
      <Providers>
        <Clearance />
        <BloomScope size="sm">
          <PageFooter
            testID="footer"
            safeArea={false}
            actions={
              <>
                <Button testID="reply" onPress={onReply}>
                  Reply to this message
                </Button>
                <Button onPress={onReplyAll}>Reply to all participants</Button>
                <Button onPress={onForward}>Forward this message</Button>
              </>
            }
          />
        </BloomScope>
      </Providers>,
    );
    fireEvent.press(screen.getByText('Reply to this message'));
    fireEvent.press(screen.getByText('Reply to all participants'));
    fireEvent.press(screen.getByText('Forward this message'));
    expect([
      onReply.mock.calls.length,
      onReplyAll.mock.calls.length,
      onForward.mock.calls.length,
    ]).toEqual([1, 1, 1]);
    expect(resolvedStyle(screen.getByTestId('reply').props.style).height).toBe(32);
    expect(resolvedStyle(screen.getByTestId('footer-actions').props.style)).toMatchObject({
      flexWrap: 'wrap',
      flexShrink: 1,
    });
    // Jest has no layout engine: feed it the height reported after wrapping.
    // Actual narrow label layout is verified in a browser by the consumer.
    layout(screen.getByTestId('footer-row'), 320, 112);
    expect(resolvedStyle(screen.getByTestId('footer-row').props.style)).toMatchObject({
      paddingLeft: 16,
      paddingRight: 16,
    });
    expect(screen.getByTestId('clearance').props.children).toBe(112);
  });

  it('uses exactly the header ramp mirrored upward, tinted with the enclosing surface', () => {
    const screen = render(
      <Providers>
        <SurfaceLevelProvider level={1} fill="#123456">
          <PageFooter testID="footer" safeArea={false} />
        </SurfaceLevelProvider>
      </Providers>,
    );
    const gradient = screen.getByTestId('footer-scrim-gradient');
    const ramp = gradient.findByProps({ x1: '0', x2: '0' });
    expect(ramp.props).toMatchObject({ y1: '1', y2: '0' });
    for (const stop of SCRIM_STOPS) {
      expect(
        ramp.findByProps({
          offset: String(stop.offset),
          stopColor: '#123456',
          stopOpacity: stop.opacity,
        }),
      ).toBeTruthy();
    }
    expect(resolvedStyle(screen.getByTestId('footer-scrim').props.style).height).toBeCloseTo(86.8);
    expect(screen.getByTestId('footer').props.pointerEvents).toBe('box-none');
    expect(screen.getByTestId('footer-scrim').props.pointerEvents).toBe('none');
  });

  it('supports no scrim and stays usable without a measurement provider', () => {
    const screen = render(
      <BloomThemeProvider>
        <Clearance />
        <PageFooter testID="footer" safeArea={false} scrim="none" />
      </BloomThemeProvider>,
    );
    expect(screen.queryByTestId('footer-scrim')).toBeNull();
    expect(screen.getByTestId('clearance').props.children).toBe(0);
  });

  it('does not let a transient invalid layout corrupt scroll clearance', () => {
    const screen = render(
      <Providers>
        <Clearance />
        <PageFooter testID="footer" safeArea={false} />
      </Providers>,
    );
    layout(screen.getByTestId('footer-row'), NaN, NaN);
    expect(screen.getByTestId('clearance').props.children).toBe(56);
  });
});
