// The spec of the iOS island host (BloomIslandComponentView.mm): React Native's codegen input.
// The same view as Android's (`bloom build`'s `:bloom-islands`), as Mention's FeedIslandList
// uses it: props cross as JSON (or through the `BloomIslands` module's keyed channel), and
// events come back as `DeviceEventEmitter`'s `BloomIslandEvent` ({ key, name, payload }).
import type { HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  /** The registered island (`FeedIsland__register()`). */
  island: string;
  /** Its keyed channel (`BloomIslands.setProps(key, json)`); its events carry it. */
  islandKey?: string;
  /** Its props, as JSON (`Codable` on the Swift side). */
  props?: string;
  /** The app's theme: a Bloom preset and `light`, `dark` or none (the system's). */
  themePreset?: string;
  themeScheme?: string;
}

export default codegenNativeComponent<NativeProps>('BloomIsland') as HostComponent<NativeProps>;
