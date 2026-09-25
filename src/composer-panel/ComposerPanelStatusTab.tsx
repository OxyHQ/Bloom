import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { RiFolder2Line } from '../icons/remix/RiFolder2Line';
import { RiGitMergeLine } from '../icons/remix/RiGitMergeLine';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { resolveComposerPalette, TAB_HEIGHT, TAB_INSET, TAB_RADIUS, type ComposerPalette } from './shared';
import type { ComposerPanelStatusTabProps } from './types';

/** 16px circular context meter: r 6, 2.5 stroke, starting at 12 o'clock. */
export function ContextRing({ pct, palette }: { pct: number; palette: ComposerPalette }) {
  const r = 6;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={8} cy={8} r={r} fill="none" stroke={palette.ringTrack} strokeWidth={2.5} />
      <Circle
        cx={8}
        cy={8}
        r={r}
        fill="none"
        stroke={palette.ringArc}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={`${(clamped / 100) * c} ${c}`}
      />
    </Svg>
  );
}

function StatusItem({ icon, label, palette }: { icon: React.ReactNode; label: string; palette: ComposerPalette }) {
  return (
    <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {icon}
      <Text variant="body-2-medium" numberOfLines={1} style={{ flexShrink: 1, color: palette.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The status tab: the grey tab hanging off the Composer Panel's
 * top edge — at least 34 tall, inset 28 each side, radius 16 on the top corners only,
 * px 8 / py 4. Branch (mirrored merge glyph) and project folder on the left, 12
 * apart; the context meter on the right (py 4, pl 6 / pr 8, gap 4).
 */
function ComposerPanelStatusTabComponent({ branch, project, context, style, testID }: ComposerPanelStatusTabProps) {
  const theme = useTheme();
  const palette = useMemo(() => resolveComposerPalette(theme), [theme]);
  return (
    <View
      testID={testID}
      style={[
        {
          marginLeft: TAB_INSET,
          marginRight: TAB_INSET,
          minHeight: TAB_HEIGHT,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          borderTopLeftRadius: TAB_RADIUS,
          borderTopRightRadius: TAB_RADIUS,
          backgroundColor: palette.tab,
          paddingLeft: 8,
          paddingRight: 8,
          paddingTop: 4,
          paddingBottom: 4,
        },
        style,
      ]}>
      <View style={{ minWidth: 0, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {branch != null ? (
          <StatusItem
            palette={palette}
            label={branch}
            icon={
              <View style={{ transform: [{ scaleY: -1 }] }}>
                <RiGitMergeLine width={16} height={16} fill={palette.iconSecondary} />
              </View>
            }
          />
        ) : null}
        {project != null ? (
          <StatusItem
            palette={palette}
            label={project}
            icon={<RiFolder2Line width={16} height={16} fill={palette.iconSecondary} />}
          />
        ) : null}
      </View>
      {context != null ? (
        <View
          accessibilityLabel={`Context ${context}%`}
          style={{
            flexShrink: 0,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            borderRadius: 40,
            paddingTop: 4,
            paddingBottom: 4,
            paddingLeft: 6,
            paddingRight: 8,
          }}>
          <ContextRing pct={context} palette={palette} />
          <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
            {`${context}%`}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export const ComposerPanelStatusTab = memo(ComposerPanelStatusTabComponent);
