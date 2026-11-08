// Run after build: this imports shipped declarations, never source aliases.
import { IconCircle, type BloomIconComponent } from '../../lib/typescript/module/index';
import type { ComponentProps } from 'react';

declare const icon: BloomIconComponent;
const props: ComponentProps<typeof IconCircle> = {
  icon,
  size: 'lg',
  iconStyle: { color: '#123456' },
};
void props;
// @ts-expect-error A glyph requiring unrelated data cannot satisfy a canonical slot.
const invalid: ComponentProps<typeof IconCircle> = {
  icon: (_props: { requiredData: string }) => null,
};
void invalid;
