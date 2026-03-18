/**
 * Shared TextBubble factory for Tooltip (native + web).
 *
 * Returns a TextBubble component bound to the platform-specific Content
 * component, avoiding circular imports between TextBubble and the
 * platform entry points.
 */
import { Children } from 'react';
import { View } from 'react-native';

import { atoms as a } from '../styles';
import { Text } from '../typography';

type ContentComponent = React.ComponentType<{
  children: React.ReactNode;
  label: string;
}>;

export function createTextBubble(Content: ContentComponent) {
  return function TextBubble({ children }: { children: React.ReactNode }) {
    const c = Children.toArray(children);
    return (
      <Content label={c.join(' ')}>
        <View style={[a.gap_xs]}>
          {c.map((child, i) => (
            <Text key={i} style={[a.text_sm, a.leading_snug]}>
              {child}
            </Text>
          ))}
        </View>
      </Content>
    );
  };
}
