import { Children, createContext, useContext, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { atoms as a, flatten } from '../styles';
import { Text } from '../typography';
import {
  ARROW_SIZE,
  BUBBLE_MAX_WIDTH,
  MIN_EDGE_SPACE,
} from './const';

type TooltipContextType = {
  position: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (open: boolean) => void;
};

const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom',
  visible: false,
  onVisibleChange: () => {},
});
TooltipContext.displayName = 'TooltipContext';

/**
 * No-op on web. Portal Provider is only needed on native.
 */
export function SheetCompatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
SheetCompatProvider.displayName = 'TooltipSheetCompatProvider';

export function Outer({
  children,
  position = 'bottom',
  visible,
  onVisibleChange,
}: {
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  visible: boolean;
  onVisibleChange: (visible: boolean) => void;
}) {
  const ctx = useMemo(
    () => ({ position, visible, onVisibleChange }),
    [position, visible, onVisibleChange],
  );

  return (
    <TooltipContext.Provider value={ctx}>
      {visible && (
        <Pressable
          style={webStyles.backdrop}
          onPress={() => onVisibleChange(false)}
          accessibilityRole="none"
        />
      )}
      {children}
    </TooltipContext.Provider>
  );
}

export function Target({ children }: { children: React.ReactNode }) {
  return (
    <View collapsable={false} style={a.relative}>
      {children}
    </View>
  );
}

export function Content({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  const theme = useTheme();
  const { position, visible } = useContext(TooltipContext);

  if (!visible) return null;

  const bubbleBg = theme.isDark
    ? theme.colors.backgroundSecondary
    : theme.colors.background;

  const shadowColor = theme.isDark
    ? 'rgba(0, 0, 0, 0.4)'
    : 'rgba(0, 0, 0, 0.2)';

  return (
    <View
      aria-label={label}
      role="alert"
      style={flatten([
        a.absolute,
        a.z_50,
        {
          left: '50%',
          transform: [{ translateX: '-50%' }],
          width: BUBBLE_MAX_WIDTH,
        },
        position === 'top'
          ? { bottom: '100%', marginBottom: ARROW_SIZE / 2 }
          : { top: '100%', marginTop: ARROW_SIZE / 2 },
      ])}>
      <View
        style={flatten([
          a.rounded_sm,
          a.overflow_hidden,
          {
            backgroundColor: bubbleBg,
            boxShadow: `0 0 24px ${shadowColor}`,
          },
        ])}>
        {/* Arrow */}
        <View
          style={[
            a.absolute,
            a.z_10,
            {
              backgroundColor: bubbleBg,
              width: ARROW_SIZE,
              height: ARROW_SIZE,
              left: '50%',
              transform: [{ translateX: '-50%' }, { rotate: '45deg' }],
              borderTopLeftRadius: a.rounded_2xs.borderRadius,
              borderBottomRightRadius: a.rounded_2xs.borderRadius,
              ...(position === 'top'
                ? { bottom: -(ARROW_SIZE / 2) }
                : { top: -(ARROW_SIZE / 2) }),
            },
          ]}
        />
        <View style={[a.px_md, a.py_sm, { maxWidth: BUBBLE_MAX_WIDTH }]}>
          {children}
        </View>
      </View>
    </View>
  );
}

export function TextBubble({ children }: { children: React.ReactNode }) {
  const c = Children.toArray(children);
  return (
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}>
        {c.map((child, i) => (
          <Text key={i} style={[a.text_sm, a.leading_snug]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  );
}

const webStyles = StyleSheet.create({
  backdrop: {
    position: 'fixed' as 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
  },
});
