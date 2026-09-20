import React, { useMemo } from 'react';
import { Platform, TextInput, View, type TextStyle } from 'react-native';

import { RiAlertLine } from '../icons/remix/RiAlertLine';
import { RiCheckLine } from '../icons/remix/RiCheckLine';
import { RiErrorWarningLine } from '../icons/remix/RiErrorWarningLine';
import { RiLoader4Line } from '../icons/remix/RiLoader4Line';
import { useSurfaceFill } from '../styles/surface-levels';
import { SANS_FONT_FAMILY } from '../text-field/shared';
import { DISABLED_OPACITY } from '../styles/tokens';
import { typeScale } from '../typography/scale';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { resolveNoteStatusPaint } from './shared';
import type { NoteEditorHeaderLabels, NoteEditorHeaderProps, NoteSaveState } from './types';

/**
 * The chrome above a writing surface: the document's title, and the quiet line
 * that says where it stands.
 *
 *   title        title-1-semibold, borderless, grows to two lines then scrolls
 *   status line  caption-1-regular, 6px under the title
 *   separators   a middle dot between the three readings
 *
 * **The title is not a `TextField`.** A form field is a box you fill in; a
 * document title is the document, so it draws no chrome at all — the words sit
 * at the top of the page at their real size and the caret is the only thing that
 * says they are editable. Bloom has no borderless large input for this, which is
 * why the `TextInput` is here rather than composed.
 *
 * **The status line is three readings, not one string.** State, last edit, word
 * count — each drawn only if the app gave it, so a header with nothing to say
 * about saving is one line shorter rather than one empty line taller.
 *
 * **What this component does NOT do:** it does not own the body, it does not
 * stick, and it does not read the scroll. Sticky chrome that follows a scroller
 * is `ScrollOffsetProvider`'s contract (`docs/composition.mdx`) and the app
 * mounts it — a header that measured scroll itself would follow the wrong
 * scroller in a split view, silently.
 */

const DEFAULT_LABELS: Required<NoteEditorHeaderLabels> = {
  saved: 'Saved',
  saving: 'Saving…',
  offline: 'Offline — changes are held',
  error: 'Not saved',
  words: (count) => `${count} ${count === 1 ? 'word' : 'words'}`,
  title: 'Title',
};

const STATE_ICON = {
  saved: RiCheckLine,
  saving: RiLoader4Line,
  offline: RiAlertLine,
  error: RiErrorWarningLine,
} as const satisfies Record<NoteSaveState, unknown>;

const IS_WEB = Platform.OS === 'web';

/**
 * One reading of the status line, with its own leading separator.
 *
 * The dot travels WITH the reading after it rather than as a sibling between
 * two, because the line wraps: a free-standing separator ends up as the last
 * thing on a wrapped line, pointing at nothing. Bound to its reading, the pair
 * wraps together.
 */
function Reading({
  first,
  color,
  children,
}: {
  first: boolean;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 }}>
      {first ? null : (
        <Text
          aria-hidden
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          variant="caption-1-regular"
          style={{ color }}
        >
          ·
        </Text>
      )}
      {children}
    </View>
  );
}

export function NoteEditorHeader({
  title,
  onTitleChange,
  placeholder = 'Untitled',
  saveState,
  edited,
  wordCount,
  disabled = false,
  readOnly = false,
  actions,
  accessibilityLabel = 'Note',
  labels: labelsProp,
  style,
  titleStyle,
  testID,
}: NoteEditorHeaderProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const paint = useMemo(
    () => resolveNoteStatusPaint(theme, surface, saveState),
    [theme, surface, saveState],
  );
  const titleType = typeScale('title-1-semibold');
  const StateIcon = saveState ? STATE_ICON[saveState] : undefined;

  const readings: React.ReactNode[] = [];
  if (saveState !== undefined && StateIcon) {
    readings.push(
      <View
        key="state"
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
        testID={testID ? `${testID}-state` : undefined}
      >
        <StateIcon width={13} height={13} fill={paint.color} />
        <Text variant="caption-1-regular" numberOfLines={1} style={{ color: paint.color }}>
          {labels[saveState]}
        </Text>
      </View>,
    );
  }
  if (edited !== undefined) {
    readings.push(
      <Text key="edited" variant="caption-1-regular" numberOfLines={1} style={{ color: paint.quiet }}>
        {edited}
      </Text>,
    );
  }
  if (wordCount !== undefined) {
    readings.push(
      <Text
        key="words"
        variant="caption-1-regular"
        numberOfLines={1}
        style={{ color: paint.quiet }}
        testID={testID ? `${testID}-words` : undefined}
      >
        {labels.words(wordCount)}
      </Text>,
    );
  }

  return (
    <View
      role="group"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: 6 }, style]}
      testID={testID}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder={placeholder}
          placeholderTextColor={paint.quiet}
          editable={!disabled && !readOnly}
          multiline
          accessibilityLabel={labels.title}
          aria-disabled={disabled || undefined}
          accessibilityState={{ disabled }}
          style={[
            {
              flex: 1,
              minWidth: 0,
              color: theme.colors.text,
              fontFamily: SANS_FONT_FAMILY,
              fontSize: titleType.fontSize,
              lineHeight: titleType.lineHeight,
              fontWeight: titleType.fontWeight,
              // A document title draws no box: no border, no fill, no inset.
              padding: 0,
              // It GROWS instead of scrolling: a title cut off at one line is
              // the one thing a document header must not do. One line is the
              // floor; `field-sizing: content` takes it from there on web, and
              // a multiline `TextInput` grows on its own on native. A browser
              // without `field-sizing` keeps the floor and scrolls, which is
              // the same trade-off `Textarea` takes.
              minHeight: titleType.lineHeight,
              textAlignVertical: 'top',
              opacity: disabled ? DISABLED_OPACITY : 1,
            },
            IS_WEB
              ? ({
                  outlineWidth: 0,
                  outlineStyle: 'none',
                  resize: 'none',
                  fieldSizing: 'content',
                } as unknown as TextStyle)
              : undefined,
            titleStyle,
          ]}
          testID={testID ? `${testID}-title` : undefined}
        />
        {actions}
      </View>
      {readings.length > 0 ? (
        <View
          style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, minWidth: 0 }}
          testID={testID ? `${testID}-status` : undefined}
        >
          {readings.map((reading, index) => (
            <Reading key={index} first={index === 0} color={paint.quiet}>
              {reading}
            </Reading>
          ))}
        </View>
      ) : null}
    </View>
  );
}
NoteEditorHeader.displayName = 'NoteEditorHeader';
