import { type ComponentRef, forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import {
  type ScrollView,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useAiChatPlatform } from './context';
import { useScreenContext } from '../screen/context';
import { PageHeader } from '../page-header';
import { PageFooter } from '../page-footer';
import { AgentThinking } from '../agent-thinking';
import { Breadcrumb, BreadcrumbItem } from '../breadcrumb';
import { ButtonGroup, ButtonGroupItem } from '../button-group';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiMoreFill } from '../icons/remix/RiMoreFill';
import { RiShare2Line } from '../icons/remix/RiShare2Line';
import { RiMenuLine } from '../icons/remix/RiMenuLine';
import { useMessages } from '../locale/messages';
import { useCommonMessages } from '../locale/common-messages';
import { useAppShellPanel } from '../app-shell/hooks';
import { AI_CHAT_MESSAGES } from './messages';
import { useAiChatShell } from './context';
import type { AiChatContainerProps, AiChatThreadHandle, AiChatThreadProps } from './types';
import { IS_WEB } from '../styles/platform';
import { SurfaceLevelProvider, useSurfaceFill } from '../styles/surface-levels';
import { useSurfaceBacking } from '../surface/use-surface-backing';
import { useAiChatPalette } from './shared';
import { CHAT_CONTENT_STYLE } from '../styles/chat-layout';

const THREAD_PAD_TOP = 16;
const EDGE_THRESHOLD = 1;

/** Conversation content composed into the same Screen/header/footer contract as every route. */
export function AiChatContainerBase({
  project,
  title,
  projectIcon = RiFolderLine,
  onProjectPress,
  onShare,
  onMore,
  actions,
  header,
  children,
  composer,
  working = false,
  workingLabel,
  background,
  surface = true,
  floatingChrome = false,
  labels,
  style,
  testID,
}: AiChatContainerProps) {
  const { Screen } = useAiChatPlatform();
  const { messages } = useMessages(AI_CHAT_MESSAGES);
  const palette = useAiChatPalette();
  const ambientFill = useSurfaceFill() ?? palette.secondary;
  const backing = useSurfaceBacking(surface ? ambientFill : undefined, style, !background);
  const common = useCommonMessages();
  const l = { ...messages.container, more: common.moreOptions, ...labels };
  const documentScroll = useAiChatShell()?.documentScroll;
  const shell = useAiChatShell();
  const { active = true } = useAppShellPanel();
  const hasCrumbs = project != null || title != null;
  const crumbs = hasCrumbs ? (
    <Breadcrumb accessibilityLabel={l.breadcrumb}>
      {project === undefined ? null : (
        <BreadcrumbItem icon={projectIcon} onPress={onProjectPress}>
          {project}
        </BreadcrumbItem>
      )}
      {title == null ? null : <BreadcrumbItem current>{title}</BreadcrumbItem>}
    </Breadcrumb>
  ) : undefined;
  const headerActions =
    actions ??
    (onShare || onMore ? (
      <ButtonGroup>
        {onShare ? (
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiShare2Line}
            accessibilityLabel={l.share}
            onPress={onShare}
          />
        ) : null}
        {onMore ? (
          <ButtonGroupItem
            iconOnly
            leadingIcon={RiMoreFill}
            accessibilityLabel={l.more}
            onPress={onMore}
          />
        ) : null}
      </ButtonGroup>
    ) : undefined);
  return (
    <SurfaceLevelProvider level={backing.level} fill={backing.fill}>
      <Screen
        testID={testID}
        active={active}
        scroll="auto"
        bottomBarKeyboardBehavior="visible"
        documentScroll={documentScroll}
        headerPlacement={floatingChrome ? 'overlay' : 'inset'}
        contentClearance={0}
        style={[surface ? undefined : { backgroundColor: 'transparent' }, style, backing.vars]}
        header={
          header ?? (
            <PageHeader
              title={crumbs}
              safeArea={false}
              leading={
                shell?.navCollapsed && shell.hasNav ? (
                  <ButtonGroup>
                    <ButtonGroupItem
                      iconOnly
                      leadingIcon={RiMenuLine}
                      accessibilityLabel={shell.labels.openNavigation}
                      onPress={shell.openNav}
                    />
                  </ButtonGroup>
                ) : undefined
              }
              actions={
                <>
                  {headerActions}
                  {shell?.compact && shell.hasPanel ? (
                    <ButtonGroup>
                      <ButtonGroupItem
                        iconOnly
                        leadingIcon={shell.panelIcon}
                        accessibilityLabel={shell.labels.openPanel(shell.panelLabel)}
                        onPress={shell.openPanel}
                      />
                    </ButtonGroup>
                  ) : null}
                </>
              }
            />
          )
        }
        bottomBar={
          working || composer ? (
            <PageFooter safeArea={false} scrim="auto">
              <View style={[CHAT_CONTENT_STYLE, { gap: 10 }]}>
                {working ? <AgentThinking variant="infinity" label={workingLabel} /> : null}
                {composer}
              </View>
            </PageFooter>
          ) : undefined
        }
      >
        {background ? (
          <View
            testID={testID ? `${testID}-background` : undefined}
            pointerEvents="none"
            style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
          >
            {background}
          </View>
        ) : null}
        {children}
      </Screen>
    </SurfaceLevelProvider>
  );
}
/** The shared scroller preserves the thread's following and upward-pagination behavior. */
export const AiChatThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(
  function AiChatThread(props, ref) {
    const { Screen } = useAiChatPlatform();
    const screen = useScreenContext();
    return screen ? (
      <ScrollThread ref={ref} {...props} />
    ) : (
      <Screen scroll="auto" contentClearance={0}>
        <ScrollThread ref={ref} {...props} />
      </Screen>
    );
  },
);

