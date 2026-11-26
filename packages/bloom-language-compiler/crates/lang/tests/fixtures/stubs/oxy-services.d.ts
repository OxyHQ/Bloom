// A test stub of @oxy.so/services/ui/client.
import type { ReactNode } from 'react';
export interface AuthState {
  readonly canUsePrivateApi: boolean;
  readonly isPrivateApiPending: boolean;
  readonly userId?: string;
}
export declare function useAuth(): AuthState;
export interface OxyAuthPromptProps {
  label: string;
  description?: string;
}
export declare function OxyAuthPrompt(props: OxyAuthPromptProps): ReactNode;
