import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../button';
import { Chip } from '../chip';
import { RiCheckboxCircleFill } from '../icons/remix/RiCheckboxCircleFill';
import { RiCloseCircleLine } from '../icons/remix/RiCloseCircleLine';
import { RiMegaphoneLine } from '../icons/remix/RiMegaphoneLine';
import { RiSendPlaneLine } from '../icons/remix/RiSendPlaneLine';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
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
import { TextFieldLabel } from '../text-field';
import { Textarea } from '../textarea';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { CARD_RADIUS, resolveCreatorStudioPaint, toggleTag } from './shared';
import type { CreatorOption, PitchCardLabels, PitchCardProps } from './types';

/**
 * `PitchCard`: pitch an upcoming release to the editorial team.
 *
 *   card      radius 16, padding 16 (longhands), background-secondary, gap 16
 *   heading   20px megaphone glyph + `headline-semibold` title, description
 *             `body-2-regular` text-secondary
 *   release   `Select` of upcoming releases
 *   tags      "Mood" and "Genre": selectable `Chip`s (medium, `aria-pressed`),
 *             wrapping 6 apart, capped at `maxTags` — the rest disable at the
 *             cap and a `caption-1-regular` "Pick up to 3" sits beside the label
 *   pitch     `Textarea`, 5 rows, `maxLength` (500) with its counter
 *   submit    primary "Send pitch" (send glyph), disabled until a release and
 *             some text are in; `loading` while `submitting`
 *   sent      after submit the form is replaced by a status panel (card-inner
 *             fill, radius 12): glyph + status title + description + the
 *             submitted date — sent (clock, accent), accepted (check, positive),
 *             declined (cross, negative); "Edit pitch" while still `submitted`
 */

export const PITCH_CARD_LABELS: PitchCardLabels = {
  title: 'Pitch to editors',
  description: 'Tell the editorial team about your next release before it comes out.',
  release: 'Release',
  releasePlaceholder: 'Choose an upcoming release',
  moods: 'Mood',
  genres: 'Genre',
  pitch: 'Your pitch',
  pitchPlaceholder: 'What makes this release stand out? Who is it for, and what is the story behind it?',
  submit: 'Send pitch',
  tagLimit: (max) => `Pick up to ${max}`,
  statuses: { submitted: 'Pitch sent', accepted: 'Picked for review', declined: 'Not selected this time' },
  statusDescriptions: {
    submitted: 'Editors read every pitch. You will hear back before the release date.',
    accepted: 'Your release is being considered for editorial playlists.',
    declined: 'This release was not picked. You can pitch your next one as soon as it is scheduled.',
  },
  edit: 'Edit pitch',
};

function TagGroup({
  label,
  hint,
  tags,
  selected,
  onChange,
  max,
  disabled,
  testID,
}: {
  label: string;
  hint: string;
  tags: readonly string[];
  selected: readonly string[];
  onChange: (next: string[]) => void;
  max: number;
  disabled?: boolean;
  testID?: string;
}) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const full = selected.length >= max;
  return (
    <View testID={testID} role="group" accessibilityLabel={label} style={styles.group}>
      <View style={styles.groupHeading}>
        <TextFieldLabel style={styles.noMargin}>{label}</TextFieldLabel>
        <Text variant="caption-1-regular" style={{ color: paint.textTertiary }}>
          {hint}
        </Text>
      </View>
      <View style={styles.tags}>
        {tags.map((tag) => {
          const on = selected.includes(tag);
          return (
            <Chip
              key={tag}
              size="medium"
              variant="outlined"
              selected={on}
              disabled={disabled || (!on && full)}
              onPress={() => onChange(toggleTag(selected, tag, max))}
              testID={testID ? `${testID}-${tag}` : undefined}
            >
              {tag}
            </Chip>
          );
        })}
      </View>
    </View>
  );
}