/** The thread inside a card of fixed height: a `ScrollView` of its own. */
const ScrollThread = forwardRef<AiChatThreadHandle, AiChatThreadProps>(function ScrollThread(
  {
    children,
    autoFollow = true,
    followAnimated = true,
    followThreshold,
    onStartReached,
    onStartReachedThreshold = 300,
    maintainStartPosition = false,
    onScroll,
    scrollEventThrottle = 16,
    style,
    testID,
  },
  ref,
) {
  const { ScreenScrollView } = useAiChatPlatform();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const lastHeight = useRef(0);
  /**
   * The latest content height from ANY source, for the chrome report only.
   * `lastHeight` must change solely in `onContentSizeChange`: a scroll event
   * carrying the new size first would otherwise hide the growth from the follow.
   */
  const contentHeight = useRef(0);
  const offset = useRef(0);
  const viewport = useRef(0);
  /**
   * A scroll to the end is on its way and has not landed. `offset` is only
   * what the LAST scroll event said, so two growths between a `scrollToEnd`
   * and the event it causes measured the reader against the old offset, read
   * them as far from the bottom and dropped the follow for good (Android,
   * streaming). While this holds, growth follows whatever `offset` says; it
   * clears when a scroll event lands at the end or moves UP — only a reader
   * (or a host) scrolls up, the follow never does.
   */
  const following = useRef(false);
  /** An `onStartReached` is out and its page has not landed yet. */
  const pageOut = useRef(false);
  /** The reader has left the top zone, so the next approach may fire again. */
  const startArmed = useRef(true);

  useImperativeHandle(
    ref,
    (): AiChatThreadHandle => ({
      scrollToEnd: (options) => {
        following.current = true;
        scrollRef.current?.scrollToEnd({ animated: options?.animated ?? true });
      },
      scrollToOffset: ({ offset: y, animated = false }) =>
        scrollRef.current?.scrollTo({ y, animated }),
      getScrollView: () => scrollRef.current,
    }),
    [],
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
      const movedUp = contentOffset.y < offset.current - 0.5;
      offset.current = contentOffset.y;
      viewport.current = layoutMeasurement.height;
      if (contentSize?.height) contentHeight.current = contentSize.height;
      if (
        movedUp ||
        contentHeight.current - contentOffset.y - layoutMeasurement.height <= EDGE_THRESHOLD
      ) {
        following.current = false;
      }
      if (onStartReached) {
        if (contentOffset.y <= onStartReachedThreshold) {
          if (startArmed.current) {
            startArmed.current = false;
            pageOut.current = true;
            onStartReached();
          }
        } else {
          startArmed.current = true;
        }
      }
      onScroll?.(event);
    },
    [onScroll, onStartReached, onStartReachedThreshold],
  );

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const nextHeight = event.nativeEvent.layout.height;
    const previousHeight = viewport.current;
    const wasAtEnd =
      previousHeight > 0 && lastHeight.current - offset.current - previousHeight <= EDGE_THRESHOLD;
    viewport.current = nextHeight;
    // Screen reserves chrome outside the native viewport. Composer growth is a
    // viewport resize, not a new message: preserve the end without animating;
    // readers in older turns keep their offset.
    if (previousHeight > 0 && nextHeight !== previousHeight && (following.current || wasAtEnd)) {
      following.current = true;
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, []);

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      const previous = lastHeight.current;
      const grew = height > previous + 0.5;
      const first = previous === 0;
      lastHeight.current = height;
      contentHeight.current = height;
      if (first) return;
      if (!grew) return;

      // A page landing above the reader: keep the turn they are on where it is.
      if (maintainStartPosition && pageOut.current) {
        pageOut.current = false;
        scrollRef.current?.scrollTo({ y: offset.current + (height - previous), animated: false });
        return;
      }
      pageOut.current = false;

      if (!autoFollow) return;
      if (followThreshold !== undefined && !following.current) {
        // Measured against the height BEFORE the growth: was the reader near
        // the bottom when this arrived?
        const fromBottom = previous - offset.current - viewport.current;
        if (fromBottom > followThreshold) {
          // Staying put moves no scroll, so a host tracking the distance to
          // the end from `onScroll` (a jump-to-latest button) would not hear
          // that the end moved away. Tell it, as `DocumentThread` does on every
          // growth.
          onScroll?.(syntheticScroll(offset.current, viewport.current, height));
          return;
        }
      }
      following.current = true;
      scrollRef.current?.scrollToEnd({ animated: followAnimated });
    },
    [autoFollow, followAnimated, followThreshold, maintainStartPosition, onScroll],
  );

  return (
    <ScreenScrollView
      ref={scrollRef}
      testID={testID}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
      onScroll={handleScroll}
      scrollEventThrottle={scrollEventThrottle}
      style={[{ minHeight: 0, width: '100%', flex: 1 }, style]}
      contentContainerStyle={{
        ...CHAT_CONTENT_STYLE,
        // react-native-web gives every view `min-height: 0`, so a growing
        // container would stay the viewport's height and overflow instead of
        // scrolling; a percentage floor keeps it bottom-anchored AND scrollable.
        ...(IS_WEB ? { minHeight: '100%', flexShrink: 0 } : { flexGrow: 1 }),
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 12,
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: THREAD_PAD_TOP,
        paddingBottom: 12,
      }}
    >
      {children}
    </ScreenScrollView>
  );
});

/** A scroll event for a position that did not change while the content did. */
function syntheticScroll(
  offset: number,
  viewport: number,
  content: number,
): NativeSyntheticEvent<NativeScrollEvent> {
  return {
    nativeEvent: {
      contentOffset: { x: 0, y: offset },
      layoutMeasurement: { width: 0, height: viewport },
      contentSize: { width: 0, height: content },
      contentInset: { top: 0, left: 0, bottom: 0, right: 0 },
      zoomScale: 1,
    },
  } as NativeSyntheticEvent<NativeScrollEvent>;
}
