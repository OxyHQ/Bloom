import React, { memo, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '../button';
import { Chip } from '../chip';
import { RiAddLine } from '../icons/remix/RiAddLine';
import { RiCloseLine } from '../icons/remix/RiCloseLine';
import {
  TextField,
  TextFieldHint,
  TextFieldInput,
  TextFieldLabel,
} from '../text-field';
import { useTheme } from '../theme/use-theme';
import { addUnique, formatIsrc, isValidIsrc, normalizeIsrc, pressDataSet, resolveCreatorStudioPaint } from './shared';
import type { ArtistChipsInputProps, IsrcFieldProps } from './types';

/**
 * `ArtistChipsInput`: a list of names as removable chips over an input.
 *
 *   label     `TextFieldLabel` (with the required asterisk)
 *   chips     `Chip` medium, wrapping, 6 apart; each carries a 16px remove
 *             glyph named "Remove <name>"
 *   input     `TextField` + `TextFieldInput`; Enter (or the "Add" button)
 *             adds the trimmed name once — case-insensitively unique — and
 *             clears the input. At `max` the input and button disable
 *   hint      `TextFieldHint` under it
 */
function ArtistChipsInputComponent({
  label,
  values,
  onValuesChange,
  placeholder,
  hint,
  max,
  removeLabel = (name) => `Remove ${name}`,
  addLabel = 'Add',
  disabled = false,
  required = false,
  style,
  testID,
}: ArtistChipsInputProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const [draft, setDraft] = useState('');
  const full = max !== undefined && values.length >= max;
  const blocked = disabled || full;

  const commit = () => {
    const next = addUnique(values, draft, max);
    if (next.length !== values.length) onValuesChange(next);
    setDraft('');
  };

  return (
    <View testID={testID} style={[styles.field, style]}>
      <TextFieldLabel required={required}>{label}</TextFieldLabel>
      {values.length > 0 ? (
        <View style={styles.chips} testID={testID ? `${testID}-chips` : undefined}>
          {values.map((name) => (
            <Chip
              key={name}
              size="medium"
              variant="subtle"
              disabled={disabled}
              endIcon={
                <Pressable
                  {...pressDataSet()}
                  accessibilityRole="button"
                  accessibilityLabel={removeLabel(name)}
                  disabled={disabled}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={() => onValuesChange(values.filter((v) => v !== name))}
                  testID={testID ? `${testID}-remove-${name}` : undefined}
                  style={styles.remove}
                >
                  <RiCloseLine width={14} height={14} fill={paint.textSecondary} />
                </Pressable>
              }
            >
              {name}
            </Chip>
          ))}
        </View>
      ) : null}
      <View style={styles.inputRow}>
        <TextField style={styles.input} disabled={blocked}>
          <TextFieldInput
            label={label}
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder}
            disabled={blocked}
            returnKeyType="done"
            submitBehavior="submit"
            onSubmitEditing={commit}
            testID={testID ? `${testID}-input` : undefined}
          />
        </TextField>
        <Button
          variant="secondary"
          size="medium"
          leadingIcon={RiAddLine}
          disabled={blocked || draft.trim() === ''}
          onPress={commit}
          accessibilityLabel={`${addLabel} ${label.toLowerCase()}`}
          testID={testID ? `${testID}-add` : undefined}
        >
          {addLabel}
        </Button>
      </View>
      {hint ? <TextFieldHint>{hint}</TextFieldHint> : null}
    </View>
  );
}

export const ArtistChipsInput = memo(ArtistChipsInputComponent);
ArtistChipsInput.displayName = 'ArtistChipsInput';

/**
 * `IsrcField`: the recording code, grouped `CC-XXX-YY-NNNNN` as it is typed
 * (uppercased, anything but letters and digits dropped, 12 characters max).
 * The hint shows the format; once 12 characters are in and they do not form a
 * valid code, the field paints invalid and the hint turns into the message.
 * `onChangeText` receives the grouped value.
 */
function IsrcFieldComponent({
  value,
  onChangeText,
  label = 'ISRC',
  hint = 'Format: CC-XXX-YY-NNNNN',
  invalidMessage = 'That is not a valid ISRC',
  disabled = false,
  style,
  testID,
}: IsrcFieldProps) {
  const complete = normalizeIsrc(value).length === 12;
  const invalid = complete && !isValidIsrc(value);
  return (
    <View testID={testID} style={[styles.field, style]}>
      <TextFieldLabel>{label}</TextFieldLabel>
      <TextField isInvalid={invalid} disabled={disabled}>
        <TextFieldInput
          label={label}
          value={value}
          onChangeText={(text) => onChangeText(formatIsrc(text))}
          placeholder="GB-XXX-26-00001"
          autoCapitalize="characters"
          autoCorrect={false}
          disabled={disabled}
          isInvalid={invalid}
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>
      <TextFieldHint isInvalid={invalid}>{invalid ? invalidMessage : hint}</TextFieldHint>
    </View>
  );
}

export const IsrcField = memo(IsrcFieldComponent);
IsrcField.displayName = 'IsrcField';

const styles = StyleSheet.create({
  field: { width: '100%', minWidth: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  remove: { alignItems: 'center', justifyContent: 'center', borderRadius: 9999 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, minWidth: 0 },
});
