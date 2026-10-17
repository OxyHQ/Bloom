import { useEffect } from 'react';
import { type View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { AgentAvatar } from '../agent-avatar';
import { RiGroupLine } from '../icons/remix';
import { StyledView } from '../styles/styled-primitives';
import { Text } from '../typography';
import { useTheme } from '../theme/use-theme';
import { useTemplateCopy } from '../template-copy';
import { previewAvatarGeometry, type AvatarNodes } from './handoff';
import type { Agent } from './data';
const AnimatedView = Animated.createAnimatedComponent(StyledView);
function PreviewAvatar({ agent, index, count, hidden, nodes }: { agent: Agent; index: number; count: number; hidden: boolean; nodes: AvatarNodes }) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const { size, x, y } = previewAvatarGeometry(count,index);
  useEffect(() => { progress.value = withTiming(1,{ duration: reduced ? 0 : 300, easing: Easing.bezier(.22,1,.36,1) }); },[progress,reduced]);
  const animated = useAnimatedStyle(() => ({ opacity: hidden ? 0 : progress.value, transform: [{ translateX: x }, { translateY: y + (1-progress.value)*16 }, { scale: .5 + .5*progress.value }] }),[progress,hidden,x,y]);
  return <AnimatedView ref={(node: View | null) => { if(node) nodes.set(agent.id,node); else nodes.delete(agent.id); }} collapsable={false} pointerEvents="none" aria-hidden style={[{ position:'absolute',left:0,top:0,width:size,height:size },animated]}><AgentAvatar config={agent.avatar} size={size} /></AnimatedView>;
}
export function SelectedAgentPreview({ agents, nodes, hidden = [], caption = false }: { agents: Agent[]; nodes: AvatarNodes; hidden?: string[]; caption?: boolean }) {
  const localize = useTemplateCopy(); const { colors } = useTheme();
  return localize(<StyledView className="shrink-0 items-center gap-2" style={{paddingBottom:caption?20:0}}>
    <StyledView role="img" accessibilityLabel={agents.length ? `Selected agents: ${agents.map(a=>a.name).join(', ')}` : 'Choose your teammates'} style={{position:'relative',width:160,height:112}}>
      {!agents.length && <StyledView className="h-full items-center justify-center"><RiGroupLine size="3xl" fill={colors.textTertiary} /></StyledView>}
      {agents.map((agent,index)=><PreviewAvatar key={agent.id} agent={agent} index={index} count={agents.length} hidden={hidden.includes(agent.id)} nodes={nodes} />)}
    </StyledView>
    {caption && <Text variant="body-regular" style={{color:colors.textSecondary}}>Choose who’s joining the conversation.</Text>}
  </StyledView>);
}
