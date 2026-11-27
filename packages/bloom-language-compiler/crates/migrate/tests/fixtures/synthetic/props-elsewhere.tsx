// Props typed in another TS file: 2.0 has no `..Props` spread, so the view's stored
// properties are that interface's fields (its base's first), and the types they name are
// imported where that file has them; a type alias the file keeps to itself is written in place.
import { memo } from 'react';
import { Text, toElement, VStack } from '@oxy.so/bloom-language';
import type { BadgeProps } from './badge.types';

export const Badge = memo(function Badge({ title, size = 'md', label }: BadgeProps) {
  return toElement(VStack(Text(title), Text(`${size} ${label(2)}`)));
});
