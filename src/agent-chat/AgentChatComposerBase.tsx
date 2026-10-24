import { useMemo } from 'react';
import { View } from 'react-native';
import { useMessages } from '../locale/messages';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiInfinityLine } from '../icons/remix/RiInfinityLine';
import { RiSparklingLine } from '../icons/remix/RiSparklingLine';
import { Text } from '../typography';
import { useAgentChatPlatform } from './context';
import { shortModel, useAgentChatPalette, type AgentChatPalette } from './shared';
import { AGENT_CHAT_MESSAGES } from './messages';
import type { AgentChatComposerProps } from './types';

function StatusItem({
  icon: Icon,
  label,
  palette,
}: {
  icon: typeof RiInfinityLine;
  label: string;
  palette: AgentChatPalette;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon width={16} height={16} fill={palette.iconSecondary} />
      <Text variant="body-2-medium" numberOfLines={1} style={{ color: palette.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

export function AgentChatComposerBase({
  composerProps,
  value,
  defaultValue = '',
  onValueChange,
  onSubmit,
  onStop,
  busy = false,
  onAttach,
  model,
  provider,
  messageCount = 0,
  disabled = false,
  labels,
  style,
  testID,
}: AgentChatComposerProps) {
  const palette = useAgentChatPalette();
  const { ComposerLoader, ComposerPill } = useAgentChatPlatform();
  const { messages } = useMessages(AGENT_CHAT_MESSAGES);
  const l = useMemo(
    () => ({ ...messages.composer, newChat: messages.chat.newChat, ...labels }),
    [messages, labels],
  );
  const blocked = disabled || composerProps?.disabled;
  const submit = (next: string) => {
    if (busy || blocked || (!next.trim() && !composerProps?.attachments?.length)) return;
    onSubmit?.(next);
  };

  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column', gap: 10 }, style]}>
      <ComposerLoader active={busy}>
        <ComposerPill
          placeholder={l.placeholder}
          addMenu={
            onAttach
              ? [
                  {
                    label: l.attach,
                    rows: [{ id: 'attach', label: l.attach, icon: RiAttachment2 }],
                  },
                ]
              : []
          }
          onAddMenuSelect={onAttach ? () => onAttach() : undefined}
          models={model ? [{ id: model, name: shortModel(model) }] : undefined}
          model={model ?? undefined}
          effortLevels={[]}
          showVoice={!!composerProps?.onVoiceStateChange}
          {...composerProps}
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          onSubmit={submit}
          onStop={onStop}
          busy={busy}
          disabled={blocked}
          surface={false}
          frosted={busy}
          labels={{
            message: l.field,
            add: l.attach,
            send: l.send,
            stop: l.stop,
            ...(model ? { modelSettings: l.answeringWith(model) } : {}),
            ...composerProps?.labels,
          }}
          testID={testID ? `${testID}-pill` : undefined}
        />
      </ComposerLoader>

      <View
        style={{
          width: '100%',
          height: 26,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <StatusItem icon={RiInfinityLine} label={provider ?? l.notConfigured} palette={palette} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <StatusItem
            icon={RiSparklingLine}
            label={messageCount === 0 ? l.newChat : l.messageCount(messageCount)}
            palette={palette}
          />
        </View>
      </View>
    </View>
  );
}
