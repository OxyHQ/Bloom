import { AudioWaveVisualizer } from '../../voice/AudioWaveVisualizer';
import { Markdown } from '../../markdown/Markdown';
import { CodeLines } from '../../code/CodeLines';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { BloomScope } from '../../appearance/BloomScope';
import type { BloomSize } from '../../appearance/types';
import { PresenceDot } from '../../chat-indicators/PresenceDot';
import { UnreadBadge } from '../../chat-indicators/UnreadBadge';
import { EnergyBadge } from '../../property-insights/EnergyBadge';

export const INDICATOR_CASES: Array<{
  name: string;
  scopes: BloomSize[];
  explicit?: 'sm' | 'md';
  heights: number[];
}> = [
  { name: 'default', scopes: [], heights: [14, 20, 24] },
  { name: 'nearest sm', scopes: ['sm'], heights: [12, 16, 20] },
  { name: 'partial xs mapping', scopes: ['xs'], heights: [12, 16, 20] },
  { name: 'partial lg mapping', scopes: ['lg'], heights: [16, 20, 24] },
  { name: 'explicit md over sm', scopes: ['sm'], explicit: 'md', heights: [14, 20, 24] },
  { name: 'explicit sm over lg', scopes: ['lg'], explicit: 'sm', heights: [12, 16, 20] },
  { name: 'nested sm over lg', scopes: ['lg', 'sm'], heights: [12, 16, 20] },
  { name: 'nested lg over sm', scopes: ['sm', 'lg'], heights: [16, 20, 24] },
];
export function IndicatorSubjects({ size }: { size?: 'sm' | 'md' }) {
  return (
    <>
      <PresenceDot testID="presence" status="online" size={size} />
      <UnreadBadge testID="unread" count={12} size={size} />
      <EnergyBadge testID="energy" rating="B" size={size} />
    </>
  );
}
export function IndicatorScopes({
  scopes,
  children,
}: {
  scopes: BloomSize[];
  children: ReactNode;
}) {
  // An omitted nested scope and ordinary wrapper must not reset inherited size.
  return scopes.reduceRight<ReactNode>(
    (child, size) => (
      <BloomScope size={size}>
        <View>
          <BloomScope>{child}</BloomScope>
        </View>
      </BloomScope>
    ),
    children,
  );
}

export function IndependentSubjects({ explicit = false }: { explicit?: boolean }) {
  return (
    <>
      <AudioWaveVisualizer
        testID="wave"
        levels={[]}
        active={false}
        size={explicit ? 'lg' : undefined}
      />
      <Markdown testID="document" size={explicit ? 'lg' : undefined}>
        Paragraph
      </Markdown>
      <CodeLines testID="code" code="content" wrap size={explicit ? 'md' : undefined} />
    </>
  );
}
