import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { resolveCategoryBarPaint, type CategoryBarPaint } from '../category-bar/CategoryBar';
import { useInteractionState } from '../hooks/use-interaction-state';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import type { WebCssStyle } from '../styles/web-view-style';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { DEFAULT_HOME_SEARCH_MODE_LABELS, HOME_SEARCH_MODES } from './constants';
import type { HomeSearchMode, SearchModeTabsProps } from './types';

/**
 * The mode switch above the search bar: Rent, Buy, Vacation rentals, Swap.
 *
 * `tabs` (default) — text tabs in `CategoryBar`'s selected-underline look:
 *
 *   tab        body-medium label, 8 above and 10 below it, then a 2px bar the
 *              width of the label; 24 between tabs
 *   rest       text-secondary; hover text-primary (web)
 *   selected   text-primary with a 2px text-primary bar
 *
 * The label keeps ONE weight in every state, so switching never reflows the
 * row. Keyboard (web): one tab stop (the selected tab); ArrowLeft/ArrowRight,
 * Home and End move focus, Enter and Space select.
 *
 * `segmented` — Bloom's `SegmentedControl` (`large`, a full pill, the thumb
 * sliding under the selected mode), stretched to the width so the modes share
 * it: the phone layout.
 *
 * Either way a `tablist` named by `accessibilityLabel`, each mode a `tab` with
 * `aria-selected`.
 */

const IS_WEB = Platform.OS === 'web';

const STYLE_ID = 'bloom-search-mode-tabs-web-css';
const TAB = '[data-bloom-search-mode-tab]';
const CSS = `
${TAB} {
  cursor: pointer;
  outline: none;
  user-select: none;
}
${TAB}:focus-visible [data-bloom-search-mode-ring] {
  outline: 2px solid var(--bloom-search-mode-ring, currentColor);
  outline-offset: -2px;
}
`;

interface TabProps {
  label: string;
  selected: boolean;
  tabbable: boolean;
  paint: CategoryBarPaint;
  onSelect: () => void;
  onKey: (event: { key: string; preventDefault: () => void }) => void;
  registerRef: (node: View | null) => void;
  testID?: string;
}

function ModeTab({ label, selected, tabbable, paint, onSelect, onKey, registerRef, testID }: TabProps) {
  const hover = useInteractionState();
  const color = selected || hover.state ? paint.active : paint.rest;
  const webProps: Record<string, unknown> = IS_WEB ? { tabIndex: tabbable ? 0 : -1, onKeyDown: onKey } : {};

  return (
    <Pressable
      ref={registerRef}
      {...webDataSet({ bloomSearchModeTab: selected ? 'selected' : '' })}
      {...webProps}
      role="tab"
      accessibilityLabel={label}
      aria-selected={selected}
      accessibilityState={{ selected }}
      onPress={onSelect}
      onHoverIn={hover.onIn}
      onHoverOut={hover.onOut}
      testID={testID}
      style={{ paddingTop: 8, paddingLeft: 4, paddingRight: 4 }}
    >
      <View
        pointerEvents="none"
        {...webDataSet({ bloomSearchModeRing: '' })}
        style={{ position: 'absolute', top: 2, left: -2, right: -2, bottom: 6, borderRadius: 8 }}
      />
      <Text variant="body-medium" numberOfLines={1} style={{ color }}>
        {label}
      </Text>
      <View
        testID={testID ? `${testID}-bar` : undefined}
        style={{ marginTop: 10, height: 2, borderRadius: 1, backgroundColor: selected ? paint.active : 'transparent' }}
      />
    </Pressable>
  );
}

export function SearchModeTabs<K extends string = HomeSearchMode>({
  value,
  onValueChange,
  modes,
  labels,
  variant = 'tabs',
  accessibilityLabel = 'Search mode',
  style,
  testID,
}: SearchModeTabsProps<K>) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCategoryBarPaint(theme), [theme]);
  const keys = modes ?? (HOME_SEARCH_MODES as unknown as readonly K[]);
  const nodes = useRef(new Map<K, View>());
  const labelOf = (key: K) =>
    labels?.[key] ?? (DEFAULT_HOME_SEARCH_MODE_LABELS as Partial<Record<string, string>>)[key] ?? key;

  useEffect(() => {
    adoptStyleSheet(STYLE_ID, CSS);
  }, []);

  const onKey = useCallback(
    (key: K, event: { key: string; preventDefault: () => void }) => {
      const index = keys.indexOf(key);
      let target = -1;
      switch (event.key) {
        case 'ArrowRight':
          target = Math.min(keys.length - 1, index + 1);
          break;
        case 'ArrowLeft':
          target = Math.max(0, index - 1);
          break;
        case 'Home':
          target = 0;
          break;
        case 'End':
          target = keys.length - 1;
          break;
        case ' ':
        case 'Spacebar':
          // Enter reaches `onPress` through react-native-web's press responder;
          // Space only does for button roles, so a tab answers it here.
          event.preventDefault();
          onValueChange(key);
          return;
        default:
          return;
      }
      event.preventDefault();
      const next = keys[target];
      if (next !== undefined) nodes.current.get(next)?.focus();
    },
    [keys, onValueChange],
  );

  if (variant === 'segmented') {
    return (
      <SegmentedControl
        label={accessibilityLabel}
        type="tabs"
        size="large"
        value={value}
        onChange={onValueChange}
        style={[{ alignSelf: 'stretch' }, style]}
      >
        {keys.map((key) => (
          <SegmentedControlItem key={key} value={key} testID={testID ? `${testID}-${key}` : undefined}>
            <SegmentedControlItemText>{labelOf(key)}</SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    );
  }

  const hasSelection = keys.includes(value);
  const rowStyle: WebCssStyle = {
    flexDirection: 'row',
    alignItems: 'flex-end',
    // 4px of pressable padding either side: 24 between labels.
    gap: 16,
    '--bloom-search-mode-ring': paint.ring,
  };

  return (
    <View testID={testID} role="tablist" accessibilityLabel={accessibilityLabel} style={[rowStyle, style]}>
      {keys.map((key, index) => (
        <ModeTab
          key={key}
          label={labelOf(key)}
          selected={key === value}
          tabbable={hasSelection ? key === value : index === 0}
          paint={paint}
          onSelect={() => onValueChange(key)}
          onKey={(event) => onKey(key, event)}
          registerRef={(node) => {
            if (node) nodes.current.set(key, node);
            else nodes.current.delete(key);
          }}
          testID={testID ? `${testID}-${key}` : undefined}
        />
      ))}
    </View>
  );
}

SearchModeTabs.displayName = 'SearchModeTabs';
