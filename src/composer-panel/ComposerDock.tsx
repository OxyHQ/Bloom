import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

interface ComposerDockProps {
  /** What the agent is waiting on, docked directly above the composer. */
  question?: ReactNode;
  /** The tab on the composer's top edge. */
  status?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: ReactNode;
}

/**
 * The column a composer sits in: the question over it, the status tab hanging off its top edge.
 * `ComposerPanel` and `ComposerPill` dock the same two slots the same way, so a host moves
 * between them without moving its question or its tab.
 */
export function ComposerDock({ question, status, style, testID, children }: ComposerDockProps) {
  return (
    <View testID={testID} style={[{ width: '100%', flexDirection: 'column' }, style]}>
      {question ? <View style={{ marginBottom: 8 }}>{question}</View> : null}
      {status ?? null}
      {children}
    </View>
  );
}
