import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, View, type LayoutChangeEvent } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ContactRow } from './ContactRow';
import { contactIndexLetters, contactSectionIndex, resolveChatPeoplePaint } from './shared';
import type { ContactListProps } from './types';

/**
 * `ContactList`: contacts in A–Z sections, with the index rail.
 *
 *   heading   one letter, `caption-1-semibold` secondary, on the page fill;
 *             PINNED while its own rows scroll under it
 *   rail      the letters down the right edge, each a 16×16 press target with
 *             a 6px hit slop, the active one in the accent
 *
 * STICKY IS `stickyHeaderIndices`, not CSS. react-native-web implements the
 * same prop the native ScrollView does, so one spelling pins the heading on
 * both platforms; `position: sticky` would pin it on web and do nothing at all
 * on native, which is the shape of bug nothing in jest can see.
 *
 * The rail SCROLLS the list itself when it can (it measures each section's
 * offset with `onLayout`) and always reports the letter through
 * `onJumpToLetter`, so an app driving a virtualised list gets what it needs.
 * A letter with no section does nothing: a rail showing the whole alphabet
 * over six sections must not jump to whatever happens to be nearest.
 */

const RAIL_WIDTH = 22;

function ContactListComponent({
  sections,
  showIndex,
  indexLetters,
  activeLetter,
  onJumpToLetter,
  formatJumpLabel,
  onContactPress,
  onContactSelectedChange,
  onContactAction,
  stickyHeaders = true,
  height,
  header,
  footer,
  emptyState,
  style,
  testID,
}: ContactListProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const scroller = useRef<ScrollView | null>(null);
  const offsets = useRef<Map<string, number>>(new Map());
  const [, setMeasured] = useState(0);

  const filled = sections.filter((section) => section.contacts.length > 0);
  const letters = contactIndexLetters(filled, indexLetters);
  const railVisible = showIndex ?? filled.length > 1;
  const jumpLabel = formatJumpLabel ?? ((letter: string) => `Jump to ${letter}`);

  const onSectionLayout = useCallback((letter: string, event: LayoutChangeEvent) => {
    offsets.current.set(letter, event.nativeEvent.layout.y);
    setMeasured((n) => n + 1);
  }, []);

  const jump = useCallback(
    (letter: string) => {
      if (contactSectionIndex(filled, letter) < 0) return;
      const y = offsets.current.get(letter);
      if (y !== undefined) scroller.current?.scrollTo({ y, animated: true });
      onJumpToLetter?.(letter);
    },
    [filled, onJumpToLetter],
  );

  // One flat child array so `stickyHeaderIndices` can name the headings by
  // position. Building it inline and counting as we go is what keeps the two
  // in step — a second pass over the same data is a second place to be wrong.
  const children: React.ReactNode[] = [];
  const stickyIndices: number[] = [];
  if (header !== undefined) children.push(<View key="__header">{header}</View>);
  for (const section of filled) {
    stickyIndices.push(children.length);
    children.push(
      <View
        key={`heading-${section.letter}`}
        onLayout={(event) => onSectionLayout(section.letter, event)}
        style={{
          backgroundColor: paint.surface,
          paddingTop: 10,
          paddingRight: 10,
          paddingBottom: 4,
          paddingLeft: 10,
        }}
        testID={testID ? `${testID}-heading-${section.letter}` : undefined}
      >
        <Text variant="caption-1-semibold" style={{ color: paint.textSecondary }}>
          {section.letter}
        </Text>
      </View>,
    );
    for (const contact of section.contacts) {
      children.push(
        <ContactRow
          key={contact.id}
          {...contact}
          onPress={
            contact.onPress ??
            (onContactPress === undefined ? undefined : () => onContactPress(contact.id))
          }
          onSelectedChange={
            contact.onSelectedChange ??
            (onContactSelectedChange === undefined
              ? undefined
              : (next: boolean) => onContactSelectedChange(contact.id, next))
          }
          onAction={
            contact.onAction ??
            (onContactAction === undefined ? undefined : () => onContactAction(contact.id))
          }
          style={{ paddingRight: railVisible ? RAIL_WIDTH : 0 }}
          testID={testID ? `${testID}-contact-${contact.id}` : undefined}
        />,
      );
    }
  }
  if (footer !== undefined) children.push(<View key="__footer">{footer}</View>);

  if (filled.length === 0) {
    return (
      <View style={[{ backgroundColor: paint.surface }, style]} testID={testID}>
        {header}
        {emptyState}
        {footer}
      </View>
    );
  }

  return (
    <View
      style={[{ backgroundColor: paint.surface, position: 'relative' }, style]}
      testID={testID}
    >
      <ScrollView
        ref={scroller}
        style={height === undefined ? undefined : { height }}
        stickyHeaderIndices={stickyHeaders ? stickyIndices : undefined}
        testID={testID ? `${testID}-scroll` : undefined}
      >
        {children}
      </ScrollView>

      {railVisible ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            bottom: 8,
            right: 2,
            width: RAIL_WIDTH,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          }}
          testID={testID ? `${testID}-rail` : undefined}
        >
          {letters.map((letter) => {
            const active = letter === activeLetter;
            return (
              <Pressable
                key={letter}
                role="button"
                accessibilityLabel={jumpLabel(letter)}
                onPress={() => jump(letter)}
                hitSlop={{ top: 2, bottom: 2, left: 6, right: 6 }}
                style={{ paddingTop: 1, paddingBottom: 1 }}
                testID={testID ? `${testID}-jump-${letter}` : undefined}
              >
                <Text
                  variant={active ? 'caption-2-bold' : 'caption-2-medium'}
                  style={{ color: active ? paint.railActive : paint.railText }}
                >
                  {letter}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

export const ContactList = memo(ContactListComponent);
ContactList.displayName = 'ContactList';
