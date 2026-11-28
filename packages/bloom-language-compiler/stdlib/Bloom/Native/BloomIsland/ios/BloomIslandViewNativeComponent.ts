// The spec of the island host (BloomIslandComponentView.mm): React Native's codegen input.
// Props cross once as JSON, events come back as JSON (docs/native-runtime-api.mdx, "Islands").
import type { CodegenTypes, HostComponent, ViewProps } from 'react-native';
import { codegenNativeComponent } from 'react-native';

export interface NativeProps extends ViewProps {
  /** The registered island (`BloomIslands.register("Feed")`). */
  island: string;
  /** Its props, as JSON (`Codable` on the Swift side). */
  props: string;
  onEvent?: CodegenTypes.DirectEventHandler<Readonly<{ event: string }>>;
}

export default codegenNativeComponent<NativeProps>('BloomIslandView') as HostComponent<NativeProps>;
