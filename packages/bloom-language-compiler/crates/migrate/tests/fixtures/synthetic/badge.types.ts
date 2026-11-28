// Props of the badge views, kept beside them (as Mention's `components/Profile/types.ts`).
import type { Tone } from './tone';

export type Size = 'sm' | 'md';

/** The label a view draws, private to this file. */
type Label = (count: number) => string;

interface BadgeBaseProps {
  tone?: Tone;
}

export interface BadgeProps extends BadgeBaseProps {
  title: string;
  size?: Size;
  label: Label;
  children?: React.ReactNode;
}
