import { resolvePaintMode } from '../theme/paint';
import {
  Children,
  Fragment,
  isValidElement,
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  type ComponentType,
  type ReactNode,
} from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { BloomScope, useBloomAppearance } from '../appearance';
import { useBloomControlDensity } from '../appearance/context';

import { useThemeRecipe } from '../theme/use-theme-paint';
import { hairlineOn, useSurfaceFillRecipe } from '../styles/surface-levels';
import {
  BUTTON_RADIUS,
  BUTTON_SHADOW,
  buttonTouchVisualInset,
  resolveButtonGeometry,
  resolveCanonicalButtonPalette,
} from './shared';
import { useTouchInput } from '../styles/pointer';
import { useInteractiveWebCss } from '../styles/interactive-web-css';
import { ServerStyleSheet } from '../styles/ServerStyleSheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { moveSelection, SELECTION_FADE, SELECTION_SPRING } from '../motion/selection-motion';
import { surfacePresenceStyle, useEnteredPresence } from '../surface/use-surface-presence';
import { IS_WEB } from '../styles/platform';
import { LensButtonHost, splitLensStyle } from '../floating/lens/lens-button-host';
import { getNativeLens } from '../floating/lens/native-lens';
import { LensMaterialProvider, useControlMaterial } from '../floating/lens/lens-material';
import { useGroupSelection } from './use-group-selection';
import type { SurfaceProps } from '../surface/types';
import type { ButtonGroupProps } from './types';
import { ButtonGroupContext } from './context';

const TOUCH_PAINT_CSS = `
.bloom-surface.bloom-button-group-touch-paint::before,
.bloom-surface.bloom-button-group-touch-paint::after {
  inset-block: var(--bloom-button-group-visual-inset);
}
.bloom-surface.bloom-button-group-touch-paint::before { box-shadow: var(--bloom-button-group-shadow, none); }
`;

/** Separators resolve against the material actually published by the group. */
function Divider({ vertical, inset = 0 }: { vertical: boolean; inset?: number }) {
  const fill = useSurfaceFillRecipe();
  const recipe = useThemeRecipe(
    (theme, documentMode, documentPreset) =>
      hairlineOn(theme, resolvePaintMode(fill, documentMode, documentPreset)),
    [fill],
  );
  return (
    <>
      {recipe.sheet}
      <View
        style={
          vertical
            ? { height: 1, marginLeft: 8, marginRight: 8, backgroundColor: recipe.paint }
            : {
                width: 1,
                marginTop: 8 + inset,
                marginBottom: 8 + inset,
                backgroundColor: recipe.paint,
              }
        }
      />
    </>
  );
}

/**
 * GROUP_HOLDS_ITEMS: the group's view is never flattened away from its items.
 * Fabric flattens a view that forms no stacking context (a role and a label do
 * not form one) and mounts its children in the nearest one above: the
 * accessibility tree then held an empty "Back and forward" group beside two
 * loose buttons (Dropsea's toolbar on OxyOS; Android's TalkBack reads the same
 * mounted tree). `collapsable={false}` keeps the items the group's children.
 */

