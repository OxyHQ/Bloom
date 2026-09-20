import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, TextInput, View, type TextStyle, type ViewStyle } from 'react-native';

import { Button } from '../button';
import { resolveButtonRamps } from '../button/shared';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import {
  STAY_SEARCH_BAR_HEIGHT,
  STAY_SEARCH_BUTTON_INSET,
  STAY_SEARCH_PANEL_OFFSET,
  STAY_SEARCH_SEPARATOR_HEIGHT,
} from '../stay-search/constants';
import { useStaySearchPalette } from '../stay-search/palette';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { borderRadius } from '../styles/tokens';
import type { WebCssStyle } from '../styles/web-view-style';
import { Z_INDEX } from '../styles/z-index';
import { webDataSet } from '../styles/web-data';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import type { HomeSearchBarProps, HomeSearchSegment } from './types';

/**
 * Bloom's wide housing search: one full pill split into any segments — the
 * shared implementation behind every mode's bar (`StaySearchBar` is its stays
 * preset).
 *
 * At rest the bar is the card surface with a hairline and a soft shadow;
 * hovering a segment fills it (a colour change only). While a segment is open
 * the bar behind turns neutral, the open segment becomes a raised card-coloured
 * pill, and the round search button in the LAST segment widens to show its
 * label. The hairline separators between segments hide next to a hovered or
 * open segment, so a filled pill never has a line poking out of its edge.
 *
 * Fully controlled: the app owns `activeSegment` and every value (pre-formatted
 * strings). `panel` drops under the bar while a segment is open, aligned under
 * it. With `onQueryChange`, the open FIRST segment is a focused text field.
 */

const IS_WEB = Platform.OS === 'web';

/** React Native's `Role` has no `search`; react-native-web passes it through. */
const WEB_SEARCH_ROLE: Record<string, unknown> = IS_WEB ? { role: 'search' } : {};

const STYLE_ID = 'bloom-stay-search-bar-web-css';
const HOME_SEARCH_BAR_CSS = `
[data-bloom-stay-segment] {
  transition: background-color 150ms ease, box-shadow 150ms ease;
}
[data-bloom-stay-separator] {
  transition: background-color 150ms ease;
}
[data-bloom-stay-segment-hit] {
  outline: none;
}
[data-bloom-stay-segment-hit]:focus-visible {
  box-shadow: inset 0 0 0 2px var(--bloom-stay-search-ring, currentColor);
}
@media (prefers-reduced-motion: reduce) {
  [data-bloom-stay-segment], [data-bloom-stay-separator] {
    transition: none;
  }
}
`;

/** body-regular in Bloom's sans face, no box of its own, so it sits exactly where the value text did. */
const INPUT_TYPE = TYPE_SCALE['body-regular'];
const inputStyle: TextStyle = {
  fontFamily: SANS_FONT_FAMILY,
  fontSize: INPUT_TYPE.fontSize,
  lineHeight: INPUT_TYPE.lineHeight,
  fontWeight: INPUT_TYPE.fontWeight,
  height: INPUT_TYPE.lineHeight,
  paddingTop: 0,
  paddingBottom: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderWidth: 0,
  minWidth: 0,
  // The segment's raised pill is the focus affordance; the browser's input
  // outline would draw a rectangle inside it. Web-only keys RN does not type.
  ...(IS_WEB ? ({ outlineWidth: 0, outlineStyle: 'none' } as unknown as TextStyle) : {}),
};

