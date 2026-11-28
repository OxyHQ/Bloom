import type { ReactNode } from 'react';

export interface ChipProps {
  label: string;
  onPress: () => void;
  'aria-pressed'?: boolean;
}
export declare function Chip(props: ChipProps): ReactNode;
