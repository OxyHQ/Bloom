import type { ComponentRef } from 'react';
import type { View } from 'react-native';

/**
 * What a `View`'s `ref` receives. React Native 0.88's `View` names the
 * component function, not its host instance, so `RefObject<View>` no longer
 * accepts the ref a `<View ref>` fills.
 */
export type ViewInstance = ComponentRef<typeof View>;
