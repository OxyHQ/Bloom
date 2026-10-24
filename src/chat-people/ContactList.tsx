import { ScrollArea } from '../layout/ScrollArea';
import React, { type ComponentRef, memo, useCallback, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, type ScrollView, View, type LayoutChangeEvent } from 'react-native';

import { useMessages } from '../locale/messages';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { ContactRow } from './ContactRow';
import { contactIndexLetters, contactSectionIndex, resolveChatPeoplePaint } from './shared';
import type { ContactListProps, ContactSection } from './types';
import { CHAT_PEOPLE_MESSAGES } from './messages';

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
 * STICKY IS OFF BY DEFAULT ON ANDROID. React Native wraps every sticky child in
 * `ScrollViewStickyHeader`: an `Animated.View` at `zIndex: 10` whose
 * `translateY` is native-driven from the scroll offset (and, on Fabric,
 * re-committed through a debounced JS timer). On Allo's Android release (RN
 * 0.88 Fabric) the contact rows between those wrappers rendered UNPAINTED
 * until the first scroll. A list of one heading per letter puts one such
 * layered, animated wrapper between every few rows, and they are the SUSPECTED
 * cause (a device run with them removed is still owed); the default leaves
 * them out on Android, and `stickyHeaders` opts back in (`docs/chat-people.mdx`).
 *
 * `layout="flat"` is for search results: every contact in ONE section, in the
 * order given, under `flatLabel` or no heading at all, and never a rail —
 * letters index a sorted directory, not a ranked list of matches.
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
  stickyHeaders: stickyHeadersProp,
  layout = 'sections',
  flatLabel,
  height,
  header,
  footer,
  emptyState,
  style,
  testID,
}: ContactListProps) {
  const theme = useTheme();
  const { messages } = useMessages(CHAT_PEOPLE_MESSAGES);
  const paint = useMemo(() => resolveChatPeoplePaint(theme), [theme]);
  const scroller = useRef<ComponentRef<typeof ScrollView> | null>(null);
  const offsets = useRef<Map<string, number>>(new Map());
  const [, setMeasured] = useState(0);

  // Read at RENDER, not at import, so a test can name the platform.
  const stickyHeaders = stickyHeadersProp ?? Platform.OS !== 'android';
  const flat = layout === 'flat';
  const sectioned = sections.filter((section) => section.contacts.length > 0);
  const flatContacts = flat ? sectioned.flatMap((section) => section.contacts) : [];
  const filled: readonly ContactSection[] = flat
    ? flatContacts.length > 0
      ? [{ letter: flatLabel ?? '', contacts: flatContacts }]
      : []
    : sectioned;
  const letters = contactIndexLetters(filled, indexLetters);
  const railVisible = !flat && (showIndex ?? filled.length > 1);
  const jumpLabel = formatJumpLabel ?? messages.jumpTo;

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
    // A flat list draws its heading only when it was given a label, and never
    // pins it: one label over a list of matches has nothing to stay above.
    if (!flat || section.letter.length > 0) {
      if (!flat) stickyIndices.push(children.length);
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
          testID={
            testID
              ? flat
                ? `${testID}-heading`
                : `${testID}-heading-${section.letter}`
              : undefined
          }
        >
          <Text variant="caption-1-semibold" style={{ color: paint.textSecondary }}>
            {section.letter}
          </Text>
        </View>,
      );
    }
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
    <View style={[{ backgroundColor: paint.surface, position: 'relative' }, style]} testID={testID}>
      <ScrollArea
        ref={scroller}
        style={height === undefined ? undefined : { height }}
        stickyHeaderIndices={stickyHeaders && stickyIndices.length > 0 ? stickyIndices : undefined}
        testID={testID ? `${testID}-scroll` : undefined}
      >
        {children}
      </ScrollArea>

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
