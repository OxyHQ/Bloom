import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { StyledPressable, StyledView } from '../styles/styled-primitives';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { AgentProfileProps } from './types';
import { useInteractionState } from '../hooks/use-interaction-state';

/**
 * The conversation's profile target: animated artwork above an intrinsically sized name capsule.
 * One agent is drawn large; two or three overlap, and a longer team shows its first three and
 * "+N". The capsule names them ("Lumi + Atlas + Sol").
 */
export function AgentProfile({
  agents,
  label: labelProp,
  accessibilityLabel,
  expanded,
  onPress,
  avatarRef,
  avatarHidden = false,
}: AgentProfileProps) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  // Every avatar in the profile waves when it is pressed, not only the first.
  const [reaction, setReaction] = useState(0);
  const label =
    labelProp ??
    (agents.length === 1
      ? agents[0]!.name
      : agents
          .slice(0, 3)
          .map((agent) => agent.label || agent.name)
          .join(' + '));
  return (
    <StyledPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      aria-expanded={expanded}
      onPress={() => {
        setReaction((key) => key + 1);
        onPress();
      }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      className={`group/agent-profile relative min-w-0 max-w-full select-none items-center outline-none ${Platform.OS === 'web' ? 'motion-safe:active:scale-95' : ''}`}
      style={
        Platform.OS === 'web'
          ? undefined
          : { transform: [{ scale: pressed && !reduced ? 0.95 : 1 }] }
      }
      testID="agent-profile"
    >
      <StyledView
        ref={avatarRef}
        collapsable={false}
        pointerEvents="none"
        aria-hidden
        className="relative z-10 -mb-0.5 size-14"
        style={{ width: 56, height: 56, marginBottom: -2, opacity: avatarHidden ? 0 : 1 }}
      >
        {agents.slice(0, 3).map((agent, index) => {
          const single = agents.length === 1;
          const size = single ? 56 : 36;
          return (
            <StyledView
              key={agent.id}
              style={{
                position: 'absolute',
                width: size,
                height: size,
                insetInlineStart: single ? 0 : index === 1 ? 20 : index === 2 ? 10 : 0,
                top: index === 2 ? 20 : 0,
              }}
            >
              <AgentAvatar character={agent.avatar} size={size} reactionKey={reaction} />
            </StyledView>
          );
        })}
      </StyledView>
      <StyledView
        pointerEvents="none"
        className="relative min-w-0 max-w-full items-center justify-center rounded-[14px] px-2.5 py-1"
      >
        <StyledView
          className="absolute inset-0 rounded-[14px] group-focus-visible/agent-profile:ring-2 group-focus-visible/agent-profile:ring-border-focus-ring"
          style={{
            backgroundColor: hovered ? colors.backgroundTertiary : colors.backgroundSecondary,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: colors.border,
          }}
        />
        <Text
          numberOfLines={1}
          className="max-w-full truncate text-[16px] leading-5 font-medium text-text-primary"
        >
          {label}
          {agents.length > 3 ? ` +${agents.length - 3}` : ''}
        </Text>
      </StyledView>
    </StyledPressable>
  );
}
