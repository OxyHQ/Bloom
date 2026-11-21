import { PIECES_CASES } from './pieces.cases';
import { describeWebParity } from './support/web';

describeWebParity(
  'Badge, IconCircle, Loading, Skeleton, PressableScale and SubtleHover',
  PIECES_CASES,
);
