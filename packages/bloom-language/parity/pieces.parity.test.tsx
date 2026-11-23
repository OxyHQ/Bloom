import { PIECES_CASES } from './pieces.cases';
import { describeNativeParity } from './support/native';

describeNativeParity(
  'Badge, IconCircle, Loading, Skeleton, PressableScale and SubtleHover',
  PIECES_CASES,
);