function PitchCardComponent({
  releases,
  release,
  onReleaseChange,
  moods,
  selectedMoods,
  onSelectedMoodsChange,
  genres,
  selectedGenres,
  onSelectedGenresChange,
  pitch,
  onPitchChange,
  maxLength = 500,
  maxTags = 3,
  status = 'draft',
  submittedAt,
  onSubmit,
  onEdit,
  labels: labelOverrides,
  style,
  testID,
}: PitchCardProps) {
  const theme = useTheme();
  const paint = useMemo(() => resolveCreatorStudioPaint(theme), [theme]);
  const labels = {
    ...PITCH_CARD_LABELS,
    ...labelOverrides,
    statuses: { ...PITCH_CARD_LABELS.statuses, ...labelOverrides?.statuses },
    statusDescriptions: { ...PITCH_CARD_LABELS.statusDescriptions, ...labelOverrides?.statusDescriptions },
  };
  const id = (suffix: string) => (testID ? `${testID}-${suffix}` : undefined);
  const sent = status === 'submitted' || status === 'accepted' || status === 'declined';
  const submitting = status === 'submitting';
  const canSubmit = Boolean(release) && pitch.trim().length > 0 && !submitting;
  const releaseLabel = releases.find((r) => r.value === release)?.label;

  const heading = (
    <View style={styles.heading}>
      <View style={styles.titleRow}>
        <RiMegaphoneLine width={20} height={20} fill={paint.textSecondary} />
        <Text variant="headline-semibold" role="heading" style={[styles.flexText, { color: paint.text }]}>
          {labels.title}
        </Text>
      </View>
      <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
        {labels.description}
      </Text>
    </View>
  );

  if (sent) {
    const Icon = status === 'accepted' ? RiCheckboxCircleFill : status === 'declined' ? RiCloseCircleLine : RiTimeLine;
    const iconColor = status === 'accepted' ? paint.positive : status === 'declined' ? paint.negative : paint.accent;
    return (
      <View testID={testID} style={[styles.card, { backgroundColor: paint.surface }, style]}>
        {heading}
        <View
          testID={id('status')}
          aria-live="polite"
          style={[styles.statusPanel, { backgroundColor: paint.inner }]}
        >
          <Icon width={24} height={24} fill={iconColor} />
          <View style={styles.statusText}>
            <Text variant="body-medium" style={{ color: paint.text }}>
              {labels.statuses[status]}
            </Text>
            <Text variant="body-2-regular" style={{ color: paint.textSecondary }}>
              {labels.statusDescriptions[status]}
            </Text>
            {releaseLabel || submittedAt ? (
              <Text variant="caption-1-regular" style={{ color: paint.textTertiary, marginTop: 4 }}>
                {[releaseLabel, submittedAt].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>
        {status === 'submitted' && onEdit ? (
          <Button variant="secondary" size="medium" onPress={onEdit} style={styles.submit} testID={id('edit')}>
            {labels.edit}
          </Button>
        ) : null}
      </View>
    );
  }

  return (
    <View testID={testID} style={[styles.card, { backgroundColor: paint.surface }, style]}>
      {heading}

      <View style={styles.group}>
        <TextFieldLabel required>{labels.release}</TextFieldLabel>
        <Select value={release} onValueChange={onReleaseChange} disabled={submitting}>
          <SelectTrigger label={labels.release} testID={id('release')}>
            <SelectValue placeholder={labels.releasePlaceholder} />
            <SelectIcon />
          </SelectTrigger>
          <SelectContent<CreatorOption>
            label={labels.release}
            items={releases}
            renderItem={(item) => (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            )}
          />
        </Select>
      </View>

      <TagGroup
        label={labels.moods}
        hint={labels.tagLimit(maxTags)}
        tags={moods}
        selected={selectedMoods}
        onChange={onSelectedMoodsChange}
        max={maxTags}
        disabled={submitting}
        testID={id('moods')}
      />
      <TagGroup
        label={labels.genres}
        hint={labels.tagLimit(maxTags)}
        tags={genres}
        selected={selectedGenres}
        onChange={onSelectedGenresChange}
        max={maxTags}
        disabled={submitting}
        testID={id('genres')}
      />

      <Textarea
        label={labels.pitch}
        placeholder={labels.pitchPlaceholder}
        value={pitch}
        onChangeText={onPitchChange}
        maxLength={maxLength}
        showCount
        rows={5}
        required
        disabled={submitting}
        testID={id('pitch')}
      />

      <Button
        variant="primary"
        size="medium"
        leadingIcon={RiSendPlaneLine}
        onPress={onSubmit}
        disabled={!canSubmit}
        loading={submitting}
        style={styles.submit}
        testID={id('submit')}
      >
        {labels.submit}
      </Button>
    </View>
  );
}

export const PitchCard = memo(PitchCardComponent);
PitchCard.displayName = 'PitchCard';

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 16,
    paddingRight: 16,
    gap: 16,
    minWidth: 0,
  },
  heading: { gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flexText: { flexShrink: 1 },
  group: { gap: 0, minWidth: 0 },
  groupHeading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, marginBottom: 6 },
  noMargin: { marginBottom: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  submit: { alignSelf: 'flex-start' },
  statusPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  statusText: { flex: 1, minWidth: 0, gap: 2 },
});
