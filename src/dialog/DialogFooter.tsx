import type React from 'react';
import { useState } from 'react';
import { View } from 'react-native';

/** Fixed chrome participates in panel height, independently of scroll content. */
export function useDialogFooter(footer: React.ReactNode) {
  const [height, setHeight] = useState(0);
  const present = footer !== undefined && footer !== null && footer !== false;
  return {
    height: present ? height : 0,
    node: present ? (
      <View
        testID="bloom-dialog-footer"
        style={{ flexShrink: 0 }}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
      >
        {footer}
      </View>
    ) : null,
  };
}
