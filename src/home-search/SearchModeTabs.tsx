import React from 'react';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { Tabs, TabsTrigger } from '../tabs';
import { useMessages } from '../locale/messages';
import { HOME_SEARCH_MESSAGES } from './messages';
import { HOME_SEARCH_MODES } from './constants';
import type { HomeSearchMode, SearchModeTabsProps } from './types';

/** Search modes and localized labels over Bloom's shared tab controls. */
export function SearchModeTabs<K extends string = HomeSearchMode>({
  value,
  onValueChange,
  modes,
  labels,
  variant = 'tabs',
  accessibilityLabel: accessibilityLabelProp,
  style,
  testID,
}: SearchModeTabsProps<K>) {
  const { messages } = useMessages(HOME_SEARCH_MESSAGES);
  const accessibilityLabel = accessibilityLabelProp ?? messages.searchMode;
  const keys = modes ?? (HOME_SEARCH_MODES as unknown as readonly K[]);
  const labelOf = (key: K) =>
    labels?.[key] ?? (messages.modes as Partial<Record<string, string>>)[key] ?? key;

  if (variant === 'segmented') {
    return (
      <SegmentedControl
        label={accessibilityLabel}
        type="tabs"
        size="lg"
        value={value}
        onChange={onValueChange}
        style={[{ alignSelf: 'stretch' }, style]}
      >
        {keys.map((key) => (
          <SegmentedControlItem
            key={key}
            value={key}
            testID={testID ? `${testID}-${key}` : undefined}
          >
            <SegmentedControlItemText>{labelOf(key)}</SegmentedControlItemText>
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    );
  }

  return (
    <Tabs
      value={value}
      onValueChange={(next) => onValueChange(next as K)}
      label={accessibilityLabel}
      style={style}
      testID={testID}
    >
      {keys.map((key) => (
        <TabsTrigger
          key={key}
          value={key}
          label={labelOf(key)}
          testID={testID ? `${testID}-${key}` : undefined}
        />
      ))}
    </Tabs>
  );
}

SearchModeTabs.displayName = 'SearchModeTabs';
