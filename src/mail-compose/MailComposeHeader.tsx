import React, { useEffect, useMemo } from 'react';
import { TextInput, View, type TextStyle } from 'react-native';

import { Button } from '../button';
import { useControllableState } from '../hooks/use-controllable-state';
import { resolveMailPaint } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { hairlineOn, useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import { MailRecipientField } from './MailRecipientField';
import {
  MAIL_COMPOSE_CSS,
  MAIL_COMPOSE_GEOMETRY,
  MAIL_COMPOSE_STYLE_ID,
  copiesOpen,
  mailComposeStrings,
} from './shared';
import type { MailComposeHeaderProps } from './types';

/**
 * The addressing block: `To`, the `Cc`/`Bcc` pair behind their reveal, then the
 * subject — the order every mail client uses, which is also the order the
 * writer fills them in.
 *
 * THE COPIES REVEAL IS NOT A PLAIN TOGGLE. `copiesOpen` forces the rows open
 * whenever a cc or bcc arrives non-empty, whatever the toggle last said: a
 * reply-all whose copies were hidden is a message going to people the writer
 * cannot see, and that is not a state this component will render.
 *
 * EVERY ROW IS A GUTTER, NOT A BOX. The four rows share one label column and
 * one hairline, so the recipient chips and the subject sit on a single left
 * margin. This is deliberately not four `TextField`s: a stack of bordered boxes
 * draws five rectangles where the writer is filling in one form, and the chips
 * would then be inside a box inside a box.
 *
 * The typed text is ONE query across the three recipient rows, because the
 * suggestions it drives are one contact lookup — the app tells the rows which
 * field it is answering for through `onQuerySubmit` and `onSuggestionPress`.
 */
export function MailComposeHeader({
  to,
  onToChange,
  cc,
  onCcChange,
  bcc,
  onBccChange,
  copiesVisible,
  onCopiesVisibleChange,
  subject,
  onSubjectChange,
  query,
  onQueryChange,
  onQuerySubmit,
  suggestions,
  onSuggestionPress,
  disabled,
  strings,
  style,
  testID,
}: MailComposeHeaderProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_COMPOSE_STYLE_ID, MAIL_COMPOSE_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailComposeStrings(strings), [strings]);
  const geo = MAIL_COMPOSE_GEOMETRY;

  const [revealed, setRevealed] = useControllableState<boolean>({
    value: copiesVisible,
    defaultValue: false,
    onChange: onCopiesVisibleChange,
  });
  const copies = copiesOpen(revealed, cc, bcc);

  const subjectStyle: TextStyle = {
    ...TYPE_SCALE['body-regular'],
    color: paint.text,
    flex: 1,
    minWidth: 0,
    paddingTop: 4,
    paddingBottom: 4,
    borderWidth: 0,
    backgroundColor: 'transparent',
  };

  return (
    <View style={style} testID={testID}>
      <MailRecipientField
        label={text.to}
        recipients={to}
        onRecipientsChange={onToChange}
        value={query}
        onChangeText={onQueryChange}
        onSubmit={(value) => onQuerySubmit?.('to', value)}
        suggestions={suggestions}
        onSuggestionPress={(suggestion) => onSuggestionPress?.('to', suggestion)}
        disabled={disabled}
        strings={strings}
        trailing={
          copies ? undefined : (
            <Button
              variant="link"
              size="xs"
              linkTone="secondary"
              onPress={() => setRevealed(true)}
              accessibilityLabel={text.showCopies}
              testID={testID ? `${testID}-copies` : undefined}
            >
              {text.showCopies}
            </Button>
          )
        }
        testID={testID ? `${testID}-to` : undefined}
      />
      {copies ? (
        <MailRecipientField
          label={text.cc}
          recipients={cc ?? []}
          onRecipientsChange={onCcChange ?? (() => undefined)}
          onSubmit={(value) => onQuerySubmit?.('cc', value)}
          onSuggestionPress={(suggestion) => onSuggestionPress?.('cc', suggestion)}
          disabled={disabled}
          strings={strings}
          testID={testID ? `${testID}-cc` : undefined}
        />
      ) : null}
      {copies ? (
        <MailRecipientField
          label={text.bcc}
          recipients={bcc ?? []}
          onRecipientsChange={onBccChange ?? (() => undefined)}
          onSubmit={(value) => onQuerySubmit?.('bcc', value)}
          onSuggestionPress={(suggestion) => onSuggestionPress?.('bcc', suggestion)}
          disabled={disabled}
          strings={strings}
          testID={testID ? `${testID}-bcc` : undefined}
        />
      ) : null}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: geo.rowMinHeight,
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: hairlineOn(theme, surface),
        }}
      >
        <Text
          variant="body-regular"
          numberOfLines={1}
          style={{
            width: geo.labelWidth,
            color: paint.textTertiary,
            flexShrink: 0,
          }}
        >
          {text.subject}
        </Text>
        <TextInput
          {...webDataSet({ bloomMailComposeInput: '' })}
          accessibilityLabel={text.subject}
          editable={disabled !== true}
          value={subject}
          onChangeText={onSubjectChange}
          placeholderTextColor={paint.textTertiary}
          style={subjectStyle}
          testID={testID ? `${testID}-subject` : undefined}
        />
      </View>
    </View>
  );
}
