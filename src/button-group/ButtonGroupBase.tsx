import React, {
  Children,
  createContext,
  Fragment,
  isValidElement,
  memo,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentType,
} from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BloomScope, useBloomAppearance } from '../appearance';

import { useTheme } from '../theme/use-theme';
import type { WebCssStyle } from '../styles/web-view-style';
import { hairlineOn, useSurfaceFill } from '../styles/surface-levels';
import { BUTTON_RADIUS, BUTTON_SHADOW, resolveCanonicalButtonPalette } from '../button/shared';
import { moveSelection, SELECTION_SPRING } from '../motion/selection-motion';
import { useGroupSelection } from './use-group-selection';
import type { ButtonProps } from '../button/types';
import type { SurfaceProps } from '../surface/types';
import type { ButtonGroupItemProps, ButtonGroupProps } from './types';

/** Separators resolve against the material actually published by the group. */
function Divider() {
  const theme = useTheme();
  const fill = useSurfaceFill();
  return (
    <View
      style={{ width: 1, marginTop: 8, marginBottom: 8, backgroundColor: hairlineOn(theme, fill) }}
    />
  );
}

/** The group owns joining and inheritance; Button owns each actual control. */
export function createButtonGroup(
  Button: ComponentType<ButtonProps>,
  Surface: ComponentType<SurfaceProps>,
) {
  const GroupContext = createContext<
    ({ size: 'sm' | 'md' } & ReturnType<typeof useGroupSelection>['registry']) | null
  >(null);
  const ButtonGroup = memo(function ButtonGroup({
    size: sizeProp,
    dividers,
    children,
    accessibilityLabel,
    style,
    testID,
  }: ButtonGroupProps) {
    const theme = useTheme();
    const canonicalSize = sizeProp;
    const { size: scopedSize } = useBloomAppearance(
      { size: canonicalSize },
      { size: 'md', tone: 'neutral' },
    );
    const inheritedSize = scopedSize;
    const size: 'sm' | 'md' = inheritedSize === 'xs' || inheritedSize === 'sm' ? 'sm' : 'md';
    const { registry, layout, disabled: selectionDisabled } = useGroupSelection();
    const context = useMemo(() => ({ size, ...registry }), [size, registry]);
    const x = useSharedValue(0);
    const y = useSharedValue(0);
    const width = useSharedValue(0);
    const height = useSharedValue(0);
    const opacity = useSharedValue(0);
    const initialized = useRef(false);
    useLayoutEffect(() => {
      if (!layout) {
        moveSelection(x, opacity, null);
        return;
      }
      const snap = !initialized.current || opacity.value === 0;
      initialized.current = true;
      y.value = snap ? layout.y : withSpring(layout.y, SELECTION_SPRING);
      width.value = snap ? layout.width : withSpring(layout.width, SELECTION_SPRING);
      height.value = snap ? layout.height : withSpring(layout.height, SELECTION_SPRING);
      moveSelection(x, opacity, layout.x);
    }, [layout, x, y, width, height, opacity]);
    const selectionStyle = useAnimatedStyle(
      () => ({
        width: width.value,
        height: height.value,
        opacity: opacity.value,
        transform: [{ translateX: x.value }, { translateY: y.value }],
      }),
      [x, y, width, height, opacity],
    );
    const selectionPalette = resolveCanonicalButtonPalette('outline', theme, 'neutral');
    const items = Children.toArray(children).filter(isValidElement);
    const showDividers = dividers ?? true;
    const row = items.map((item, index) => (
      <Fragment key={item.key ?? index}>
        {showDividers && index > 0 ? <Divider /> : null}
        {item}
      </Fragment>
    ));
    return (
      <GroupContext.Provider value={context}>
        <BloomScope size={size}>
          <Surface
            radius={BUTTON_RADIUS}
            cornerCurve="round"
            role="group"
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            style={[
              {
                alignSelf: 'flex-start',
                boxShadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
              },
              style,
            ]}
          >
            <View
              testID={testID ? `${testID}-items` : undefined}
              style={{
                flexDirection: 'row',
                alignItems: 'stretch',
                padding: 2,
                borderRadius: BUTTON_RADIUS,
                overflow: 'hidden',
              }}
            >
              {layout || initialized.current ? (
                <Animated.View
                  pointerEvents="none"
                  testID={testID ? `${testID}-selection` : undefined}
                  style={[{ position: 'absolute', left: 0, top: 0 }, selectionStyle]}
                >
                  <Surface
                    radius={BUTTON_RADIUS}
                    cornerCurve="round"
                    fill={
                      (selectionDisabled ? selectionPalette.disabled : selectionPalette.active)
                        .background
                    }
                    style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                  />
                </Animated.View>
              ) : null}
              {row}
            </View>
          </Surface>
        </BloomScope>
      </GroupContext.Provider>
    );
  });
  const ButtonGroupItem = memo(function ButtonGroupItem({
    onPress,
    onCheckedChange,
    checked: checkedProp,
    selected,
    size: sizeProp,
    iconOnly = false,
    disabled = false,
    style,
    hitSlop,
    ...props
  }: ButtonGroupItemProps) {
    const group = useContext(GroupContext);
    const id = useId();
    const register = group?.register;
    const unregister = group?.unregister;
    const measure = group?.measure;
    const canonicalSize = sizeProp;
    const { size: scopedSize } = useBloomAppearance(
      { size: canonicalSize },
      { size: 'md', tone: 'neutral' },
    );
    const inheritedDensity = scopedSize;
    const rawSize = canonicalSize ?? group?.size ?? inheritedDensity;
    const size = rawSize === 'xs' || rawSize === 'sm' ? 'sm' : 'md';
    const height = size === 'sm' ? 30 : 34;
    const checked = checkedProp ?? selected;
    useLayoutEffect(() => {
      register?.(id, Boolean(checked), disabled);
    }, [register, id, checked, disabled]);
    useLayoutEffect(() => () => unregister?.(id), [unregister, id]);
    const onLayout = useCallback<NonNullable<ButtonProps['onLayout']>>(
      (event) => {
        measure?.(id, event.nativeEvent.layout);
      },
      [measure, id],
    );
    const itemStyle: WebCssStyle = {
      height,
      minWidth: iconOnly ? height : undefined,
      width: iconOnly ? height : undefined,
      borderWidth: 0,
      borderRadius: BUTTON_RADIUS,
      boxShadow: 'none',
      paddingLeft: iconOnly ? 0 : 8,
      paddingRight: iconOnly ? 0 : 8,
      gap: 4,
      ...(group?.moving && checked ? { backgroundColor: 'transparent' } : {}),
      ...(Platform.OS === 'web' ? { outlineOffset: -2 } : {}),
    };
    return (
      <Button
        {...props}
        onLayout={group ? onLayout : undefined}
        appearance={checked && !group?.moving ? 'outline' : 'plain'}
        tone="neutral"
        size={size}
        iconOnly={iconOnly}
        pressed={checked}
        disabled={disabled}
        hitSlop={
          typeof hitSlop === 'object'
            ? { top: 0, bottom: 0, left: 0, right: 0, ...hitSlop }
            : (hitSlop ?? 0)
        }
        onPress={(event) => {
          if (disabled) return;
          onCheckedChange?.(!checked);
          onPress?.(event);
        }}
        style={[itemStyle, style]}
      />
    );
  });
  return { ButtonGroup, ButtonGroupItem };
}
