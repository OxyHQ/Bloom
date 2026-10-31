import type { ComponentType } from 'react';
import type { RenderProps } from './CharacterAvatar';
import type { AvatarSnapshot, CharacterCapabilities } from './context';

export type NativeAvatarAdapterProps = {
  runtimeUrl: string;
  value: RenderProps;
  onReady?(): void;
  onError(): void;
  onCapabilities?(value: CharacterCapabilities): void;
  observeSnapshot?(capture: (() => Promise<AvatarSnapshot | null>) | null): void;
};
export type NativeAvatarAdapter = {
  ABI_VERSION: number;
  isAvailable: boolean;
  NativeAvatar: ComponentType<NativeAvatarAdapterProps>;
  isRuntimeCompatible(runtimeUrl: string): Promise<boolean>;
};
/** Web and non-Metro hosts never load the optional native graphics graph. */
export function nativeAvatarAdapter(): NativeAvatarAdapter | null {
  return null;
}