/** The group owns joining and inheritance; Button owns each actual control. */
export function createButtonGroup(Surface: ComponentType<SurfaceProps>) {
  const ButtonGroup = memo(function ButtonGroup({
    orientation = 'horizontal',
    size: sizeProp,
    dividers,
    separated = false,
    children,
    accessibilityLabel,
    material,
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
    const touch = useTouchInput();
    const density = useBloomControlDensity();
    useInteractiveWebCss('bloom-button-group-touch-paint', TOUCH_PAINT_CSS);
    const canonicalSize = sizeProp;
    const { size: scopedSize } = useBloomAppearance(
      { size: canonicalSize },
      { size: 'md', tone: 'neutral' },
    );
    const inheritedSize = scopedSize;
    const size = inheritedSize;
    const visualInset = buttonTouchVisualInset(
      resolveButtonGeometry(size, undefined, density, touch).height,
      touch,
    );
    const paintClass = visualInset ? 'bloom-button-group-touch-paint' : undefined;
    const paintStyle: WebCssStyle | undefined = visualInset
      ? {
          '--bloom-button-group-visual-inset': `${visualInset}px`,
          boxShadow: 'none',
          '--bloom-button-group-shadow': recipe.paint.shadow,
        }
      : undefined;
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
        {showDividers && index > 0 ? (
          <Divider vertical={orientation === 'vertical'} inset={visualInset} />
        ) : null}
        {item}
      </Fragment>
    ));
    // The group's one material: its own Surface, or, with `material="lens"` on a device that has the
    // native lens, the lens itself behind the items. The items draw their content either way.
    const regionMaterial = useControlMaterial();
    const lens = (material ?? regionMaterial) === 'lens' && getNativeLens() != null;
    const frame = (content: ReactNode) => {
      if (lens) {
        const split = splitLensStyle(style);
        return (
          <LensButtonHost radius={BUTTON_RADIUS} style={{ alignSelf: 'flex-start', ...split.host }}>
            <View
              role="group"
              accessibilityLabel={accessibilityLabel}
              // The group holds its items (GROUP_HOLDS_ITEMS).
              collapsable={false}
              testID={testID}
              style={[{ borderRadius: BUTTON_RADIUS, overflow: 'hidden' }, split.control]}
            >
              <LensMaterialProvider value="surface">{content}</LensMaterialProvider>
            </View>
          </LensButtonHost>
        );
      }
      return (
        <Surface
          radius={BUTTON_RADIUS}
          cornerCurve="round"
          className={paintClass}
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
            paintStyle,
            style,
          ]}
        >
          {content}
        </Surface>
      );
    };
    if (separated)
      return (
        <ButtonGroupContext.Provider value={context}>
          {recipe.sheet}
          {IS_WEB && <ServerStyleSheet id="bloom-button-group-touch-paint" css={TOUCH_PAINT_CSS} />}
          <BloomScope size={size}>
            {/* One pill: the group's own Surface paints the rim and shadow once, around the
                whole, and clips the first segment's start and the last one's end. The segments
                are flat tints with a hairline of the surface between them. */}
            {frame(
              <View
                testID={testID ? `${testID}-items` : undefined}
                style={{
                  flexDirection: orientation === 'vertical' ? 'column' : 'row',
                  alignItems: 'stretch',
                  gap: 2,
                  borderRadius: BUTTON_RADIUS,
                  overflow: 'hidden',
                }}
              >
                {items}
              </View>,
            )}
          </BloomScope>
        </ButtonGroupContext.Provider>
      );
    return (
      <ButtonGroupContext.Provider value={context}>
        {recipe.sheet}
        {IS_WEB && <ServerStyleSheet id="bloom-button-group-touch-paint" css={TOUCH_PAINT_CSS} />}
        <BloomScope size={size}>
          {frame(
            <View
              testID={testID ? `${testID}-items` : undefined}
              style={{
                flexDirection: orientation === 'vertical' ? 'column' : 'row',
                alignItems: 'stretch',
                padding: 0,
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
                    className={paintClass}
                    radius={BUTTON_RADIUS}
                    cornerCurve="round"
                    fill={
                      (selectionDisabled ? selectionPalette.disabled : selectionPalette.active)
                        .background
                    }
                    style={[
                      { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
                      visualInset
                        ? ({
                            '--bloom-button-group-visual-inset': `${visualInset}px`,
                            '--bloom-button-group-shadow': 'none',
                          } as WebCssStyle)
                        : undefined,
                    ]}
                  />
                </Animated.View>
              ) : null}
              {row}
            </View>,
          )}
        </BloomScope>
      </ButtonGroupContext.Provider>
    );
  });
  return ButtonGroup;
}
