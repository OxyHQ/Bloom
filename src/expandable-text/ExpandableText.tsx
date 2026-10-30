import { memo, useCallback, useEffect, useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { useIsRtl } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { IS_WEB } from '../styles/platform';
import { useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type { ExpandableTextProps } from './types';

const STYLE_ID = 'bloom-expandable-text-web-css';
/** How far the fade before the inline "more" reaches into the text. */
const FADE = 32;
const CSS = `
[data-bloom-expandable-more] {
  background-color: transparent;
  background-image: linear-gradient(to right, transparent, var(--bloom-expandable-fill) ${FADE}px);
}
[data-bloom-expandable-more][data-bloom-expandable-rtl] {
  background-image: linear-gradient(to left, transparent, var(--bloom-expandable-fill) ${FADE}px);
}
`;

/**
 * Text clamped to `numberOfLines`, with a control to read the rest.
 *
 * Whether the text IS clamped is measured, never guessed from its length: an
 * invisible, unclamped copy is laid out behind the text and the two heights
 * compared, identically on web and native. The control is drawn only when
 * something is hidden.
 *
 * - `below`: a "Show more" / "Show less" link under the text, underlined, in
 *   the reading colour.
 * - `inline`: "More" in the accent at the end of the last visible line, over a
 *   32px fade of the text into the actual backing (web; native backs it with
 *   that fill). Pressed, the whole text shows and the control goes: what was
 *   opened stays open.
 *
 * The toggle carries `aria-expanded` (web) and `accessibilityState.expanded`
 * (native); `expanded` / `onExpandedChange` control it. The invisible copy is
 * hidden from assistive technology, which reads the whole text either way.
 */
function ExpandableTextComponent({
  children,
  numberOfLines = 3,
  toggle = 'below',
  variant = 'body-regular',
  color,
  expanded: expandedProp,
  defaultExpanded = false,
  onExpandedChange,
  moreLabel: moreLabelProp,
  lessLabel: lessLabelProp,
  style,
  textStyle,
  testID,
  toggleTestID,
}: ExpandableTextProps) {
  const common = useCommonMessages();
  const theme = useTheme();
  const fill = useSurfaceFill();
  const rtl = useIsRtl();
  const inline = toggle === 'inline';
  const moreLabel = moreLabelProp ?? (inline ? common.more : common.showMore);
  const lessLabel = lessLabelProp ?? common.showLess;
  const [expanded, setExpanded] = useControllableState({
    value: expandedProp,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });
  useEffect(() => {
    if (inline) adoptStyleSheet(STYLE_ID, CSS);
  }, [inline]);

  const clamps = numberOfLines > 0;
  const [clampedHeight, setClampedHeight] = useState(0);
  const [fullHeight, setFullHeight] = useState(0);
  const onClampedLayout = useCallback(
    (event: LayoutChangeEvent) => {
      // Only the collapsed height says whether the text is clamped.
      if (!expanded) setClampedHeight(Math.round(event.nativeEvent.layout.height));
    },
    [expanded],
  );
  const onFullLayout = useCallback((event: LayoutChangeEvent) => {
    setFullHeight(Math.round(event.nativeEvent.layout.height));
  }, []);
  const truncatable = clamps && clampedHeight > 0 && fullHeight > clampedHeight + 1;
  const toggleID = toggleTestID ?? (testID ? `${testID}-toggle` : undefined);
  const textColor = color ?? theme.colors.text;

  const inlineMore =
    inline && truncatable && !expanded ? (
      <View
        {...webDataSet(
          rtl ? { bloomExpandableMore: '', bloomExpandableRtl: '' } : { bloomExpandableMore: '' },
        )}
        style={
          {
            position: 'absolute',
            bottom: 0,
            insetInlineEnd: 0,
            // One line tall and centred on the last line: the button's own
            // height reaches past it without covering the line above.
            height: TYPE_SCALE[variant].lineHeight,
            justifyContent: 'center',
            overflow: 'visible',
            paddingInlineStart: IS_WEB ? FADE : 8,
            backgroundColor: IS_WEB ? undefined : fill,
            '--bloom-expandable-fill': fill,
          } as WebCssStyle
        }
      >
        <Button
          appearance="plain"
          linkTone="primary"
          textVariant={variant}
          accessibilityLabel={moreLabel}
          aria-expanded={false}
          onPress={() => setExpanded(true)}
          testID={toggleID}
        >
          {moreLabel}
        </Button>
      </View>
    ) : null;

  return (
    <View style={[{ gap: 8 }, style]}>
      <View style={{ overflow: 'hidden' }}>
        <Text
          variant={variant}
          numberOfLines={clamps && !expanded ? numberOfLines : undefined}
          onLayout={onClampedLayout}
          style={[{ color: textColor }, textStyle]}
          testID={testID}
        >
          {children}
        </Text>
        {clamps ? (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            {...(IS_WEB ? { 'aria-hidden': true } : null)}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 }}
          >
            <Text
              variant={variant}
              onLayout={onFullLayout}
              style={textStyle}
              testID={testID ? `${testID}-measure` : undefined}
            >
              {children}
            </Text>
          </View>
        ) : null}
        {inlineMore}
      </View>
      {!inline && truncatable ? (
        <Button
          appearance="plain"
          linkTone="text"
          underline="rest"
          textVariant="body-semibold"
          accessibilityLabel={expanded ? lessLabel : moreLabel}
          aria-expanded={expanded}
          onPress={() => setExpanded(!expanded)}
          style={{ alignSelf: 'flex-start' }}
          testID={toggleID}
        >
          {expanded ? lessLabel : moreLabel}
        </Button>
      ) : null}
    </View>
  );
}

export const ExpandableText = memo(ExpandableTextComponent);
ExpandableText.displayName = 'ExpandableText';
