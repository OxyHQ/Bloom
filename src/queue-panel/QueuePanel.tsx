import React, { memo, useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo, ScrollView, View } from 'react-native';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiPlayListAddLine } from '../icons/remix/RiPlayListAddLine';
import { Tabs, TabsTrigger } from '../tabs';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { QueueIconButton } from './QueueIconButton';
import { QueuePanelRow, useQueuePanelCss } from './QueuePanelRow';
import { QueueReorderList } from './QueueReorderList';
import { RecentlyPlayedList } from './RecentlyPlayedList';
import { DEFAULT_QUEUE_PANEL_LABELS, IS_WEB, resolveQueuePanelPaint } from './shared';
import type { QueuePanelLabels, QueuePanelProps, QueuePanelTab } from './types';

/**
 * The play queue.
 *
 *   header    Queue / Recently played tabs · close button
 *   Now playing       the loaded track: accent title, now-playing bars
 *   Next in queue     tracks the listener added · "Clear queue"
 *   Next from: <ctx>  what follows from the playing album or playlist
 *
 * `panel` (web default): a rounded-8 surface of `width` (360) with a hairline,
 * in the menu surface colours, filling its parent's height. `sheet` (native
 * default): flat and full width, for the inside of a `BottomSheet`.
 *
 * Every list is a prop and every change is a callback — the panel reorders,
 * removes and clears nothing itself. Rows are 56 tall; see `QueueReorderList`
 * for the three ways a row moves.
 */

function SectionHeading({
  children,
  action,
  color,
}: {
  children: string;
  action?: React.ReactNode;
  color: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 32,
        paddingLeft: 8,
        paddingRight: 4,
        marginTop: 16,
        marginBottom: 4,
      }}
    >
      <Text role="heading" variant="headline-semibold" numberOfLines={1} style={{ flex: 1, color }}>
        {children}
      </Text>
      {action}
    </View>
  );
}

