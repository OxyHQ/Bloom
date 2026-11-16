import { Button } from '../button';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { createSinglePathSVG } from '../icons/TEMPLATE';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { GroupedSection, GroupedSectionItem } from '../grouped-section';
import { StyledView } from '../styles/styled-primitives';
import { Switch } from '../switch';
import { useTheme } from '../theme/use-theme';
import { AGENT_LANGUAGES, AGENT_SPEECH_RATES } from './constants';
import { useAgentCreatorBindings, useAgentCreatorMessages } from './context';
import { normalizeAgentPreferences } from './shared';
import type { AgentCreatorProps, AgentPreferences } from './types';
import { useAgentVoices } from './use-agent-voices';

// Source Remix play-mini-fill artwork; the existing full-size play triangle has different geometry.
const PreviewPlayIcon = createSinglePathSVG({
  path: 'M7.75194 5.43872L18.2596 11.5682C18.4981 11.7073 18.5787 12.0135 18.4396 12.252C18.3961 12.3265 18.3341 12.3885 18.2596 12.432L7.75194 18.5615C7.51341 18.7006 7.20725 18.62 7.06811 18.3815C7.0235 18.305 7 18.2181 7 18.1296V5.87061C7 5.59446 7.22386 5.37061 7.5 5.37061C7.58853 5.37061 7.67547 5.39411 7.75194 5.43872Z',
});
/** Device voices preview locally; preferences travel with the agent to onRespond. */
export function AgentPreferencesPanel(props: AgentCreatorProps) {
  const messages = useAgentCreatorMessages();
  const { agent, onChange } = props;
  const { colors } = useTheme();
  const preferences = normalizeAgentPreferences(agent.preferences);
  const { voices, canPreview, canSelect, preview } = useAgentVoices(props);
  const { SettingsSelect } = useAgentCreatorBindings();
  const update = (patch: Partial<AgentPreferences>) =>
    onChange({ ...agent, preferences: { ...preferences, ...patch } });
  const selectedVoice = voices.find((voice) =>
    preferences.voice === 'alice'
      ? voice.name.toLowerCase() === 'alice'
      : voice.id === preferences.voice,
  );
  const selectedVoiceKey =
    preferences.voice === 'alice' ? (selectedVoice?.id ?? 'system') : preferences.voice || 'off';
  const choices = voices
    .filter(
      (voice) =>
        preferences.language === 'auto' ||
        voice.language.toLowerCase().startsWith(preferences.language),
    )
    .slice(0, 12);
  if (selectedVoice && !choices.includes(selectedVoice)) choices.push(selectedVoice);
  const voiceItems = [
    { value: 'off', label: messages.off },
    { value: 'system', label: messages.systemVoice },
    ...choices.map((voice) => ({ value: voice.id, label: voice.name })),
    ...(preferences.voice &&
    preferences.voice !== 'system' &&
    preferences.voice !== 'alice' &&
    !selectedVoice
      ? [{ value: preferences.voice, label: messages.savedVoice }]
      : []),
  ];
  return (
    <StyledView className="mt-4 flex flex-col gap-3 pb-3">
      <GroupedSection separator="line">
        <GroupedSectionItem
          title={messages.language}
          icon={<RiGlobalLine size="md" fill={colors.icon} aria-hidden />}
          wrapControl
          rightElement={
            <SettingsSelect
              label={messages.languageInput}
              size="sm"
              compact={false}
              width={192}
              value={preferences.language}
              onChange={(language) => update({ language })}
              items={AGENT_LANGUAGES.map((language) => ({
                value: language.id,
                label: messages.languages[language.id],
              }))}
            />
          }
        />
        <GroupedSectionItem
          title={messages.notifications}
          description={messages.notificationsDescription}
          icon={<RiNotification3Line size="md" fill={colors.icon} aria-hidden />}
          wrapControl
          rightElement={
            <Switch
              accessibilityLabel={messages.notifyFinished}
              size="sm"
              checked={preferences.notifications}
              onCheckedChange={(notifications) => update({ notifications })}
            />
          }
        />
      </GroupedSection>
      <GroupedSection separator="line">
        <GroupedSectionItem
          title={messages.voice}
          icon={<RiVolumeUpLine size="md" fill={colors.icon} aria-hidden />}
          wrapControl
          rightElement={
            <StyledView className="flex min-w-0 items-center gap-1 flex-row">
              {!!preferences.voice && (
                <Button
                  iconOnly
                  size="sm"
                  appearance="plain"
                  tone="neutral"
                  icon={PreviewPlayIcon}
                  accessibilityLabel={messages.previewVoice}
                  disabled={!canPreview}
                  className="bg-transparent text-text-secondary hover:bg-background-tertiary-default hover:text-text-primary active:bg-background-tertiary-hover active:text-text-primary"
                  onPress={() => preview(preferences)}
                />
              )}
              <SettingsSelect
                label={messages.voiceInput}
                size="sm"
                compact={false}
                width={240}
                style={{ maxWidth: 144 }}
                disabled={!canSelect}
                value={selectedVoiceKey}
                onChange={(voice) => update({ voice: voice === 'off' ? '' : voice })}
                items={voiceItems}
              />
            </StyledView>
          }
        />
        <GroupedSectionItem
          title={messages.playbackSpeed}
          wrapControl
          rightElement={
            <SegmentedControl
              label={messages.playbackSpeed}
              className="w-full bg-background-tertiary-default dark:bg-segmented-control-background"
              style={{ width: '100%' }}
              type="radio"
              value={String(preferences.speed)}
              onValueChange={(speed) => update({ speed: Number(speed) })}
            >
              {AGENT_SPEECH_RATES.map((speed) => (
                <SegmentedControlItem
                  key={speed}
                  value={String(speed)}
                  accessibilityLabel={messages.playbackSpeedLabel(speed)}
                  className="min-w-0 flex-1 px-1"
                  style={{ flex: 1, minWidth: 0, paddingHorizontal: 4 }}
                >
                  <SegmentedControlItemText>{speed}×</SegmentedControlItemText>
                </SegmentedControlItem>
              ))}
            </SegmentedControl>
          }
        />
      </GroupedSection>
    </StyledView>
  );
}
