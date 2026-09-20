import React, { memo, useCallback, useMemo } from 'react';
import { View } from 'react-native';

import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import * as Skeleton from '../skeleton';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AddressRow } from './AddressRow';
import { ADDRESS_GEOMETRY, ADDRESS_SECTION_GAP, ADDRESS_SECTIONS_GAP } from './constants';
import { resolveAddressPaint } from './shared';
import type { AddressListEntry, AddressListProps } from './types';

/**
 * The sectioned list an `AddressRow` lives in — "Saved", "Recent", "Results" —
 * with its loading and empty states.
 *
 * THE VARIANT IS THE ANNOUNCED TREE, not a style. `list` is a list of places a
 * reader is reading: each section is its own `list` named by its header, and
 * each row is a `listitem` wrapping a button. `picker` is a list they are
 * choosing ONE of: the whole thing is a `radiogroup`, each section a `group`,
 * and each row a `radio` carrying `aria-checked`. Both roles exist on both
 * platforms, which is why the picker is a radio group rather than the listbox
 * ARIA would suggest — React Native has no `listbox`, and a role that reaches
 * only one platform is the silent half of an accessibility bug.
 *
 *   header   caption-1-semibold, secondary rung, 8 above its rows
 *   sections 16 apart
 *   loading  three placeholder rows at the row's own geometry, announced as
 *            busy so a reader is told to wait rather than told nothing
 *   empty    a 32 glyph, a title and a line, centred with 32 of air
 */
function AddressListComponent({
  sections,
  selectedId,
  onSelect,
  variant = 'list',
  density = 'comfortable',
  loading = false,
  loadingRows = 3,
  empty,
  emptyTitle = 'Nothing here yet',
  emptyDescription,
  emptyIcon: EmptyIcon = RiMapPin2Line,
  accessibilityLabel = 'Addresses',
  style,
  testID,
}: AddressListProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const paint = useMemo(() => resolveAddressPaint(theme, surface), [theme, surface]);
  const g = ADDRESS_GEOMETRY[density];
  const picker = variant === 'picker';

  const press = useCallback(
    (entry: AddressListEntry) => (onSelect ? () => onSelect(entry.id) : undefined),
    [onSelect],
  );

  if (loading) {
    return (
      <View
        aria-busy
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={[{ gap: ADDRESS_SECTION_GAP }, style]}
      >
        {Array.from({ length: loadingRows }, (_unused, index) => (
          <View
            key={index}
            testID={testID ? `${testID}-placeholder-${index}` : undefined}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10 }}
          >
            <Skeleton.Circle size={g.tile} />
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Skeleton.Text style={{ width: '45%', lineHeight: 16 }} />
              <Skeleton.Text style={{ width: '70%', lineHeight: 14 }} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  const total = sections.reduce((count, section) => count + section.entries.length, 0);
  if (total === 0) {
    return (
      <View testID={testID} style={style}>
        {empty ?? (
          <View
            testID={testID ? `${testID}-empty` : undefined}
            style={{ alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 16 }}
          >
            <EmptyIcon width={32} height={32} fill={paint.textTertiary} />
            <Text variant="body-medium" style={{ color: paint.text, textAlign: 'center' }}>
              {emptyTitle}
            </Text>
            {emptyDescription ? (
              <Text variant="body-2-regular" style={{ color: paint.textSecondary, textAlign: 'center' }}>
                {emptyDescription}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  }

  const groups = sections.map((section, sectionIndex) => {
    const key = section.id ?? sectionIndex;
    const sectionId = testID ? `${testID}-section-${sectionIndex}` : undefined;
    const rows = section.entries.map((entry, entryIndex) => {
      const row = (
        <AddressRow
          key={entry.id}
          title={entry.title}
          subtitle={entry.subtitle}
          kind={entry.kind}
          icon={entry.icon}
          leading={entry.leading}
          meta={entry.meta}
          badge={entry.badge}
          action={entry.action}
          disabled={entry.disabled}
          density={density}
          accessibilityLabel={entry.accessibilityLabel}
          style={entry.style}
          onPress={press(entry)}
          {...(picker
            ? { role: 'radio' as const, selected: selectedId === entry.id }
            : { role: undefined })}
          testID={entry.testID ?? (sectionId ? `${sectionId}-row-${entryIndex}` : undefined)}
        />
      );
      if (picker) return row;
      return (
        <View key={entry.id} role="listitem">
          {row}
        </View>
      );
    });

    return (
      <View key={key} style={{ gap: ADDRESS_SECTION_GAP }}>
        {section.title ? (
          <Text
            variant="caption-1-semibold"
            testID={sectionId ? `${sectionId}-title` : undefined}
            style={{ color: paint.textSecondary, paddingHorizontal: 16 }}
          >
            {section.title}
          </Text>
        ) : null}
        <View
          role={picker ? 'group' : 'list'}
          accessibilityLabel={section.title ?? accessibilityLabel}
          testID={sectionId}
        >
          {rows}
        </View>
      </View>
    );
  });

  if (!picker) {
    return (
      <View testID={testID} style={[{ gap: ADDRESS_SECTIONS_GAP }, style]}>
        {groups}
      </View>
    );
  }

  return (
    <View
      role="radiogroup"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[{ gap: ADDRESS_SECTIONS_GAP }, style]}
    >
      {groups}
    </View>
  );
}

export const AddressList = memo(AddressListComponent);
AddressList.displayName = 'AddressList';
