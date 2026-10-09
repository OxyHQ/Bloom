import React from 'react';
import { ScrollView, View } from 'react-native';
import { PanelErrorBoundary } from '../error-boundary/PanelErrorBoundary';
import type { PanelErrorBoundaryOptions } from '../error-boundary/types';

/** One pane: a bounded column that scrolls its own overflow. */
export function SplitPane({
  children,
  scroll,
  errorBoundary,
  style,
  testID,
}: {
  children: React.ReactNode;
  scroll: boolean;
  errorBoundary?: false | PanelErrorBoundaryOptions;
  style: React.ComponentProps<typeof View>['style'];
  testID?: string;
}) {
  const content = scroll ? (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }}>
      {children}
    </ScrollView>
  ) : <View style={{ flex: 1, minHeight: 0 }}>{children}</View>;
  return (
    <View testID={testID} style={[{ minWidth: 0, alignSelf: 'stretch' }, style]}>
      {errorBoundary === false ? content : <PanelErrorBoundary {...errorBoundary}>{content}</PanelErrorBoundary>}
    </View>
  );
}
