import React, { memo } from 'react';
import { Image, Pressable, View } from 'react-native';

import { Button } from '../button';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import { RiListUnordered } from '../icons/remix/RiListUnordered';
import { RiUnpinLine } from '../icons/remix/RiUnpinLine';
import { Text } from '../typography';
import {
  CHAT_SCREEN_LABELS,
  clamp,
  formatPinTitle,
  MAX_PIN_SEGMENTS,
  useChatScreenPaint,
  useResolvedImageSource,
} from './shared';
import type { ChatPinnedMessage, PinnedMessageBarProps } from './types';

const BAR_HEIGHT = 52;
const ACCENT_BAR_HEIGHT = 32;
const SEGMENT_GAP = 2;

/**
 * The vertical accent rule: one segment per pin, the current one at full
 * strength and the rest washed out, so the bar says WHERE you are in the pins as
 * well as that there are some.
 *
 * Past {@link MAX_PIN_SEGMENTS} it draws a single solid rule instead. Nine
 * segments inside 32px are sub-pixel slivers — a progress indicator that cannot
 * be counted is decoration, and decoration that looks like information is worse
 * than none.
 */
function PinSegments({
  total,
  index,
  active,
  inactive,
  testID,
}: {
  total: number;
  index: number;
  active: string;
  inactive: string;
  testID?: string;
}) {
  const segments = total > MAX_PIN_SEGMENTS ? 1 : total;
  const height = (ACCENT_BAR_HEIGHT - SEGMENT_GAP * (segments - 1)) / segments;
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: 3, height: ACCENT_BAR_HEIGHT, gap: SEGMENT_GAP }}
      testID={testID}
    >
      {Array.from({ length: segments }, (_unused, i) => (
        <View
          key={i}
          testID={testID ? `${testID}-${i}` : undefined}
          style={{
            height,
            borderRadius: 2,
            backgroundColor: segments === 1 || i === index ? active : inactive,
          }}
        />
      ))}
    </View>
  );
}

function PinThumbnail({ source }: { source: ChatPinnedMessage['thumbnail'] }) {
  const paint = useChatScreenPaint();
  const resolved = useResolvedImageSource(source, 'thumb');
  if (!resolved) return null;
  return (
    <Image
      source={resolved}
      accessibilityIgnoresInvertColors
      style={{
        width: 32,
        height: 32,
        borderRadius: 6,
        backgroundColor: paint.surfaceSubtle,
      }}
    />
  );
}

/**
 * The strip under the header: which message is pinned, what it says, and a way
 * to jump to it.
 *
 * An empty `pins` renders NOTHING — a bar reading "Pinned message" over no pin
 * is a row of chrome claiming a state the conversation is not in.
 *
 * `index` is CLAMPED rather than trusted. The pins arrive from a list that can
 * shrink under the caller (someone unpins the one you were looking at), and a
 * bar that renders `undefined.preview` for one frame is a crash, not a state.
 */
function PinnedMessageBarComponent({
  pins,
  index = 0,
  onPressPin,
  onPressList,
  onDismiss,
  dismissIcon = 'close',
  formatTitle = formatPinTitle,
  listLabel = CHAT_SCREEN_LABELS.pinnedList,
  dismissLabel,
  accessibilityLabel,
  style,
  testID,
}: PinnedMessageBarProps) {
  const paint = useChatScreenPaint();
  if (pins.length === 0) return null;

  const safeIndex = clamp(Math.round(index), 0, pins.length - 1);
  const pin = pins[safeIndex] as ChatPinnedMessage;
  const title = formatTitle(safeIndex, pins.length);
  const preview = pin.author ? `${pin.author}: ${pin.preview}` : pin.preview;
  const resolvedDismissLabel =
    dismissLabel ??
    (dismissIcon === 'unpin' ? CHAT_SCREEN_LABELS.pinnedUnpin : CHAT_SCREEN_LABELS.pinnedClose);

  return (
    <View
      testID={testID}
      style={[
        {
          minHeight: BAR_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingLeft: 12,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: paint.surface,
          borderBottomWidth: 1,
          borderBottomColor: paint.border,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `${title}. ${preview}`}
        onPress={onPressPin ? () => onPressPin(pin, safeIndex) : undefined}
        disabled={!onPressPin}
        testID={testID ? `${testID}-jump` : undefined}
        style={{
          minWidth: 0,
          flexGrow: 1,
          flexShrink: 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <PinSegments
          total={pins.length}
          index={safeIndex}
          active={paint.accentColor}
          inactive={paint.accentTrack}
          testID={testID ? `${testID}-segment` : undefined}
        />
        <View style={{ minWidth: 0, flexGrow: 1, flexShrink: 1 }}>
          <Text
            variant="caption-1-semibold"
            numberOfLines={1}
            testID={testID ? `${testID}-title` : undefined}
            style={{ color: paint.accentColor }}
          >
            {title}
          </Text>
          <Text
            variant="body-2-regular"
            numberOfLines={1}
            testID={testID ? `${testID}-preview` : undefined}
            style={{ color: paint.textSecondary }}
          >
            {preview}
          </Text>
        </View>
        <PinThumbnail source={pin.thumbnail} />
      </Pressable>

      {onPressList ? (
        <Button
          variant="text"
          size="small"
          iconOnly
          // An ELEMENT: `variant="text"` paints a component icon in the ACCENT,
          // and two accent glyphs beside an accent title line is three things
          // competing for the same attention.
          icon={<RiListUnordered width={18} height={18} fill={paint.textSecondary} />}
          accessibilityLabel={listLabel}
          onPress={onPressList}
          testID={testID ? `${testID}-list` : undefined}
        />
      ) : null}
      {onDismiss ? (
        <Button
          variant="text"
          size="small"
          iconOnly
          icon={
            dismissIcon === 'unpin' ? (
              <RiUnpinLine width={18} height={18} fill={paint.textSecondary} />
            ) : (
              <RiCloseLine width={18} height={18} fill={paint.textSecondary} />
            )
          }
          accessibilityLabel={resolvedDismissLabel}
          onPress={onDismiss}
          testID={testID ? `${testID}-dismiss` : undefined}
        />
      ) : null}
    </View>
  );
}

export const PinnedMessageBar = memo(PinnedMessageBarComponent);
PinnedMessageBar.displayName = 'PinnedMessageBar';
