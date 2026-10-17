import { useTemplateCopy } from '../template-copy';
import { RiGlobalLine, RiNotification3Line, RiPlayFill, RiVolumeUpLine } from '../icons';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { Switch } from '../switch';
import { SegmentedControl, SegmentedControlItem, SegmentedControlItemText } from '../segmented-control';
import { useTheme } from '../theme/use-theme';
import { AGENT_LANGUAGES, AGENT_SPEECH_RATES } from './constants';
import { useAgentCreatorBindings } from './context';
import { normalizeAgentPreferences } from './shared';
import { useAgentVoices } from './use-agent-voices';
import type { AgentCreatorProps, AgentPreferences } from './types';

function PreferenceSelect({ value, onChange, label, items, disabled = false, width }: { value: string; onChange: (value: string) => void; label: string; items: readonly { id: string; label: string }[]; disabled?: boolean; width?: number }) {
  const localizeBloomCopy = useTemplateCopy();
  const { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectItemText } = useAgentCreatorBindings();
  return localizeBloomCopy(<Select size="sm" value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger label={label} style={{ maxWidth: width ?? 144 }}><SelectValue /></SelectTrigger><SelectContent label={label} width={width ?? 192} items={items} valueExtractor={item => item.id} renderItem={item => <SelectItem value={item.id} label={item.label}><SelectItemText>{item.label}</SelectItemText></SelectItem>} /></Select>);
}

export function AgentPreferencesPanel(props: AgentCreatorProps) {
  const localizeBloomCopy = useTemplateCopy();
  const { agent, onChange } = props;
  const { colors } = useTheme();
  const preferences = normalizeAgentPreferences(agent.preferences);
  const { voices, canPreview, canSelect, preview } = useAgentVoices(props);
  const update = (patch: Partial<AgentPreferences>) => onChange({ ...agent, preferences: { ...preferences, ...patch } });
  const selectedVoice = voices.find(voice => preferences.voice === 'alice' ? voice.name.toLowerCase() === 'alice' : voice.id === preferences.voice);
  const selectedVoiceKey = preferences.voice === 'alice' ? selectedVoice?.id ?? 'system' : preferences.voice || 'off';
  const choices = voices.filter(voice => preferences.language === 'auto' || voice.language.toLowerCase().startsWith(preferences.language)).slice(0, 12);
  if (selectedVoice && !choices.includes(selectedVoice)) choices.push(selectedVoice);
  const voiceItems = [{ id: 'off', label: 'Off' }, { id: 'system', label: 'System voice' }, ...choices.map(voice => ({ id: voice.id, label: voice.name })), ...(preferences.voice && preferences.voice !== 'system' && preferences.voice !== 'alice' && !selectedVoice ? [{ id: preferences.voice, label: 'Saved voice' }] : [])];
  return localizeBloomCopy(<StyledView className="mt-4 flex flex-col gap-3 pb-3">
    <StyledView className="overflow-hidden rounded-2xl px-3" style={{ backgroundColor: colors.backgroundSecondary }}>
      <StyledView className="flex min-h-14 flex-row items-center justify-between gap-3 border-b py-3" style={{ borderColor: colors.border }}>
        <StyledView className="flex flex-row items-center gap-2"><RiGlobalLine size="md" fill={colors.icon} /><Text variant="body-medium">Language</Text></StyledView>
        <PreferenceSelect label="Agent language" value={preferences.language} onChange={language => update({ language: language as AgentPreferences['language'] })} items={AGENT_LANGUAGES} />
      </StyledView>
      <StyledView className="flex flex-row items-center gap-3 py-3"><RiNotification3Line size="md" fill={colors.icon} />
        <StyledView className="flex min-w-0 flex-1 flex-col gap-1"><Text variant="body-medium">Notifications</Text><Text variant="caption-1-regular" style={{ color: colors.textSecondary }}>Show a notice when a reply is ready.</Text></StyledView>
        <Switch accessibilityLabel="Notify when this agent finishes" size="sm" value={preferences.notifications} onValueChange={notifications => update({ notifications })} />
      </StyledView>
    </StyledView>
    <StyledView className="gap-3 rounded-2xl p-3 pt-2" style={{ backgroundColor: colors.backgroundSecondary }}>
      <StyledView className="flex flex-row items-center justify-between gap-3"><StyledView className="flex flex-row items-center gap-2"><RiVolumeUpLine size="md" fill={colors.icon} /><Text variant="body-medium">Voice</Text></StyledView>
        <StyledView className="flex min-w-0 flex-row items-center gap-1">
          {!!preferences.voice && <StyledPressable accessibilityRole="button" accessibilityLabel="Preview voice" disabled={!canPreview} aria-disabled={!canPreview} onPress={() => preview(preferences)} className="size-7 items-center justify-center rounded-full" style={{ opacity: canPreview ? 1 : .5 }}><RiPlayFill size="sm" fill={colors.icon} /></StyledPressable>}
          <PreferenceSelect label="Agent voice" disabled={!canSelect} value={selectedVoiceKey} onChange={voice => update({ voice: voice === 'off' ? '' : voice })} items={voiceItems} width={240} />
        </StyledView>
      </StyledView>
      <StyledView className="flex flex-col gap-2"><Text variant="caption-1-regular" style={{ color: colors.textSecondary }}>Playback speed</Text>
        <SegmentedControl label="Playback speed" type="radio" value={String(preferences.speed)} onChange={speed => update({ speed: Number(speed) })} style={{ width: '100%' }}>
          {AGENT_SPEECH_RATES.map(speed => <SegmentedControlItem key={speed} value={String(speed)} accessibilityLabel={`${speed} times playback speed`} style={{ minWidth: 0, paddingHorizontal: 4 }}><SegmentedControlItemText>{speed}×</SegmentedControlItemText></SegmentedControlItem>)}
        </SegmentedControl>
      </StyledView>
    </StyledView>
  </StyledView>);
}
