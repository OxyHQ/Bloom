import React, { useEffect, useMemo } from 'react';
import { TextInput, View, type TextStyle } from 'react-native';

import { Avatar } from '../avatar';
import { Chip } from '../chip';
import { useFieldMembership } from '../field';
import { Item } from '../item';
import { resolveMailPaint } from '../mail-list/shared';
import { adoptStyleSheet } from '../styles/adopt-style-sheet';
import { hairlineOn, useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import { resolveAccentColors } from '../theme/accent-colors';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { TYPE_SCALE } from '../typography/scale';
import {
  MAIL_COMPOSE_CSS,
  MAIL_COMPOSE_GEOMETRY,
  MAIL_COMPOSE_STYLE_ID,
  mailComposeStrings,
  recipientName,
  recipientsInvalid,
} from './shared';
import type { MailRecipientFieldProps } from './types';

/**
 * The `To` / `Cc` / `Bcc` row: recipients as removable chips, an inline input
 * that grows into whatever space is left, and the contact suggestions under it.
 *
 * IT IS A `Field` MEMBER. `useFieldMembership()` resolves the four decisions
 * a control inside a `Field` has to make, and each has a direction that is
 * silently wrong the other way round (`docs/composition.mdx` §Field). The one
 * choice this family makes is `labelPlacement: 'adjacent'`: the "To" in the
 * gutter is the words the reader reads AS the control, so it keeps its own name
 * and an enclosing field only fills a gap. A `stacked` control would announce
 * the field's label while the eye reads "To", which is the disagreement that
 * rule exists to prevent.
 *
 * INVALIDITY COMBINES, IT DOES NOT REPLACE. The field is invalid if it was told
 * so OR if any recipient is — `recipientsInvalid` — and the chip that is wrong
 * paints the error tone through `resolveAccentColors`, so the error text a
 * `Field` shows and the chip that caused it say the same thing.
 *
 * WHY THIS IS NOT A TAG INPUT. A recipient is a person: a face, a name, an
 * address and a verdict on whether that address will deliver. A tag has none of
 * those. The two share the `Chip` they are built on and the `Field` contract
 * they answer to, which is the part worth sharing, and they are kept separate
 * until they actually converge.
 *
 * The typed text is the CALLER's: only the app knows its address grammar and
 * its directory, so `onSubmit` hands it the string and this field never parses.
 */
export function MailRecipientField({
  label,
  recipients,
  onRecipientsChange,
  value = '',
  onChangeText,
  onSubmit,
  suggestions,
  onSuggestionPress,
  placeholder,
  disabled,
  invalid,
  trailing,
  nativeID,
  accessibilityLabel,
  strings,
  style,
  testID,
}: MailRecipientFieldProps) {
  const theme = useTheme();
  const surface = useSurfaceFill();
  useEffect(() => {
    adoptStyleSheet(MAIL_COMPOSE_STYLE_ID, MAIL_COMPOSE_CSS);
  }, []);
  const paint = useMemo(() => resolveMailPaint(theme, surface), [theme, surface]);
  const text = useMemo(() => mailComposeStrings(strings), [strings]);
  const geo = MAIL_COMPOSE_GEOMETRY;

  const field = useFieldMembership({
    accessibilityLabel,
    label,
    labelPlacement: 'adjacent',
    disabled,
    invalid: recipientsInvalid(recipients, invalid),
    nativeID,
  });

  // The gutter draws the CALLER's label and nothing else. Inside a `Field` with
  // no `label` of its own the input still announces the field's words
  // (`labelPlacement: 'adjacent'` falls back), but the gutter stays empty —
  // a field's label and a control's label are alternatives, not layers, and
  // drawing the same words twice is the duplication `Field` exists to avoid.
  const gutter = label;

  const errorPaint = resolveAccentColors(theme.colors, 'error', 'outlined');
  const inputStyle: TextStyle = {
    ...TYPE_SCALE['body-regular'],
    color: paint.text,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 120,
    paddingTop: 4,
    paddingBottom: 4,
    // A borderless input: the ROW is the field, and a second box around the
    // caret would read as a control inside a control.
    borderWidth: 0,
    backgroundColor: 'transparent',
  };

  return (
    <View style={style} testID={testID}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          minHeight: geo.rowMinHeight,
          paddingTop: 6,
          paddingBottom: 6,
          paddingLeft: geo.paddingHorizontal,
          paddingRight: geo.paddingHorizontal,
          gap: 8,
          borderBottomWidth: 1,
          borderBottomColor: field.invalid ? errorPaint.border : hairlineOn(theme, surface),
        }}
      >
        {gutter === undefined ? null : (
          <Text
            variant="body-regular"
            numberOfLines={1}
            style={{
              width: geo.labelWidth,
              color: paint.textTertiary,
              paddingTop: 8,
              flexShrink: 0,
            }}
            testID={testID ? `${testID}-label` : undefined}
          >
            {gutter}
          </Text>
        )}
        <View
          style={{
            flex: 1,
            minWidth: 0,
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 6,
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {recipients.map((recipient) => {
            const name = recipientName(recipient);
            return (
              <Chip
                key={recipient.id}
                size="large"
                variant={recipient.invalid === true ? 'outlined' : 'subtle'}
                color={recipient.invalid === true ? 'error' : 'default'}
                surface={surface}
                disabled={field.disabled}
                accessibilityLabel={name}
                // `Chip` names its own close button after the label; a
                // recipient's label is a person, so the app's own wording wins
                // ("Remove Mireia Solans", not "Remove Mireia Solans" spelled
                // by a component that cannot be translated with the rest).
                closeLabel={text.removeRecipient(name)}
                startIcon={
                  <Avatar source={recipient.avatar ?? null} name={name} size={20} />
                }
                onClose={
                  field.disabled
                    ? undefined
                    : () =>
                        onRecipientsChange(
                          recipients.filter((entry) => entry.id !== recipient.id),
                        )
                }
                testID={testID ? `${testID}-chip-${recipient.id}` : undefined}
              >
                {name}
              </Chip>
            );
          })}
          <TextInput
            {...webDataSet({ bloomMailComposeInput: '' })}
            nativeID={field.nativeID}
            accessibilityLabel={field.accessibilityLabel}
            aria-describedby={field.describedBy}
            aria-invalid={field.invalid || undefined}
            editable={!field.disabled}
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={() => {
              if (value.trim().length > 0) onSubmit?.(value);
            }}
            blurOnSubmit={false}
            placeholder={placeholder}
            placeholderTextColor={paint.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={inputStyle}
            testID={testID ? `${testID}-input` : undefined}
          />
        </View>
        {trailing === undefined ? null : (
          <View style={{ flexShrink: 0, paddingTop: 2 }}>{trailing}</View>
        )}
      </View>
      {(suggestions ?? []).length > 0 ? (
        <View
          role="list"
          accessibilityLabel={text.suggestions}
          style={{ backgroundColor: paint.hover }}
          testID={testID ? `${testID}-suggestions` : undefined}
        >
          {(suggestions ?? []).map((suggestion) => {
            const name = recipientName(suggestion);
            return (
              <Item
                key={suggestion.id}
                density="compact"
                title={name}
                subtitle={suggestion.address}
                leading={<Avatar source={suggestion.avatar ?? null} name={name} size={28} />}
                accessibilityLabel={`${name}, ${suggestion.address}`}
                onPress={() => onSuggestionPress?.(suggestion)}
                testID={testID ? `${testID}-suggestion-${suggestion.id}` : undefined}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
