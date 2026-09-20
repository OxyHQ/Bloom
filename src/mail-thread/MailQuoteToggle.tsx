import React, { useEffect, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { useControllableState } from '../hooks/use-controllable-state';
import { RiMoreLine } from '../icons/remix/RiMoreLine';
import { resolveMailPaint } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { MAIL_THREAD_CSS, MAIL_THREAD_STYLE_ID, mailThreadStrings } from './shared';
import type { MailQuoteToggleProps } from './types';

/**
 * The "show trimmed content" control, and the place the trimmed content lands.
 *
 * THE CONTENT IS THE APP'S AND THE PRESENTATION IS BLOOM'S, which is the whole
 * division of labour in this family. Where a quote starts, what counts as
 * trimmed, and how the quoted HTML renders are questions only the app's parser
 * can answer; what a reader sees while it is hidden is a question every mail
 * client answers the same way and each one re-solves.
 *
 * It draws as a short dotted lozenge rather than as a labelled button
 * deliberately: it sits at the END of a message's own words, where a second
 * labelled control would read as a fourth action beside Reply and Forward. It
 * still carries a full accessible name, and the name FLIPS with the state — a
 * toggle whose name does not change is a toggle a screen-reader user cannot
 * tell the state of.
 */
export function MailQuoteToggle({
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
  strings,
  style,
  testID,
}: MailQuoteToggleProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_THREAD_STYLE_ID, MAIL_THREAD_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailThreadStrings(strings), [strings]);
  const [open, setOpen] = useControllableState<boolean>({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange: onExpandedChange,
  });

  const buttonStyle: WebCssStyle = {
    width: 32,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paint.hover,
    '--bloom-mail-ring': paint.accent,
  };

  return (
    <View style={[{ gap: 8, alignItems: 'flex-start' }, style]} testID={testID}>
      <Pressable
        {...webDataSet({ bloomMailThreadFocusable: '' })}
        role="button"
        accessibilityLabel={open ? text.hideTrimmed : text.showTrimmed}
        aria-expanded={open}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={buttonStyle}
        testID={testID ? `${testID}-button` : undefined}
      >
        <RiMoreLine width={16} height={16} fill={paint.textSecondary} />
      </Pressable>
      {open ? (
        <View style={{ width: '100%' }} testID={testID ? `${testID}-content` : undefined}>
          {children}
        </View>
      ) : null}
    </View>
  );
}
