import React, { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import {
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from '../select';
import { Switch } from '../switch';
import { TextField, TextFieldHint, TextFieldInput, TextFieldLabel } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CreditsEditor } from './CreditsEditor';
import { ArtistChipsInput, IsrcField } from './MetadataFields';
import { resolveCreatorStudioPaint } from './shared';
import type { CreatorOption, TrackMetadata, TrackMetadataFormLabels, TrackMetadataFormProps } from './types';

/**
 * `TrackMetadataForm`: everything a track needs before distribution, composed
 * from Bloom's form primitives.
 *
 *   title · version         two `TextFieldInput`s, side by side from 560px
 *                           of the form's own width (1.6 : 1), stacked below
 *   explicit                `Switch` row: label `body-medium` + description
 *                           `body-2-regular` text-secondary, the switch right
 *   genre · language        two `Select`s, side by side from 560px
 *   primary / featured      `ArtistChipsInput` each (primary required)
 *   ISRC                    `IsrcField`
 *   lyrics                  `Textarea`, 6 rows, counter
 *   credits                 `CreditsEditor` (omit with `showCredits={false}`)
 *
 * 20 between fields. Controlled: every edit calls `onChange` with the whole
 * next value; `errors` paints a field invalid and shows its message.
 */

export const TRACK_METADATA_LABELS: TrackMetadataFormLabels = {
  title: 'Track title',
  version: 'Version',
  versionPlaceholder: 'Remix, Live, Acoustic…',
  explicit: 'Explicit lyrics',
  explicitDescription: 'Mark the track if it contains strong language or explicit themes.',
  genre: 'Genre',
  genrePlaceholder: 'Choose a genre',
  primaryArtists: 'Primary artists',
  featuredArtists: 'Featured artists',
  artistPlaceholder: 'Add an artist name',
  language: 'Lyrics language',
  languagePlaceholder: 'Choose a language',
  lyrics: 'Lyrics',
  lyricsPlaceholder: 'Paste the lyrics, one line per sung line',
};

const TWO_UP_FROM = 560;

function OptionSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
  error,
  disabled,
  testID,
}: {
  label: string;
  placeholder: string;
  value?: string;
  options: readonly CreatorOption[];
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <View style={styles.field}>
      <TextFieldLabel>{label}</TextFieldLabel>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger label={label} testID={testID}>
          <SelectValue placeholder={placeholder} />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent<CreatorOption>
          label={label}
          items={options}
          renderItem={(item) => (
            <SelectItem value={item.value} label={item.label}>
              <SelectItemIndicator />
              <SelectItemText>{item.label}</SelectItemText>
            </SelectItem>
          )}
        />
      </Select>
      {error ? <TextFieldHint isInvalid>{error}</TextFieldHint> : null}
    </View>
  );
}

function TrackMetadataFormComponent({
  value,
  onChange,
  genres,
  languages,
  roles,
  showCredits = true,
  errors = {},
  disabled = false,
  labels: labelOverrides,
  style,
  testID,
}: TrackMetadataFormProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const labels = { ...TRACK_METADATA_LABELS, ...labelOverrides };
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((prev) => (prev === next ? prev : next));
  }, []);
  const twoUp = width >= TWO_UP_FROM;
  const pair = twoUp ? styles.pair : styles.stack;

  const set = <K extends keyof TrackMetadata>(key: K, next: TrackMetadata[K]) =>
    onChange({ ...value, [key]: next });
  const id = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);

  return (
    <View testID={testID} onLayout={onLayout} style={[styles.root, style]}>
      <View style={pair}>
        <View style={twoUp ? styles.wide : styles.field}>
          <TextFieldLabel required>{labels.title}</TextFieldLabel>
          <TextField isInvalid={Boolean(errors.title)} disabled={disabled}>
            <TextFieldInput
              label={labels.title}
              placeholder={null}
              value={value.title}
              onChangeText={(t) => set('title', t)}
              isInvalid={Boolean(errors.title)}
              disabled={disabled}
              testID={id('title')}
            />
          </TextField>
          {errors.title ? <TextFieldHint isInvalid>{errors.title}</TextFieldHint> : null}
        </View>
        <View style={twoUp ? styles.narrow : styles.field}>
          <TextFieldLabel>{labels.version}</TextFieldLabel>
          <TextField isInvalid={Boolean(errors.version)} disabled={disabled}>
            <TextFieldInput
              label={labels.version}
              placeholder={labels.versionPlaceholder}
              value={value.version}
              onChangeText={(t) => set('version', t)}
              isInvalid={Boolean(errors.version)}
              disabled={disabled}
              testID={id('version')}
            />
          </TextField>
          {errors.version ? <TextFieldHint isInvalid>{errors.version}</TextFieldHint> : null}
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text variant="body-medium" style={{ color: paint.text }}>
            {labels.explicit}
          </Text>
          <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
            {labels.explicitDescription}
          </Text>
        </View>
        <Switch
          value={value.explicit}
          onValueChange={(v) => set('explicit', v)}
          disabled={disabled}
          accessibilityLabel={labels.explicit}
          testID={id('explicit')}
        />
      </View>

      <View style={pair}>
        <View style={twoUp ? styles.half : styles.field}>
          <OptionSelect
            label={labels.genre}
            placeholder={labels.genrePlaceholder}
            value={value.genre}
            options={genres}
            onChange={(v) => set('genre', v)}
            error={errors.genre}
            disabled={disabled}
            testID={id('genre')}
          />
        </View>
        <View style={twoUp ? styles.half : styles.field}>
          <OptionSelect
            label={labels.language}
            placeholder={labels.languagePlaceholder}
            value={value.language}
            options={languages}
            onChange={(v) => set('language', v)}
            error={errors.language}
            disabled={disabled}
            testID={id('language')}
          />
        </View>
      </View>

      <ArtistChipsInput
        label={labels.primaryArtists}
        values={value.primaryArtists}
        onValuesChange={(v) => set('primaryArtists', v)}
        placeholder={labels.artistPlaceholder}
        hint={errors.primaryArtists}
        required
        disabled={disabled}
        testID={id('primary')}
      />
      <ArtistChipsInput
        label={labels.featuredArtists}
        values={value.featuredArtists}
        onValuesChange={(v) => set('featuredArtists', v)}
        placeholder={labels.artistPlaceholder}
        disabled={disabled}
        testID={id('featured')}
      />

      <IsrcField
        value={value.isrc}
        onChangeText={(v) => set('isrc', v)}
        disabled={disabled}
        testID={id('isrc')}
      />

      <Textarea
        label={labels.lyrics}
        placeholder={labels.lyricsPlaceholder}
        value={value.lyrics}
        onChangeText={(v) => set('lyrics', v)}
        rows={6}
        showCount
        hint={errors.lyrics}
        isInvalid={Boolean(errors.lyrics)}
        disabled={disabled}
        testID={id('lyrics')}
      />

      {showCredits ? (
        <CreditsEditor
          credits={value.credits}
          onCreditsChange={(v) => set('credits', v)}
          roles={roles}
          disabled={disabled}
          testID={id('credits')}
        />
      ) : null}
    </View>
  );
}

export const TrackMetadataForm = memo(TrackMetadataFormComponent);
TrackMetadataForm.displayName = 'TrackMetadataForm';

const styles = StyleSheet.create({
  root: { width: '100%', gap: 20, minWidth: 0 },
  pair: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stack: { gap: 20 },
  field: { width: '100%', minWidth: 0 },
  wide: { flexGrow: 1.6, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  narrow: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  half: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  switchText: { flex: 1, minWidth: 0, gap: 2 },
});