const ALIGN: Record<NonNullable<HomeSearchSegment['panelAlign']>, ViewStyle['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

/** Where a segment's panel aligns: its own `panelAlign`, else by position. Pure; exported for the tests. */
export function segmentPanelAlign(
  segments: readonly Pick<HomeSearchSegment, 'panelAlign'>[],
  index: number,
): NonNullable<HomeSearchSegment['panelAlign']> {
  const own = segments[index]?.panelAlign;
  if (own) return own;
  if (index <= 0) return 'start';
  if (index >= segments.length - 1) return 'end';
  return 'center';
}

export function HomeSearchBar<K extends string = string>({
  segments,
  activeSegment,
  onActiveSegmentChange,
  onSearch,
  searchLabel = 'Search',
  query,
  onQueryChange,
  panel,
  dismissible = true,
  style,
  testID,
}: HomeSearchBarProps<K>) {
  const theme = useTheme();
  const palette = useStaySearchPalette();
  const { accent } = useMemo(() => resolveButtonRamps(theme), [theme]);
  const [barWidth, setBarWidth] = useState<number | null>(null);
  const compact = barWidth !== null && barWidth < 640;
  const [hovered, setHovered] = useState<K | null>(null);
  const rootRef = useRef<View>(null);
  const open = activeSegment !== null;
  const lastIndex = segments.length - 1;

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, HOME_SEARCH_BAR_CSS);
  }, []);

  // Dismissal on web: Escape, or a press that lands outside the bar AND its
  // panel (the panel is a descendant of the root, so one `contains` covers both).
  useEffect(() => {
    if (!open || !dismissible || !IS_WEB || typeof document === 'undefined') return;
    const onPointerDown = (event: PointerEvent) => {
      const node = rootRef.current as unknown as Node | null;
      const target = event.target as Node | null;
      if (node && target && node.contains(target)) return;
      onActiveSegmentChange(null);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onActiveSegmentChange(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, dismissible, onActiveSegmentChange]);

  const lit = useCallback(
    (key: K | undefined) => key !== undefined && (key === activeSegment || key === hovered),
    [activeSegment, hovered],
  );

  const activeIndex = open ? segments.findIndex((s) => s.key === activeSegment) : -1;

  const barStyle: WebCssStyle = {
    height: STAY_SEARCH_BAR_HEIGHT,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: open ? palette.barSurfaceOpen : palette.barSurface,
    boxShadow: palette.barShadow,
    flexDirection: 'row',
    alignItems: 'stretch',
    '--bloom-stay-search-ring': accent[500],
  };

  return (
    <View
      ref={rootRef}
      onLayout={(event) => setBarWidth(event.nativeEvent.layout.width)}
      testID={testID}
      // react-native-web gives every View `z-index: 0`, so the root is its own
      // stacking context: the panel's z-index only competes INSIDE it. Lift the
      // whole root while open, or content after the bar paints over the panel.
      style={[{ position: 'relative', zIndex: open ? Z_INDEX.dropdown : Z_INDEX.base }, style]}
    >
      <View {...WEB_SEARCH_ROLE} style={barStyle}>
        {segments.map((segment, index) => {
          const { key, label, value, placeholder } = segment;
          const active = key === activeSegment;
          const isHovered = key === hovered;
          const isLast = index === lastIndex;
          const showInput = active && index === 0 && onQueryChange != null;
          const background = active
            ? palette.segmentActive
            : isHovered
              ? open
                ? palette.segmentHoverOpen
                : palette.segmentHover
              : 'transparent';
          const segmentTestID = testID ? `${testID}-${key}` : undefined;

          const text = (
            <>
              <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: palette.text }}>
                {label}
              </Text>
              {showInput ? (
                <TextInput
                  autoFocus
                  value={query ?? ''}
                  onChangeText={onQueryChange}
                  placeholder={value || placeholder}
                  placeholderTextColor={palette.placeholder}
                  accessibilityLabel={label}
                  testID={testID ? `${testID}-${key}-input` : undefined}
                  style={[inputStyle, { color: palette.text }]}
                />
              ) : (
                <Text
                  variant="body-regular"
                  numberOfLines={1}
                  style={{ color: value ? palette.text : palette.placeholder }}
                >
                  {value || placeholder}
                </Text>
              )}
            </>
          );

          const hitStyle: ViewStyle = {
            flex: 1,
            minWidth: 0,
            alignSelf: 'stretch',
            justifyContent: 'center',
            paddingLeft: compact ? 12 : index === 0 ? 32 : 24,
            paddingRight: compact ? 4 : isLast ? 8 : 16,
            borderRadius: borderRadius.full,
          };

          return (
            <Fragment key={key}>
              {index > 0 ? (
                <View style={{ width: 0, alignSelf: 'center', zIndex: Z_INDEX.raised }}>
                  <View
                    {...webDataSet({ bloomStaySeparator: '' })}
                    testID={testID ? `${testID}-separator-${index}` : undefined}
                    style={{
                      position: 'absolute',
                      left: -0.5,
                      top: -STAY_SEARCH_SEPARATOR_HEIGHT / 2,
                      width: 1,
                      height: STAY_SEARCH_SEPARATOR_HEIGHT,
                      backgroundColor:
                        lit(segments[index - 1]?.key) || lit(key) ? 'transparent' : palette.separator,
                    }}
                  />
                </View>
              ) : null}
              <View
                {...webDataSet({ bloomStaySegment: active ? 'active' : '' })}
                style={{
                  flex: segment.flex ?? 1,
                  minWidth: 0,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: borderRadius.full,
                  backgroundColor: background,
                  boxShadow: active ? palette.segmentActiveShadow : undefined,
                }}
              >
                {showInput ? (
                  <View testID={segmentTestID} style={hitStyle}>
                    {text}
                  </View>
                ) : (
                  <Pressable
                    {...webDataSet({ bloomStaySegmentHit: '' })}
                    testID={segmentTestID}
                    onPress={() => onActiveSegmentChange(key)}
                    onHoverIn={() => setHovered(key)}
                    onHoverOut={() => setHovered((h) => (h === key ? null : h))}
                    accessibilityRole="button"
                    accessibilityLabel={`${label}, ${value || placeholder}`}
                    accessibilityState={{ expanded: active }}
                    aria-expanded={active}
                    style={hitStyle}
                  >
                    {text}
                  </Pressable>
                )}
                {isLast ? (
                  <Button
                    variant="primary"
                    size="large"
                    icon={RiSearchLine}
                    iconOnly={!open || compact}
                    onPress={onSearch}
                    accessibilityLabel={searchLabel}
                    testID={testID ? `${testID}-search` : undefined}
                    style={{ marginRight: STAY_SEARCH_BUTTON_INSET - 1, flexShrink: 0 }}
                  >
                    {open && !compact ? searchLabel : undefined}
                  </Button>
                ) : null}
              </View>
            </Fragment>
          );
        })}
      </View>
      {open && panel != null && activeIndex >= 0 ? (
        <View
          pointerEvents="box-none"
          testID={testID ? `${testID}-panel` : undefined}
          style={{
            position: 'absolute',
            top: STAY_SEARCH_BAR_HEIGHT + STAY_SEARCH_PANEL_OFFSET,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: ALIGN[segmentPanelAlign(segments, activeIndex)],
            zIndex: Z_INDEX.dropdown,
          }}
        >
          {panel}
        </View>
      ) : null}
    </View>
  );
}

HomeSearchBar.displayName = 'HomeSearchBar';
