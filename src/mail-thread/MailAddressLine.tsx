import React, { useEffect, useMemo } from 'react';
import { View } from 'react-native';

import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { resolveMailPaint } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import {
  MAIL_THREAD_CSS,
  MAIL_THREAD_STYLE_ID,
  addressName,
  mailThreadStrings,
  visibleAddresses,
} from './shared';
import type { MailAddressLineProps } from './types';

/**
 * One `to` or `cc` line: the label, the names, and the overflow.
 *
 * THE OVERFLOW IS A CONTROL, NOT AN ELLIPSIS. A line truncated with "…" tells
 * the reader there are more recipients and gives them no way to find out who —
 * which, on a message they are about to reply-all to, is the one fact that
 * changes what they write. So the surplus collapses into a "+3 more" button
 * that reveals the rest in place, and the names stay selectable text either way.
 *
 * It draws a `to`/`cc` line inside a message header and it draws the same line
 * anywhere else — a reading pane's summary, a confirmation dialog. It owns no
 * state it does not have to: give it `expanded` and it is controlled.
 */
export function MailAddressLine({
  label,
  addresses,
  maxVisible = 3,
  expanded,
  onExpandedChange,
  strings,
  style,
  testID,
}: MailAddressLineProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_THREAD_STYLE_ID, MAIL_THREAD_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailThreadStrings(strings), [strings]);
  const [open, setOpen] = useControllableState<boolean>({
    value: expanded,
    defaultValue: false,
    onChange: onExpandedChange,
  });

  const { shown, overflow } = visibleAddresses(addresses, open ? 0 : maxVisible);
  if (addresses.length === 0) return null;

  return (
    <View
      style={[
        { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, minWidth: 0 },
        style,
      ]}
      testID={testID}
    >
      <Text
        variant="caption-1-regular"
        style={{ color: paint.textTertiary, flexShrink: 0 }}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
      <Text
        variant="caption-1-regular"
        numberOfLines={open ? undefined : 1}
        style={{ color: paint.textSecondary, flexShrink: 1, minWidth: 0 }}
        testID={testID ? `${testID}-names` : undefined}
      >
        {shown.map(addressName).join(', ')}
      </Text>
      {overflow > 0 ? (
        <Button
          variant="link"
          size="xs"
          linkTone="secondary"
          onPress={() => setOpen(true)}
          accessibilityLabel={text.moreAddresses(overflow)}
          testID={testID ? `${testID}-more` : undefined}
        >
          {`+${overflow}`}
        </Button>
      ) : null}
    </View>
  );
}