function QueuePanelComponent({
  nowPlaying,
  playing = true,
  queue = [],
  context = [],
  contextName,
  recentlyPlayed = [],
  tab: tabProp,
  defaultTab = 'queue',
  onTabChange,
  onReorder,
  onRemove,
  onPlay,
  onClearQueue,
  onClose,
  variant = IS_WEB ? 'panel' : 'sheet',
  width = 360,
  labels: labelsProp,
  style,
  testID,
}: QueuePanelProps) {
  const theme = useTheme();
  useQueuePanelCss();
  const paint = useMemo(() => resolveQueuePanelPaint(theme), [theme]);
  const labels: QueuePanelLabels = useMemo(
    () => ({ ...DEFAULT_QUEUE_PANEL_LABELS, ...labelsProp }),
    [labelsProp],
  );

  const [innerTab, setInnerTab] = useState<QueuePanelTab>(defaultTab);
  const tab = tabProp ?? innerTab;
  const selectTab = useCallback(
    (value: string) => {
      const next = value as QueuePanelTab;
      if (tabProp === undefined) setInnerTab(next);
      onTabChange?.(next);
    },
    [tabProp, onTabChange],
  );

  const [dragActive, setDragActive] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const announce = useCallback((message: string) => {
    if (IS_WEB) setAnnouncement(message);
    else AccessibilityInfo.announceForAccessibility(message);
  }, []);

  const playFromSection = useMemo(
    () => (onPlay ? (section: 'queue' | 'context', index: number, track: (typeof queue)[number]) => onPlay(section, index, track) : undefined),
    [onPlay],
  );

  const isPanel = variant === 'panel';
  const empty = !nowPlaying && queue.length === 0 && context.length === 0;

  return (
    <View
      testID={testID}
      style={[
        isPanel
          ? {
              width,
              maxWidth: '100%',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: paint.border,
              backgroundColor: paint.surface,
              overflow: 'hidden',
            }
          : { width: '100%' },
        { flexDirection: 'column', minHeight: 0 },
        style,
      ]}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 8,
          paddingLeft: 16,
          paddingRight: 8,
          gap: 8,
        }}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Tabs value={tab} onValueChange={selectTab} testID={testID ? `${testID}-tabs` : undefined}>
            <TabsTrigger value="queue" label={labels.queueTab} />
            <TabsTrigger value="recent" label={labels.recentTab} />
          </Tabs>
        </View>
        {onClose ? (
          <QueueIconButton
            icon={RiCloseLine}
            accessibilityLabel={labels.close}
            onPress={onClose}
            testID={testID ? `${testID}-close` : undefined}
          />
        ) : null}
      </View>

      <ScrollView
        style={{ flex: 1, minHeight: 0 }}
        contentContainerStyle={{ paddingLeft: 8, paddingRight: 8, paddingBottom: 16 }}
        scrollEnabled={!dragActive}
        testID={testID ? `${testID}-scroll` : undefined}
      >
        {tab === 'recent' ? (
          <RecentlyPlayedList
            items={recentlyPlayed}
            currentId={nowPlaying?.id}
            playing={playing}
            labels={labels}
            onPlay={onPlay ? (index, track) => onPlay('recent', index, track) : undefined}
            style={{ marginTop: 8 }}
            testID={testID ? `${testID}-recent` : undefined}
          />
        ) : empty ? (
          <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 24, paddingLeft: 16, paddingRight: 16, gap: 8 }}>
            <RiPlayListAddLine width={32} height={32} fill={paint.textSecondary} />
            <Text variant="headline-semibold" style={{ color: paint.text, textAlign: 'center' }}>
              {labels.emptyQueue}
            </Text>
            <Text variant="body-regular" style={{ color: paint.textSecondary, textAlign: 'center' }}>
              {labels.emptyQueueHint}
            </Text>
          </View>
        ) : (
          <>
            {nowPlaying ? (
              <>
                <SectionHeading color={paint.text}>{labels.nowPlaying}</SectionHeading>
                <QueuePanelRow
                  track={nowPlaying}
                  current
                  playing={playing}
                  accessibilityLabel={`${labels.play} ${nowPlaying.title}`}
                  onPress={onPlay ? () => onPlay('now', 0, nowPlaying) : undefined}
                  testID={testID ? `${testID}-now` : undefined}
                />
              </>
            ) : null}
            {queue.length > 0 ? (
              <>
                <SectionHeading
                  color={paint.text}
                  action={
                    onClearQueue ? (
                      <Button
                        variant="text"
                        size="small"
                        onPress={onClearQueue}
                        testID={testID ? `${testID}-clear` : undefined}
                      >
                        {labels.clearQueue}
                      </Button>
                    ) : undefined
                  }
                >
                  {labels.nextInQueue}
                </SectionHeading>
                <QueueReorderList
                  section="queue"
                  tracks={queue}
                  labels={labels}
                  onReorder={onReorder}
                  onRemove={onRemove}
                  onPlay={playFromSection}
                  onDragActiveChange={setDragActive}
                  onAnnounce={announce}
                  removeButton={isPanel}
                  testID={testID ? `${testID}-queue` : undefined}
                />
              </>
            ) : null}
            {context.length > 0 ? (
              <>
                <SectionHeading color={paint.text}>
                  {contextName ? labels.nextFrom(contextName) : labels.nextUp}
                </SectionHeading>
                <QueueReorderList
                  section="context"
                  tracks={context}
                  labels={labels}
                  onReorder={onReorder}
                  onRemove={onRemove}
                  onPlay={playFromSection}
                  onDragActiveChange={setDragActive}
                  onAnnounce={announce}
                  removeButton={isPanel}
                  testID={testID ? `${testID}-context` : undefined}
                />
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      {IS_WEB ? (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            overflow: 'hidden',
            opacity: 0,
          }}
          testID={testID ? `${testID}-announcer` : undefined}
        >
          <Text>{announcement}</Text>
        </View>
      ) : null}
    </View>
  );
}

export const QueuePanel = memo(QueuePanelComponent);
QueuePanel.displayName = 'QueuePanel';
