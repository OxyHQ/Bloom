import { useTemplateCopy } from '../template-copy';
import { ScrollView } from 'react-native';
import { AgentAvatar, type AvatarConfig } from '../agent-avatar';
import { CloseButton } from '../button/CloseButton';
import { TextFieldInput } from '../text-field';
import { Textarea } from '../textarea';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { AgentPreferencesPanel } from './AgentPreferencesPanel';
import { EmotionPicker } from './EmotionPicker';
import { ShapeArc } from './ShapeArc';
import { GlossArt } from './GlossArt';
import { CustomColorPicker } from './CustomColorPicker';
import { useAgentCreatorBindings } from './context';
import { AVATAR_COLORS } from './constants';
import { avatarHex, hexAppearance } from './shared';
import type { AgentCreatorProps } from './types';

/** Controlled creator block; saving and the surrounding panel belong to the host. */
export function AgentCreatorBase(props: AgentCreatorProps) {
  const localizeBloomCopy = useTemplateCopy();
  const { agent, onChange, onClose, className, style } = props;
  const { colors } = useTheme();
  const { Popover, PopoverTrigger, PopoverContent } = useAgentCreatorBindings();
  const c = agent.avatar;
  const appearance = (patch: Partial<AvatarConfig>) => onChange({ ...agent, avatar: { ...c, ...patch, lookAt: 'wander' } });
  return localizeBloomCopy(<StyledView accessibilityLabel="Agent editor" className={className} style={[{ flex: 1, minHeight: 0, paddingStart: 4, paddingEnd: 8, backgroundColor: colors.background }, style]}>
    <StyledView className="relative flex h-8 shrink-0 items-start justify-center pt-4"><Text variant="body-medium" numberOfLines={1} style={{ maxWidth: 260, alignSelf: 'center' }}>{agent.name || 'New bot'}</Text>
      {onClose && <CloseButton size="xs" accessibilityLabel="Close agent editor" style={{ position: 'absolute', end: 0, top: 14 }} onPress={onClose} />}
    </StyledView>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }} accessibilityLabel="Agent appearance and details">
      <StyledView className="relative h-[360px] overflow-hidden">
        <StyledView pointerEvents="box-none" style={{ position: 'absolute', left: '50%', top: 30, marginLeft: -134 }}><EmotionPicker key={agent.id} config={c} onChange={eyes => appearance({ eyes })} /></StyledView>
        <StyledView pointerEvents="none" style={{ position: 'absolute', left: '50%', top: 83, marginLeft: -81 }}><AgentAvatar config={{ ...c, lookAt: 'wander' }} size={162} label={`${agent.name || 'New agent'}, live avatar preview`} /></StyledView>
        <StyledView pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><ShapeArc key={agent.id} config={c} onChange={foldShape => appearance({ foldShape })} /></StyledView>
      </StyledView>
      <StyledView className="mt-[15px] flex items-center justify-center">
        <StyledView accessibilityLabel="Avatar color" className="flex h-[38px] shrink-0 flex-row items-center gap-1 rounded-full border p-[5px]" style={{ backgroundColor: colors.card, borderColor: colors.border, boxShadow: '0 1px 2px rgba(0,0,0,.05)' }}>
          {AVATAR_COLORS.map(([hue, saturation, name, center, edge]) => {
            const active = c.hue === hue && c.saturation === saturation && c.lightness === undefined;
            return <StyledPressable key={name} accessibilityRole="button" accessibilityLabel={`${name} avatar`} accessibilityState={{ selected: active }} aria-pressed={active} onPress={() => appearance({ hue, saturation, lightness: undefined, lightEyes: false })} className="relative size-[26px] shrink-0 overflow-hidden rounded-full"><GlossArt center={center} edge={edge} active={active} /></StyledPressable>;
          })}
          <Popover><PopoverTrigger label="Custom avatar color" className="relative size-[26px] shrink-0 overflow-hidden rounded-full"><GlossArt rainbow /></PopoverTrigger>
            <PopoverContent label="Custom avatar color" align="end" minWidth={248} maxWidth={248} className="rounded-3xl p-2.5"><CustomColorPicker value={avatarHex(c)} onChange={hex => { const next = hexAppearance(hex); if (next) appearance(next); }} /></PopoverContent>
          </Popover>
        </StyledView>
      </StyledView>
      <StyledView className="mt-[15px] overflow-hidden rounded-2xl ps-3" style={{ backgroundColor: colors.backgroundSecondary }}>
        <StyledView className="flex h-[52px] flex-row items-center border-b pe-2.5" style={{ borderColor: colors.border }}><Text variant="body-regular" style={{ width: 96 }}>Name</Text><StyledView className="min-w-0 flex-1"><TextFieldInput label="Agent name" size="small" maxLength={48} value={agent.name} onChangeText={name => onChange({ ...agent, name })} placeholder="Michael Scott" /></StyledView></StyledView>
        <StyledView className="flex h-[52px] flex-row items-center border-b pe-2.5" style={{ borderColor: colors.border }}><Text variant="body-regular" style={{ width: 96 }}>Label</Text><StyledView className="min-w-0 flex-1"><TextFieldInput label="Agent label" size="small" maxLength={60} value={agent.label} onChangeText={label => onChange({ ...agent, label })} placeholder="Manager, marketing, painter" /></StyledView></StyledView>
        <StyledView className="flex h-[82px] flex-row items-start py-2.5 pe-2.5"><Text variant="body-regular" style={{ width: 96, paddingTop: 4 }}>Description</Text><StyledView className="min-w-0 flex-1"><Textarea accessibilityLabel="Agent description" size="small" rows={2} resize="none" maxLength={500} style={{ height: 62 }} value={agent.description} onChangeText={description => onChange({ ...agent, description })} placeholder="Details for the agent" /></StyledView></StyledView>
      </StyledView>
      <AgentPreferencesPanel {...props} />
    </ScrollView>
  </StyledView>);
}
