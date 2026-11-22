import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AgentAvatar } from '../agent-avatar';
import { webDataSet } from '../styles/web-data';
import { createTokenStyles } from '../theme/color-tokens';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import type { AgentProfileProps } from './types';
import { useAgentReplyWebCss } from './web-css';
import { useInteractionState } from '../hooks/use-interaction-state';
import { usePrefersReducedMotion } from '../hooks/use-prefers-reduced-motion';

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'center',
    userSelect: 'none',
  },
  art: { position: 'relative', zIndex: 10, width: 56, height: 56, marginBottom: -2 },
  capsule: {
    position: 'relative',
    minWidth: 0,
    maxWidth: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingInline: 10,
    paddingBlock: 4,
  },
  ring: { position: 'absolute', inset: 0, borderRadius: 14 },
});

const useStyles = createTokenStyles((t) => ({
  label: {
    maxWidth: '100%',
    overflow: 'hidden',
    fontSize: 16,
    lineHeight: 20,
    fontWeight: 500,
    color: t.foreground,
  },
}));

const profileHook = webDataSet({ bloomAgentProfile: '' });
const ringHook = webDataSet({ bloomAgentProfileRing: '' });

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
  const themed = useStyles();
  useAgentReplyWebCss();
  const reduced = usePrefersReducedMotion();
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
    <Pressable
      {...profileHook}
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
      style={[
        styles.root,
        Platform.OS === 'web'
          ? undefined
          : { transform: [{ scale: pressed && !reduced ? 0.95 : 1 }] },
      ]}
      testID="agent-profile"
    >
      <View
        ref={avatarRef}
        collapsable={false}
        pointerEvents="none"
        aria-hidden
        style={[styles.art, { opacity: avatarHidden ? 0 : 1 }]}
      >
        {agents.slice(0, 3).map((agent, index) => {
          const single = agents.length === 1;
          const size = single ? 56 : 36;
          return (
            <View
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
            </View>
          );
        })}
      </View>
      <View pointerEvents="none" style={styles.capsule}>
        <View
          {...ringHook}
          style={[
            styles.ring,
            {
              backgroundColor: hovered ? colors.backgroundTertiary : colors.backgroundSecondary,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
            },
          ]}
        />
        <Text numberOfLines={1} style={themed.label}>
          {label}
          {agents.length > 3 ? ` +${agents.length - 3}` : ''}
        </Text>
      </View>
    </Pressable>
  );
}
