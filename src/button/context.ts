import { createContext } from 'react';
import type { ButtonSize } from './types';
import type { useGroupSelection } from './use-group-selection';

export const ButtonGroupContext = createContext<
  | ({ size: ButtonSize; separated: boolean } & ReturnType<typeof useGroupSelection>['registry'])
  | null
>(null);
