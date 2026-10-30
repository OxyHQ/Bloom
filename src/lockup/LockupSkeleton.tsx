import { memo } from 'react';
import { View } from 'react-native';

import { useCommonMessages } from '../locale/common-messages';
import { useShelfCell } from '../media-shelf/use-shelf-cell';
import * as Skeleton from '../skeleton';
import { hairlineOn, useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { LOCKUP_METRICS } from './shared';
import type { LockupSkeletonProps } from './types';

/**
 * A `Lockup` that is still loading: the same icon box, a bar per text line at
 * that line's height, and the action's pill, from the same metrics, so nothing
 * moves when the real one swaps in.
 *
 * Semantics: one `aria-busy` group named "Loading"; the shapes are decoration.
 */
function LockupSkeletonComponent({
  size = 'md',
  caption = false,
  action = true,
  divider: dividerProp,
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
}: LockupSkeletonProps) {
  const common = useCommonMessages();
  const theme = useTheme();
  const fill = useSurfaceFill();
  const cell = useShelfCell();
  const metrics = LOCKUP_METRICS[size];
  const large = size === 'lg';
  const divider = dividerProp ?? (cell && cell.rows > 1 ? !cell.lastInColumn : false);
  const [titleLine, subtitleLine, captionLine] = metrics.lineHeights;
  const pill = <Skeleton.Box width={large ? 88 : 64} height={28} borderRadius={14} />;

  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabelProp ?? common.loading}
      aria-busy
      accessibilityState={{ busy: true }}
      style={[
        {
          flexDirection: 'row',
          alignItems: large ? 'flex-start' : 'center',
          gap: metrics.gap,
          paddingTop: metrics.padding,
          paddingBottom: metrics.padding,
        },
        style,
      ]}
      testID={testID}
    >
      <Skeleton.Box
        width={metrics.icon}
        height={metrics.icon}
        borderRadius={Math.round(metrics.icon * 0.225)}
      />
      <View style={{ flex: 1, minWidth: 0, gap: large ? 4 : 1 }}>
        <View style={{ width: '70%' }}>
          <Skeleton.Text style={{ lineHeight: titleLine }} />
        </View>
        <View style={{ width: '50%' }}>
          <Skeleton.Text style={{ lineHeight: subtitleLine }} />
        </View>
        {caption ? (
          <View style={{ width: '35%' }}>
            <Skeleton.Text style={{ lineHeight: captionLine }} />
          </View>
        ) : null}
        {large && action ? <View style={{ marginTop: 8 }}>{pill}</View> : null}
      </View>
      {!large && action ? pill : null}
      {divider ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            insetInlineStart: metrics.icon + metrics.gap,
            insetInlineEnd: 0,
            height: 1,
            backgroundColor: hairlineOn(theme, fill),
          }}
        />
      ) : null}
    </View>
  );
}

export const LockupSkeleton = memo(LockupSkeletonComponent);
LockupSkeleton.displayName = 'LockupSkeleton';
