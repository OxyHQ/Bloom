import { IconButton } from '../button';
import { RiGlobalLine } from '../icons/remix/RiGlobalLine';
import { RiNotification3Line } from '../icons/remix/RiNotification3Line';
import { RiVolumeUpLine } from '../icons/remix/RiVolumeUpLine';
import { createSinglePathSVG } from '../icons/TEMPLATE';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '../segmented-control';
import { SettingsCard } from '../settings-modal/SettingsRows';
import { StyledView } from '../styles/styled-primitives';
import { Switch } from '../switch';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { AGENT_LANGUAGES, AGENT_SPEECH_RATES } from './constants';
import { useAgentCreatorBindings, useAgentCreatorMessages } from './context';
import { normalizeAgentPreferences } from './shared';
import type { AgentCreatorProps, AgentPreferences } from './types';
import { useAgentVoices } from './use-agent-voices';

// Source Remix play-mini-fill artwork; the existing full-size play triangle has different geometry.
const PreviewPlayIcon = createSinglePathSVG({
  path: 'M7.75194 5.43872L18.2596 11.5682C18.4981 11.7073 18.5787 12.0135 18.4396 12.252C18.3961 12.3265 18.3341 12.3885 18.2596 12.432L7.75194 18.5615C7.51341 18.7006 7.20725 18.62 7.06811 18.3815C7.0235 18.305 7 18.2181 7 18.1296V5.87061C7 5.59446 7.22386 5.37061 7.5 5.37061C7.58853 5.37061 7.67547 5.39411 7.75194 5.43872Z',
});
function PreferenceSelect({
  value,
  onChange,
  label,
  items,
  disabled = false,
  popoverWidth = 192,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  items: readonly { id: string; label: string }[];
  disabled?: boolean;
  popoverWidth?: number;
  className?: string;
}) {
  const messages = useAgentCreatorMessages();
  const {
    Select,
    SelectTrigger,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectItem,
    SelectItemText,
  } = useAgentCreatorBindings();
  return (
    <Select
      size="sm"
      value={value}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger
        label={label}
        className={className}
        style={className ? { minWidth: 0, maxWidth: 144 } : undefined}
      >
        <SelectValue />
        <SelectIcon />
      </SelectTrigger>
      <SelectContent
        label={label}
        width={popoverWidth}
        items={items}
        valueExtractor={(item) => item.id}
        renderItem={(item) => (
          <SelectItem value={item.id} label={item.label}>
            <SelectItemText>{item.label}</SelectItemText>
          </SelectItem>
        )}
      />
    </Select>
  );
}

/** Device voices preview locally; preferences travel with the agent to onRespond. */
export function AgentPreferencesPanel(props: AgentCreatorProps) {
  const messages = useAgentCreatorMessages();
  const { agent, onChange } = props;
  const { colors } = useTheme();
  const preferences = normalizeAgentPreferences(agent.preferences);
  const { voices, canPreview, canSelect, preview } = useAgentVoices(props);
  const update = (patch: Partial<AgentPreferences>) =>
    onChange({ ...agent, preferences: { ...preferences, ...patch } });
  const selectedVoice = voices.find((voice) =>
    preferences.voice === 'alice'
      ? voice.name.toLowerCase() === 'alice'
      : voice.id === preferences.voice,
  );
  const selectedVoiceKey =
    preferences.voice === 'alice'
      ? (selectedVoice?.id ?? 'system')
      : preferences.voice || 'off';
  const choices = voices
    .filter(
      (voice) =>
        preferences.language === 'auto' ||
        voice.language.toLowerCase().startsWith(preferences.language),
    )
    .slice(0, 12);
  if (selectedVoice && !choices.includes(selectedVoice))
    choices.push(selectedVoice);
  const voiceItems = [
    { id: 'off', label: messages.off },
    { id: 'system', label: messages.systemVoice },
    ...choices.map((voice) => ({ id: voice.id, label: voice.name })),
    ...(preferences.voice &&
    preferences.voice !== 'system' &&
    preferences.voice !== 'alice' &&
    !selectedVoice
      ? [{ id: preferences.voice, label: messages.savedVoice }]
      : []),
  ];
  return (
    <StyledView className="mt-4 flex flex-col gap-3 pb-3">
      <SettingsCard
        className="px-3"
        style={{ paddingLeft: 12, paddingRight: 12 }}
      >
        <StyledView
          className="flex min-h-14 items-center justify-between gap-3 border-b border-separator-border py-3 flex-row"
          style={{ borderColor: colors.border }}
        >
          <StyledView className="flex items-center gap-2 text-body-medium text-text-primary flex-row">
            <RiGlobalLine
              className="size-5 text-foreground-icon-secondary"
              size="md"
              fill={colors.icon}
              aria-hidden
            />
            <Text
              variant="body-medium"
              className="text-body-medium text-text-primary"
            >
              {messages.language}
            </Text>
          </StyledView>
          <PreferenceSelect
            label={messages.languageInput}
            value={preferences.language}
            onChange={(language) =>
              update({ language: language as AgentPreferences['language'] })
            }
            items={AGENT_LANGUAGES.map((language) => ({
              id: language.id,
              label: messages.languages[language.id],
            }))}
          />
        </StyledView>
        <StyledView className="flex items-center gap-3 py-3 flex-row">
          <RiNotification3Line
            className="size-5 shrink-0 text-foreground-icon-secondary"
            size="md"
            fill={colors.icon}
            aria-hidden
          />
          <StyledView className="flex min-w-0 flex-1 flex-col gap-1">
            <Text
              variant="body-medium"
              className="text-body-medium text-text-primary"
            >
              {messages.notifications}
            </Text>
            <Text
              variant="caption-1-regular"
              className="text-caption-1-regular text-text-secondary"
            >
              {messages.notificationsDescription}
            </Text>
          </StyledView>
          <Switch
            accessibilityLabel={messages.notifyFinished}
            size="sm"
            checked={preferences.notifications}
            onCheckedChange={(notifications) => update({ notifications })}
          />
        </StyledView>
      </SettingsCard>
      <SettingsCard
        className="gap-3 p-3 pt-2"
        style={{
          paddingLeft: 12,
          paddingRight: 12,
          paddingTop: 8,
          paddingBottom: 12,
          gap: 12,
        }}
      >
        <StyledView className="flex items-center justify-between gap-3 flex-row">
          <StyledView className="flex items-center gap-2 text-body-medium text-text-primary flex-row">
            <RiVolumeUpLine
              className="size-5 text-foreground-icon-secondary"
              size="md"
              fill={colors.icon}
              aria-hidden
            />
            <Text
              variant="body-medium"
              className="text-body-medium text-text-primary"
            >
              {messages.voice}
            </Text>
          </StyledView>
          <StyledView className="flex min-w-0 items-center gap-1 flex-row">
            {!!preferences.voice && (
              <IconButton
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
            <PreferenceSelect
              label={messages.voiceInput}
              disabled={!canSelect}
              value={selectedVoiceKey}
              onChange={(voice) =>
                update({ voice: voice === 'off' ? '' : voice })
              }
              items={voiceItems}
              className="min-w-0 max-w-36"
              popoverWidth={240}
            />
          </StyledView>
        </StyledView>
        <StyledView className="flex flex-col gap-2">
          <Text
            variant="caption-1-regular"
            className="text-caption-1-regular text-text-secondary"
          >
            {messages.playbackSpeed}
          </Text>
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
        </StyledView>
      </SettingsCard>
    </StyledView>
  );
}
