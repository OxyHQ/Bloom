import React, { memo } from 'react';
import { View } from 'react-native';

import { ScrollArea } from '../layout/ScrollArea';
import { PressableScale } from '../pressable-scale';
import { IS_WEB } from '../styles/platform';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { hairlineOn, useRingOffsetStyle, useSurfaceFill } from '../styles/surface-levels';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { FactStripItem, FactStripProps } from './types';

const STYLE_ID = 'bloom-fact-strip-web-css';
const FACT_CSS = interactiveWebCss({
  selector: '[data-bloom-fact]',
  varPrefix: 'bloom-fact',
  reset: 'none',
  transition: 'opacity 120ms ease',
  outlineOffset: -2,
});

/** The separator's height: centred on the value, shorter than the fact. */
const SEPARATOR_HEIGHT = 36;

/**
 * The strip of facts under a product's header: equal columns, each a small
 * label over a large value over a caption, with a hairline between them.
 *
 *   label     caption-1-semibold, text-secondary
 *   value     title-2-bold, text-secondary (a fact, not a heading)
 *   caption   caption-1-regular, text-secondary
 *   column    ≥ `minItemWidth` (96), centred, py 12 · px 8
 *   divider   1 × 36, the hairline of the actual backing
 *
 * The facts share the width while they fit and keep `minItemWidth` once they
 * do not, when the strip scrolls sideways on the shared `ScrollArea` (one
 * overlay bar on web, the system's on native) — a row of facts never wraps
 * into a ragged block.
 *
 * Semantics: a list; each fact is one list item (or a button, with `onPress`)
 * named by the text it contains unless it says otherwise, so the label, value
 * and caption are heard as one fact.
 */
function FactStripComponent({
  items,
  minItemWidth = 96,
  contentInset = 0,
  accessibilityLabel,
  style,
  testID,
}: FactStripProps) {
  useInteractiveWebCss(STYLE_ID, FACT_CSS);
  const theme = useTheme();
  const fill = useSurfaceFill();
  const hairline = hairlineOn(theme, fill);
  const trackStyle: WebCssStyle = { marginLeft: -contentInset, marginRight: -contentInset };

  return (
    <ScrollArea
      horizontal
      role="list"
      accessibilityLabel={accessibilityLabel}
      style={[trackStyle, style]}
      contentContainerStyle={{
        flexGrow: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: contentInset,
        paddingRight: contentInset,
      }}
      testID={testID}
    >
      {items.map((item, index) => (
        <React.Fragment key={item.key}>
          {index > 0 ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              {...(IS_WEB ? { 'aria-hidden': true } : null)}
              style={{ width: 1, height: SEPARATOR_HEIGHT, backgroundColor: hairline }}
            />
          ) : null}
          <Fact
            item={item}
            minWidth={minItemWidth}
            testID={testID ? `${testID}-${item.key}` : undefined}
          />
        </React.Fragment>
      ))}
    </ScrollArea>
  );
}

function Fact({
  item,
  minWidth,
  testID,
}: {
  item: FactStripItem;
  minWidth: number;
  testID?: string;
}) {
  const theme = useTheme();
  const ringOffset = useRingOffsetStyle();
  const secondary = theme.colors.textSecondary;
  const content = (
    <>
      <Text variant="caption-1-semibold" numberOfLines={1} style={{ color: secondary }}>
        {item.label}
      </Text>
      {typeof item.value === 'string' || typeof item.value === 'number' ? (
        <Text variant="title-2-bold" numberOfLines={1} style={{ color: secondary }}>
          {item.value}
        </Text>
      ) : (
        <View style={{ minHeight: 26, justifyContent: 'center' }}>{item.value}</View>
      )}
      {item.caption == null ? null : typeof item.caption === 'string' ? (
        <Text variant="caption-1-regular" numberOfLines={1} style={{ color: secondary }}>
          {item.caption}
        </Text>
      ) : (
        <View style={{ minHeight: 16, justifyContent: 'center' }}>{item.caption}</View>
      )}
    </>
  );
  const layout = {
    flexGrow: 1,
    flexBasis: minWidth,
    minWidth,
    alignItems: 'center' as const,
    gap: 2,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 8,
    paddingRight: 8,
  };

  if (item.onPress) {
    const pressStyle: WebCssStyle = {
      ...layout,
      ...(ringOffset as WebCssStyle),
      '--bloom-fact-ring': theme.colors.primary,
      borderRadius: 8,
    };
    return (
      <PressableScale
        {...webDataSet({ bloomFact: '' })}
        role="button"
        targetScale={0.96}
        accessibilityLabel={item.accessibilityLabel}
        onPress={item.onPress}
        style={pressStyle}
        testID={testID}
      >
        {content}
      </PressableScale>
    );
  }
  return (
    <View
      role="listitem"
      accessible
      accessibilityLabel={item.accessibilityLabel}
      style={layout}
      testID={testID}
    >
      {content}
    </View>
  );
}

export const FactStrip = memo(FactStripComponent);
FactStrip.displayName = 'FactStrip';
