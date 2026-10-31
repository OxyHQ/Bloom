import { resolvePaintMode } from '../theme/paint';
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

import { useThemeRecipe } from '../theme/use-theme-paint';
import type { WebCssStyle } from '../styles/web-view-style';
import { hairlineOn, useSurfaceFillRecipe } from '../styles/surface-levels';
import { BUTTON_RADIUS, BUTTON_SHADOW, resolveCanonicalButtonPalette } from '../button/shared';
import { moveSelection, SELECTION_FADE, SELECTION_SPRING } from '../motion/selection-motion';
import { surfacePresenceStyle, useEnteredPresence } from '../surface/use-surface-presence';
import { IS_WEB } from '../styles/platform';
import { useGroupSelection } from './use-group-selection';
import type { ButtonProps } from '../button/types';
import type { SurfaceProps } from '../surface/types';
import type { ButtonGroupItemProps, ButtonGroupProps } from './types';

/** Separators resolve against the material actually published by the group. */
function Divider() {
  const fill = useSurfaceFillRecipe();
  const recipe = useThemeRecipe(
    (theme, documentMode, documentPreset) =>
      hairlineOn(theme, resolvePaintMode(fill, documentMode, documentPreset)),
    [fill],
  );
  return (
    <>
      {recipe.sheet}
      <View style={{ width: 1, marginTop: 8, marginBottom: 8, backgroundColor: recipe.paint }} />
    </>
  );
}

/**
 * GROUP_HOLDS_ITEMS: the group's view is never flattened away from its items.
 * Fabric flattens a view that forms no stacking context (a role and a label do
 * not form one) and mounts its children in the nearest one above: the
 * accessibility tree then held an empty "Back and forward" group beside two
 * loose buttons (Stash's toolbar on OxyOS; Android's TalkBack reads the same
 * mounted tree). `collapsable={false}` keeps the items the group's children.
 */

/** The group owns joining and inheritance; Button owns each actual control. */
export function createButtonGroup(
  Button: ComponentType<ButtonProps>,
  Surface: ComponentType<SurfaceProps>,
) {
  const GroupContext = createContext<
    | ({ size: 'xs' | 'sm' | 'md'; separated: boolean } & ReturnType<
        typeof useGroupSelection
      >['registry'])
    | null
  >(null);
  const ButtonGroup = memo(function ButtonGroup({
    size: sizeProp,
    dividers,
    separated = false,
    children,
    accessibilityLabel,
    style,
    testID,
  }: ButtonGroupProps) {
    const recipe = useThemeRecipe(
      (theme) => ({
        selection: resolveCanonicalButtonPalette('outline', theme, 'neutral'),
        shadow: BUTTON_SHADOW[theme.isDark ? 'dark' : 'light'],
      }),
      [],
    );
    const canonicalSize = sizeProp;
    const { size: scopedSize } = useBloomAppearance(
      { size: canonicalSize },
      { size: 'md', tone: 'neutral' },
    );
    const inheritedSize = scopedSize;
    const size: 'xs' | 'sm' | 'md' =
      inheritedSize === 'xs' ? 'xs' : inheritedSize === 'sm' ? 'sm' : 'md';
    const { registry, layout, disabled: selectionDisabled } = useGroupSelection();
    const context = useMemo(() => ({ size, separated, ...registry }), [size, separated, registry]);
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
    // The selection is a Surface: on the web it fades through its presence,
    // never an opacity on the wrapper above its material.
    const selectionStyle = useAnimatedStyle(
      () => ({
        width: width.value,
        height: height.value,
        ...(IS_WEB ? null : { opacity: opacity.value }),
        transform: [{ translateX: x.value }, { translateY: y.value }],
      }),
      [x, y, width, height, opacity],
    );
    const selectionPresence = useEnteredPresence(!!layout, !!layout || initialized.current) ? 1 : 0;
    const selectionPalette = recipe.paint.selection;
    const items = Children.toArray(children).filter(isValidElement);
    const showDividers = dividers ?? true;
    const row = items.map((item, index) => (
      <Fragment key={item.key ?? index}>
        {showDividers && index > 0 ? <Divider /> : null}
        {item}
      </Fragment>
    ));
    if (separated)
      return (
        <GroupContext.Provider value={context}>
          {recipe.sheet}
          <BloomScope size={size}>
            {/* One pill: the group's own Surface paints the rim and shadow once, around the
                whole, and clips the first segment's start and the last one's end. The segments
                are flat tints with a hairline of the surface between them. */}
            <Surface
              radius={BUTTON_RADIUS}
              cornerCurve="round"
              role="group"
              accessibilityLabel={accessibilityLabel}
              // The group holds its items (GROUP_HOLDS_ITEMS).
              collapsable={false}
              testID={testID}
              style={[
                {
                  alignSelf: 'flex-start',
                  boxShadow: recipe.paint.shadow,
                },
                style,
              ]}
            >
              <View
                testID={testID ? `${testID}-items` : undefined}
                style={{
                  flexDirection: 'row',
                  alignItems: 'stretch',
                  gap: 2,
                  borderRadius: BUTTON_RADIUS,
                  overflow: 'hidden',
                }}
              >
                {items}
              </View>
            </Surface>
          </BloomScope>
        </GroupContext.Provider>
      );
    return (
      <GroupContext.Provider value={context}>
        {recipe.sheet}
        <BloomScope size={size}>
          <Surface
            radius={BUTTON_RADIUS}
            cornerCurve="round"
            role="group"
            accessibilityLabel={accessibilityLabel}
            // The group holds its items (GROUP_HOLDS_ITEMS).
            collapsable={false}
            testID={testID}
            style={[
              {
                alignSelf: 'flex-start',
                boxShadow: recipe.paint.shadow,
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
                  style={[
                    { position: 'absolute', left: 0, top: 0 },
                    selectionStyle,
                    IS_WEB
                      ? surfacePresenceStyle(selectionPresence, SELECTION_FADE.duration)
                      : null,
                  ]}
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
    const size = rawSize === 'xs' ? 'xs' : rawSize === 'sm' ? 'sm' : 'md';
    const height = size === 'xs' ? 24 : size === 'sm' ? 30 : 34;
    const pill = Boolean(group?.separated) && iconOnly;
    const width = pill ? Math.round(height * 1.5) : height;
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
      // Joined, an icon item is a square cell of the group. Separated, it stands alone, and a
      // circle is not a pill: it is wider than it is tall (`Button wide`).
      minWidth: iconOnly ? width : undefined,
      width: iconOnly ? width : undefined,
      borderWidth: 0,
      // Separated, the group's pill rounds the ends and every item is a straight segment.
      borderRadius: group?.separated ? 0 : BUTTON_RADIUS,
      ...(group?.separated ? { '--bloom-btn-radius': '0px' } : null),
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
        appearance={group?.separated ? (checked ? 'outline' : 'subtle') : 'outline'}
        tone="neutral"
        size={size}
        iconOnly={iconOnly}
        wide={pill}
        material={
          group?.separated ? 'flat' : group && !(checked && !group.moving) ? 'shared' : undefined
        }
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
